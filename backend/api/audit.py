# backend/api/audit.py
from __future__ import annotations

import json
import os
import threading
import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from . import models as m  # your app models

# Thread-local to carry request + session id
_local = threading.local()

AUDIT_DIR = getattr(settings, "AUDIT_LOG_DIR", os.path.join(settings.BASE_DIR, "audit_logs"))
os.makedirs(AUDIT_DIR, exist_ok=True)


# -------- helpers --------
def _now_iso() -> str:
    return datetime.utcnow().isoformat(timespec="microseconds") + "Z"


def _session_id() -> str:
    sid = getattr(_local, "audit_session_id", None)
    if not sid:
        sid = uuid.uuid4().hex
        _local.audit_session_id = sid
    return sid


def _request_user():
    req = getattr(_local, "request", None)
    if req and getattr(req, "user", None) and req.user.is_authenticated:
        return req.user
    return None


def _actor_admin_id() -> int:
    """
    Returns a meaningful admin id:
      - if a row exists in your `admin` table for this user, use admin.admin_id
      - else fall back to auth user id
      - else 0
    """
    u = _request_user()
    if not u:
        return 0
    try:
        adm = m.Admin.objects.filter(user_id=u.id).only("admin_id").first()
        if adm:
            return int(adm.admin_id)
    except Exception:
        pass
    return int(getattr(u, "id", 0) or 0)


def _user_folder_name() -> str:
    u = _request_user()
    if not u:
        return "anonymous"
    # keep it filesystem safe & short
    return f"{u.id}_{(u.username or 'user').replace('/', '_')}"


def _write_jsonl_line(payload: Dict[str, Any]) -> None:
    """
    Append one JSON line into: audit_logs/<user>/<session>.jsonl
    """
    user_dir = os.path.join(AUDIT_DIR, _user_folder_name())
    os.makedirs(user_dir, exist_ok=True)
    path = os.path.join(user_dir, f"{_session_id()}.jsonl")
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(payload, ensure_ascii=False) + "\n")


def _model_name(obj) -> str:
    return obj.__class__.__name__


def _serialize(instance) -> Dict[str, Any]:
    """
    Safe, minimal serializer:
      - only concrete local fields
      - forward FKs stored as <field>_id
      - skips reverse/auto-created relations so deletes never break
    """
    data: Dict[str, Any] = {}
    opts = instance._meta

    # Concrete local fields -> primitive values
    for f in opts.concrete_fields:
        # for FK, read the *_id attribute (no DB hit)
        if getattr(f, "remote_field", None) is not None and getattr(f.remote_field, "model", None):
            try:
                data[f.attname] = getattr(instance, f.attname)
            except Exception:
                data[f.attname] = None
        else:
            try:
                data[f.name] = getattr(instance, f.name)
            except Exception:
                data[f.name] = None

    # Editable, non M2M local many-to-many (optional; cheap ids only)
    for f in opts.local_many_to_many:
        try:
            # Store only related IDs; avoid huge payloads
            data[f.name] = list(getattr(instance, f.name).values_list("id", flat=True))
        except Exception:
            # if anything goes wrong, just skip
            pass

    return data


def _log_event(action: str, instance, details: Optional[Dict[str, Any]] = None) -> None:
    """
    Writes to JSONL and DB audit_log (admin_id, action, target_entity, target_id, timestamp, ip_address).
    """
    details = details or {}
    user = _request_user()
    ip = None
    if user is not None:
        try:
            req = getattr(_local, "request", None)
            if req:
                ip = req.META.get("HTTP_X_FORWARDED_FOR", req.META.get("REMOTE_ADDR"))
        except Exception:
            ip = None

    payload = {
        "ts": _now_iso(),
        "session_id": _session_id(),
        "actor": {
            "auth_user_id": getattr(user, "id", None),
            "username": getattr(user, "username", None),
            "is_staff": getattr(user, "is_staff", False),
            "is_superuser": getattr(user, "is_superuser", False),
        },
        "event": {
            "action": action,
            "model": _model_name(instance),
            "pk": getattr(instance, "pk", None),
            "details": details,
            "remote_addr": ip,
        },
    }

    # JSONL
    try:
        _write_jsonl_line(payload)
    except Exception:
        # never block the main request
        pass

    # DB row
    try:
        m.AuditLog.objects.create(
            admin_id=_actor_admin_id(),
            action=action,
            target_entity=_model_name(instance),
            target_id=getattr(instance, "pk", 0) or 0,
            ip_address=ip,
        )
    except Exception:
        # don't crash requests on audit failures
        pass


# -------- middleware to bind request to thread-local --------
class AuditRequestMiddleware:
    """
    Add this in settings.MIDDLEWARE, preferably near the bottom but
    before AuthenticationMiddleware duplicates.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _local.request = request
        # (Re)use the same audit session id for the browser session
        if "audit_session_id" not in request.session:
            request.session["audit_session_id"] = uuid.uuid4().hex
        _local.audit_session_id = request.session["audit_session_id"]
        try:
            response = self.get_response(request)
        finally:
            # avoid leaking request objects between threads
            _local.request = None
        return response


# -------- signals --------
TRACKED_MODELS = (
    m.Resource,
    m.Competitor,
    m.BusinessIdea,
    m.Bookmark,
    m.InvestorDetails,
    m.Notification,
    # add any others you want to track
)


@receiver(post_save)
def _on_save(sender, instance, created, **kwargs):
    if sender not in TRACKED_MODELS:
        return
    try:
        if created:
            _log_event("create", instance, {"new": _serialize(instance)})
        else:
            _log_event("update", instance, {"new": _serialize(instance)})
    except Exception:
        # never block
        pass


@receiver(post_delete)
def _on_delete(sender, instance, **kwargs):
    if sender not in TRACKED_MODELS:
        return
    try:
        # serialize minimal snapshot of what was deleted
        _log_event("delete", instance, {"old": _serialize(instance)})
    except Exception:
        pass
