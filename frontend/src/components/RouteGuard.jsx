import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { API_BASE } from "../lib/api";

export default function RouteGuard({ need, children }) {
  const [ok, setOk] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/me/`, { credentials: "include" });
        const j = await r.json();
        const roles = j?.roles || [];
        if (!alive) return;
        setOk(roles.includes(need));
      } catch {
        if (!alive) return;
        setOk(false);
      }
    })();
    return () => { alive = false; };
  }, [need]);

  if (ok === null) return null; // render nothing while checking
  if (!ok) {
    // soft bounce: default to user dashboard; your router can route again from there
    return <Navigate to="/userdashboard" replace />;
  }
  return children;
}