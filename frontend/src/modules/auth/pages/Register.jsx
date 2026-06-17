
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authService } from "../../../core/auth/authService";

import { ROLE_THEMES, SPECIALIZATIONS } from "../../../core/theme/roleThemes";
export default function RegisterPage() {
  const { state }    = useLocation();
  const role         = state?.role;
  const theme        = ROLE_THEMES[role];
  const { t, i18n } = useTranslation();
  const navigate     = useNavigate();

  const [form,    setForm]    = useState({});
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  if (!theme) return <h2>No role selected — <a href="/select-role">go back</a></h2>;

  const handleChange = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

const handleRegister = async (e) => {
  e.preventDefault();
  setError(null);
  setLoading(true);

  const { email, password, full_name, specialty, license_number, certifications } = form;

  const { error } = await authService.register({
    email,
    password,
    name:           full_name,
    role,
    specialty:      specialty      || null,
    license_number: license_number || null,
    certifications: certifications || null,
  });

  setLoading(false);
  if (error) { setError(error.message); return; }
  navigate("/waiting-approval", { replace: true });
};
 /* const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { email, password, full_name, specialty, license } = form;

    const { error } = await authService.register({
      email,
      password,
      name: full_name,
      role,
       specialty: specialty || null,
      license:   license   || null,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // التسجيل ناجح — وجّه لصفحة الانتظار
    navigate("/waiting-approval", { replace: true });
  };
*/
  return (
    <div
      className="auth-wrapper"
      style={{ "--primary": theme.color, "--light": theme.light }}
      dir={i18n.language === "ar" ? "rtl" : "ltr"}
    >
      <div className="auth-box">
        <div className="header-box">
          <span className="logo">Journey of Motherhood</span>
          <h2>{t(theme.titleKey)}</h2>
          <p className="subtitle">{t(theme.subtitleKey)}</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form
          onSubmit={handleRegister}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 25 }}
        >
      
{theme.fields.map((field) => (
  <div
    key={field.name}
    style={field.full ? { gridColumn: "span 2" } : {}}
  >
    <div className="input-group">
      <label>
        {field.icon && (
          <i
            className={`fas ${field.icon}`}
            style={{ color: theme.color, fontSize: "0.85rem" }}
          />
        )}
        {t(field.labelKey)}
      </label>
{field.type === "select" && field.name === "specialty" ? (
  <select
    className="input"
    onChange={(e) => handleChange(field.name, e.target.value)}
    required={field.required}
  >
    <option value="">
      {i18n.language === "ar" ? "اختر التخصص" : "Select Specialty"}
    </option>
    {SPECIALIZATIONS.map((s) => (
      <option key={s.value} value={s.value}>
        {i18n.language === "ar" ? s.ar : s.en}
      </option>
    ))}
  </select>
) : field.type === "select" ? (
  <select className="input" onChange={(e) => handleChange(field.name, e.target.value)}>
    <option value="">{t("auth.selectAge")}</option>
    {field.options?.map((opt) => (
      <option key={opt} value={opt}>{opt}</option>
    ))}
  </select>
) : (
  <input
    className="input"
    type={field.type}
    placeholder={field.placeholder ? t(field.placeholder) : ""}
    required={field.required}
    onChange={(e) => handleChange(field.name, e.target.value)}
  />
)}

      {field.instructionKey && (
        <span
          style={{
            display: "block",
            marginTop: 8,
            color: "#999",
            fontSize: "0.8rem",
            paddingInlineStart: 5,
          }}
        >
          {t(field.instructionKey)}
        </span>
      )}
    </div>
  </div>
))}
          <button
            type="submit"
            className="btn-main"
            disabled={loading}
            style={{ gridColumn: "span 2", background: theme.color }}
          >
            {loading ? "..." : t("auth.registerBtn")}
          </button>
        </form>

        <p className="login-link-box">
          {t("auth.haveAccount")}{" "}
          <a href="/login" onClick={(e) => { e.preventDefault(); navigate("/login", { state: { role } }); }}>
  {t("auth.login")}
</a>
        { /* <a href="/login">{t("auth.login")}</a>*/}
        </p>
      </div>
    </div>
  );
}
