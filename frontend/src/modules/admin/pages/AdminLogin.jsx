// src/modules/admin/pages/AdminLogin.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../services/supabaseClient";
import "../../../styles/AdminLayout.css";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. تسجيل الدخول عبر Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw new Error("البريد أو كلمة المرور غير صحيحة");

      // 2. تحقق من الـ role في جدول profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, full_name, is_active")
        .eq("id", data.user.id)
        .single();

      if (profileError || !profile) throw new Error("لم يتم العثور على الملف الشخصي");
      if (profile.role !== "admin")  throw new Error("غير مصرح لك بالدخول إلى لوحة التحكم");
      if (!profile.is_active)        throw new Error("هذا الحساب موقوف. تواصل مع مزود الخدمة");

      // 3. وجّه للـ Dashboard
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.message);
      // سجّل خروج احترازي لو تسجيل دخول نجح لكن role خاطئ
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-root" dir="rtl">
      <div className="admin-login-bg">
        <div className="admin-login-orb orb1" />
        <div className="admin-login-orb orb2" />
        <div className="admin-login-orb orb3" />
      </div>

      <div className="admin-login-card">
        <div className="admin-login-logo">
          <div className="admin-login-icon">👑</div>
          <h1>لوحة تحكم الأدمن</h1>
          <p>منصة الأمومة والرعاية</p>
        </div>

        <form onSubmit={handleLogin} className="admin-login-form">
          <div className="admin-field">
            <label>البريد الإلكتروني</label>
            <div className="admin-input-wrap">
              <i className="fas fa-envelope" />
              <input
                type="email"
                placeholder="admin@platform.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="admin-field">
            <label>كلمة المرور</label>
            <div className="admin-input-wrap">
              <i className="fas fa-lock" />
              <input
                type="password"
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <div className="admin-login-error">
              <i className="fas fa-exclamation-circle" />
              {error}
            </div>
          )}

          <button type="submit" className="admin-login-btn" disabled={loading}>
            {loading ? (
              <><i className="fas fa-spinner fa-spin" /> جارٍ التحقق...</>
            ) : (
              <><i className="fas fa-sign-in-alt" /> دخول إلى لوحة التحكم</>
            )}
          </button>
        </form>

        <div className="admin-login-note">
          <i className="fas fa-shield-alt" />
          هذه الصفحة للمشرفين المعتمدين فقط. لا يوجد تسجيل.
        </div>
      </div>
    </div>
  );
}