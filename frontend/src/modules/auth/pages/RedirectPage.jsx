
// redirect page
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../../core/context/useAuthContext";
import LoadingScreen from "../../../components/LoadingScreen";
const ROLE_ROUTES = {
  mother: "/mother/dashboard",
  doctor: "/doctor/dashboard",
  vendor: "/vendor/dashboard",
  admin:  "/admin/dashboard",
};

export default function RedirectPage() {
  const { user, role, status, isReady } = useAuthContext();
  const navigate    = useNavigate();
  const didRedirect = useRef(false); // ← يمنع التوجيه المزدوج
useEffect(() => {
  if (!isReady) return;
  if (!user) { navigate("/login", { replace: true }); return; }

  // إذا اكتمل التحقق ولم نجد دوراً، ربما المستخدم جديد جداً أو هناك خطأ
  if (!role || !status) {
    console.warn("User authenticated but no role found yet.");
    // يمكنك التوجيه لصفحة إكمال البيانات أو الانتظار قليلاً
    return; 
  }

  if (didRedirect.current) return;
  didRedirect.current = true;

    if (status === "pending")   { navigate("/waiting-approval", { replace: true }); return; }
    if (status === "rejected")  { navigate("/rejected",         { replace: true }); return; }
    if (status === "suspended") { navigate("/unauthorized",     { replace: true }); return; }

    const target = ROLE_ROUTES[role];
    if (target) navigate(target, { replace: true });

}, [user, role, status, isReady, navigate]);
  

  // أضف timeout — إذا مر 10 ثواني بدون توجيه، شيء خطأ
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!didRedirect.current) {
        console.error("Redirect timeout — state:", { user, role, status, isReady });
        navigate("/login", { replace: true });
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, []);
  return <LoadingScreen message="جاري إعادة التوجيه..." />;

}