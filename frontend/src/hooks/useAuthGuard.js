import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../lib/api"; // default import

export default function useAuthGuard(allowedRoles = []) {
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const loc = useLocation();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const ctrl = new AbortController();

    (async () => {
      try {
        const me = await api.me({ signal: ctrl.signal });
        if (!me?.authenticated) {
          const next = encodeURIComponent(loc.pathname + loc.search);
          navigate(`/login?next=${next}`, { replace: true });
          return;
        }
        const roles = me?.roles || [];
        const ok = !allowedRoles.length || roles.some((r) => allowedRoles.includes(r));
        if (!ok) {
          navigate(me?.next || "/", { replace: true });
          return;
        }
        setReady(true);
      } catch (e) {
        if (e.name === "AbortError") return;
        const next = encodeURIComponent(loc.pathname + loc.search);
        navigate(`/login?next=${next}`, { replace: true });
      }
    })();

    return () => ctrl.abort();
  }, [allowedRoles, navigate, loc]);

  return ready;
}
