// src/lib/api.js
// CRA-safe (Webpack) config + CSRF helpers

export const API_BASE =
  (typeof process !== "undefined" &&
    process.env &&
    process.env.REACT_APP_API_BASE) ||
  "http://localhost:8000";

// simple cookie getter
export function getCookie(name) {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : "";
}

// call once (on app mount) to set csrftoken cookie
export async function ensureCsrf() {
  try {
    await fetch(`${API_BASE}/api/csrf/`, { credentials: "include" });
  } catch {
    // ignore
  }
}
