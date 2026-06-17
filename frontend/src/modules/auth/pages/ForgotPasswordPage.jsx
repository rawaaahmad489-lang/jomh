// src/features/auth/pages/ForgotPasswordPage.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authService } from "../../../core/auth/authService";

export default function ForgotPasswordPage() {
  const { t, i18n } = useTranslation();
  const navigate     = useNavigate();

  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [sent,    setSent]    = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await authService.forgotPassword(email);

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSent(true); // أظهر رسالة النجاح
  };

  // ✅ شاشة تأكيد الإرسال
  if (sent) {
    return (
      <div className="auth-wrapper" dir={i18n.language === "ar" ? "rtl" : "ltr"}>
        <div className="auth-box" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: 12 }}>📧</div>
          <h2>تم إرسال الرابط!</h2>
          <p style={{ color: "#888", marginTop: 8 }}>
            تحقق من بريدك الإلكتروني واضغط على رابط إعادة التعيين.
          </p>
          <button
            className="btn-main"
            style={{ marginTop: 24, background: "#7fa9ae" }}
            onClick={() => navigate("/login")}
          >
            العودة لتسجيل الدخول
          </button>
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
          <h2>نسيت كلمة المرور؟</h2>
          <p className="subtitle">
            أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين
          </p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit} style={{ maxWidth: 420, margin: "0 auto" }}>
          <div className="input-group">
            <label>
              <i
                className="fas fa-envelope"
                style={{ color: "#7fa9ae", fontSize: "0.85rem" }}
              />
              البريد الإلكتروني
            </label>
            <input
              type="email"
              className="input"
              placeholder="example@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-main"
            style={{ background: "#7fa9ae", marginTop: 8 }}
            disabled={loading}
          >
            {loading ? "..." : "إرسال رابط الاسترداد"}
          </button> 
          <button
            className="btn-main"
            style={{ marginTop: 24, background: "#7fa9ae" }}
            onClick={() => navigate("/login")}
          >
            العودة لتسجيل الدخول
          </button>
        </form>

      
      
       
      
      </div>
    </div>
  );
}