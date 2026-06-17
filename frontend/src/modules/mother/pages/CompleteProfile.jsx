

// src/pages/mother/CompleteProfilePage.jsx
import { supabase } from "../../../services/supabaseClient";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const CompleteProfilePage = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isAr = i18n.language === "ar";
  const dir = isAr ? "rtl" : "ltr";

  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  //const [step, setStep] = useState(1); // 1=personal, 2=children preview (optional wizard)
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    name: "",
    age: "",
    number_of_children: 1,
    is_first_time_mother: false,
    pregnancy_status: "",
    due_date: "",
    preferred_language: "ar",
    avatar_url: "",
  });

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate("/login");

      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (!userData) return navigate("/login");
      setUserId(userData.user_id);

      const { data: motherData } = await supabase
        .from("mother_profiles")
        .select("*")
        .eq("mother_id", userData.user_id)
        .maybeSingle();

      setForm({
        name: userData?.name || "",
        age: motherData?.age || "",
        number_of_children: motherData?.number_of_children || 1,
        is_first_time_mother: motherData?.is_first_time_mother || false,
        pregnancy_status: motherData?.pregnancy_status || "",
        due_date: motherData?.due_date || "",
        preferred_language: motherData?.preferred_language || (isAr ? "ar" : "en"),
        avatar_url: userData?.avatar_url || "",
      });

      if (userData?.avatar_url) setAvatarPreview(userData.avatar_url);
      setLoading(false);
    };
    fetchUser();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview immediately
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setUploading(true);

    try {
      const ext = file.name.split(".").pop();
      const fileName = `${userId}/avatar_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
      setForm((prev) => ({ ...prev, avatar_url: data.publicUrl }));
    } catch (err) {
      console.error("Avatar upload error:", err);
      alert(isAr ? "خطأ في رفع الصورة" : "Avatar upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);

    try {
      // Update users table
      const { error: userErr } = await supabase
        .from("users")
        .update({ name: form.name, avatar_url: form.avatar_url })
        .eq("user_id", userId);
      if (userErr) throw userErr;

      // Upsert mother_profiles (insert or update)
      const { error: motherErr } = await supabase
        .from("mother_profiles")
        .upsert({
          mother_id: userId,
          age: form.age ? parseInt(form.age) : null,
          number_of_children: parseInt(form.number_of_children) || 1,
          is_first_time_mother: form.is_first_time_mother,
          pregnancy_status: form.pregnancy_status || null,
          due_date: form.due_date || null,
          preferred_language: form.preferred_language,
        }, { onConflict: "mother_id" });

      if (motherErr) throw motherErr;

      setSaved(true);
      setTimeout(() => navigate("/mother/dashboard"), 1200);

    } catch (err) {
      console.error("Save error:", err);
      alert(isAr ? "حدث خطأ أثناء الحفظ" : "Error saving profile");
    } finally {
      setSaving(false);
    }
  };

  const t = {
    title: isAr ? "إكمال ملفك الشخصي ✨" : "Complete Your Profile ✨",
    subtitle: isAr
      ? "ساعدينا بتعبئة بياناتك لنقدم لكِ تجربة مخصصة"
      : "Help us personalize your experience",
    avatar: isAr ? "الصورة الشخصية" : "Profile Photo",
    changePhoto: isAr ? "تغيير الصورة" : "Change Photo",
    uploading: isAr ? "جارٍ الرفع..." : "Uploading...",
    name: isAr ? "الاسم الكامل" : "Full Name",
    age: isAr ? "عمركِ" : "Your Age",
    numChildren: isAr ? "عدد أطفالكِ" : "Number of Children",
    firstTime: isAr ? "هل هذه تجربتكِ الأولى في الأمومة؟" : "Is this your first time being a mother?",
    pregnancyStatus: isAr ? "حالة الحمل الحالية" : "Current Pregnancy Status",
    pregnancyPlaceholder: isAr ? "مثال: حامل / بعد الولادة / لا" : "e.g. Pregnant / Postpartum / No",
    dueDate: isAr ? "موعد الولادة المتوقع" : "Expected Due Date",
    language: isAr ? "اللغة المفضلة" : "Preferred Language",
    save: isAr ? "حفظ الملف الشخصي" : "Save Profile",
    saving: isAr ? "جارٍ الحفظ..." : "Saving...",
    saved: isAr ? "تم الحفظ! ✅" : "Saved! ✅",
    skip: isAr ? "تخطي الآن" : "Skip for now",
  };

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.loadingSpinner} />
        <p style={{ color: "var(--primary)", marginTop: 16, fontWeight: 700 }}>
          {isAr ? "جارٍ التحميل..." : "Loading..."}
        </p>
      </div>
    );
  }

  return (
    <div style={styles.page} dir={dir}>
      <style>{cssStyles}</style>

      {/* Background decoration */}
      <div style={styles.bgBlob1} />
      <div style={styles.bgBlob2} />

      <div style={styles.container}>
        {/* Logo */}
        <div style={styles.logo}>Journey of Motherhood</div>

        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>{t.title}</h1>
          <p style={styles.subtitle}>{t.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>

          {/* Avatar Upload */}
          <div style={styles.avatarSection}>
            <div
              style={styles.avatarCircle}
              onClick={() => fileInputRef.current?.click()}
              className="avatar-hover"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" style={styles.avatarImg} />
              ) : (
                <div style={styles.avatarPlaceholder}>
                  <span style={{ fontSize: "2.5rem" }}>👤</span>
                </div>
              )}
              <div style={styles.avatarOverlay} className="avatar-overlay">
                {uploading ? (
                  <div style={styles.miniSpinner} />
                ) : (
                  <i className="fas fa-camera" style={{ fontSize: "1.3rem" }} />
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: "none" }}
            />
            <p style={styles.avatarHint}>
              {uploading ? t.uploading : t.changePhoto}
            </p>
          </div>

          {/* Form Grid */}
          <div style={styles.grid}>

            {/* Full Name */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                <i className="fas fa-user" style={styles.labelIcon} />
                {t.name}
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                style={styles.input}
                className="form-input"
                required
                placeholder={isAr ? "الاسم الكامل" : "Your full name"}
              />
            </div>

            {/* Age */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                <i className="fas fa-birthday-cake" style={styles.labelIcon} />
                {t.age}
              </label>
              <input
                type="number"
                name="age"
                value={form.age}
                onChange={handleChange}
                style={styles.input}
                className="form-input"
                min="15"
                max="60"
                placeholder="25"
              />
            </div>

            {/* Number of Children */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                <i className="fas fa-baby" style={styles.labelIcon} />
                {t.numChildren}
              </label>
              <input
                type="number"
                name="number_of_children"
                value={form.number_of_children}
                onChange={handleChange}
                style={styles.input}
                className="form-input"
                min="0"
                max="20"
              />
            </div>

            {/* Preferred Language */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                <i className="fas fa-globe" style={styles.labelIcon} />
                {t.language}
              </label>
              <select
                name="preferred_language"
                value={form.preferred_language}
                onChange={handleChange}
                style={styles.input}
                className="form-input"
              >
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            </div>

            {/* Pregnancy Status */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                <i className="fas fa-heart" style={styles.labelIcon} />
                {t.pregnancyStatus}
              </label>
              <input
                type="text"
                name="pregnancy_status"
                value={form.pregnancy_status}
                onChange={handleChange}
                style={styles.input}
                className="form-input"
                placeholder={t.pregnancyPlaceholder}
              />
            </div>

            {/* Due Date */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                <i className="fas fa-calendar-alt" style={styles.labelIcon} />
                {t.dueDate}
              </label>
              <input
                type="date"
                name="due_date"
                value={form.due_date}
                onChange={handleChange}
                style={styles.input}
                className="form-input"
              />
            </div>

            {/* First Time Mother - full row */}
            <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}>
              <label style={styles.checkboxLabel}>
                <div
                  style={{
                    ...styles.customCheckbox,
                    background: form.is_first_time_mother ? "var(--primary)" : "white",
                    borderColor: form.is_first_time_mother ? "var(--primary)" : "#ddd",
                  }}
                  onClick={() =>
                    setForm((p) => ({ ...p, is_first_time_mother: !p.is_first_time_mother }))
                  }
                >
                  {form.is_first_time_mother && (
                    <i className="fas fa-check" style={{ color: "white", fontSize: "0.8rem" }} />
                  )}
                </div>
                <span style={styles.checkboxText}>{t.firstTime}</span>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            style={{
              ...styles.saveBtn,
              background: saved ? "#2ecc71" : "var(--primary)",
            }}
            disabled={saving || uploading}
            className="save-btn"
          >
            {saving ? (
              <>
                <div style={styles.btnSpinner} />
                {t.saving}
              </>
            ) : saved ? (
              <>
                <i className="fas fa-check-circle" />
                {t.saved}
              </>
            ) : (
              <>
                <i className="fas fa-save" />
                {t.save}
              </>
            )}
          </button>

          <button
            type="button"
            style={styles.skipBtn}
            onClick={() => navigate("/mother/dashboard")}
          >
            {t.skip}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "#FBF9F8",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "40px 20px",
    position: "relative",
    overflow: "hidden",
  },
  bgBlob1: {
    position: "fixed", top: -200, right: -200, width: 500, height: 500,
    borderRadius: "50%", background: "rgba(214,139,157,0.08)", pointerEvents: "none",
  },
  bgBlob2: {
    position: "fixed", bottom: -200, left: -200, width: 600, height: 600,
    borderRadius: "50%", background: "rgba(234,184,198,0.06)", pointerEvents: "none",
  },
  container: {
    width: "100%", maxWidth: 600, position: "relative", zIndex: 1,
  },
  logo: {
    fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: "1.5rem",
    fontWeight: "bold", color: "#d68b9d", textAlign: "center", marginBottom: 30,
  },
  header: { textAlign: "center", marginBottom: 30 },
  title: {
    fontSize: "1.8rem", fontWeight: 800, color: "#333", marginBottom: 8,
    fontFamily: "'Poppins', sans-serif",
  },
  subtitle: {
    color: "#777", fontWeight: 600, fontSize: "0.95rem",
    fontFamily: "'Poppins', sans-serif",
  },
  form: {
    background: "white", borderRadius: 25, padding: "35px 30px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.05)", border: "1px solid #fdf2f5",
  },
  avatarSection: {
    display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 30,
  },
  avatarCircle: {
    width: 100, height: 100, borderRadius: "50%", overflow: "hidden",
    position: "relative", cursor: "pointer", border: "3px solid #eab8c6",
    boxShadow: "0 5px 20px rgba(214,139,157,0.2)",
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  avatarPlaceholder: {
    width: "100%", height: "100%", background: "#fdf2f5",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  avatarOverlay: {
    position: "absolute", inset: 0, background: "rgba(214,139,157,0.75)",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "white", opacity: 0, transition: "0.3s",
  },
  avatarHint: {
    marginTop: 10, fontSize: "0.85rem", color: "#aaa", fontWeight: 600,
    fontFamily: "'Poppins', sans-serif",
  },
  grid: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: 25,
  },
  inputGroup: { display: "flex", flexDirection: "column", gap: 8 },
  label: {
    fontSize: "0.88rem", fontWeight: 700, color: "#333",
    display: "flex", alignItems: "center", gap: 7, fontFamily: "'Poppins', sans-serif",
  },
  labelIcon: { color: "#d68b9d", fontSize: "0.9rem" },
  input: {
    padding: "11px 15px", borderRadius: 12, border: "1px solid #eee",
    outline: "none", fontFamily: "'Poppins', sans-serif", fontSize: "0.9rem",
    background: "#fafafa", color: "#333", transition: "0.3s",
    width: "100%",
  },
  checkboxLabel: {
    display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
    padding: "12px 15px", background: "#fafafa", borderRadius: 12,
    border: "1px solid #eee",
  },
  customCheckbox: {
    width: 22, height: 22, borderRadius: 6, border: "2px solid #ddd",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", transition: "0.3s", minWidth: 22,
  },
  checkboxText: {
    fontSize: "0.9rem", fontWeight: 600, color: "#333",
    fontFamily: "'Poppins', sans-serif",
  },
  saveBtn: {
    width: "100%", padding: "14px", borderRadius: 14, border: "none",
    color: "white", fontWeight: 700, fontSize: "1rem", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
    transition: "0.3s", boxShadow: "0 5px 20px rgba(214,139,157,0.3)",
    fontFamily: "'Poppins', sans-serif",
  },
  skipBtn: {
    width: "100%", padding: "12px", borderRadius: 14, border: "none",
    background: "transparent", color: "#aaa", fontWeight: 600, fontSize: "0.9rem",
    cursor: "pointer", marginTop: 10, fontFamily: "'Poppins', sans-serif",
  },
  btnSpinner: {
    width: 18, height: 18, borderRadius: "50%",
    border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "white",
    animation: "spin 0.8s linear infinite",
  },
  miniSpinner: {
    width: 20, height: 20, borderRadius: "50%",
    border: "3px solid rgba(255,255,255,0.4)", borderTopColor: "white",
    animation: "spin 0.8s linear infinite",
  },
  loadingScreen: {
    minHeight: "100vh", display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", background: "#FBF9F8",
  },
  loadingSpinner: {
    width: 40, height: 40, borderRadius: "50%",
    border: "4px solid #fdf2f5", borderTopColor: "#d68b9d",
    animation: "spin 0.8s linear infinite",
  },
};

const cssStyles = `
  :root { --primary: #d68b9d; --primary-light: #fdf2f5; --secondary: #eab8c6; }
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .avatar-hover:hover .avatar-overlay { opacity: 1 !important; }
  .form-input:focus {
    border-color: var(--secondary) !important;
    background: white !important;
    box-shadow: 0 0 0 3px var(--primary-light) !important;
  }
  .save-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(214,139,157,0.4) !important;
  }
  .save-btn:disabled { opacity: 0.7; cursor: not-allowed; }

  @media (max-width: 520px) {
    .profile-grid { grid-template-columns: 1fr !important; }
  }
`;

export default CompleteProfilePage;