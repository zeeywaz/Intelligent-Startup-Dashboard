

import os, re, json, sys, types
import numpy as np
import pandas as pd
import joblib, cloudpickle as cp

# ---------------- Optional deps ----------------
_HNSW_OK = True
try:
    import hnswlib
except Exception:
    _HNSW_OK = False
    hnswlib = None  # type: ignore

# --------------- Shim for notebook transformers ---------------
class TextNormalizer:
    def __init__(self, lowercase: bool = True, strip: bool = True):
        self.lowercase = lowercase
        self.strip = strip
    def fit(self, X, y=None): return self
    def transform(self, X):
        s = pd.Series(X, dtype=object).astype(str)
        if self.lowercase: s = s.str.lower()
        if self.strip: s = s.str.strip()
        return s
    def get_params(self, deep=True):
        return {"lowercase": self.lowercase, "strip": self.strip}
    def set_params(self, **params):
        for k, v in params.items():
            setattr(self, k, v)
        return self

# Ensure pickles referencing "__main__.TextNormalizer" can resolve
if "__main__" not in sys.modules:
    sys.modules["__main__"] = types.ModuleType("__main__")
setattr(sys.modules["__main__"], "TextNormalizer", TextNormalizer)

# ---------------- Paths ----------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ART_DIR  = os.environ.get("ML_PARTS_DIR", os.path.join(BASE_DIR, "ml_artifacts", "ml_parts"))
FILES = {
    "featurizer_cls_joblib": os.path.join(ART_DIR, "featurizer_cls.joblib"),
    "featurizer_cls":        os.path.join(ART_DIR, "featurizer_cls.cpkl"),  # legacy
    "cat_head":              os.path.join(ART_DIR, "cat_head.joblib"),
    "loc_head":              os.path.join(ART_DIR, "loc_head.joblib"),
    "encoders":              os.path.join(ART_DIR, "label_encoders.joblib"),
    "embedder_json":         os.path.join(ART_DIR, "embedder.json"),
    "embedder":              os.path.join(ART_DIR, "embedder.cpkl"),        # legacy
    "ann":                   os.path.join(ART_DIR, "neighbors.index"),
    "corpus":                os.path.join(ART_DIR, "corpus.parquet"),
    "meta":                  os.path.join(ART_DIR, "meta.json"),
}

# ---------------- Globals ----------------
_featurizer_cls = None
_cat_head = _loc_head = None
_enc_cat = _enc_loc = None
_embedder = None
_ann = None
_corpus: pd.DataFrame | None = None
_meta: dict = {}
_last_error: str | None = None

# ---------------- Location inference ----------------
DISTRICTS = [
    "Colombo","Gampaha","Kalutara","Kandy","Matale","Nuwara Eliya","Galle","Matara","Hambantota",
    "Jaffna","Kilinochchi","Mannar","Vavuniya","Mullaitivu","Batticaloa","Ampara","Trincomalee",
    "Kurunegala","Puttalam","Anuradhapura","Polonnaruwa","Badulla","Monaragala","Ratnapura","Kegalle"
]
_DISTRICT_PAT = {d: re.compile(rf"\b{re.escape(d.lower())}\b") for d in DISTRICTS}
_DISTRICT_CAN = {d.lower(): d for d in DISTRICTS}
_DISTRICT_SET = {d.lower() for d in DISTRICTS}

_ONLINE_RE = re.compile(
    r"\b(online|e-?commerce|saas|cloud|web(app)?|website|internet|virtual|remote|marketplace|digital|lms|subscription|api|platform|software)\b",
    re.IGNORECASE,
)

def infer_location_simple(text: str, model_loc: str | None = None) -> str | None:
    """Priority: Online → explicit district → model_loc"""
    s = str(text or "")
    if _ONLINE_RE.search(s):
        return "Online"
    lo = s.lower()
    for d, pat in _DISTRICT_PAT.items():
        if pat.search(lo):
            return _DISTRICT_CAN[d.lower()]
    return model_loc

# ---------------- Light category overrides (safe, narrow) ----------------
# Use **only** for very common false labels. This patches obvious misses.
_CAT_RULES: list[tuple[re.Pattern, str]] = [
    (re.compile(r"\b(cloth(?:ing)?|apparel|boutique|fashion|streetwear|sneaker|footwear)\b", re.I), "apparel & fashion"),
    (re.compile(r"\b(software|saas|open\s?source|dev(?:elopment)?|platform|api|sdk)\b", re.I), "computer software"),
    (re.compile(r"\b(cafe|coffee|bakery|restaurant|bistro|food truck|catering)\b", re.I), "food & beverage"),
    (re.compile(r"\b(retail|supermarket|minimart|grocery|storefront)\b", re.I), "retail"),
]

def maybe_override_category(text: str, predicted: str) -> str:
    t = str(text or "")
    p = str(predicted or "")
    for rx, target in _CAT_RULES:
        if rx.search(t) and target.lower() != p.lower():
            return target
    return p

# ---------------- Suggestion cleanup / dedupe ----------------
_START_IN_RE = re.compile(r"^\s*(?:start|begin|launch)\s+in\s+([A-Za-z\s]+?)\s*,\s*", re.IGNORECASE)

def _clean_suggestion_language(s: str, sig: dict) -> str:
    if not s:
        return s
    s = str(s).strip()

    # strip "Start|Begin|Launch in <District>, "
    m = _START_IN_RE.match(s)
    if m:
        place = (m.group(1) or "").strip().lower()
        if sig.get("is_online") or place in _DISTRICT_SET:
            s = s[m.end():].lstrip()

    # strip bare leading "Start/Begin/Launch "
    s = re.sub(r"^\s*(start|begin|launch)\s+", "", s, flags=re.IGNORECASE)

    # tidy spacing/punctuation and ensure trailing period
    s = re.sub(r"\s+", " ", s).strip()
    s = re.sub(r",\s*\.$", ".", s)
    if s and not s.endswith("."):
        s += "."
    # Capitalize first letter for polish
    if s and not re.match(r"^[A-Z]", s):
        s = s[:1].upper() + s[1:]
    return s

def _humanize_suggestions(lines: list[str], sig: dict, max_k=5) -> list[str]:
    # near-duplicate filter via simple 3-gram Jaccard
    def _sim(a: str, b: str) -> float:
        def ngrams(t):
            t = re.sub(r"[^a-z0-9 ]+", " ", t.lower())
            toks = t.split()
            return set(zip(toks, toks[1:], toks[2:])) if len(toks) >= 3 else set()
        A, B = ngrams(a), ngrams(b)
        if not A or not B: return 0.0
        return len(A & B) / len(A | B)

    seen = []
    out = []
    for raw in lines:
        s = _clean_suggestion_language(raw, sig)
        if not s: continue
        if any(_sim(s, prev) >= 0.55 for prev in seen):
            continue
        out.append(s); seen.append(s)
        if len(out) >= max_k: break
    return out

def _suggestions_from_neighbors(neighbor_rows, top_k=5):
    seen = set(); out = []
    for r in neighbor_rows:
        s = str(r.get("suggestion", "")).strip()
        if not s: continue
        k = s.lower()
        if k in seen: continue
        out.append(s); seen.add(k)
        if len(out) >= top_k: break
    return out

# ---------------- Advice playbooks ----------------
def _human_join(items: list[str], conj="and"):
    it = [str(x) for x in items if x]
    if not it: return ""
    if len(it) == 1: return it[0]
    return ", ".join(it[:-1]) + f" {conj} " + it[-1]

_PLAYBOOKS = {
    "apparel & fashion": {
        "narr_leads": [
            "Lead with a tight capsule; make sizing/fit crystal clear.",
            "Win with story & community—try-on reels and campus micro-creators.",
        ],
        "ops": [
            "15–25 SKUs; reorder winners weekly; avoid deep inventory.",
            "Offer easy exchanges; WhatsApp support; COD where feasible.",
        ],
        "pricing": "2.2×–2.8× landed cost; test bundles to lift AOV.",
        "kpis": [("Problem interviews", 20), ("Email signups (90d)", 300), ("First 30-day orders", 80), ("AOV (LKR)", 4500), ("Return rate % ≤", 8)],
        "online_suggestions": [
            "Interview 15–20 shoppers and collect 150+ emails/DMs.",
            "Ship a lightweight storefront (Instagram Shop/site) and publish a clear size guide.",
            "Run 2–3 creator try-ons; repost UGC with size notes.",
            "Tighten returns/exchanges; add one bundle to raise AOV.",
        ],
        "offline_suggestions": [
            "Run a 1–2 day popup; capture 100+ contacts with a QR signup.",
            "Finalize capsule and visual merchandising; post try-on reels.",
            "Soft-launch with limited hours; collect Google/Meta reviews.",
            "Negotiate MOQs; offer a first-order exchange guarantee.",
        ],
    },
    "food & beverage": {
        "narr_leads": ["Keep the menu tiny (2–3 heroes).", "Design for delivery—packaging and prep times matter."],
        "ops": ["Pilot as a pop-up/ghost kitchen; standardize recipes; track waste.", "Use bundles/add-ons; partner with delivery apps."],
        "pricing": "Keep COGS under 30–35%.",
        "kpis": [("Preorders/day wk4", 20), ("Gross margin %", 65), ("Avg rating", 4.5)],
        "online_suggestions": [
            "Test preorders through Instagram/WhatsApp; collect 100+ contacts.",
            "Shoot one hero item in bright natural light; pin it everywhere.",
            "Offer a starter bundle and an add-on that travels well.",
        ],
        "offline_suggestions": [
            "Weekend pop-up at a high footfall spot; measure sell-through.",
            "Simplify prep; standardize portioning to reduce waste.",
            "Capture reviews; iterate based on dwell time and ticket times.",
        ],
    },
    "retail": {
        "narr_leads": ["Own one proposition—price, convenience, curation or service.", "Start narrow; expand once repeat purchase is predictable."],
        "ops": ["Pilot with 50–100 customers; enable loyalty/referrals.", "Track basket size, repeat rate and category adjacencies."],
        "pricing": "Target 45–60% gross margin; use bundles to lift AOV.",
        "kpis": [("Repeat rate (60d) %", 30), ("AOV (LKR)", 4000), ("NPS", 45)],
        "online_suggestions": [
            "Curate 30–60 SKUs tightly; launch a simple loyalty perk.",
            "Publish a concise ‘who it’s for / why it wins’ on each product.",
            "Run one weekly live-sell; capture emails/DMs during the stream.",
        ],
        "offline_suggestions": [
            "Shelf test with a short-term rack/booth; watch basket patterns.",
            "Label shelves with quick ‘compare/choose’ cues.",
            "Introduce 1–2 bundles that match the top baskets.",
        ],
    },
    "computer software": {
        "narr_leads": ["Ship a narrow MVP for one painful job.", "Weekly build-measure-learn; Friday demos."],
        "ops": ["Simple analytics: activation, retention, CAC, payback.", "Recruit design partners early."],
        "pricing": "Start simple (one plan + intro discount).",
        "kpis": [("Activation %", 35), ("W4 retention %", 30), ("Payback (months)", 6)],
        "online_suggestions": [
            "Run 12–20 problem interviews; nail the job-to-be-done in one sentence.",
            "Ship a clickable prototype; collect 20 structured walkthroughs.",
            "Stand up a landing page with 2–3 value props and a waitlist.",
            "Run a tiny paid test (strict UTM) to validate message → signup.",
        ],
        "offline_suggestions": [
            "Host a 6-person founder roundtable; take notes → backlog.",
            "Offer a ‘founding team’ plan to your first 3–5 design partners.",
        ],
    },
    "default": {
        "narr_leads": ["Ship a narrow MVP for one painful job.", "Weekly build-measure-learn; Friday demos."],
        "ops": ["Track activation → retention; instrument CAC and payback.", "Recruit 3–5 design partners early."],
        "pricing": "Start simple (one plan + intro discount).",
        "kpis": [("Activation %", 30), ("W4 retention %", 25), ("Payback (months)", 6)],
        "online_suggestions": [
            "Validate the core job with 12–20 interviews and a no-code waitlist.",
            "Spin up a landing page; A/B two headlines; collect 100+ contacts.",
        ],
        "offline_suggestions": [
            "Run a 1–2 day popup/pilot; collect 100+ contacts.",
            "Document SOPs for the top two repeatable tasks.",
        ],
    },
}

def _playbook_for(cat: str):
    c = (cat or "").lower()
    for key in _PLAYBOOKS.keys():
        if key.lower() in c:
            return _PLAYBOOKS[key]
    if "fashion" in c or "apparel" in c: return _PLAYBOOKS["apparel & fashion"]
    if "food" in c or "beverage" in c:   return _PLAYBOOKS["food & beverage"]
    if "retail" in c:                    return _PLAYBOOKS["retail"]
    if "software" in c:                  return _PLAYBOOKS["computer software"]
    return _PLAYBOOKS["default"]

# ---------------- Signature extraction ----------------
def _sig_from_text(text: str, category: str, model_loc: str | None = None) -> dict:
    s = (text or "").lower()
    loc = infer_location_simple(text, model_loc=model_loc)
    is_online = (loc == "Online")
    audience = []
    if re.search(r"\byoung adult[s]?\b|\byouth\b|\bteen[s]?\b", s): audience.append("young adults")
    if re.search(r"\bstudent[s]?\b|\buni(?:versity)?\b", s):        audience.append("students")
    if   re.search(r"\b(cafe|coffee|bakery|bistro|restaurant)\b", s): product = "cafe/restaurant"
    elif re.search(r"\b(clothing|apparel|boutique|fashion|footwear|sneaker)\b", s): product = "apparel store"
    elif re.search(r"\b(grocery|supermarket|minimart)\b", s):         product = "grocery"
    elif re.search(r"\b(salon|spa|barber)\b", s):                     product = "salon/spa"
    elif re.search(r"\b(gym|fitness)\b", s):                          product = "gym/fitness"
    else: product = (category or "business")

    channels = []
    if is_online: channels += ["Instagram", "TikTok", "Facebook", "SEO", "WhatsApp"]
    if product in ("cafe/restaurant","grocery","apparel store","salon/spa","gym/fitness"):
        channels += ["Google Maps","Local influencers","Flyers near hotspots"]

    return {
        "is_online": is_online,
        "district": (None if is_online else (loc if loc in DISTRICTS else None)),
        "audience": list(dict.fromkeys(audience)),
        "product": product,
        "channels": list(dict.fromkeys(channels)),
    }

# ---------------- Narrative / Roadmap / KPIs / Risks ----------------
def _compose_narrative(category: str, sig: dict) -> str:
    pb = _playbook_for(category)
    aud = f" for {', '.join(sig['audience'])}" if sig["audience"] else ""
    loc_str = "online" if sig["is_online"] else (sig["district"] or "your area")
    p1 = f"You’re building {sig['product']} in the **{category}** space{aud}. Start by clarifying a sharp value proposition and launching in {loc_str}. {_human_join(pb['narr_leads'])}"
    p2 = "On operations: " + " ".join(pb["ops"])
    p3 = "Pricing: " + pb["pricing"]
    return p1 + "\n\n" + p2 + "\n\n" + p3

def _roadmap_90d(category: str, sig: dict) -> list[dict]:
    if sig.get("product") == "apparel store":
        if sig["is_online"]:
            p1 = ["Interview 15–20 shoppers; collect 150+ emails/DMs.",
                  "Source 15–25 SKUs; size chart & try-on content ready."]
            p2 = ["Soft-launch Instagram Shop/site; test 2–3 creator collabs.",
                  "Track AOV; add a bundle; tighten the returns flow."]
            p3 = ["Scale winners; reorder weekly; add loyalty/referrals."]
        else:
            p1 = ["Run a 1–2 day popup; capture 100+ contacts.",
                  "Finalize capsule + visual merchandising."]
            p2 = ["Soft-launch with limited hours; collect reviews; refine size guidance.",
                  "Negotiate MOQs; add a first-order exchange guarantee."]
            p3 = ["Expand SKUs/hours; add bundles/subscriptions; campus promos."]
        return [{"phase":"Weeks 1–2","goals":p1},{"phase":"Weeks 3–6","goals":p2},{"phase":"Weeks 7–12","goals":p3}]
    # generic
    if sig["is_online"]:
        p1 = ["20–30 problem interviews; no-code waitlist.",
              "Set up Instagram + WhatsApp; collect 100+ contacts."]
        p2 = ["Ship MVP; run 2–3 collabs; measure CTR→signup/purchase."]
        p3 = ["Double-down on a winning channel; add loyalty/referrals."]
    else:
        p1 = ["Scout sites/popup partners; estimate footfall & rent.",
              "Run a 1–2 day popup; capture 100+ contacts."]
        p2 = ["Standardize suppliers/SOPs; soft-launch; collect reviews."]
        p3 = ["Negotiate MOQs; expand SKUs/hours; introduce bundles."]
    return [{"phase":"Weeks 1–2","goals":p1},{"phase":"Weeks 3–6","goals":p2},{"phase":"Weeks 7–12","goals":p3}]

def _kpis(category: str, sig: dict) -> list[dict]:
    pb = _playbook_for(category)
    out = [{"name": k, "target": v} for (k, v) in pb["kpis"]]
    out.append({"name": ("Email/DM list (90d)" if sig["is_online"] else "Footfall/day by week 8"),
                "target": (500 if sig["is_online"] else 60)})
    return out[:6]

def _risks(category: str, sig: dict) -> list[str]:
    risks = []
    c = (category or "").lower()
    if "apparel" in c or "fashion" in c:
        risks += ["Sizing/returns erode margin → publish a size guide; free first-exchange.",
                  "Dead inventory risk → small buys; reorder winners weekly."]
    if "food" in c or "beverage" in c:
        risks += ["Food safety/consistency → SOPs & temperature logs.",
                  "Delivery margins thin → engineer bundles & add-ons."]
    if sig.get("is_online"):
        risks += ["Ad spend waste → test small with strict UTM tracking."]
    else:
        risks += ["Bad lease lock-in → validate with pop-ups first."]
    return risks[:4] if risks else ["Keep MVP narrow; measure learning velocity weekly."]

# ---------------- Embedder wrapper (optional) ----------------
class SBERTEmbedder:
    def __init__(self, model_name: str, normalize: bool = True):
        self.model = None
        self.dim_ = None
        self.normalize = bool(normalize)
        self.model_name = model_name
        try:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer(model_name, device="cpu")
            try:
                self.dim_ = self.model.get_sentence_embedding_dimension()
            except Exception:
                self.dim_ = int(self.model.encode(["test"], convert_to_numpy=True).shape[1])
        except Exception:
            self.model = None
            self.dim_ = None
    def transform(self, texts):
        if self.model is None:
            raise RuntimeError("Embedder not available")
        arr = self.model.encode(
            list(texts),
            convert_to_numpy=True,
            normalize_embeddings=self.normalize,
            show_progress_bar=False,
        )
        return arr.astype("float32")

# ---------------- Loader ----------------
def _extract_encoders(enc_obj):
    # dict with flexible keys
    if isinstance(enc_obj, dict):
        lower = {str(k).lower(): v for k, v in enc_obj.items()}
        cat = lower.get("cat") or lower.get("category")
        loc = lower.get("loc") or lower.get("location")
        if cat is not None and loc is not None:
            return cat, loc
    # list/tuple
    if isinstance(enc_obj, (list, tuple)) and len(enc_obj) >= 2:
        return enc_obj[0], enc_obj[1]
    # object with .encoders dict
    if hasattr(enc_obj, "encoders") and isinstance(enc_obj.encoders, dict):
        lower = {str(k).lower(): v for k, v in enc_obj.encoders.items()}
        cat = lower.get("cat") or lower.get("category")
        loc = lower.get("loc") or lower.get("location")
        if cat is not None and loc is not None:
            return cat, loc
    raise KeyError("Could not find label encoders for Category/Location in encoders artifact")

def _load_once():
    global _featurizer_cls, _cat_head, _loc_head, _enc_cat, _enc_loc, _embedder, _ann, _corpus, _meta, _last_error
    if _featurizer_cls is not None:
        return

    try:
        # Featurizer
        try:
            if os.path.exists(FILES["featurizer_cls_joblib"]):
                _featurizer_cls = joblib.load(FILES["featurizer_cls_joblib"])
            else:
                raise FileNotFoundError
        except Exception:
            if os.path.exists(FILES["featurizer_cls"]):
                with open(FILES["featurizer_cls"], "rb") as f:
                    _featurizer_cls = cp.load(f)
            else:
                raise FileNotFoundError(f"Missing featurizer at {FILES['featurizer_cls_joblib']}")

        # Heads & encoders
        _cat_head = joblib.load(FILES["cat_head"])
        _loc_head = joblib.load(FILES["loc_head"])
        enc = joblib.load(FILES["encoders"])
        _enc_cat, _enc_loc = _extract_encoders(enc)

        # Meta
        try:
            _meta = json.load(open(FILES["meta"], "r"))
        except Exception:
            _meta = {}

        # Embedder/ANN (optional)
        _embedder = None
        _ann = None

        if os.path.exists(FILES["embedder_json"]):
            cfg = json.load(open(FILES["embedder_json"], "r"))
            _embedder = SBERTEmbedder(
                model_name=cfg.get("model_name", "sentence-transformers/all-MiniLM-L6-v2"),
                normalize=cfg.get("normalize", True),
            )
            if _embedder.dim_ is None:
                _embedder = None
        elif os.path.exists(FILES["embedder"]):
            try:
                with open(FILES["embedder"], "rb") as f:
                    _embedder = cp.load(f)
            except Exception:
                _embedder = None

        # Load ANN if possible
        if _embedder is not None and _HNSW_OK and os.path.exists(FILES["ann"]):
            dim = _meta.get("embedder_dim") or getattr(_embedder, "dim_", None)
            if dim is None:
                dim = int(_embedder.transform(["test"]).shape[1])
            _ann = hnswlib.Index(space="cosine", dim=int(dim))
            _ann.load_index(FILES["ann"])

        # Corpus
        try:
            _corpus = pd.read_parquet(FILES["corpus"])
        except Exception:
            try:
                _corpus = pd.read_csv(FILES["corpus"].replace(".parquet", ".csv"))
            except Exception:
                _corpus = pd.DataFrame(columns=["Description", "Category", "Location", "Suggestion"])

        _last_error = None

    except Exception as e:
        _last_error = repr(e)
        return {
            "ready": False,
            "error": _last_error,
            "details": {
                "source": "parts",
                "parts_dir": ART_DIR,
                "featurizer_joblib": os.path.exists(FILES["featurizer_cls_joblib"]),
                "featurizer_cpkl":   os.path.exists(FILES["featurizer_cls"]),
                "heads": {"cat": os.path.exists(FILES["cat_head"]), "loc": os.path.exists(FILES["loc_head"])},
                "encoders": os.path.exists(FILES["encoders"]),
                "embedder_json": os.path.exists(FILES["embedder_json"]),
                "embedder_cpkl": os.path.exists(FILES["embedder"]),
                "ann": os.path.exists(FILES["ann"]),
                "corpus_path": FILES["corpus"],
                "corpus_rows": None
            }
        }

def _ready_snapshot():
    rows = int(len(_corpus)) if _corpus is not None else 0
    return {
        "ready": all(x is not None for x in (_featurizer_cls, _cat_head, _loc_head, _enc_cat, _enc_loc)),
        "error": _last_error,
        "details": {
            "source": "parts",
            "parts_dir": ART_DIR,
            "featurizer": _featurizer_cls is not None,
            "heads": {"cat": _cat_head is not None, "loc": _loc_head is not None},
            "encoders": (_enc_cat is not None and _enc_loc is not None),
            "embedder": _embedder is not None,
            "ann": _ann is not None,
            "corpus_rows": rows,
            "meta": _meta or {}
        }
    }

# ---------------- Public API ----------------
def status() -> dict:
    info = _load_once()
    if isinstance(info, dict):
        return info
    return _ready_snapshot()

def predict(texts: list[str]) -> list[dict]:
    _load_once()
    if _featurizer_cls is None or _cat_head is None or _loc_head is None:
        return [{"Category": None, "Location": None} for _ in texts]

    X = pd.Series(texts, dtype=object)
    Xv = _featurizer_cls.transform(X)
    ycat = _cat_head.predict(Xv)
    yloc = _loc_head.predict(Xv)
    cats = _enc_cat.inverse_transform(ycat)
    locs = _enc_loc.inverse_transform(yloc)

    out = []
    for t, c, l in zip(texts, cats, locs):
        loc = infer_location_simple(t, model_loc=str(l) if l is not None else None)
        cat = maybe_override_category(t, str(c))
        out.append({"Category": str(cat), "Location": loc})
    return out

def _baseline_response(text: str, pred_cat: str | None, pred_loc: str | None) -> dict:
    sig = _sig_from_text(text, pred_cat, pred_loc)
    narrative = _compose_narrative(pred_cat, sig)
    roadmap   = _roadmap_90d(pred_cat, sig)
    kpis      = _kpis(pred_cat, sig)
    risks     = _risks(pred_cat, sig)
    suggestions = _humanize_suggestions([ "Ship a thin MVP and recruit 5–10 design partners." ], sig)
    return {
        "predicted": {"Category": pred_cat, "Location": pred_loc},
        "suggestions": suggestions,
        "narrative": narrative,
        "next_90_days": roadmap,
        "kpis": kpis,
        "risks": risks
    }

def advise(text: str, top_k: int = 5, include_neighbors: bool = False) -> dict:
    """
    Main advice endpoint with defensive fallback:
    - Uses ANN neighbors when available
    - Cleans suggestion phrasing ("Start in ...")
    - Never throws: returns a baseline plan on any error
    """
    try:
        _load_once()
        pred = predict([text])[0]
        pred_cat, pred_loc = pred["Category"], pred["Location"]

        # normalize once via featurizer's "norm" step if available, else raw text
        try:
            norm = _featurizer_cls.named_steps["norm"].transform(pd.Series([text]))
        except Exception:
            norm = pd.Series([text])

        # If corpus/ANN unavailable or embedder missing, return baseline advice (fast)
        if _corpus is None or len(_corpus) == 0 or _ann is None or _embedder is None:
            return _baseline_response(text, pred_cat, pred_loc)

        # ANN search
        try:
            q = _embedder.transform(norm).astype(np.float32)
        except Exception:
            # embedder failed at runtime; degrade gracefully with baseline (no recursion)
            return _baseline_response(text, pred_cat, pred_loc)

        k = min(30, max(10, top_k * 4))
        labels, dists = _ann.knn_query(q, k=k)
        idxs, dists = labels[0].tolist(), dists[0].tolist()

        rows = []
        for ix, d in zip(idxs, dists):
            ix = int(ix)
            rows.append({
                "rank_raw": len(rows) + 1,
                "distance": float(d),
                "text":       _corpus.iloc[ix].get("Description", ""),
                "Category":   _corpus.iloc[ix].get("Category", ""),
                "Location":   _corpus.iloc[ix].get("Location", ""),
                "suggestion": _corpus.iloc[ix].get("Suggestion", ""),
            })

        # Prefer neighbors in same predicted Category
        same = [r for r in rows if (r["Category"] or "").lower() == str(pred_cat).lower()]
        diff = [r for r in rows if (r["Category"] or "").lower() != str(pred_cat).lower()]
        selected = (same[:max(3, top_k)] + diff)[:top_k]
        for i, r in enumerate(selected, 1):
            r["rank"] = i

        # Suggestions (raw → cleaned)
        raw_suggestions = _suggestions_from_neighbors(selected, top_k=top_k)
        if len(raw_suggestions) < top_k:
            raw_suggestions.append("Ship a thin MVP and recruit 5–10 design partners.")
            raw_suggestions = raw_suggestions[:top_k]

        # define sig BEFORE cleaning & narrative, and pass model_loc for perfect location
        sig = _sig_from_text(text, pred_cat, pred_loc)
        suggestions = _humanize_suggestions(raw_suggestions, sig, max_k=top_k)

        # Narrative bits
        narrative = _compose_narrative(pred_cat, sig)
        roadmap   = _roadmap_90d(pred_cat, sig)
        kpis      = _kpis(pred_cat, sig)
        risks     = _risks(pred_cat, sig)

        resp = {
            "predicted": {"Category": pred_cat, "Location": pred_loc},
            "suggestions": suggestions,
            "narrative": narrative,
            "next_90_days": roadmap,
            "kpis": kpis,
            "risks": risks
        }
        if include_neighbors:
            resp["neighbors"] = selected
        return resp

    except Exception as e:
        # Defensive baseline (no 500s)
        global _last_error
        _last_error = f"advise_error: {repr(e)}"
        pred = predict([text])[0]
        return {
            **_baseline_response(text, pred.get("Category"), pred.get("Location")),
            "error": _last_error
        }
