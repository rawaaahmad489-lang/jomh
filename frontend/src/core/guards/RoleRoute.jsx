


// src/core/guards/RoleRoute.jsx

import { Navigate } from "react-router-dom";
import { useAuthContext } from "../context/useAuthContext";
import LoadingScreen from "../../components/LoadingScreen";
export default function RoleRoute({ children, roles }) {
  const { role, status, isReady } = useAuthContext();

  /*if (!isReady) return <div className="loading-screen">جاري التحقق...</div>;*/
 if (!isReady) return <LoadingScreen role={role} />;
 if (!role) return <Navigate to="/" replace />;

  // وجّه حسب الحالة
  if (status === "pending")   return <Navigate to="/waiting-approval" replace />;
  if (status === "rejected")  return <Navigate to="/rejected" replace />;
  if (status === "suspended") return <Navigate to="/unauthorized" replace />;

  if (!roles?.includes(role)) return <Navigate to="/unauthorized" replace />;

  return children;
}








