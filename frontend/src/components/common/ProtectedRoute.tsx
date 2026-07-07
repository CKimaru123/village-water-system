import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "client";
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#1F2A40", // matches dashboard dark background
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: "4px solid #4cceac33",
          borderTop: "4px solid #4cceac",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const hasPermission =
      (requiredRole === "admin" && (user.role === "admin" || user.role === "super_admin")) ||
      (requiredRole === "client" && user.role === "client");

    if (!hasPermission) {
      if (user.role === "admin" || user.role === "super_admin") return <Navigate to="/admin" replace />;
      if (user.role === "client") return <Navigate to="/client" replace />;
      return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
