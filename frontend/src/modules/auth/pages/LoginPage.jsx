
/*
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authService } from "../../../core/auth/authService";
import { ROLE_THEMES } from "../../../core/theme/roleThemes";

export default function LoginPage() {
  const { state }    = useLocation();
  const role  = state?.role || null;
const theme = ROLE_THEMES[role] ?? { color: "#7fa9ae", light: "#eef6f7" };

  const { t, i18n } = useTranslation();
  const navigate     = useNavigate();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await authService.login(email, password);

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // onAuthStateChange في AuthProvider سيتولى جلب الدور
    // RedirectPage ستنتظر isReady تلقائياً
    navigate("/redirect", { replace: true });
  };

  return (
    <div
      className="auth-wrapper "
      style={{ "--primary": theme.color, "--light": theme.light }}
      dir={i18n.language === "ar" ? "rtl" : "ltr"}
    >
      <div className="auth-box"    >
       <h1 className="logo" style={{  textAlign: "center"}}  >Journey of Motherhood</h1>
        <h2 style={{  textAlign: "center"}}  >{t("auth.loginTitle")}</h2>
        <p className="subtitle" style={{  textAlign: "center"}}>{t("auth.loginSubtitle")}</p>

        {error && (
          <div className="error-banner">{error}</div>
        )}

        <div style={{ maxWidth: 450, margin: "0 auto" }}>
          <form onSubmit={handleLogin}>

<div className="input-group">
  <label>
    <i className="fas fa-envelope" style={{ color: theme.color, fontSize: "0.85rem" }} />
    {t("auth.email")}
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

<div className="input-group">
  <label>
    <i className="fas fa-lock" style={{ color: theme.color, fontSize: "0.85rem" }} />
    {t("auth.password")}
  </label>
  <input
    type="password"
    className="input"
    placeholder={t("auth.password")}
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    required
  />
</div>
            <a  href="/forgot-password"
  className="forgot-password"
  onClick={(e) => { e.preventDefault(); navigate("/forgot-password"); }}
>
  {t("auth.forgotPassword")}
</a>

            <button
              type="submit"
              className="btn-main"
              style={{ background: theme.color }}
              disabled={loading}
            >
              {loading ? "..." : t("auth.login")}
            </button>
          </form>

          <p className="register-link">
            {t("auth.noAccount")}{" "}
            <a href="/select-role">{t("auth.registerBtn")}</a>
          </p>
        </div>
      </div>
    </div>
  );
}*/
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authService } from "../../../core/auth/authService";
import { ROLE_THEMES } from "../../../core/theme/roleThemes";

export default function LoginPage() {
  const { state }    = useLocation();
  const role         = state?.role || null;
  const theme        = ROLE_THEMES[role] ?? { color: "#7fa9ae", light: "#eef6f7" };
  const { t, i18n } = useTranslation();
  const navigate     = useNavigate();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  // ── مفاتيح النصوص حسب الدور ──────────────────────────────────────
  const roleKeys = {
    doctor: {
      title:     "doctor.loginTitle",
      subtitle:  "doctor.loginSubtitle",
      btn:       "doctor.loginBtn",
      badge:     "doctor.badge",
      noAccount: "doctor.noAccount",
      applyNow:  "doctor.applyNow",
      applyLink: "/select-role",
    },
    vendor: {
      title:     "vendor.loginTitle",
      subtitle:  "vendor.loginSubtitle",
      btn:       "vendor.loginBtn",
      badge:     "vendor.badge",
      noAccount: "vendor.noAccount",
      applyNow:  "vendor.applyNow",
      applyLink: "/select-role",
    },
    mother: {
      title:     "auth.loginTitle",
      subtitle:  "auth.loginSubtitle",
      btn:       "auth.login",
      badge:     null,
      noAccount: "auth.noAccount",
      applyNow:  "auth.registerBtn",
      applyLink: "/select-role",
    },
  };

  const keys = roleKeys[role] ?? roleKeys["mother"];

  // ── تسجيل الدخول ─────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await authService.login(email, password);

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    navigate("/redirect", { replace: true });
  };

  return (
    <div
      className="auth-wrapper"
      style={{ "--primary": theme.color, "--light": theme.light }}
      dir={i18n.language === "ar" ? "rtl" : "ltr"}
    >
      <div className="auth-box">

        {/* ── شعار المنصة ── */}
        <h1 className="logo" style={{ textAlign: "center" }}>
          Journey of Motherhood
        </h1>

        {/* ── Badge خاص بالدكتور أو الفيندور ── */}
  
{keys.badge && (
  <div
    className="doctor-badge"
    style={{
      background: theme.light,
      color: theme.color,
      border: `1px solid ${theme.color}`,
      borderRadius: "20px",
      padding: "6px 16px",
      display: "flex",          // غيّري من inline-flex إلى flex
      alignItems: "center",
      justifyContent: "center", // ← هذا يحاذي المحتوى للوسط
      gap: "6px",
      width: "fit-content",     // ← يجعل العرض بحجم المحتوى
      margin: "12px auto 12px",    // ← auto على اليمين واليسار يحوّطه بالوسط
      fontSize: "0.85rem",
      fontWeight: 600,
    }}
  >
    <i
      className={
        role === "doctor" ? "fas fa-user-md" : "fas fa-store"
      }
    />
    {t(keys.badge)}
  </div>
)}

        {/* ── العنوان والوصف ── */}
        <h2 style={{ textAlign: "center" }}>{t(keys.title)}</h2>
        <p className="subtitle" style={{ textAlign: "center" }}>
          {t(keys.subtitle)}
        </p>

        {/* ── رسالة الخطأ ── */}
        {error && <div className="error-banner">{error}</div>}

        <div style={{ maxWidth: 450, margin: "0 auto" }}>
          <form onSubmit={handleLogin}>

            {/* ── البريد الإلكتروني ── */}
            <div className="input-group">
              <label>
                <i
                  className="fas fa-envelope"
                  style={{ color: theme.color, fontSize: "0.85rem" }}
                />
                {t("auth.email")}
              </label>
              <input
                type="email"
                className="input"
                placeholder={
                  role === "doctor" || role === "vendor"
                    ? "example@mail.com"
                    : "example@mail.com"
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* ── كلمة المرور ── */}
            <div className="input-group">
              <label>
                <i
                  className="fas fa-lock"
                  style={{ color: theme.color, fontSize: "0.85rem" }}
                />
                {t("auth.password")}
              </label>
              <input
                type="password"
                className="input"
                placeholder={t("auth.password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* ── نسيت كلمة المرور ── */}
                    <a  href="/forgot-password"
  className="forgot-password"
  onClick={(e) => { e.preventDefault(); navigate("/forgot-password"); }}
>
  {t("auth.forgotPassword")}
</a>

            {/* ── زر الدخول ── */}
            <button
              type="submit"
              className="btn-main"
              style={{ background: theme.color }}
              disabled={loading}
            >
              {loading ? "..." : t(keys.btn)}
            </button>
          </form>

          {/* ── رابط التسجيل ── */}
          <p className="register-link">
            {t(keys.noAccount)}{" "}
            <a href={keys.applyLink}>{t(keys.applyNow)}</a>
          </p>
        </div>
      </div>
    </div>
  );
}