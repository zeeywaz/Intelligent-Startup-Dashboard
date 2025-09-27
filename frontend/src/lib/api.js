// src/lib/api.js

// Works in CRA and Vite. If you only use CRA, REACT_APP_API_BASE is enough.
const fromVite =
  typeof import.meta !== "undefined" &&
  import.meta &&
  import.meta.env &&
  import.meta.env.VITE_API_BASE;

export const API_BASE =
  (fromVite && String(fromVite)) ||
  process.env.REACT_APP_API_BASE ||
  "";

/* ------------ Cookie helpers ------------ */
export function getCookie(name) {
  const m = document.cookie.match(
    new RegExp("(^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)")
  );
  return m ? decodeURIComponent(m[2]) : null;
}
export function getCsrfFromCookie() {
  return getCookie("csrftoken") || getCookie("csrfToken") || getCookie("XSRF-TOKEN") || null;
}

/* Ensure the CSRF cookie exists (hit /api/csrf/ once if missing). */
async function ensureCsrfCookie() {
  let tok = getCsrfFromCookie();
  if (tok) return tok;
  const url = API_BASE ? `${API_BASE}/api/csrf/` : "/api/csrf/";
  await fetch(url, { credentials: "include" }).catch(() => {});
  return getCsrfFromCookie();
}

/* ------------ Core fetch wrapper (adds cookies + CSRF) ------------ */
export async function apiFetch(path, { method = "GET", body, headers } = {}) {
  const url = API_BASE && path.startsWith("/") ? `${API_BASE}${path}` : path;

  const opts = {
    method,
    credentials: "include",
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      "X-Requested-With": "XMLHttpRequest",
      ...(headers || {}),
    },
  };

  // Add CSRF for unsafe methods
  const unsafe = !["GET", "HEAD", "OPTIONS", "TRACE"].includes(method.toUpperCase());
  if (unsafe) {
    const token = await ensureCsrfCookie();
    if (token) opts.headers["X-CSRFToken"] = token;
  }

  if (body) opts.body = typeof body === "string" ? body : JSON.stringify(body);

  const res = await fetch(url, opts);
  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json")
    ? await res.json().catch(() => ({}))
    : await res.text();

  if (!res.ok) {
    const detail = typeof data === "string" ? data : JSON.stringify(data);
    throw new Error(`${res.status} ${res.statusText}${detail ? " — " + detail : ""}`);
  }
  return data;
}

/* ------------ Convenience endpoints ------------ */
const api = {
  me: () => apiFetch("/api/me/"),
  login: (email, password) =>
    apiFetch("/api/login/", { method: "POST", body: { email, password } }),
  logout: () => apiFetch("/api/logout/", { method: "POST" }),
  classify: (payload) => apiFetch("/api/ml/classify/", { method: "POST", body: payload }),
  saveIdea: (payload) => apiFetch("/api/ideas/", { method: "POST", body: payload }),
};

export default api;
