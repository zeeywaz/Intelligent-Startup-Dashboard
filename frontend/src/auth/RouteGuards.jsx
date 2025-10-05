// src/auth/RouteGuards.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

function Splash() {
  return (
    <div style={{ minHeight: "40vh", display: "grid", placeItems: "center", color: "#1f2a44", fontWeight: 700 }}>
      Checking access…
    </div>
  );
}

export function RequireAuth() {
  const { loading, isAuthenticated } = useAuth();
  const location = useLocation();
  if (loading) return <Splash />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

export function RequireRole({ role }) {
  const { loading, isAuthenticated, role: myRole, next } = useAuth();
  if (loading) return <Splash />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role && myRole !== role) {
    const fallback =
      myRole === "admin" ? "/admindashboard" :
      myRole === "investor" ? "/investordashboard" :
      "/userdashboard";
    return <Navigate to={next || fallback} replace />;
  }
  return <Outlet />;
}

// For pages like /login or /signup that should be hidden *once* logged in:
export function PublicOnly() {
  const { loading, isAuthenticated, role, next } = useAuth();
  if (loading) return <Splash />;
  if (isAuthenticated) {
    const fallback =
      role === "admin" ? "/admindashboard" :
      role === "investor" ? "/investordashboard" :
      "/userdashboard";
    return <Navigate to={next || fallback} replace />;
  }
  return <Outlet />;
}
