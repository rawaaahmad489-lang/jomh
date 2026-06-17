// src/features/auth/pages/AuthCallback.jsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../services/supabaseClient";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        // وجّه لصفحة إعادة التعيين مع الـ session نشطة
        navigate("/reset-password", { replace: true });
        return;
      }

      if (event === "SIGNED_IN" && session) {
        navigate("/redirect", { replace: true });
        return;
      }
    });

    // fallback: إذا لم يُطلق onAuthStateChange خلال 5 ثوانٍ
    const timer = setTimeout(() => {
      navigate("/login", { replace: true });
    }, 5000);

    return () => {
      listener.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [navigate]);

  return (
    <div className="auth-wrapper">
      <div className="auth-box" style={{ textAlign: "center" }}>
        <p>جاري التحقق...</p>
      </div>
    </div>
  );
}