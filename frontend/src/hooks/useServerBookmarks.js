import { useEffect, useState, useCallback } from "react";
import api from "../lib/api";

/**
 * Server-backed bookmarks for a given kind: "resource" | "competitor" | "investor"
 * - Reads via GET /api/bookmarks/ids/?kind=...
 * - Toggles via POST /api/bookmarks/toggle/
 */
export default function useServerBookmarks(kind) {
  const [ids, setIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.bookmarkIds(kind); // { kind, ids } or map
      const list = res?.ids || res?.[kind] || [];
      setIds(new Set(list.map(Number)));
    } catch (e) {
      console.error("bookmarkIds failed:", e);
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.bookmarkIds(kind);
        if (cancelled) return;
        const list = res?.ids || res?.[kind] || [];
        setIds(new Set(list.map(Number)));
      } catch (e) {
        if (!cancelled) console.error("bookmarkIds failed:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [kind]);

  const isBookmarked = useCallback((id) => ids.has(Number(id)), [ids]);

  const toggle = useCallback(async (id) => {
    id = Number(id);

    // optimistic UI
    setIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

    try {
      // grab CSRF if your api wrapper exposes it (safe no-op if not)
      if (typeof api.csrf === "function") {
        try { await api.csrf(); } catch {}
      }

      // support either naming in your api wrapper
      const toggleFn = api.bookmarkToggle || api.toggleBookmark;
      const r = await toggleFn(kind, id); // writes to DB

      // reconcile with server response
      if (r?.bookmarked === true) {
        setIds(prev => new Set(prev).add(id));
      } else if (r?.bookmarked === false) {
        setIds(prev => { const n = new Set(prev); n.delete(id); return n; });
      }
    } catch (e) {
      console.error("bookmarkToggle failed:", e);
      // revert optimistic change
      setIds(prev => {
        const n = new Set(prev);
        n.has(id) ? n.delete(id) : n.add(id);
        return n;
      });
      throw e;
    }
  }, [kind]);

  return { ids, isBookmarked, toggle, loading, refresh };
}
