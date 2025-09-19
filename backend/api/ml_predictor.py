# backend/api/ml_predictor.py
import os, re, threading
import joblib
import numpy as np
from typing import Dict, Any, Optional, List
from sklearn.preprocessing import normalize as sk_normalize
from scipy.sparse import hstack as sp_hstack

BASE_DIR = os.path.dirname(__file__)
ARTIFACT_PATH = os.path.join(BASE_DIR, "ml_artifacts", "startup_models.joblib")

_lock = threading.Lock()
_bundle: Optional[Dict[str, Any]] = None

def _load() -> Dict[str, Any]:
    """
    Load model bundle. Supports two layouts:
      A) {'features', 'cat_clf', 'sub_clf', 'le_cat', 'le_sub', 'allowed_sub_by_cat_idx', ...}
      B) {'vec_word','vec_char','cat_clf','sub_clf','le_cat','le_sub','allowed_sub_by_cat_idx', ...}
    Suggestions & location keys are optional.
    """
    global _bundle
    if _bundle is None:
        with _lock:
            if _bundle is None:
                if not os.path.exists(ARTIFACT_PATH):
                    raise FileNotFoundError(f"Model artifact not found at {ARTIFACT_PATH}")
                b = joblib.load(ARTIFACT_PATH)

                # Core classifiers + encoders
                need = ["cat_clf", "sub_clf", "le_cat", "le_sub", "allowed_sub_by_cat_idx"]
                missing = [k for k in need if k not in b]
                if missing:
                    raise ValueError(f"Artifact missing core classifier keys: {missing}")

                # Featureizers: accept either 'features' or vec_* combo
                has_features = "features" in b
                has_word = "vec_word" in b
                has_char = "vec_char" in b
                if not has_features and not (has_word or has_char):
                    # this was your error
                    raise ValueError(
                        "Artifact has no 'features' and no 'vec_word'/'vec_char'. "
                        "Export either a single pipeline as 'features' or individual vectorizers as 'vec_word'/'vec_char'."
                    )

                # Suggestions (optional)
                sugg_keys = ["tfidf_sugg", "X_corpus", "cats_col", "subs_col", "suggestions_col"]
                b["_suggestions_available"] = all(k in b for k in sugg_keys)

                # Location (optional)
                loc_keys = ["features_loc", "loc_clf", "le_loc"]
                b["_location_available"] = all(k in b for k in loc_keys)

                _bundle = b
    return _bundle

_SPLIT_RE = re.compile(r"[;\n•\-\u2022\.]+")

def _split_suggestions(text: str) -> List[str]:
    if not text or str(text).strip().lower() == "nan":
        return []
    parts = _SPLIT_RE.split(str(text))
    return [p.strip() for p in parts if p and len(p.strip()) > 2]

def _cosine_topk(q_vec, matrix, k: int = 50):
    q = sk_normalize(q_vec, norm="l2")
    scores = (matrix @ q.T).toarray().ravel()
    idx = np.argsort(scores)[::-1][:k]
    return idx, scores[idx]

def _featurize_texts(b: Dict[str, Any], texts: List[str]):
    """Return feature matrix for a list of texts for either layout."""
    if "features" in b:
        return b["features"].transform(texts)
    # Stack available vectorizers
    mats = []
    if "vec_word" in b:
        mats.append(b["vec_word"].transform(texts))
    if "vec_char" in b:
        mats.append(b["vec_char"].transform(texts))
    if not mats:
        raise ValueError("No vectorizer found to featurize texts.")
    return mats[0] if len(mats) == 1 else sp_hstack(mats)

def predict(text: str, top_k: int = 3, ensure_min_suggs: int = 3):
    b = _load()

    cat_clf = b["cat_clf"]; sub_clf = b["sub_clf"]
    le_cat = b["le_cat"];   le_sub = b["le_sub"]

    # allowed map: cat index -> set(sub indices)
    allowed_map = {int(k): set(v) for k, v in b["allowed_sub_by_cat_idx"].items()}

    # ---- features
    X = _featurize_texts(b, [text])

    # ---- category
    c_idx = int(cat_clf.predict(X)[0])
    cat_name = le_cat.inverse_transform([c_idx])[0]

    # ---- subcategory with cat constraint
    sub_scores = sub_clf.decision_function(X)
    if getattr(sub_scores, "ndim", 1) == 1:
        sub_scores = sub_scores.reshape(-1, 1)
    s = sub_scores[0].copy()
    allowed = allowed_map.get(c_idx, set())
    if allowed:
        mask = np.ones(s.shape[0], dtype=bool); mask[list(allowed)] = False
        s[mask] = -1e9
    sub_top = np.argsort(s)[::-1][:max(1, int(top_k))]
    preds = [{
        "category": cat_name,
        "sub_category": le_sub.inverse_transform([int(j)])[0],
        "score": float(s[int(j)]),
    } for j in sub_top]

    # ---- location (optional)
    loc_name = ""
    if b.get("_location_available"):
        desc_only = re.sub(r"\s+", " ", text.lower())
        Xl = b["features_loc"].transform([desc_only])
        loc_idx = int(b["loc_clf"].predict(Xl)[0])
        loc_name = b["le_loc"].inverse_transform([loc_idx])[0]

    # ---- suggestions (optional)
    bullets: List[str] = []
    if b.get("_suggestions_available"):
        q = f"{text} || cat:{cat_name}"
        q_vec = b["tfidf_sugg"].transform([q])
        idxs, _ = _cosine_topk(q_vec, b["X_corpus"], k=80)
        # prefer same category if present
        cats_col = b["cats_col"]; suggestions_col = b["suggestions_col"]
        idxs = [i for i in idxs if cats_col[i] == cat_name] or list(idxs[:40])
        for i in idxs:
            bullets += _split_suggestions(suggestions_col[i])[:3]

    # generic backstops (ensures >= ensure_min_suggs)
    GENERAL = [
        "Create/optimize Google Business Profile; collect reviews.",
        "Post real work as short video 3×/week; cross-post to TikTok/IG/FB.",
        "Offer a low-friction starter package and a clear upsell.",
        "Enable online booking or WhatsApp CTA with response SLA.",
        "Run small geo-targeted Meta/Google ads; retarget site visitors.",
    ]
    if len(bullets) < ensure_min_suggs:
        bullets += GENERAL

    # de-dup + cap
    seen, uniq = set(), []
    for item in bullets:
        key = re.sub(r"[^a-z0-9]+", " ", item.lower()).strip()
        if key and key not in seen:
            uniq.append(item); seen.add(key)
        if len(uniq) >= max(ensure_min_suggs, 8):
            break

    return {
        "predicted_location": loc_name,
        "predictions": preds,      # you show only main category in UI
        "suggestions": uniq,
    }
