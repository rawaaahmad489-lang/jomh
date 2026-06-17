// src/features/auth/pages/ResetPasswordPage.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authService } from "../../../core/auth/authService";
import { supabase } from "../../../services/supabaseClient";

export default function ResetPasswordPage() {
  const { i18n }     = useTranslation();
  const navigate     = useNavigate();

  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [ready,     setReady]     = useState(false); // session جاهزة؟
  const [done,      setDone]      = useState(false);

  // انتظر حتى يستقبل Supabase الـ session من URL hash
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    // إذا كان المستخدم موجوداً بالفعل (من session سابقة + hash)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }
    if (password !== confirm) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }

    setLoading(true);
    const { error } = await authService.resetPassword(password);
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setDone(true);
    // وجّه بعد 3 ثواني
    setTimeout(() => navigate("/login", { replace: true }), 3000);
  };

  // ✅ تم التغيير
  if (done) {
    return (
      <div className="auth-wrapper">
        <div className="auth-box" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: 12 }}>✅</div>
          <h2>تم تغيير كلمة المرور!</h2>
          <p style={{ color: "#888" }}>سيتم توجيهك لصفحة تسجيل الدخول...</p>
        </div>
      </div>
    );
  }

  // ⏳ لم تصل الـ session بعد
  if (!ready) {
    return (
      <div className="auth-wrapper">
        <div className="auth-box" style={{ textAlign: "center" }}>
          <p>جاري التحقق من الرابط...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="auth-wrapper"
      style={{ "--primary": "#7fa9ae", "--light": "#eef6f7" }}
      dir={i18n.language === "ar" ? "rtl" : "ltr"}
    >
      <div className="auth-box">
        <div className="header-box">
          <span className="logo">Journey of Motherhood</span>
          <h2>إعادة تعيين كلمة المرور</h2>
          <p className="subtitle">أدخل كلمة المرور الجديدة</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit} style={{ maxWidth: 420, margin: "0 auto" }}>
          <div className="input-group">
            <label>
              <i className="fas fa-lock" style={{ color: "#7fa9ae", fontSize: "0.85rem" }} />
              كلمة المرور الجديدة
            </label>
            <input
              type="password"
              className="input"
              placeholder="8 أحرف على الأقل"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <div className="input-group">
            <label>
              <i className="fas fa-lock" style={{ color: "#7fa9ae", fontSize: "0.85rem" }} />
              تأكيد كلمة المرور
            </label>
            <input
              type="password"
              className="input"
              placeholder="أعد كتابة كلمة المرور"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>

          {/* مؤشر التطابق */}
          {confirm && (
            <p style={{
              fontSize: "0.8rem",
              color: password === confirm ? "green" : "#e74c3c",
              marginBottom: 8,
              paddingInlineStart: 4,
            }}>
              {password === confirm ? "✓ كلمتا المرور متطابقتان" : "✗ كلمتا المرور غير متطابقتين"}
            </p>
          )}

          <button
            type="submit"
            className="btn-main"
            style={{ background: "#7fa9ae", marginTop: 8 }}
            disabled={loading}
          >
            {loading ? "..." : "حفظ كلمة المرور"}
          </button>
        </form>
      </div>
    </div>
  );
}