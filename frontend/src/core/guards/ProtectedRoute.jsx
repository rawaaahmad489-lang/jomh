
// src/core/guards/ProtectedRoute.jsx

import { Navigate } from "react-router-dom";
import { useAuthContext } from "../context/useAuthContext";
import LoadingScreen from "../../components/LoadingScreen";
export default function ProtectedRoute({ children }) {
  const { user, isReady } = useAuthContext();

  /*if (!isReady) return <div className="loading-screen">جاري التحقق...</div>;
  if (!user)    return <Navigate to="/login" replace />;*/
if (!isReady) return <LoadingScreen />;
  if (!user)    return <Navigate to="/" replace />;
  return children;
}