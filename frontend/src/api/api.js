const BASE_URL = "http://127.0.0.1:8000/api";

export async function fetchInvestors() {
  const res = await fetch(`${BASE_URL}/investors/`);
  if (!res.ok) throw new Error("Failed to fetch investors");
  return await res.json();
}

export async function fetchResources() {
  const res = await fetch(`${BASE_URL}/resources/`);
  if (!res.ok) throw new Error("Failed to fetch resources");
  return await res.json();
}

export async function fetchCompetitors() {
  const res = await fetch(`${BASE_URL}/competitors/`);
  if (!res.ok) throw new Error("Failed to fetch competitors");
  return await res.json();
}