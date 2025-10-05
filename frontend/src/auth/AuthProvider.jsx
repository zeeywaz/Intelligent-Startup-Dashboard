// src/auth/AuthProvider.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);       // null when not logged in
  const [roles, setRoles] = useState([]);       // ["User", "Investor", ...]
  const [next, setNext] = useState("/login");   // server-computed preferred path

  const refresh = async () => {
    try {
      const data = await api.me();
      if (data?.authenticated) {
        setUser(data.user || null);
        setRoles(data.roles || []);
        setNext(data.next || "/userdashboard");
      } else {
        setUser(null);
        setRoles([]);
        setNext("/login");
      }
    } catch {
      setUser(null);
      setRoles([]);
      setNext("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const role = useMemo(() => {
    if (!user) return null;
    if (user.is_superuser) return "admin";
    return next === "/investordashboard" ? "investor" : "user";
  }, [user, next]);

  const value = useMemo(
    () => ({
      loading,
      user,
      roles,
      role,
      next,
      isAuthenticated: !!user,
      refresh,
    }),
    [loading, user, roles, role, next]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
