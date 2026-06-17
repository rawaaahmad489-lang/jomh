
// src/pages/doctor/DoctorDashboard.jsx
import { useState, useRef , useCallback, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../../../services/supabaseClient";
import { useDoctor } from "../../../core/hooks/useDoctor";
//import { useDoctorRecommendations } from "../../../core/hooks/useRecommendations";
import DoctorRecModal from "../../../components/recommendations/DoctorRecModal";
// ✅ أضف SPECIALIZATIONS
import { ROLE_THEMES, SPECIALIZATIONS } from "../../../core/theme/roleThemes";
import DoctorArticlesSection from "./DoctorArticlesSection";
import ChildAccessSection from "../components/ChildAccessSection";
// ─── helpers ────────────────────────────────
const fmt = (d, isAr) => d ? new Date(d).toLocaleDateString(isAr ? "ar-SA" : "en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";
const fmtTime = (d, isAr) => d ? new Date(d).toLocaleTimeString(isAr ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" }) : "—";

const STAR = (n, max = 5) => Array.from({ length: max }, (_, i) => (
  <i key={i} className={`fas fa-star${i < Math.floor(n) ? "" : i < n ? "-half-alt" : " star-empty"}`} />
));

const STATUS_STYLE = {
  pending:  { bg: "#fff8f0", color: "#f39c12" },
  approved: { bg: "#f0faf4", color: "#2ecc71" },
  rejected: { bg: "#fef0f0", color: "#e74c3c" },
  published:{ bg: "#f0f4ff", color: "#3498db" },
  draft:    { bg: "#f4f4f4", color: "#888"    },
  archived: { bg: "#f4f4f4", color: "#888"    },
};

// ─── MAIN ────────────────────────────────────
const DoctorDashboard = () => {
  const { i18n } = useTranslation();
  const navigate  = useNavigate();
  const isAr = i18n.language === "ar";
  const dir  = isAr ? "rtl" : "ltr";
const theme = ROLE_THEMES["doctor"]; 
  const { loading, user, profile, articles, recommendations, appointments, ratings, stats, refetch ,notifications, unreadCount} = useDoctor();

  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [articleModal, setArticleModal] = useState(false);
  const [recModal, setRecModal]         = useState(false);
  const [profileModal, setProfileModal] = useState(false);
  const [notiOpen, setNotiOpen]         = useState(false);
  const avatarRef = useRef(null);

  const hour = new Date().getHours();
  const getGreeting = (n) => {
    if (isAr) {
      if (hour < 12) return `صباح الخير، د. ${n} ☀️`;
      if (hour < 18) return `مساء الخير، د. ${n} ☕`;
      return `طاب مساؤكَ، د. ${n} 🌙`;
    }
    if (hour < 12) return `Good morning, Dr. ${n} ☀️`;
    if (hour < 18) return `Good afternoon, Dr. ${n} ☕`;
    return `Good evening, Dr. ${n} 🌙`;
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/"); };
  const switchLang   = () => { i18n.changeLanguage(isAr ? "en" : "ar"); document.documentElement.dir = isAr ? "ltr" : "rtl"; };
const markNotiRead = async () => {
  if (!user) return;
  await supabase.from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.user_id)
    .eq("is_read", false);
  refetch();
};

const markSingleRead = async (id) => {
  await supabase.from("notifications")
    .update({ is_read: true })
    .eq("notification_id", id);
  refetch();
};

const NOTI_ICON = (type) => ({
  appointment: "📅", system: "🔐", medical: "💊",
  reminder: "⏰", recommendation: "💡", promo: "🎁", order: "📦"
})[type] || "🔔";
  const NAV_ITEMS = [
    { key: "overview",       label: isAr ? "نظرة عامة" : "Overview",          icon: "fas fa-th-large" },
    { key: "appointments",   label: isAr ? "المواعيد" : "Appointments",        icon: "fas fa-calendar-alt" },
    { key: "articles",       label: isAr ? "المقالات" : "Articles",            icon: "fas fa-newspaper" },
    { key: "recommendations",label: isAr ? "التوصيات" : "Recommendations",     icon: "fas fa-lightbulb" },
    { key: "ratings",        label: isAr ? "التقييمات" : "Ratings",            icon: "fas fa-star" },
    { key: "childaccess",    label: isAr ? "متابعة الأطفال" : "Child Monitoring", icon: "fas fa-child" },
    { key: "profile",        label: isAr ? "ملفي الطبي" : "My Profile",         icon: "fas fa-user-md" },
  ];

  if (loading) return (
    <div className="doc-loading">
      <div className="doc-spinner" />
      <p>{isAr ? "جارٍ التحميل..." : "Loading..."}</p>
    </div>
  );

  const doctorName = user?.name || (isAr ? "الطبيب" : "Doctor");

  return (
    <div className="doc-root" dir={dir}  style={{
      "--primary":       theme.color,        
      "--primary-light": theme.light,       
      "--accent":        theme.color,
    }} >
      <style>{DOC_CSS}</style>

      {sidebarOpen && <div className="doc-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* ══════════════ SIDEBAR ══════════════ */}
      <aside className={`doc-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="doc-sidebar-logo">Journey of Motherhood</div>

        <div className="doc-sidebar-avatar-section">
          {user?.avatar_url
            ? <img src={user.avatar_url} alt="avatar" className="doc-sidebar-avatar" />
            : <div className="doc-sidebar-avatar-init">{doctorName.charAt(0)}</div>}
          <div>
            <h4>{doctorName}</h4>
            <p>{profile?.specialization || (isAr ? "طبيب" : "Doctor")}</p>
          </div>
        </div>

        <nav className="doc-sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              className={`doc-nav-item ${activeSection === item.key ? "active" : ""}`}
              onClick={() => { setActiveSection(item.key); setSidebarOpen(false); }}
            >
              <i className={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
          <button className="doc-nav-item doc-nav-logout" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt" />
            <span>{isAr ? "تسجيل الخروج" : "Logout"}</span>
          </button>
        </nav>
      </aside>

      {/* ══════════════ MAIN ══════════════ */}
      <div className="doc-main">

        {/* Top bar */}
        <header className="doc-topbar">
          <button className="doc-hamburger" onClick={() => setSidebarOpen(true)}>
            <i className="fas fa-bars" />
          </button>
          <div className="doc-topbar-title">
            {NAV_ITEMS.find(n => n.key === activeSection)?.label}
          </div>
          <div className="doc-topbar-right">
            <div className="doc-lang-pill" onClick={switchLang}>
              <span className="lang-active">{isAr ? "عربي" : "EN"}</span>
              <span className="lang-inactive">{isAr ? "EN" : "عربي"}</span>
            </div>
          <div style={{ position: "relative" }}>
  <div
    className="doc-noti-btn"
    onClick={() => { setNotiOpen(!notiOpen); if (!notiOpen) markNotiRead(); }}
  >
    <i className="fas fa-bell" />
    {unreadCount > 0 && (
      <span className="doc-noti-badge">{unreadCount}</span>
    )}
  </div>

  {notiOpen && (
    <div style={{
      position: "absolute", top: "calc(100% + 8px)", right: 0,
      width: 300, background: "var(--white)", borderRadius: 16,
      boxShadow: "0 15px 40px rgba(0,0,0,.12)",
      border: "1px solid var(--border)", zIndex: 2000, overflow: "hidden",
    }}>
      <div style={{
        padding: "14px 16px", fontWeight: 800,
        borderBottom: "1px solid var(--border)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span>{isAr ? "الإشعارات" : "Notifications"}</span>
        {unreadCount > 0 && (
          <button onClick={markNotiRead} style={{
            background: "none", border: "none", color: "var(--primary)",
            fontSize: ".72rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}>
            {isAr ? "تحديد الكل كمقروء" : "Mark all read"}
          </button>
        )}
      </div>

      <div style={{ maxHeight: 340, overflowY: "auto" }}>
        {notifications.length === 0 ? (
          <div style={{ padding: "28px 16px", textAlign: "center", color: "var(--gray)" }}>
            <i className="fas fa-bell-slash" style={{ fontSize: "1.8rem", display: "block", marginBottom: 8, color: "#ddd" }} />
            <p style={{ fontSize: ".85rem" }}>{isAr ? "لا توجد إشعارات" : "No notifications"}</p>
          </div>
        ) : notifications.map(n => (
          <div
            key={n.notification_id}
            onClick={() => markSingleRead(n.notification_id)}
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #f9f9f9",
              background: !n.is_read ? "var(--primary-light)" : "transparent",
              cursor: "pointer", display: "flex", gap: 10, alignItems: "flex-start",
            }}
          >
            <span style={{ fontSize: "1.1rem", minWidth: 24 }}>{NOTI_ICON(n.notification_type)}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: ".83rem", fontWeight: 700, marginBottom: 3, lineHeight: 1.4 }}>
                {n.message}
              </p>
              <small style={{ fontSize: ".72rem", color: "var(--gray)" }}>
                {new Date(n.created_at).toLocaleDateString(
                  isAr ? "ar-SA" : "en-US",
                  { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                )}
              </small>
            </div>
            {!n.is_read && (
              <div style={{ width: 8, height: 8, background: "var(--primary)", borderRadius: "50%", marginTop: 4, flexShrink: 0 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )}
</div>
            <div className="doc-topbar-user">
              {user?.avatar_url
                ? <img src={user.avatar_url} alt="" className="doc-topbar-avatar" />
                : <div className="doc-topbar-avatar-init">{doctorName.charAt(0)}</div>}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="doc-content">

          {/* ── OVERVIEW ── */}
          {activeSection === "overview" && (
            <div>
              <div className="doc-welcome animate">
                <div>
                  <h1>{getGreeting(doctorName)}</h1>
                  <p>{isAr
                    ? "إليك ملخص نشاطك الطبي اليوم."
                    : "Here's a summary of your medical activity today."}</p>
                </div>
                <div className="doc-welcome-actions">
                  <button className="doc-btn-primary" onClick={() => { setActiveSection("articles"); setArticleModal(true); }}>
                    <i className="fas fa-plus" /> {isAr ? "مقال جديد" : "New Article"}
                  </button>
                  <button className="doc-btn-secondary" onClick={() => { setActiveSection("recommendations"); setRecModal(true); }}>
                    <i className="fas fa-lightbulb" /> {isAr ? "توصية جديدة" : "New Recommendation"}
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="doc-stats-grid animate">
                {[
                  { icon: "fa-newspaper",     val: stats.totalArticles,     lbl: isAr ? "إجمالي المقالات" : "Total Articles",    color: "#d68b9d", bg: "#fdf2f5" },
                  { icon: "fa-check-circle",  val: stats.approvedArticles,  lbl: isAr ? "مقالات معتمدة"  : "Approved Articles",  color: "#2ecc71", bg: "#f0faf4" },
                  { icon: "fa-clock",         val: stats.pendingArticles,   lbl: isAr ? "قيد المراجعة"   : "Pending Review",     color: "#f39c12", bg: "#fff8f0" },
                  { icon: "fa-lightbulb",     val: stats.totalRecs,         lbl: isAr ? "التوصيات"       : "Recommendations",    color: "#9b59b6", bg: "#f5f0ff" },
                  { icon: "fa-calendar-check",val: stats.totalAppointments, lbl: isAr ? "المواعيد"       : "Appointments",       color: "#3498db", bg: "#f0f4ff" },
                  { icon: "fa-users",         val: stats.totalPatients,     lbl: isAr ? "المرضى"         : "Patients",           color: "#e67e22", bg: "#fff5ec" },
                  { icon: "fa-star",          val: stats.avgRating || "—",  lbl: isAr ? "متوسط التقييم"  : "Avg. Rating",        color: "#f1c40f", bg: "#fffbe6" },
                ].map((s, i) => (
                  <div key={i} className="doc-stat-card" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="doc-stat-icon" style={{ background: s.bg, color: s.color }}>
                      <i className={`fas ${s.icon}`} />
                    </div>
                    <div className="doc-stat-val">{s.val}</div>
                    <div className="doc-stat-lbl">{s.lbl}</div>
                  </div>
                ))}
              </div>

              {/* Quick panels */}
              <div className="doc-overview-grid">
                {/* Upcoming Appointments */}
                <div className="doc-panel animate">
                  <div className="doc-panel-header">
                    <h3><i className="fas fa-calendar-alt" /> {isAr ? "مواعيد اليوم" : "Today's Appointments"}</h3>
                    <button className="doc-panel-more" onClick={() => setActiveSection("appointments")}>
                      {isAr ? "عرض الكل ←" : "View all →"}
                    </button>
                  </div>
                  {appointments.filter(a => {
                    const d = new Date(a.appointment_date);
                    const today = new Date();
                    return d.toDateString() === today.toDateString();
                  }).length === 0 ? (
                    <div className="doc-panel-empty">
                      <i className="fas fa-calendar-check" />
                      <p>{isAr ? "لا مواعيد اليوم" : "No appointments today"}</p>
                    </div>
                  ) : appointments
                    .filter(a => new Date(a.appointment_date).toDateString() === new Date().toDateString())
                    .map(a => (
                      <div key={a.appointment_id} className="doc-appt-row">
                        <div className="doc-appt-time">{fmtTime(a.appointment_date, isAr)}</div>
                        <div className="doc-appt-info">
                          <strong>{a.mother_profiles?.users?.name || "—"}</strong>
                          <span>{isAr ? { checkup:"فحص",vaccination:"تطعيم",consultation:"استشارة" }[a.type] || a.type : a.type}</span>
                        </div>
                        <span className="doc-appt-status" style={STATUS_STYLE[a.status]}>
                          {isAr ? { pending:"انتظار",confirmed:"مؤكد",cancelled:"ملغى",completed:"مكتمل" }[a.status] : a.status}
                        </span>
                      </div>
                    ))}
                </div>

                {/* Recent articles */}
                <div className="doc-panel animate">
                  <div className="doc-panel-header">
                    <h3><i className="fas fa-newspaper" /> {isAr ? "آخر المقالات" : "Recent Articles"}</h3>
                    <button className="doc-panel-more" onClick={() => setActiveSection("articles")}>
                      {isAr ? "عرض الكل ←" : "View all →"}
                    </button>
                  </div>
                  {articles.length === 0 ? (
                    <div className="doc-panel-empty">
                      <i className="fas fa-file-alt" />
                      <p>{isAr ? "لا توجد مقالات بعد" : "No articles yet"}</p>
                    </div>
                  ) : articles.slice(0, 4).map(a => (
                    <div key={a.article_id} className="doc-article-row">
                      <div className="doc-article-row-info">
                        <strong>{a.title?.slice(0, 40)}{a.title?.length > 40 ? "…" : ""}</strong>
                        <span>{fmt(a.created_at, isAr)}</span>
                      </div>
                      <span className="doc-status-pill" style={STATUS_STYLE[a.status] || {}}>
                        {isAr ? { pending:"انتظار",approved:"معتمد",rejected:"مرفوض" }[a.status] : a.status}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Ratings summary */}
                <div className="doc-panel animate">
                  <div className="doc-panel-header">
                    <h3><i className="fas fa-star" /> {isAr ? "التقييمات" : "Ratings"}</h3>
                    <button className="doc-panel-more" onClick={() => setActiveSection("ratings")}>
                      {isAr ? "عرض الكل ←" : "View all →"}
                    </button>
                  </div>
                  <div className="doc-rating-summary">
                    <div className="doc-rating-big">
                      <span className="doc-rating-num">{stats.avgRating || "—"}</span>
                      <div className="doc-rating-stars" style={{ color: "#f1c40f" }}>
                        {stats.avgRating ? STAR(stats.avgRating) : "—"}
                      </div>
                      <span className="doc-rating-count">
                        {ratings.length} {isAr ? "تقييم" : "reviews"}
                      </span>
                    </div>
                    <div className="doc-rating-bars">
                      {[5, 4, 3, 2, 1].map(n => {
                        const count = ratings.filter(r => r.rating === n).length;
                        const pct = ratings.length ? (count / ratings.length) * 100 : 0;
                        return (
                          <div key={n} className="doc-rating-bar-row">
                            <span>{n}</span>
                            <div className="doc-rating-bar-bg">
                              <div className="doc-rating-bar-fill" style={{ width: `${pct}%` }} />
                            </div>
                            <span>{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── APPOINTMENTS ── */}
          {activeSection === "appointments" && (
            <AppointmentsSection appointments={appointments} isAr={isAr} refetch={refetch} />
          )}


          {/* ── RECOMMENDATIONS ── 
          
            <RecommendationsSection
              recommendations={recommendations} isAr={isAr} userId={user?.user_id}
              openNew={() => setRecModal(true)} refetch={refetch}
            />
         */}

{activeSection === "recommendations" && (
          <RecommendationsSection
  isAr={isAr}
  userId={user?.user_id}
  openNew={() => setRecModal(true)}
  refetch={refetch}
/>

 )}
 {/* ── ARTICLES ── */}
{activeSection === "articles" && (
  <DoctorArticlesSection
    articles={articles}
    isAr={isAr}
    userId={user?.user_id}
    refetch={refetch}
  />
)}
          {/* ── RATINGS ── */}
          {activeSection === "ratings" && (
            <RatingsSection ratings={ratings} stats={stats} isAr={isAr} />
          )}
{/* ── CHILD ACCESS ── */}
          {activeSection === "childaccess" && (
            <ChildAccessSection
              isAr={isAr}
              doctorUserId={user?.user_id}
              doctorName={user?.name || ""}
            />
          )}
          {/* ── PROFILE ── */}
          {activeSection === "profile" && (
            <ProfileSection user={user} profile={profile} isAr={isAr} refetch={refetch} avatarRef={avatarRef} />
          )}
        </div>
      </div>

      {/* ── Article Modal ── 
      {articleModal && (
        <ArticleModal isAr={isAr} doctorId={user?.user_id}
          onClose={() => setArticleModal(false)} onSuccess={() => { setArticleModal(false); refetch(); }} />
      )}*/}

         
   

      {/* ── Recommendation Modal ── 
      {recModal && (
        <RecModal isAr={isAr} doctorId={user?.user_id}
          onClose={() => setRecModal(false)} onSuccess={() => { setRecModal(false); refetch(); }} />
      )}*/}
    </div>
  );
};
// ════════════════════════════════════════════════════════
// useDoctorRecommendations - for doctor dashboard
// ════════════════════════════════════════════════════════
export const useDoctorRecommendations = (doctorId) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [products, setProducts] = useState([]);  // all available products
 
  const fetchRecs = useCallback(async () => {
    if (!doctorId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("doctor_recommendations")
        .select(`
          *,
          recommendation_products (
            id, usage_instructions, duration_days, is_alternative, notes, sort_order,
            products (
              product_id, name, price, image_url, stock,
              stores (store_id, store_name, logo)
            )
          ),
          recommendation_tags (tags (tag_id, name)),
          recommendation_likes (id),
          recommendation_comments (comment_id, is_deleted),
          saved_recommendations (id)
        `)
        .eq("doctor_id", doctorId)
        .order("created_at", { ascending: false });
 
      if (error) throw error;
      setRecommendations(data || []);
    } catch (err) {
      console.error("useDoctorRecommendations error:", err.message);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);
 
  // Fetch all available products for linking
  const fetchProducts = useCallback(async () => {
    const { data } = await supabase
      .from("products")
      .select(`
        product_id, name, price, image_url, description, stock,
        stores (store_id, store_name),
        product_categories (name)
      `)
      .eq("is_active", true)
      .order("name")
      .limit(200);
    setProducts(data || []);
  }, []);
 
  useEffect(() => {
    fetchRecs();
    fetchProducts();
  }, [fetchRecs, fetchProducts]);
 
  // ── Create recommendation ────────────────────────────
  const createRecommendation = async ({
    title, description,
    targetAgeMin, targetAgeMax,
    status = "published",
    coverImage, videoUrl, mediaUrls = [], ageGroup,
    tagNames = [],
    linkedProducts = [],  // [{product_id, usage_instructions, duration_days, notes, is_alternative}]
  }) => {
    try {
      const { data: rec, error } = await supabase
        .from("doctor_recommendations")
        .insert({
          doctor_id:       doctorId,
          title,
          description,
          target_age_min:  parseInt(targetAgeMin) || 0,
          target_age_max:  parseInt(targetAgeMax) || 12,
          status,
          cover_image:     coverImage || null,
          video_url:       videoUrl   || null,
          media_urls:      mediaUrls,
          age_group:       ageGroup   || null,
        })
        .select()
        .single();
 
      if (error) throw error;
 
      // Insert tags
      for (const tagName of tagNames) {
        let { data: tagData } = await supabase
          .from("tags").select("tag_id").eq("name", tagName.trim()).maybeSingle();
        if (!tagData) {
          const { data: nt } = await supabase
            .from("tags").insert({ name: tagName.trim() }).select().single();
          tagData = nt;
        }
        if (tagData) {
          await supabase.from("recommendation_tags").insert({
            recommendation_id: rec.id,
            tag_id: tagData.tag_id,
          });
        }
      }
 
      // Insert linked products
      for (let i = 0; i < linkedProducts.length; i++) {
        const lp = linkedProducts[i];
        await supabase.from("recommendation_products").insert({
          recommendation_id: rec.id,
          product_id:        lp.product_id,
          usage_instructions:lp.usage_instructions || null,
          duration_days:     lp.duration_days ? parseInt(lp.duration_days) : null,
          notes:             lp.notes || null,
          is_alternative:    lp.is_alternative || false,
          sort_order:        i,
        });
      }
 
      await fetchRecs();
      return { data: rec, error: null };
    } catch (err) {
      console.error("createRecommendation error:", err.message);
      return { data: null, error: err };
    }
  };
 
  // ── Update recommendation ────────────────────────────
  const updateRecommendation = async (recId, updates) => {
    const { error } = await supabase
      .from("doctor_recommendations")
      .update(updates)
      .eq("id", recId);
    if (!error) fetchRecs();
    return !error;
  };
 
  // ── Delete recommendation ────────────────────────────
  const deleteRecommendation = async (recId) => {
    const { error } = await supabase
      .from("doctor_recommendations")
      .delete()
      .eq("id", recId);
    if (!error) fetchRecs();
    return !error;
  };
 
  // ── Upload media to Supabase Storage ─────────────────
  const uploadMedia = async (file, folder = "covers") => {
    const ext  = file.name.split(".").pop();
    const path = `${doctorId}/${folder}/${Date.now()}.${ext}`;
 
    const { error } = await supabase.storage
      .from("recommendations")
      .upload(path, file, { upsert: true });
 
    if (error) throw error;
 
    const { data } = supabase.storage
      .from("recommendations")
      .getPublicUrl(path);
 
    return data.publicUrl;
  };
 
  return {
    recommendations, products, loading,
    createRecommendation, updateRecommendation,
    deleteRecommendation, uploadMedia,
    refetch: fetchRecs,
  };
};


// ═══════════════════════════════════════════
// APPOINTMENTS SECTION
// ═══════════════════════════════════════════
const AppointmentsSection = ({ appointments, isAr, refetch }) => {
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? appointments
    : appointments.filter(a => a.status === filter);

  const updateStatus = async (id, status) => {
    await supabase.from("appointments").update({ status }).eq("appointment_id", id);
    refetch();
  };

  const FILTERS = [
    { key: "all",       lbl: isAr ? "الكل" : "All" },
    { key: "pending",   lbl: isAr ? "انتظار" : "Pending" },
    { key: "confirmed", lbl: isAr ? "مؤكدة" : "Confirmed" },
    { key: "completed", lbl: isAr ? "مكتملة" : "Completed" },
    { key: "cancelled", lbl: isAr ? "ملغاة" : "Cancelled" },
  ];

  return (
    <div>
      <div className="doc-section-header">
        <h2><i className="fas fa-calendar-alt" /> {isAr ? "المواعيد" : "Appointments"}</h2>
        <span className="doc-count-badge">{appointments.length}</span>
      </div>
      <div className="doc-filter-bar">
        {FILTERS.map(f => (
          <button key={f.key} className={`doc-filter-btn ${filter === f.key ? "active" : ""}`}
            onClick={() => setFilter(f.key)}>{f.lbl}</button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="doc-empty"><span>📅</span><p>{isAr ? "لا توجد مواعيد" : "No appointments"}</p></div>
      ) : (
        <div className="doc-appt-cards">
          {filtered.map(appt => {
            const d = new Date(appt.appointment_date);
            const sc = STATUS_STYLE[appt.status] || STATUS_STYLE.pending;
            const motherName = appt.mother_profiles?.users?.name || "—";
            const childName  = appt.children?.name;
            const typeLabels = { checkup: isAr ? "فحص" : "Checkup", vaccination: isAr ? "تطعيم" : "Vaccination", consultation: isAr ? "استشارة" : "Consultation" };
            return (
              <div key={appt.appointment_id} className="doc-appt-card">
                <div className="doc-appt-card-date">
                  <span>{d.getDate()}</span>
                  <small>{d.toLocaleString(isAr ? "ar-SA" : "en-US", { month: "short" })}</small>
                </div>
                <div className="doc-appt-card-info">
                  <h4>{typeLabels[appt.type] || appt.type}</h4>
                  <p><i className="fas fa-user" /> {motherName}</p>
                  {childName && <p><i className="fas fa-baby" /> {childName}</p>}
                  {appt.notes && <p className="doc-appt-notes"><i className="fas fa-sticky-note" /> {appt.notes}</p>}
                  <p className="doc-appt-time-text"><i className="fas fa-clock" /> {fmtTime(appt.appointment_date, isAr)}</p>
                </div>
                <div className="doc-appt-card-actions">
                  <span className="doc-status-pill" style={sc}>{
                    isAr ? { pending:"انتظار",confirmed:"مؤكد",cancelled:"ملغى",completed:"مكتمل" }[appt.status] : appt.status
                  }</span>
                  {appt.status === "pending" && (
                    <div className="doc-appt-btns">
                      <button className="doc-confirm-btn" onClick={() => updateStatus(appt.appointment_id, "confirmed")}>
                        <i className="fas fa-check" /> {isAr ? "تأكيد" : "Confirm"}
                      </button>
                      <button className="doc-reject-btn" onClick={() => updateStatus(appt.appointment_id, "cancelled")}>
                        <i className="fas fa-times" /> {isAr ? "رفض" : "Reject"}
                      </button>
                    </div>
                  )}
                  {appt.status === "confirmed" && (
                    <button className="doc-confirm-btn" onClick={() => updateStatus(appt.appointment_id, "completed")}>
                      <i className="fas fa-flag-checkered" /> {isAr ? "مكتمل" : "Complete"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};


const RecommendationsSection = ({ isAr, userId, openNew, refetch }) => {
  // ← احذفي recommendations من الـ props وأضيفي state محلي
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [editRec, setEditRec] = useState(null);
  const [showModal, setShowModal] = useState(false);
const [activeTab, setActiveTab] = useState("mine");
const [allRecs, setAllRecs] = useState([]);
const [loadingAll, setLoadingAll] = useState(false);
const [myLikes, setMyLikes] = useState(new Set());
const [mySaves, setMySaves] = useState(new Set());
  // ← جلب مباشر بدون الاعتماد على useDoctor
  const fetchMyRecs = useCallback(async () => {
    if (!userId) return;
    setLoadingRecs(true);
    const { data, error } = await supabase
      .from("doctor_recommendations")
      .select(`
        id, title, description, status, created_at,
        target_age_min, target_age_max,
        cover_image, video_url, media_urls,
        recommendation_products(
          id, usage_instructions, duration_days, notes,
          is_alternative, sort_order,
          products(product_id, name, price, image_url, stock,
            stores(store_id, store_name, logo)
          )
        ),
        recommendation_tags(tags(tag_id, name)),
        recommendation_likes(id),
        recommendation_comments(comment_id, is_deleted),
        saved_recommendations(id)
      `)
      .eq("doctor_id", userId)
      .order("created_at", { ascending: false });

    if (error) console.error("fetchMyRecs:", error.message);
    setRecommendations(data || []);
    setLoadingRecs(false);
  }, [userId]);

  useEffect(() => { fetchMyRecs(); }, [fetchMyRecs]);
const fetchAllRecs = useCallback(async () => {
    if (!userId) return;
    setLoadingAll(true);
    const { data } = await supabase
      .from("doctor_recommendations")
      .select(`
        id, title, description, status, created_at,
        target_age_min, target_age_max, cover_image,
        doctor_profiles!doctor_recommendations_doctor_id_fkey(
          doctor_id, specialization,
          users!doctor_profiles_doctor_id_fkey(name, avatar_url)
        ),
        recommendation_tags(tags(tag_id, name)),
        recommendation_likes(id, user_id),
        recommendation_comments(comment_id, is_deleted),
        saved_recommendations(id, user_id)
      `)
      .eq("status", "published")
      .order("created_at", { ascending: false });

    const fetched = data || [];
    setAllRecs(fetched);
    setMyLikes(new Set(
      fetched.filter(r => (r.recommendation_likes||[]).some(l => l.user_id === userId)).map(r => r.id)
    ));
    setMySaves(new Set(
      fetched.filter(r => (r.saved_recommendations||[]).some(s => s.user_id === userId)).map(r => r.id)
    ));
    setLoadingAll(false);
  }, [userId]);

  useEffect(() => {
    if (activeTab === "browse" && allRecs.length === 0) fetchAllRecs();
  }, [activeTab, fetchAllRecs]);

  const toggleLike = async (recId) => {
    if (!userId) return;
    if (myLikes.has(recId)) {
      await supabase.from("recommendation_likes").delete()
        .eq("recommendation_id", recId).eq("user_id", userId);
      setMyLikes(p => { const n = new Set(p); n.delete(recId); return n; });
    } else {
      await supabase.from("recommendation_likes")
        .insert({ recommendation_id: recId, user_id: userId });
      setMyLikes(p => new Set([...p, recId]));
    }
  };

  const toggleSave = async (recId) => {
    if (!userId) return;
    if (mySaves.has(recId)) {
      await supabase.from("saved_recommendations").delete()
        .eq("recommendation_id", recId).eq("user_id", userId);
      setMySaves(p => { const n = new Set(p); n.delete(recId); return n; });
    } else {
      await supabase.from("saved_recommendations")
        .insert({ recommendation_id: recId, user_id: userId });
      setMySaves(p => new Set([...p, recId]));
    }
  };
  const handleRefetch = () => { fetchMyRecs(); refetch(); };

  const requestDelete = async (recId) => {
    if (!window.confirm(isAr ? "هل تريد إرسال طلب حذف للإدارة؟" : "Send delete request to admin?")) return;
    await supabase.from("doctor_recommendations")
      .update({ status: "archived" }).eq("id", recId);
    const { data: admins } = await supabase
      .from("users").select("user_id").eq("role", "admin");
    for (const admin of (admins || [])) {
      await supabase.from("notifications").insert({
        user_id: admin.user_id,
        message: `طلب حذف توصية طبية من الدكتور`,
        notification_type: "system",
        related_type: "recommendation",
        related_id: recId,
      });
    }
    handleRefetch();
    alert(isAr ? "تم إرسال طلب الحذف للإدارة" : "Delete request sent to admin");
  };


  return (
    <div>
     {/*} <div className="doc-section-header">
        <h2><i className="fas fa-lightbulb" /> {isAr ? "توصياتي الطبية" : "My Recommendations"}</h2>
        <button className="doc-btn-primary" onClick={() => { setEditRec(null); setShowModal(true); }}>
          <i className="fas fa-plus" /> {isAr ? "توصية جديدة" : "New Recommendation"}
        </button>
      </div>*/}
<div className="doc-section-header">
        <h2><i className="fas fa-lightbulb" /> {isAr ? "التوصيات الطبية" : "Medical Recommendations"}</h2>
        {activeTab === "mine" && (
          <button className="doc-btn-primary" onClick={() => { setEditRec(null); setShowModal(true); }}>
            <i className="fas fa-plus" /> {isAr ? "توصية جديدة" : "New Recommendation"}
          </button>
        )}
      </div>

      {/* ── التبويبات ── */}
      <div className="doc-filter-bar">
        <button className={`doc-filter-btn ${activeTab === "mine" ? "active" : ""}`}
          onClick={() => setActiveTab("mine")}>
          <i className="fas fa-user-md" /> {isAr ? " توصياتي" : " My Recommendations"}
          <span className="filter-count">{recommendations.length}</span>
        </button>
        <button className={`doc-filter-btn ${activeTab === "browse" ? "active" : ""}`}
          onClick={() => setActiveTab("browse")}>
          <i className="fas fa-globe" /> {isAr ? " تصفح الكل" : " Browse All"}
          {allRecs.length > 0 && <span className="filter-count">{allRecs.length}</span>}
        </button>
      </div>
     {activeTab === "mine" && (
        <>
          {recommendations.length === 0 ? (
            <div className="doc-empty">
              <span>💡</span>
              <p>{isAr ? "لا توجد توصيات بعد" : "No recommendations yet"}</p>
              <button className="doc-btn-primary" onClick={() => { setEditRec(null); setShowModal(true); }}>
                <i className="fas fa-plus" /> {isAr ? "أضف أول توصية" : "Add first"}
              </button>
            </div>
          ) : (
            <div className="doc-recs-grid">
              {recommendations.map(rec => {
                const tags = rec.recommendation_tags?.map(t => t.tags?.name).filter(Boolean) || [];
                return (
                  <div key={rec.id} className="doc-rec-card">
                    {rec.cover_image && (
                      <div style={{ height: 120, overflow: "hidden", borderRadius: "12px 12px 0 0" }}>
                        <img src={rec.cover_image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    )}
                    <div className="doc-rec-card-top">
                      <span className="doc-status-pill" style={STATUS_STYLE[rec.status] || {}}>
                        {isAr ? { draft:"مسودة", published:"منشور", archived:"أرشيف" }[rec.status] : rec.status}
                      </span>
                      <span className="doc-rec-age-range">
                        {rec.target_age_min}–{rec.target_age_max} {isAr ? "شهر" : "mo"}
                      </span>
                    </div>
                    <h3 className="doc-rec-title">{rec.title}</h3>
                    <p className="doc-rec-desc">
                      {(rec.description || "").slice(0, 100)}{rec.description?.length > 100 ? "…" : ""}
                    </p>
                    {tags.length > 0 && (
                      <div className="doc-rec-tags">
                        {tags.slice(0, 4).map((t, i) => <span key={i} className="doc-rec-tag">#{t}</span>)}
                      </div>
                    )}
                    {rec.recommendation_products?.length > 0 && (
                      <div style={{ padding: "6px 0", fontSize: ".78rem", color: "#1a6b5c", fontWeight: 700 }}>
                        <i className="fas fa-box" /> {rec.recommendation_products.length} {isAr ? "منتج مرتبط" : "linked products"}
                      </div>
                    )}
                    <div className="doc-rec-footer">
                      <div className="doc-rec-stats">
                        <span><i className="fas fa-heart" /> {rec.recommendation_likes?.length || 0}</span>
                        <span><i className="fas fa-comment" /> {rec.recommendation_comments?.filter(c => !c.is_deleted).length || 0}</span>
                        <span><i className="fas fa-bookmark" /> {rec.saved_recommendations?.length || 0}</span>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="doc-edit-btn" onClick={() => { setEditRec(rec); setShowModal(true); }}>
                          <i className="fas fa-edit" />
                        </button>
                        {rec.status === "draft" && (
                          <button className="doc-confirm-btn doc-btn-sm"
                            onClick={async () => {
                              await supabase.from("doctor_recommendations")
                                .update({ status: "published" }).eq("id", rec.id);
                              handleRefetch();
                            }}>
                            {isAr ? "نشر" : "Publish"}
                          </button>
                        )}
                        {rec.status === "published" && (
                          <button className="doc-reject-btn doc-btn-sm"
                            onClick={async () => {
                              await supabase.from("doctor_recommendations")
                                .update({ status: "archived" }).eq("id", rec.id);
                              handleRefetch();
                            }}>
                            {isAr ? "أرشفة" : "Archive"}
                          </button>
                        )}
                        <button className="doc-del-btn" onClick={() => requestDelete(rec.id)}>
                          <i className="fas fa-trash-alt" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ══ تصفح الكل ══ */}
      {activeTab === "browse" && (
        <>
          {loadingAll ? (
            <div style={{ textAlign: "center", padding: 40 }}><div className="doc-spinner" /></div>
          ) : allRecs.length === 0 ? (
            <div className="doc-empty">
              <span>💡</span>
              <p>{isAr ? "لا توجد توصيات منشورة" : "No published recommendations yet"}</p>
            </div>
          ) : (
            <div className="doc-recs-grid">
              {allRecs.map(rec => {
                const tags   = rec.recommendation_tags?.map(t => t.tags?.name).filter(Boolean) || [];
                const doctor = rec.doctor_profiles?.users?.name || (isAr ? "طبيب" : "Doctor");
                const avatar = rec.doctor_profiles?.users?.avatar_url;
                const spec   = rec.doctor_profiles?.specialization || "";
                const liked  = myLikes.has(rec.id);
                const saved  = mySaves.has(rec.id);
                const isOwn  = rec.doctor_profiles?.doctor_id === userId;
                return (
                  <div key={rec.id} className="doc-rec-card" style={{ position: "relative" }}>
                    {isOwn && (
                      <div style={{
                        position:"absolute", top:10, insetInlineEnd:10,
                        background:"var(--primary-light)", color:"var(--primary)",
                        fontSize:".68rem", fontWeight:800, padding:"2px 8px", borderRadius:8, zIndex:1,
                      }}>{isAr ? "توصيتي" : "Mine"}</div>
                    )}
                    {rec.cover_image && (
                      <div style={{ height:120, overflow:"hidden", borderRadius:"12px 12px 0 0" }}>
                        <img src={rec.cover_image} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      </div>
                    )}
                    <div className="doc-rec-card-top">
                      <span className="doc-rec-age-range">
                        <i className="fas fa-baby" style={{ marginInlineEnd:4 }} />
                        {rec.target_age_min}–{rec.target_age_max} {isAr ? "شهر" : "mo"}
                      </span>
                    </div>
                    <h3 className="doc-rec-title">{rec.title}</h3>
                    <p className="doc-rec-desc">
                      {(rec.description||"").slice(0,100)}{rec.description?.length > 100 ? "…" : ""}
                    </p>
                    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 0" }}>
                      {avatar
                        ? <img src={avatar} alt="" style={{ width:26, height:26, borderRadius:"50%", objectFit:"cover" }} />
                        : <div style={{
                            width:26, height:26, borderRadius:"50%",
                            background:"var(--primary-light)", color:"var(--primary)",
                            display:"flex", alignItems:"center", justifyContent:"center",
                            fontSize:".7rem", fontWeight:800,
                          }}>{doctor.charAt(0)}</div>}
                      <div>
                        <div style={{ fontSize:".75rem", fontWeight:700, color:"var(--text)" }}>{doctor}</div>
                        {spec && <div style={{ fontSize:".65rem", color:"var(--gray)" }}>{spec}</div>}
                      </div>
                    </div>
                    {tags.length > 0 && (
                      <div className="doc-rec-tags">
                        {tags.slice(0,3).map((t,i) => <span key={i} className="doc-rec-tag">#{t}</span>)}
                      </div>
                    )}
                    <div className="doc-rec-footer">
                      <div className="doc-rec-stats">
                        <button onClick={() => toggleLike(rec.id)} style={{
                          display:"flex", alignItems:"center", gap:4,
                          background: liked ? "var(--primary-light)" : "#f4f4f4",
                          color: liked ? "var(--primary)" : "var(--gray)",
                          border:"none", padding:"5px 10px", borderRadius:20,
                          fontSize:".72rem", fontWeight:800, cursor:"pointer",
                        }}>
                          <i className={`fa${liked?"s":"r"} fa-heart`} />
                          {rec.recommendation_likes?.length || 0}
                        </button>
                        <button onClick={() => toggleSave(rec.id)} style={{
                          display:"flex", alignItems:"center", gap:4,
                          background: saved ? "var(--primary-light)" : "#f4f4f4",
                          color: saved ? "var(--primary)" : "var(--gray)",
                          border:"none", padding:"5px 10px", borderRadius:20,
                          fontSize:".72rem", fontWeight:800, cursor:"pointer",
                        }}>
                          <i className={`fa${saved?"s":"r"} fa-bookmark`} />
                          {isAr ? (saved?"محفوظ":"حفظ") : (saved?"Saved":"Save")}
                        </button>
                        <span style={{ fontSize:".72rem", color:"var(--gray)", display:"flex", alignItems:"center", gap:4 }}>
                          <i className="fas fa-comment" />
                          {rec.recommendation_comments?.filter(c=>!c.is_deleted).length || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {showModal && (
        <DoctorRecModal
          isAr={isAr}
          doctorId={userId}
          existing={editRec}
          onClose={() => { setShowModal(false); setEditRec(null); }}
          onSuccess={() => { setShowModal(false); setEditRec(null); handleRefetch(); }}
        />
      )}
    </div>
  );
};


// ═══════════════════════════════════════════
// RATINGS SECTION
// ═══════════════════════════════════════════
const RatingsSection = ({ ratings, stats, isAr }) => (
  <div>
    <div className="doc-section-header">
      <h2><i className="fas fa-star" /> {isAr ? "تقييمات المرضى" : "Patient Ratings"}</h2>
    </div>
    <div className="doc-ratings-top">
      <div className="doc-ratings-summary-card">
        <div className="doc-ratings-big-num">{stats.avgRating || "—"}</div>
        <div className="doc-ratings-stars-row" style={{ color: "#f1c40f", fontSize: "1.5rem" }}>
          {stats.avgRating ? STAR(stats.avgRating) : "—"}
        </div>
        <p>{ratings.length} {isAr ? "تقييم" : "reviews"}</p>
        <div className="doc-rating-bars" style={{ marginTop: 16 }}>
          {[5, 4, 3, 2, 1].map(n => {
            const count = ratings.filter(r => r.rating === n).length;
            const pct = ratings.length ? (count / ratings.length) * 100 : 0;
            return (
              <div key={n} className="doc-rating-bar-row">
                <span>{n} <i className="fas fa-star" style={{ color: "#f1c40f", fontSize: ".75rem" }} /></span>
                <div className="doc-rating-bar-bg"><div className="doc-rating-bar-fill" style={{ width: `${pct}%` }} /></div>
                <span>{count}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="doc-ratings-list">
        {ratings.length === 0 ? (
          <div className="doc-empty"><span>⭐</span><p>{isAr ? "لا توجد تقييمات بعد" : "No ratings yet"}</p></div>
        ) : ratings.map((r, i) => (
          <div key={i} className="doc-rating-card">
            <div className="doc-rating-card-top">
              <div className="doc-rater-avatar">
                {r.users?.avatar_url
                  ? <img src={r.users.avatar_url} alt="" />
                  : <div className="doc-rater-init">{(r.users?.name || "U").charAt(0)}</div>}
              </div>
              <div>
                <strong>{r.users?.name || (isAr ? "مجهول" : "Anonymous")}</strong>
                <div className="doc-stars-row" style={{ color: "#f1c40f" }}>{STAR(r.rating)}</div>
              </div>
            </div>
            {r.review && <p className="doc-review-text">{r.review}</p>}
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════
// PROFILE SECTION
// ═══════════════════════════════════════════
const ProfileSection = ({ user, profile, isAr, refetch, avatarRef }) => {
  const [form, setForm] = useState({
    name:                  user?.name                  || "",
    email:                 user?.email                 || "",
    specialization:        profile?.specialization     || "",
    license_number:        profile?.license_number     || "",
    certifications:        profile?.certifications     || "",
    experience_years:      profile?.experience_years   || "",
    bio:                   profile?.bio                || "",
    availability_schedule: profile?.availability_schedule || "",
    avatar_url:            user?.avatar_url            || "",
  });
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setForm(p => ({ ...p, avatar_url: URL.createObjectURL(file) }));
    try {
      const ext      = file.name.split(".").pop();
      const fileName = `${user.user_id}/avatar_${Date.now()}.${ext}`;
      await supabase.storage.from("avatars").upload(fileName, file, { upsert: true });
      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
      setForm(p => ({ ...p, avatar_url: data.publicUrl }));
    } catch (err) { console.error(err); }
    finally { setUploading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await supabase.from("users")
        .update({ name: form.name, avatar_url: form.avatar_url })
        .eq("user_id", user.user_id);

      await supabase.from("doctor_profiles").upsert({
        doctor_id:             user.user_id,
        specialization:        form.specialization,
        certifications:        form.certifications,
        // ← license_number محذوف عمداً — لا يُعدَّل أبداً
        experience_years:      form.experience_years ? parseInt(form.experience_years) : null,
        bio:                   form.bio,
        availability_schedule: form.availability_schedule,
      }, { onConflict: "doctor_id" });

      setSaved(true);
      refetch();
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert(isAr ? "خطأ في الحفظ" : "Save error");
    } finally {
      setSaving(false);
    }
  };

  const T = {
    title:  isAr ? "ملفي الطبي"             : "My Medical Profile",
    name:   isAr ? "الاسم الكامل"            : "Full Name",
    email:  isAr ? "البريد الإلكتروني"       : "Email",
    spec:   isAr ? "التخصص"                 : "Specialization",
    lic:    isAr ? "رقم الترخيص المهني"      : "License Number",
    certs:  isAr ? "الشهادات العلمية"        : "Certifications",
    exp:    isAr ? "سنوات الخبرة"            : "Years of Experience",
    bio:    isAr ? "نبذة تعريفية"            : "Bio",
    avail:  isAr ? "جدول الاستقبال"          : "Availability Schedule",
    save:   isAr ? "حفظ التغييرات"           : "Save Changes",
    saved:  isAr ? "تم الحفظ ✅"             : "Saved ✅",
    saving: isAr ? "جارٍ الحفظ..."           : "Saving...",
    change: isAr ? "تغيير الصورة"            : "Change Photo",
  };

  return (
    <div>
      <div className="doc-section-header">
        <h2><i className="fas fa-user-md" /> {T.title}</h2>
      </div>

      <form onSubmit={handleSave} className="doc-profile-form">

        {/* ── Avatar ── */}
        <div className="doc-profile-avatar-section">
          <div className="doc-profile-avatar-wrap" onClick={() => fileRef.current?.click()}>
            {form.avatar_url
              ? <img src={form.avatar_url} alt="avatar" />
              : <div className="doc-profile-avatar-init">{form.name.charAt(0)}</div>}
            <div className="doc-profile-avatar-overlay">
              {uploading ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-camera" />}
            </div>
          </div>
          <input type="file" ref={fileRef} accept="image/*"
            onChange={handleAvatarChange} style={{ display: "none" }} />
          <p>{T.change}</p>
        </div>

        <div className="doc-profile-grid">

          {/* ── الاسم ── */}
          <div className="doc-profile-field">
            <label><i className="fas fa-user" /> {T.name}</label>
            <input type="text" name="name" value={form.name}
              onChange={handleChange} className="doc-profile-input" />
          </div>

          {/* ── الإيميل — readonly ── */}
          <div className="doc-profile-field">
            <label><i className="fas fa-envelope" /> {T.email}</label>
            <input type="email" name="email" value={form.email}
              readOnly className="doc-profile-input"
              style={{ background: "#f0f0f0", cursor: "not-allowed", color: "#888" }} />
          </div>

          {/* ── رقم الترخيص — readonly + محمي ── */}
          <div className="doc-profile-field">
            <label><i className="fas fa-id-badge" /> {T.lic}</label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                name="license_number"
                value={form.license_number || (isAr ? "غير مُسجَّل" : "Not registered")}
                readOnly
                className="doc-profile-input"
                style={{
                  background: "#f0f0f0",
                  cursor: "not-allowed",
                  color: "#888",
                  paddingInlineEnd: "90px",
                }}
              />
              {/* ← شارة "محمي" داخل الحقل */}
              <span style={{
                position: "absolute",
                top: "50%", transform: "translateY(-50%)",
                insetInlineEnd: "10px",
                background: "#fef0f0", color: "#e74c3c",
                fontSize: ".68rem", fontWeight: 800,
                padding: "2px 8px", borderRadius: 8,
                display: "flex", alignItems: "center", gap: 4,
                pointerEvents: "none",
              }}>
                <i className="fas fa-lock" />
                {isAr ? "محمي" : "Protected"}
              </span>
            </div>
          </div>

          {/* ── التخصص — select بكل التخصصات ── */}
          <div className="doc-profile-field">
            <label><i className="fas fa-stethoscope" /> {T.spec}</label>
            <select
              name="specialization"
              value={form.specialization}
              onChange={handleChange}
              className="doc-profile-input"
            >
              <option value="">{isAr ? "اختر التخصص" : "Select specialization"}</option>
              {SPECIALIZATIONS.map(s => (
                <option key={s.value} value={s.value}>
                  {isAr ? s.ar : s.en}
                </option>
              ))}
            </select>
          </div>

          {/* ── الشهادات العلمية — قابلة للتعديل ── */}
          <div className="doc-profile-field">
            <label><i className="fas fa-certificate" /> {T.certs}</label>
            <input
              type="text"
              name="certifications"
              value={form.certifications}
              onChange={handleChange}
              className="doc-profile-input"
              placeholder={isAr ? "مثال: بورد طب الأطفال، MRCPCH" : "e.g. MRCPCH, Board Certified"}
            />
          </div>

          {/* ── سنوات الخبرة ── */}
          <div className="doc-profile-field">
            <label><i className="fas fa-briefcase" /> {T.exp}</label>
            <input type="number" name="experience_years" value={form.experience_years}
              onChange={handleChange} className="doc-profile-input" min="0" max="50" />
          </div>

          {/* ── النبذة — full width ── */}
          <div className="doc-profile-field doc-profile-full">
            <label><i className="fas fa-align-left" /> {T.bio}</label>
            <textarea name="bio" value={form.bio} onChange={handleChange}
              rows="4" className="doc-profile-input" />
          </div>

          {/* ── جدول الاستقبال — full width ── */}
          <div className="doc-profile-field doc-profile-full">
            <label><i className="fas fa-calendar-week" /> {T.avail}</label>
            <textarea
              name="availability_schedule"
              value={form.availability_schedule}
              onChange={handleChange}
              rows="3"
              className="doc-profile-input"
              placeholder={isAr ? "مثال: الأحد - الخميس 9ص-5م" : "e.g. Sun-Thu 9am-5pm"}
            />
          </div>

        </div>{/* end doc-profile-grid */}

        <button
          type="submit"
          className="doc-profile-save-btn"
          disabled={saving}
          style={{ background: saved ? "#2ecc71" : undefined }}
        >
          {saving ? <><i className="fas fa-spinner fa-spin" /> {T.saving}</>
          : saved  ? <><i className="fas fa-check-circle" /> {T.saved}</>
          :           <><i className="fas fa-save" /> {T.save}</>}
        </button>

      </form>
    </div>
  );
};


// ═══════════════════════════════════════════
// CSS
// ═══════════════════════════════════════════
const DOC_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800;900&display=swap');
:root{
  --primary:#1a6b5c; --primary-light:#e8f5f2; --accent:#2ecc71;
  --gold:#f1c40f; --bg:#f4f7f6; --white:#fff; --text:#2d3748;
  --gray:#718096; --border:#e2e8f0; --shadow:0 4px 20px rgba(0,0,0,.05);
  --radius:16px;
}
*{margin:0;padding:0;box-sizing:border-box;font-family:'Poppins',sans-serif;}
html{overflow-x:hidden;}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
.animate{animation:fadeUp .5s ease forwards;}
.doc-root{display:flex;min-height:100vh;background:var(--bg);color:var(--text);}

/* ─── SIDEBAR ─── */
.doc-sidebar{
  width:260px;min-width:260px;background:var(--white);border-inline-end:1px solid var(--border);
  display:flex;flex-direction:column;position:sticky;top:0;height:100vh;overflow-y:auto;
  transition:.35s;z-index:200;
}
.doc-sidebar-logo{
  font-family:'Georgia',serif;font-style:italic;font-size:1.15rem;font-weight:bold;
  color:var(--primary);padding:24px 22px 16px;border-bottom:1px solid var(--border);
}
.doc-sidebar-avatar-section{
  display:flex;align-items:center;gap:12px;padding:18px 22px;border-bottom:1px solid var(--border);
}
.doc-sidebar-avatar{width:46px;height:46px;border-radius:50%;object-fit:cover;border:2px solid var(--primary-light);}
.doc-sidebar-avatar-init{
  width:46px;height:46px;border-radius:50%;background:var(--primary-light);color:var(--primary);
  display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.2rem;
}
.doc-sidebar-avatar-section h4{font-size:.92rem;font-weight:800;color:var(--text);line-height:1.2;}
.doc-sidebar-avatar-section p{font-size:.75rem;color:var(--gray);font-weight:600;}
.doc-sidebar-nav{padding:12px 10px;flex:1;}
.doc-nav-item{
  width:100%;background:none;border:none;padding:11px 14px;border-radius:12px;
  display:flex;align-items:center;gap:12px;text-align:start;cursor:pointer;
  font-family:'Poppins';font-size:.88rem;font-weight:600;color:var(--gray);
  transition:.25s;margin-bottom:4px;
}
.doc-nav-item i{width:20px;text-align:center;font-size:1rem;}
.doc-nav-item:hover{background:var(--primary-light);color:var(--primary);}
.doc-nav-item.active{background:var(--primary-light);color:var(--primary);font-weight:700;}
.doc-nav-logout{margin-top:16px;border-top:1px solid var(--border);padding-top:16px;border-radius:0;color:#e74c3c!important;}
.doc-nav-logout:hover{background:#fef0f0!important;color:#e74c3c!important;}

/* ─── MAIN ─── */
.doc-main{flex:1;display:flex;flex-direction:column;min-width:0;overflow-x:hidden;}

/* ─── TOPBAR ─── */
.doc-topbar{
  background:var(--white);border-bottom:1px solid var(--border);
  padding:0 28px;height:68px;display:flex;align-items:center;
  justify-content:space-between;position:sticky;top:0;z-index:100;
}
.doc-hamburger{background:none;border:none;font-size:1.4rem;cursor:pointer;color:var(--gray);display:none;padding:8px;}
.doc-topbar-title{font-size:1.1rem;font-weight:800;color:var(--text);}
.doc-topbar-right{display:flex;align-items:center;gap:12px;}
.doc-lang-pill{
  display:flex;background:#f4f4f4;border-radius:25px;padding:3px;cursor:pointer;
  border:1px solid var(--border);user-select:none;
}
.lang-active{background:var(--primary);color:white;border-radius:20px;padding:4px 12px;font-weight:700;font-size:.78rem;}
.lang-inactive{color:var(--gray);border-radius:20px;padding:4px 12px;font-weight:700;font-size:.78rem;}
.doc-noti-btn{position:relative;font-size:1.1rem;color:var(--gray);cursor:pointer;padding:9px;border-radius:50%;transition:.3s;}
.doc-noti-btn:hover{background:var(--primary-light);color:var(--primary);}
.doc-noti-badge{position:absolute;top:4px;right:4px;background:#e74c3c;color:white;width:16px;height:16px;border-radius:50%;font-size:.62rem;display:flex;align-items:center;justify-content:center;font-weight:700;}
.doc-topbar-avatar{width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid var(--primary-light);}
.doc-topbar-avatar-init{width:36px;height:36px;border-radius:50%;background:var(--primary-light);color:var(--primary);display:flex;align-items:center;justify-content:center;font-weight:800;}

/* ─── CONTENT ─── */
.doc-content{padding:28px;flex:1;max-width:1100px;margin:0 auto;width:100%;}

/* ─── WELCOME ─── */
.doc-welcome{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;flex-wrap:wrap;gap:14px;}
.doc-welcome h1{font-size:1.7rem;font-weight:800;color:var(--text);margin-bottom:5px;}
.doc-welcome p{color:var(--gray);font-weight:600;font-size:.92rem;}
.doc-welcome-actions{display:flex;gap:12px;flex-wrap:wrap;}

/* ─── STATS ─── */
.doc-stats-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:16px;margin-bottom:28px;}
.doc-stat-card{
  background:var(--white);border-radius:var(--radius);padding:18px 14px;
  text-align:center;border:1px solid var(--border);box-shadow:var(--shadow);
  animation:fadeUp .5s ease forwards;transition:.3s;
}
.doc-stat-card:hover{transform:translateY(-4px);box-shadow:0 8px 25px rgba(0,0,0,.08);}
.doc-stat-icon{width:46px;height:46px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;margin:0 auto 10px;}
.doc-stat-val{font-size:1.6rem;font-weight:800;color:var(--text);line-height:1;}
.doc-stat-lbl{font-size:.72rem;color:var(--gray);font-weight:700;margin-top:4px;}

/* ─── OVERVIEW GRID ─── */
.doc-overview-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;}

/* ─── PANEL ─── */
.doc-panel{background:var(--white);border-radius:var(--radius);padding:20px;border:1px solid var(--border);box-shadow:var(--shadow);}
.doc-panel-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;}
.doc-panel-header h3{font-size:.95rem;font-weight:700;color:var(--text);display:flex;align-items:center;gap:8px;}
.doc-panel-header h3 i{color:var(--primary);}
.doc-panel-more{background:none;border:none;color:var(--primary);font-weight:700;font-size:.8rem;cursor:pointer;font-family:'Poppins';}
.doc-panel-more:hover{text-decoration:underline;}
.doc-panel-empty{text-align:center;padding:20px;color:#ccc;}
.doc-panel-empty i{font-size:1.8rem;display:block;margin-bottom:8px;}
.doc-panel-empty p{font-size:.82rem;font-weight:600;}

/* Appointment row */
.doc-appt-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #f5f5f5;}
.doc-appt-row:last-child{border:none;}
.doc-appt-time{background:var(--primary-light);color:var(--primary);padding:5px 10px;border-radius:8px;font-size:.78rem;font-weight:700;white-space:nowrap;}
.doc-appt-info{flex:1;}
.doc-appt-info strong{display:block;font-size:.88rem;color:var(--text);}
.doc-appt-info span{font-size:.75rem;color:var(--gray);}
.doc-appt-status{font-size:.72rem;font-weight:700;padding:3px 9px;border-radius:12px;}
.doc-status-pill{font-size:.75rem;font-weight:700;padding:3px 10px;border-radius:20px;white-space:nowrap;}

/* Article row */
.doc-article-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid #f5f5f5;}
.doc-article-row:last-child{border:none;}
.doc-article-row-info strong{display:block;font-size:.85rem;color:var(--text);font-weight:700;}
.doc-article-row-info span{font-size:.72rem;color:var(--gray);}

/* Rating summary */
.doc-rating-summary{display:flex;gap:20px;align-items:flex-start;flex-wrap:wrap;}
.doc-rating-big{text-align:center;flex:0 0 auto;}
.doc-rating-num{font-size:2.5rem;font-weight:800;color:var(--text);display:block;line-height:1;}
.doc-rating-stars{font-size:1.1rem;margin:5px 0;}
.doc-rating-count{font-size:.75rem;color:var(--gray);font-weight:600;}
.doc-rating-bars{flex:1;display:flex;flex-direction:column;gap:6px;min-width:120px;}
.doc-rating-bar-row{display:flex;align-items:center;gap:8px;font-size:.75rem;font-weight:600;color:var(--gray);}
.doc-rating-bar-row span:first-child{min-width:14px;text-align:end;}
.doc-rating-bar-bg{flex:1;height:7px;background:#f0f0f0;border-radius:10px;overflow:hidden;}
.doc-rating-bar-fill{height:100%;background:var(--gold);border-radius:10px;transition:.8s;}
.doc-rating-bar-row span:last-child{min-width:18px;text-align:start;}

/* ─── SECTION HEADER ─── */
.doc-section-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;gap:12px;flex-wrap:wrap;}
.doc-section-header h2{font-size:1.3rem;font-weight:800;color:var(--text);display:flex;align-items:center;gap:10px;}
.doc-section-header h2 i{color:var(--primary);}
.doc-count-badge{background:var(--primary-light);color:var(--primary);padding:4px 12px;border-radius:20px;font-weight:700;font-size:.85rem;}

/* ─── FILTER BAR ─── */
.doc-filter-bar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;}
.doc-filter-btn{background:var(--white);border:1.5px solid var(--border);padding:7px 16px;border-radius:25px;font-family:'Poppins';font-weight:700;font-size:.8rem;color:var(--gray);cursor:pointer;transition:.3s;display:flex;align-items:center;gap:6px;}
.doc-filter-btn:hover{border-color:var(--primary);color:var(--primary);}
.doc-filter-btn.active{background:var(--primary);color:white;border-color:var(--primary);}
.filter-count{background:rgba(255,255,255,.3);padding:1px 7px;border-radius:10px;font-size:.7rem;}
.doc-filter-btn.active .filter-count{background:rgba(255,255,255,.25);color:white;}

/* ─── BUTTONS ─── */
.doc-btn-primary{background:var(--primary);color:white;border:none;padding:10px 20px;border-radius:12px;font-family:'Poppins';font-weight:700;font-size:.88rem;cursor:pointer;display:inline-flex;align-items:center;gap:8px;transition:.3s;box-shadow:0 3px 12px rgba(26,107,92,.25);}
.doc-btn-primary:hover{background:#145e50;transform:translateY(-1px);}
.doc-btn-primary:disabled{opacity:.7;cursor:not-allowed;transform:none;}
.doc-btn-secondary{background:var(--white);color:var(--primary);border:1.5px solid var(--primary);padding:10px 20px;border-radius:12px;font-family:'Poppins';font-weight:700;font-size:.88rem;cursor:pointer;display:inline-flex;align-items:center;gap:8px;transition:.3s;}
.doc-btn-secondary:hover{background:var(--primary-light);}
.doc-confirm-btn{background:#f0faf4;color:#2ecc71;border:none;padding:7px 14px;border-radius:10px;font-weight:700;cursor:pointer;font-family:'Poppins';font-size:.78rem;display:inline-flex;align-items:center;gap:6px;transition:.3s;}
.doc-confirm-btn:hover{background:#2ecc71;color:white;}
.doc-reject-btn{background:#fef0f0;color:#e74c3c;border:none;padding:7px 14px;border-radius:10px;font-weight:700;cursor:pointer;font-family:'Poppins';font-size:.78rem;display:inline-flex;align-items:center;gap:6px;transition:.3s;}
.doc-reject-btn:hover{background:#e74c3c;color:white;}
.doc-edit-btn{background:#f0f4ff;color:#3498db;border:none;width:32px;height:32px;border-radius:9px;cursor:pointer;transition:.3s;display:flex;align-items:center;justify-content:center;}
.doc-edit-btn:hover{background:#3498db;color:white;}
.doc-del-btn{background:#fef0f0;color:#e74c3c;border:none;width:32px;height:32px;border-radius:9px;cursor:pointer;transition:.3s;display:flex;align-items:center;justify-content:center;}
.doc-del-btn:hover{background:#e74c3c;color:white;}
.doc-btn-sm{padding:5px 10px!important;font-size:.72rem!important;}

/* ─── APPOINTMENTS SECTION ─── */
.doc-appt-cards{display:flex;flex-direction:column;gap:14px;}
.doc-appt-card{background:var(--white);border-radius:var(--radius);padding:18px;border:1px solid var(--border);display:flex;gap:16px;box-shadow:var(--shadow);transition:.3s;animation:fadeUp .4s ease;}
.doc-appt-card:hover{box-shadow:0 8px 25px rgba(0,0,0,.08);transform:translateX(4px);}
.doc-appt-card-date{background:var(--primary-light);border-radius:12px;padding:12px;text-align:center;min-width:58px;display:flex;flex-direction:column;align-items:center;justify-content:center;}
.doc-appt-card-date span{font-size:1.7rem;font-weight:800;color:var(--primary);line-height:1;}
.doc-appt-card-date small{font-size:.72rem;font-weight:700;color:var(--primary);}
.doc-appt-card-info{flex:1;}
.doc-appt-card-info h4{font-size:.95rem;font-weight:700;color:var(--text);margin-bottom:5px;}
.doc-appt-card-info p{font-size:.82rem;color:var(--gray);font-weight:600;margin-bottom:3px;display:flex;align-items:center;gap:6px;}
.doc-appt-card-info p i{color:var(--primary);width:14px;}
.doc-appt-notes{color:#bbb!important;}
.doc-appt-time-text{color:var(--primary)!important;font-weight:700!important;}
.doc-appt-card-actions{display:flex;flex-direction:column;align-items:flex-end;gap:8px;justify-content:center;}
.doc-appt-btns{display:flex;gap:6px;flex-wrap:wrap;}

/* ─── ARTICLES ─── */
.doc-articles-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px;}
.doc-article-card{background:var(--white);border-radius:var(--radius);padding:20px;border:1px solid var(--border);box-shadow:var(--shadow);animation:fadeUp .4s ease;transition:.3s;}
.doc-article-card:hover{box-shadow:0 8px 25px rgba(0,0,0,.08);transform:translateY(-3px);}
.doc-article-card-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;}
.doc-article-date{font-size:.75rem;color:var(--gray);font-weight:600;}
.doc-article-title{font-size:1rem;font-weight:700;color:var(--text);margin-bottom:8px;line-height:1.4;}
.doc-article-excerpt{font-size:.82rem;color:var(--gray);line-height:1.6;margin-bottom:12px;font-weight:500;}
.doc-rejection-note{display:flex;align-items:flex-start;gap:8px;background:#fef0f0;border-radius:10px;padding:10px;margin-bottom:12px;font-size:.78rem;color:#e74c3c;font-weight:600;}
.doc-article-footer{display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid var(--border);}
.doc-article-meta{display:flex;gap:12px;}
.doc-article-meta span{font-size:.78rem;color:var(--gray);font-weight:600;display:flex;align-items:center;gap:4px;}

/* ─── RECOMMENDATIONS ─── */
.doc-recs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px;}
.doc-rec-card{background:var(--white);border-radius:var(--radius);padding:20px;border:1px solid var(--border);box-shadow:var(--shadow);animation:fadeUp .4s ease;transition:.3s;}
.doc-rec-card:hover{box-shadow:0 8px 25px rgba(0,0,0,.08);transform:translateY(-3px);}
.doc-rec-card-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;}
.doc-rec-age-range{background:#f0f4ff;color:#3498db;padding:3px 10px;border-radius:12px;font-size:.75rem;font-weight:700;}
.doc-rec-title{font-size:1rem;font-weight:700;color:var(--text);margin-bottom:8px;}
.doc-rec-desc{font-size:.82rem;color:var(--gray);line-height:1.6;margin-bottom:10px;}
.doc-rec-tags{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;}
.doc-rec-tag{background:var(--primary-light);color:var(--primary);padding:3px 9px;border-radius:12px;font-size:.72rem;font-weight:700;}
.doc-rec-products{font-size:.78rem;color:var(--gray);font-weight:600;margin-bottom:10px;}
.doc-rec-footer{display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid var(--border);}
.doc-rec-stats{display:flex;gap:12px;}
.doc-rec-stats span{font-size:.78rem;color:var(--gray);font-weight:600;display:flex;align-items:center;gap:4px;}

/* ─── RATINGS ─── */
.doc-ratings-top{display:grid;grid-template-columns:250px 1fr;gap:24px;align-items:start;}
.doc-ratings-summary-card{background:var(--white);border-radius:var(--radius);padding:24px;border:1px solid var(--border);box-shadow:var(--shadow);text-align:center;}
.doc-ratings-big-num{font-size:3.5rem;font-weight:800;color:var(--text);}
.doc-ratings-stars-row{margin:8px 0;}
.doc-ratings-summary-card p{font-size:.82rem;color:var(--gray);font-weight:600;}
.doc-ratings-list{display:flex;flex-direction:column;gap:14px;}
.doc-rating-card{background:var(--white);border-radius:var(--radius);padding:16px;border:1px solid var(--border);box-shadow:var(--shadow);}
.doc-rating-card-top{display:flex;align-items:center;gap:12px;margin-bottom:10px;}
.doc-rater-avatar img,.doc-rater-init{width:40px;height:40px;border-radius:50%;object-fit:cover;}
.doc-rater-init{background:var(--primary-light);color:var(--primary);display:flex;align-items:center;justify-content:center;font-weight:800;}
.doc-rating-card-top strong{display:block;font-size:.9rem;color:var(--text);}
.doc-stars-row{font-size:.85rem;}
.doc-stars-row .star-empty{color:#e0e0e0;}
.doc-review-text{font-size:.85rem;color:var(--gray);line-height:1.6;}

/* ─── PROFILE ─── */
.doc-profile-form{background:var(--white);border-radius:var(--radius);padding:28px;border:1px solid var(--border);box-shadow:var(--shadow);}
.doc-profile-avatar-section{display:flex;flex-direction:column;align-items:center;margin-bottom:24px;}
.doc-profile-avatar-wrap{width:100px;height:100px;border-radius:50%;overflow:hidden;position:relative;cursor:pointer;border:3px solid var(--primary-light);box-shadow:0 4px 15px rgba(26,107,92,.15);}
.doc-profile-avatar-wrap img,.doc-profile-avatar-init{width:100%;height:100%;object-fit:cover;}
.doc-profile-avatar-init{background:var(--primary-light);color:var(--primary);display:flex;align-items:center;justify-content:center;font-size:2.5rem;font-weight:800;}
.doc-profile-avatar-overlay{position:absolute;inset:0;background:rgba(26,107,92,.7);display:flex;align-items:center;justify-content:center;color:white;opacity:0;transition:.3s;font-size:1.3rem;}
.doc-profile-avatar-wrap:hover .doc-profile-avatar-overlay{opacity:1;}
.doc-profile-avatar-section p{margin-top:8px;font-size:.8rem;color:var(--gray);font-weight:600;}
.doc-profile-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:22px;}
.doc-profile-full{grid-column:span 2;}
.doc-profile-field{display:flex;flex-direction:column;gap:7px;}
.doc-profile-field label{font-size:.88rem;font-weight:700;color:var(--text);display:flex;align-items:center;gap:7px;}
.doc-profile-field label i{color:var(--primary);font-size:.85rem;}
.doc-profile-input{width:100%;padding:11px 14px;border-radius:12px;border:1.5px solid var(--border);outline:none;font-family:'Poppins';font-size:.88rem;background:#fafafa;transition:.3s;resize:vertical;}
.doc-profile-input:focus{border-color:var(--primary);background:white;box-shadow:0 0 0 3px rgba(26,107,92,.1);}
.doc-profile-save-btn{width:100%;padding:13px;background:var(--primary);color:white;border:none;border-radius:14px;font-weight:700;font-size:.95rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;font-family:'Poppins';box-shadow:0 4px 15px rgba(26,107,92,.25);transition:.3s;}
.doc-profile-save-btn:hover{background:#145e50;}
.doc-profile-save-btn:disabled{opacity:.7;cursor:not-allowed;}

/* ─── EMPTY & LOADING ─── */
.doc-empty{text-align:center;padding:55px 20px;color:var(--gray);}
.doc-empty span{font-size:3.5rem;display:block;margin-bottom:14px;}
.doc-empty p{font-size:.95rem;font-weight:600;margin-bottom:16px;}
.doc-loading{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg);}
.doc-spinner{width:44px;height:44px;border:4px solid #e8f5f2;border-top-color:var(--primary);border-radius:50%;animation:spin .8s linear infinite;margin-bottom:14px;}
.doc-loading p{color:var(--primary);font-weight:700;}

/* ─── OVERLAY (mobile) ─── */
.doc-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:150;}

/* ─── MODAL ─── */
.doc-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:3000;padding:15px;}
.doc-modal{background:var(--white);width:100%;max-width:540px;border-radius:22px;padding:32px;box-shadow:0 20px 50px rgba(0,0,0,.15);max-height:90vh;overflow-y:auto;}
.doc-modal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;}
.doc-modal-head h2{font-size:1.2rem;font-weight:800;color:var(--text);}
.doc-modal-head button{background:none;border:none;font-size:1.4rem;color:var(--gray);cursor:pointer;transition:.3s;}
.doc-modal-head button:hover{color:#e74c3c;transform:rotate(90deg);}
.doc-modal-info{background:var(--primary-light);color:var(--primary);padding:10px 14px;border-radius:12px;font-size:.82rem;font-weight:700;margin-bottom:18px;display:flex;align-items:center;gap:8px;}
.doc-modal-field{margin-bottom:16px;}
.doc-modal-field label{display:block;font-size:.88rem;font-weight:700;color:var(--text);margin-bottom:7px;}
.doc-modal-input{width:100%;padding:11px 14px;border-radius:12px;border:1.5px solid var(--border);outline:none;font-family:'Poppins';font-size:.88rem;background:#fafafa;transition:.3s;resize:vertical;}
.doc-modal-input:focus{border-color:var(--primary);background:white;box-shadow:0 0 0 3px rgba(26,107,92,.1);}
.doc-modal-two-col{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.doc-tag-input-row{display:flex;gap:8px;margin-bottom:10px;}
.doc-tags-preview{display:flex;flex-wrap:wrap;gap:6px;}
.doc-tag-preview-item{background:var(--primary-light);color:var(--primary);padding:4px 10px;border-radius:12px;font-size:.78rem;font-weight:700;display:flex;align-items:center;gap:6px;}
.doc-tag-preview-item i{cursor:pointer;transition:.2s;font-size:.65rem;}
.doc-tag-preview-item i:hover{color:#e74c3c;}

/* apt-type-tab reuse */
.apt-type-tabs{display:flex;gap:8px;margin-bottom:4px;}
.apt-type-tab{flex:1;padding:9px;border-radius:10px;border:2px solid var(--border);background:#fafafa;font-family:'Poppins';font-weight:700;font-size:.82rem;cursor:pointer;transition:.3s;color:var(--gray);}
.apt-type-tab.active{border-color:var(--primary);background:var(--primary-light);color:var(--primary);}

/* ─── RESPONSIVE ─── */
@media(max-width:1024px){
  .doc-sidebar{position:fixed;top:0;bottom:0;inset-inline-start:-280px;height:100%;z-index:200;transition:.35s;}
  [dir=rtl] .doc-sidebar{inset-inline-start:auto;inset-inline-end:-280px;}
  .doc-sidebar.open{inset-inline-start:0;}
  [dir=rtl] .doc-sidebar.open{inset-inline-end:0;}
  .doc-hamburger{display:block;}
  .doc-overview-grid{grid-template-columns:1fr 1fr;}
  .doc-stats-grid{grid-template-columns:repeat(4,1fr);}
}
@media(max-width:768px){
  .doc-content{padding:18px;}
  .doc-overview-grid{grid-template-columns:1fr;}
  .doc-stats-grid{grid-template-columns:repeat(2,1fr);}
  .doc-ratings-top{grid-template-columns:1fr;}
  .doc-profile-grid{grid-template-columns:1fr;}
  .doc-profile-full{grid-column:span 1;}
  .doc-articles-grid,.doc-recs-grid{grid-template-columns:1fr;}
  .doc-appt-card{flex-direction:column;}
  .doc-modal-two-col{grid-template-columns:1fr;}
  .doc-welcome{flex-direction:column;}
  .doc-topbar{padding:0 16px;}
}
`;

export default DoctorDashboard;