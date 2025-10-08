# backend/api/audit.py
from __future__ import annotations

import json, os, threading, uuid, shutil
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple

from django.conf import settings
from django.db.models.signals import pre_save, post_save, post_delete
from django.dispatch import receiver

from . import models as m  # your app models

# ------- Thread-local & constants -------
_local = threading.local()

AUDIT_DIR = getattr(settings, "AUDIT_LOG_DIR", os.path.join(settings.BASE_DIR, "audit_logs"))
SESSIONS_ROOT = os.path.join(AUDIT_DIR, "sessions")
os.makedirs(SESSIONS_ROOT, exist_ok=True)

# ------- helpers -------
def _now_iso() -> str:
    # "2025-10-07T04:58:35.416032+00:00"
    return datetime.now(timezone.utc).isoformat(timespec="microseconds")

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

def _actor_user_id() -> int:
    u = _request_user()
    return int(getattr(u, "id", 0) or 0)

def _user_dir_for(uid: int) -> str:
    return os.path.join(SESSIONS_ROOT, str(uid or 0))

def _session_path_for(uid: int, sid: str) -> str:
    return os.path.join(_user_dir_for(uid), f"{sid}.jsonl")

def _session_path() -> str:
    return _session_path_for(_actor_user_id(), _session_id())

def _client_ip() -> Optional[str]:
    req = getattr(_local, "request", None)
    if not req:
        return None
    return req.META.get("HTTP_X_FORWARDED_FOR") or req.META.get("REMOTE_ADDR")

def _user_agent() -> Optional[str]:
    req = getattr(_local, "request", None)
    if not req:
        return None
    return req.META.get("HTTP_USER_AGENT")

def _req_method_path() -> Tuple[Optional[str], Optional[str]]:
    req = getattr(_local, "request", None)
    if not req:
        return None, None
    return req.method, req.path

def _json_dump_line(payload: Dict[str, Any]) -> None:
    """Append JSON line to the current session file; default=str for datetimes/decimals."""
    path = _session_path()
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(payload, ensure_ascii=False, default=str) + "\n")

def _model_name(obj) -> str:
    return obj.__class__.__name__

def _serialize(instance) -> Dict[str, Any]:
    """Serialize concrete fields & simple M2M ids."""
    data: Dict[str, Any] = {}
    opts = instance._meta

    for f in opts.concrete_fields:
        if getattr(f, "remote_field", None) is not None and getattr(f.remote_field, "model", None):
            data[f.attname] = getattr(instance, f.attname, None)
        else:
            try:
                v = getattr(instance, f.name)
            except Exception:
                v = None
            data[f.name] = v

    for f in getattr(opts, "local_many_to_many", []):
        try:
            data[f.name] = list(getattr(instance, f.name).values_list("id", flat=True))
        except Exception:
            pass

    return data

# ------- capture "old" snapshot for updates -------
def _snap_key(sender, pk): return (sender.__name__, pk)

def _snap_store(sender, instance):
    if not getattr(instance, "pk", None):
        return
    try:
        old = sender.objects.filter(pk=instance.pk).first()
    except Exception:
        old = None
    if old is None:
        return
    d = getattr(_local, "pre_save_snaps", None)
    if d is None:
        d = {}
        _local.pre_save_snaps = d
    d[_snap_key(sender, instance.pk)] = _serialize(old)

def _snap_take(sender, instance):
    d = getattr(_local, "pre_save_snaps", None)
    if not d:
        return None
    return d.pop(_snap_key(sender, getattr(instance, "pk", None)), None)

# ------- write detailed lines like your sample -------
def _log_detailed(action: str, entity: str, object_id: Any, changes: Optional[Dict[str, Any]] = None):
    method, path = _req_method_path()
    payload = {
        "ts": _now_iso(),
        "action": action,
        "entity": entity,
        "object_id": object_id,
        "changes": changes or {},
        "path": path,
        "method": method,
        "ip": _client_ip(),
    }
    # Add UA for auth/session markers (keeps regular entries smaller)
    if action in ("login", "logout", "session_start"):
        payload["ua"] = _user_agent()
    _json_dump_line(payload)

def _log_event(action: str, instance, details: Optional[Dict[str, Any]] = None) -> None:
    model = _model_name(instance)
    pk = getattr(instance, "pk", None)
    _log_detailed(action, model, pk, details or {})

    # optional SQL mirror
    try:
        m.AuditLog.objects.create(
            admin_id=_actor_user_id(),
            action=action,
            target_entity=model,
            target_id=pk or 0,
            ip_address=_client_ip(),
        )
    except Exception:
        pass

# ------- middleware -------
class AuditRequestMiddleware:
    """
    Uses audit_logs/sessions/<user_id>/<session_id>.jsonl.
    - seeds 'session_start'
    - merges anonymous->user file on login/logout & writes marker
    - optional per-request trace via AUDIT_LOG_EVERY_REQUEST
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _local.request = request

        if "audit_session_id" not in request.session:
            request.session["audit_session_id"] = uuid.uuid4().hex
        sid = request.session["audit_session_id"]
        _local.audit_session_id = sid

        cur_uid = request.user.id if request.user.is_authenticated else 0
        prev_uid = int(request.session.get("audit_user_id", 0))

        # ensure file exists (write one line so it's never empty)
        try:
            dst = _session_path_for(cur_uid, sid)
            if not os.path.exists(dst):
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                _log_detailed("session_start", "Session", None, {})
        except Exception:
            pass

        # merge & mark login/logout
        if prev_uid != cur_uid:
            try:
                src = _session_path_for(prev_uid, sid)
                dst = _session_path_for(cur_uid, sid)
                if os.path.exists(src) and src != dst:
                    os.makedirs(os.path.dirname(dst), exist_ok=True)
                    with open(dst, "a", encoding="utf-8") as out_f, open(src, "r", encoding="utf-8") as in_f:
                        shutil.copyfileobj(in_f, out_f)
                    try:
                        os.remove(src)
                    except Exception:
                        pass
                _log_detailed("login" if cur_uid else "logout", "Auth", None, {})
            except Exception:
                pass
            request.session["audit_user_id"] = cur_uid

        # handle request
        response = None
        try:
            response = self.get_response(request)
            return response
        finally:
            try:
                if getattr(settings, "AUDIT_LOG_EVERY_REQUEST", False):
                    p = request.path or ""
                    if not (p.startswith("/static/") or p.startswith("/media/") or p.startswith("/admin/") or p == "/favicon.ico"):
                        _log_detailed("request", "HTTP", None, {"status": getattr(response, "status_code", None)})
            except Exception:
                pass
            _local.request = None

# ------- signals (pre/post for proper "changes") -------
TRACKED_MODELS = (
    m.Resource,
    m.Competitor,
    m.BusinessIdea,
    m.Bookmark,
    m.InvestorDetails,
    m.Notification,
)

@receiver(pre_save)
def _on_pre_save(sender, instance, **kwargs):
    if sender not in TRACKED_MODELS:
        return
    try:
        if getattr(instance, "pk", None):
            _snap_store(sender, instance)
    except Exception:
        pass

@receiver(post_save)
def _on_post_save(sender, instance, created, **kwargs):
    if sender not in TRACKED_MODELS:
        return
    try:
        if created:
            _log_event("create", instance, {"new": _serialize(instance)})
        else:
            old = _snap_take(sender, instance)
            details = {"new": _serialize(instance)}
            if old:
                details["old"] = old
            _log_event("update", instance, details)
    except Exception:
        pass

@receiver(post_delete)
def _on_delete(sender, instance, **kwargs):
    if sender not in TRACKED_MODELS:
        return
    try:
        _log_event("delete", instance, {"old": _serialize(instance)})
    except Exception:
        pass
