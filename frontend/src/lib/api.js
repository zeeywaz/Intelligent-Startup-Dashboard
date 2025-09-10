const API = import.meta.env.VITE_API_BASE;

export async function getDbHealth() {
  const res = await fetch(`${API}/health/db/`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}
