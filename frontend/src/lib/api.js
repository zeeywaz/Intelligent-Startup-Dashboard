// src/lib/api.js
export const API_BASE =
  import.meta?.env?.VITE_API_BASE ||
  process.env.REACT_APP_API_BASE ||
  "http://127.0.0.1:8000";

export function getCookie(name) {
  const m = document.cookie.match(
    new RegExp("(^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)")
  );
  return m ? decodeURIComponent(m[2]) : null;
}

export function getCsrfFromCookie() {
  return (
    getCookie("csrftoken") ||
    getCookie("csrfToken") ||
    getCookie("XSRF-TOKEN") ||
    null
  );
}

export async function apiFetch(path, opts = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const method = (opts.method || "GET").toUpperCase();
  const isUnsafe = !["GET", "HEAD", "OPTIONS"].includes(method);

  const headers = new Headers(opts.headers || {});
  headers.set("Accept", "application/json");

  const isForm = typeof FormData !== "undefined" && opts.body instanceof FormData;
  if (isUnsafe && !isForm && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (isUnsafe && !headers.has("X-CSRFToken")) {
    const token = getCsrfFromCookie();
    if (token) headers.set("X-CSRFToken", token);
  }

  const res = await fetch(url, { credentials: "include", ...opts, headers });

  let data = null;
  let text = "";
  try {
    data = await res.json();
  } catch {
    try { text = await res.text(); } catch {}
  }

  if (!res.ok) {
    const msg = data?.detail || data?.error || text || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data ?? text;
    throw err;
  }
  return data ?? (text ? { detail: text } : {});
}

const api = {
  /* ---- CSRF & session ---- */
  csrf: () => apiFetch("/api/csrf/"),
  me: () => apiFetch("/api/me/"),
  login: (email, password) =>
    apiFetch("/api/login/", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => apiFetch("/api/logout/", { method: "POST" }),

  /* ---- ML ---- */
  classify: (payload) =>
    apiFetch("/api/ml/classify/", { method: "POST", body: JSON.stringify(payload) }),

  /* ---- Ideas + MyStartup bundle ---- */
  saveIdea: (payload) =>
    apiFetch("/api/ideas/", { method: "POST", body: JSON.stringify(payload) }),
  myIdeas: () => apiFetch("/api/ideas/mine/"),
  myStartupBundle: (ideaId, { res_limit = 8, comp_limit = 8 } = {}) =>
    apiFetch(`/api/mystartup/${ideaId}/?res_limit=${res_limit}&comp_limit=${comp_limit}`),

  /* ---- Lists (paged) ---- */
  resourcesList: (params = {}) => {
    const sp = new URLSearchParams();
    if (params.limit) sp.set("limit", params.limit);
    if (params.offset != null) sp.set("offset", params.offset);
    if (params.location) sp.set("location", params.location);
    if (params.type) sp.set("type", params.type);
    if (params.search) sp.set("search", params.search);
    if (params.fallback) sp.set("fallback", "1");
    return apiFetch(`/api/resources/?${sp.toString()}`);
  },

  competitorsList: (params = {}) => {
    const sp = new URLSearchParams();
    sp.set("limit", params.limit ?? 15);
    sp.set("offset", params.offset ?? 0);
    if (params.search) sp.set("search", params.search);
    if (params.category) sp.set("category", params.category);
    if (params.strength) sp.set("strength", params.strength);
    return apiFetch(`/api/competitors/?${sp.toString()}`);
  },

  /* ---- Bookmarks ---- */
  bookmarkIds: (kind) => {
    const q = kind ? `?kind=${encodeURIComponent(kind)}` : "";
    return apiFetch(`/api/bookmarks/ids/${q}`);
  },
  toggleBookmark: (kind, id) =>
    apiFetch(`/api/bookmarks/toggle/`, {
      method: "POST",
      body: JSON.stringify({ kind, id }),
    }),

  /* ---- Notifications ---- */
  notifications: () => apiFetch("/api/notifications/"),
};

export default api;
