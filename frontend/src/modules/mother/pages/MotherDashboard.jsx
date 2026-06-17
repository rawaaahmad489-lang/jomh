//motherdashbord
import MotherArticleSuggestions from "../../../components/MotherArticleSuggestions";
import ChatbotWidget from "../../../components/ChatbotWidget";
import XPScoreBadge from "../../../components/Xpscorebadge";
import { BadgeToast, XPToast, useXPToast } from "../../../components/Badgetoast ";
import { useGamification } from "../../../core/hooks/useGamification";
import MoodTracker from "../../../components/MoodTracker";
import XpMiniCard from "../../../components/XpMiniCard";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../../../services/supabaseClient";
import { useMotherData } from "../../../core/hooks/useMotherData";
import AddChildModal from "./AddChildModal";
import { useCart } from "../../../core/context/CartContext";
import DashboardArticlesWidget from "../../../components/DashboardArticlesWidget";
import AccessRequestsNotifications from "../components/AccessRequestsNotifications";
import ChildAccessManager from "../components/ChildAccessManager";



import PPDRiskBanner           from "../../../components/PPDRiskBanner";
import MentalHealthConsentModal from "../../../components/MentalHealthConsentModal";
import { calculatePPDRisk } from "../../../services/ppdService";

import DoctorVideosSection from "../../../components/DoctorVideosSection";
// ─── MILESTONES 1-12 months ────────────────────────────────────────────
const MILESTONES_EN = {
  1:  { title: "Month 1",  items: ["Focuses eyes on close faces.", "Responds to loud sounds.", "Makes cooing sounds."] },
  2:  { title: "Month 2",  items: ["Social smiling.", "Makes 'ah' and 'oh' sounds.", "More active arm/leg movement."] },
  3:  { title: "Month 3",  items: ["Smiles at you clearly.", "Lifts head when on tummy.", "Tracks objects with eyes."] },
  4:  { title: "Month 4",  items: ["Laughs out loud.", "Grasps objects.", "Rolls to their side."] },
  5:  { title: "Month 5",  items: ["Rolls tummy to back.", "Recognizes your voice.", "Sits with support."] },
  6:  { title: "Month 6",  items: ["Sits with minimal support.", "Starts solid foods.", "Babbles consonants."] },
  7:  { title: "Month 7",  items: ["Sits without support.", "Passes objects hand to hand.", "Responds to name."] },
  8:  { title: "Month 8",  items: ["Crawling starts.", "Object permanence appears.", "Imitates sounds."] },
  9:  { title: "Month 9",  items: ["Pulls to standing.", "Waves bye-bye.", "Says 'mama/dada' unspecifically."] },
  10: { title: "Month 10", items: ["Cruises along furniture.", "Points at objects.", "Understands 'no'."] },
  11: { title: "Month 11", items: ["Stands momentarily alone.", "Says 1-2 words.", "Uses cup with help."] },
  12: { title: "Month 12", items: ["Walks with one hand held.", "Uses 2+ words.", "Imitates activities."] },
};
const MILESTONES_AR = {
  1:  { title: "الشهر 1",   items: ["يركّز نظره على الوجوه.", "يستجيب للأصوات.", "يُصدر أصواتاً."] },
  2:  { title: "الشهر 2",   items: ["يبتسم اجتماعياً.", "يُصدر أصوات 'آه وأوه'.", "يُحرك أطرافه بنشاط."] },
  3:  { title: "الشهر 3",   items: ["يبتسم بوضوح.", "يرفع رأسه على البطن.", "يتتبع الأشياء بعينيه."] },
  4:  { title: "الشهر 4",   items: ["يضحك بصوت.", "يُمسك الأشياء.", "يدور على جانبه."] },
  5:  { title: "الشهر 5",   items: ["يتدحرج من بطنه لظهره.", "يُميز صوتكِ.", "يجلس بدعم."] },
  6:  { title: "الشهر 6",   items: ["يجلس بدعم بسيط.", "يبدأ الطعام الصلب.", "يُصدر مقاطع."] },
  7:  { title: "الشهر 7",   items: ["يجلس دون دعم.", "ينقل الأشياء بين يديه.", "يستجيب لاسمه."] },
  8:  { title: "الشهر 8",   items: ["يبدأ الزحف.", "يُدرك وجود الأشياء المختفية.", "يُقلّد الأصوات."] },
  9:  { title: "الشهر 9",   items: ["يقف بمساعدة.", "يُلوّح وداعاً.", "يقول 'ماما/بابا'."] },
  10: { title: "الشهر 10",  items: ["يمشي على الأثاث.", "يُشير للأشياء.", "يفهم كلمة لا."] },
  11: { title: "الشهر 11",  items: ["يقف لحظياً وحده.", "يقول 1-2 كلمة.", "يستخدم الكوب بمساعدة."] },
  12: { title: "الشهر 12",  items: ["يمشي بمساعدة.", "يقول كلمتين أو أكثر.", "يُقلّد النشاطات."] },
};

const TIPS_EN = [
  "Take 15 minutes just for yourself today — stretching or a warm cup of tea.",
  "Remember: a rested mother is a better mother. Nap when the baby naps!",
  "Deep breathing for 5 minutes can dramatically reduce postpartum anxiety.",
  "Reach out to one friend or family member today — connection heals.",
  "Hydration tip: Keep a water bottle visible so you don't forget to drink.",
];
const TIPS_AR = [
  "خصّصي 15 دقيقة لنفسكِ اليوم — تمدد أو كوب شاي دافئ.",
  "تذكّري: الأم المرتاحة أم أفضل. نامي حين ينام طفلكِ!",
  "التنفس العميق لمدة 5 دقائق يُقلل من قلق ما بعد الولادة.",
  "تواصلي مع صديقة أو أحد أفراد العائلة اليوم — التواصل يشفي.",
  "نصيحة الترطيب: ضعي زجاجة ماء أمامكِ حتى لا تنسي الشرب.",
];

// ─── HELPERS ───────────────────────────────────────────────────────────
function ageInMonths(birthDate) {
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  const now = new Date();
  return Math.max(1,
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth())
  );
}

function ageDisplay(birthDate, isAr) {
  if (!birthDate) return "";
  const months = ageInMonths(birthDate);
  const years  = Math.floor(months / 12);
  const rem    = months % 12;
  if (isAr) {
    if (years === 0) return `${rem} شهر`;
    if (rem   === 0) return `${years} سنة`;
    return `${years} سنة و${rem} شهر`;
  }
  if (years === 0) return `${months} month${months !== 1 ? "s" : ""}`;
  if (rem   === 0) return `${years} year${years > 1 ? "s" : ""}`;
  return `${years}y ${rem}m`;
}

const GENDER_EMOJI = { male: "👦", female: "👧" };

const MOOD_EN = [
  { emoji: "😊", label: "Happy",   msg: "Your positive energy is beautiful! 🌟"           },
  { emoji: "😴", label: "Tired",   msg: "Take some time to rest ☕"                        },
  { emoji: "😔", label: "Anxious", msg: "We are always by your side ❤️"                   },
  { emoji: "😢", label: "Sad",     msg: "It's okay to have hard days. You're not alone 💛" },
];
const MOOD_AR = [
  { emoji: "😊", label: "سعيدة",  msg: "طاقتكِ الإيجابية تسعدنا! 🌟"                   },
  { emoji: "😴", label: "متعبة",  msg: "خذي وقتاً للراحة ☕"                            },
  { emoji: "😔", label: "قلقة",   msg: "نحن بجانبكِ دوماً ❤️"                           },
  { emoji: "😢", label: "حزينة",  msg: "لا بأس بأيام صعبة. لستِ وحدك 💛"              },
];



// ─── MAIN ──────────────────────────────────────────────────────────────
const MotherDashboard = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isAr = i18n.language === "ar";
  const dir  = isAr ? "rtl" : "ltr";
const [riskLevel,       setRiskLevel]       = useState(null);
const [riskBannerOpen,  setRiskBannerOpen]  = useState(true);
const [consentModalOpen, setConsentModalOpen] = useState(false);

  const {
    loading, user, motherProfile, children,
    appointments, todos, notifications, unreadCount, refetch,
  } = useMotherData();
const { cartCount } = useCart();
 
 const [activeMilestone, setActiveMilestone] = useState({});
  const [sidebarOpen,   setSidebarOpen]   = useState(false);


  const [addChildOpen,  setAddChildOpen]  = useState(false);
  const [addRecordOpen, setAddRecordOpen] = useState(false);
  const [todoItems,     setTodoItems]     = useState([]);
  const [newTodo,       setNewTodo]       = useState("");
  const [addTodoOpen,   setAddTodoOpen]   = useState(false);
  const [notiOpen,      setNotiOpen]      = useState(false);
  const [savingTodo,    setSavingTodo]    = useState(false);
  // Articles state
  const [articles,       setArticles]       = useState([]);
  const [categories,     setCategories]     = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [articlesLoading, setArticlesLoading] = useState(false);
 const [bookingOpen, setBookingOpen] = useState(false);
  const [tipIndex] = useState(() => Math.floor(Math.random() * TIPS_EN.length));
    const [childPhotos, setChildPhotos] = useState({}); 
  // { child_id: { month: url } }

  const MOODS      = isAr ? MOOD_AR     : MOOD_EN;
  const MILESTONES = isAr ? MILESTONES_AR : MILESTONES_EN;
  const TIPS       = isAr ? TIPS_AR     : TIPS_EN;
const { recordActivity, newBadge } = useGamification(user?.user_id);
const { toast, showXP, hideXP }    = useXPToast();
  // ─── INIT ─────────────────────────────────────────────────────────
  useEffect(() => { setTodoItems(todos); }, [todos]);
useEffect(() => {
  const handleClickOutside = (e) => {
    if (!e.target.closest(".noti-btn-wrapper")) {
      setNotiOpen(false);
    }
  };
  document.addEventListener("click", handleClickOutside);
  return () => document.removeEventListener("click", handleClickOutside);
}, []);
// ✅ الإصلاح
useEffect(() => {
  if (!user?.user_id || loading) return;  // ← أضيفي loading هنا
  
  if (motherProfile && motherProfile.mental_health_monitoring_consent === false) {
    // ← استخدمي === false وليس !value لأن undefined ≠ false
    const t = setTimeout(() => setConsentModalOpen(true), 3000);
    return () => clearTimeout(t);
  }
  
  if (motherProfile?.mental_health_monitoring_consent === true) {
    calculatePPDRisk(user.user_id).then(result => {
      if (!result?.skipped) setRiskLevel(result.finalRiskLevel);
    });
  }
}, [user, motherProfile, loading]);

/////test
useEffect(() => {
  if (!user?.user_id || loading) return;

  if (motherProfile && motherProfile.mental_health_monitoring_consent === false) {
    const t = setTimeout(() => setConsentModalOpen(true), 3000);
    return () => clearTimeout(t);
  }
    if (motherProfile?.mental_health_monitoring_consent === true) {
   
    calculatePPDRisk(user.user_id).then(result => {
     
      if (!result?.skipped) setRiskLevel(result.finalRiskLevel);
    });
  }
}, [user, motherProfile, loading]);
  // Set milestone to child's actual age
  useEffect(() => {
    if (children.length > 0) {
      const initial = {};
      children.forEach(child => {
        const months = ageInMonths(child.birth_date);
        initial[child.child_id] = Math.min(12, Math.max(1, months));
      });
      setActiveMilestone(initial);
    }
  }, [children]);
 useEffect(() => {
    if (!user || children.length === 0) return;
    const loadAllPhotos = async () => {
      const allPhotos = {};
      for (const child of children) {
        const { data } = await supabase
          .from("child_milestone_photos")
          .select("month_number, photo_url")
          .eq("child_id", child.child_id);
        if (data) {
          allPhotos[child.child_id] = {};
          data.forEach(r => { allPhotos[child.child_id][r.month_number] = r.photo_url; });
        }
      }
      setChildPhotos(allPhotos);
    };
    loadAllPhotos();
  }, [user, children]);



  // Fetch articles + categories
  useEffect(() => {
    const fetchArticles = async () => {
      setArticlesLoading(true);
    
const { data, error } = await supabase
  .from("articles")
  .select(`
    article_id,
    title,
    content,
    doctor_profiles (
      users (name)
    )
  `)
  .eq("status", "approved")
  .limit(20);
      

      // We'll derive categories from article data or a separate table if available
      const { data: cats } = await supabase
        .from("product_categories")
        .select("*")
        .limit(10);
      setCategories(cats || []);
      setArticlesLoading(false);
    };
    fetchArticles();
  }, []);

  // ─── GREETING ─────────────────────────────────────────────────────
  const hour = new Date().getHours();
  const getGreeting = (name) => {
    if (isAr) {
      if (hour < 12) return `صباح الخير، ${name} ☀️`;
      if (hour < 18) return `مساء الخير، ${name} ☕`;
      return `طاب مساؤكِ، ${name} 🌙`;
    }
    if (hour < 12) return `Good morning, ${name} ☀️`;
    if (hour < 18) return `Good afternoon, ${name} ☕`;
    return `Good evening, ${name} 🌙`;
  };

  // ─── TODO ─────────────────────────────────────────────────────────
  const toggleTodo = async (todo) => {
    const s = todo.status === "completed" ? "pending" : "completed";
    setTodoItems(p => p.map(t => t.todo_id === todo.todo_id ? { ...t, status: s } : t));
    await supabase.from("todo_list").update({ status: s }).eq("todo_id", todo.todo_id);
  };

 const addTodo = async () => {
  if (!newTodo.trim() || !user) return;
  setSavingTodo(true);
  const { data } = await supabase
    .from("todo_list")
    .insert({ mother_id: user.user_id, title: newTodo.trim(), status: "pending" })
    .select().single();
  if (data) {
    setTodoItems(p => [...p, data]);
    await recordActivity("todo_complete", data.todo_id); 
    showXP("إتمام مهمة", 5);                           
  }
  setNewTodo(""); setAddTodoOpen(false); setSavingTodo(false);
};

  const deleteTodo = async (todoId) => {
    setTodoItems(p => p.filter(t => t.todo_id !== todoId));
    await supabase.from("todo_list").delete().eq("todo_id", todoId);
  };

 const markNotiRead = async () => {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.user_id)
      .eq("is_read", false);
    refetch();
  };

  const markSingleRead = async (notificationId) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("notification_id", notificationId);
    refetch();
  };

  const handleNotiClick = async (n) => {
    // تحديد كمقروء
    if (!n.is_read) await markSingleRead(n.notification_id);

    setNotiOpen(false);

    // التنقل حسب نوع الإشعار
    if (n.related_type && n.related_id) {
      const type = n.notification_type || n.related_type;

      if (type === "appointment") {
        navigate("/mother/appointments");
        return;
      }
      if (type === "system" && (n.message?.includes("متابعة") || n.message?.includes("access") || n.message?.includes("طفل"))) {
        // مرر للـ ChildAccessManager
        window.dispatchEvent(new CustomEvent("open-access-manager"));
        return;
      }
    }

    // fallback — فتح قسم الإشعارات العام
  };

  // أيقونة حسب نوع الإشعار
const NOTI_ICON = (type) => {
    const icons = {
      appointment:     "📅",
      system:          "🔐",
      medical:         "💊",
      reminder:        "⏰",
      recommendation:  "💡",
      promo:           "🎁",
      order:           "📦",
    };
    return icons[type] || "🔔";
  };
  // ─── CHAT ─────────────────────────────────────────────────────────
 
  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/"); };
  const switchLang   = () => { i18n.changeLanguage(isAr ? "en" : "ar"); document.documentElement.dir = isAr ? "ltr" : "rtl"; };

  if (loading) return (
    <div className="dash-loading">
      <div className="dash-spinner" />
      <p>{isAr ? "جارٍ التحميل..." : "Loading..."}</p>
    </div>
  );

  const userName     = user?.name || (isAr ? "الأم" : "Mom");
  const firstChild   = children[0];
  const childAgeMonths = firstChild ? ageInMonths(firstChild.birth_date) : 0;
 

  // Articles filtered by category
  const visibleArticles = activeCategory
    ? articles.filter(a => a.category_id === activeCategory)
    : articles;

  return (
    <div className="dash-root" dir={dir}>
      <style>{DASHBOARD_CSS}</style>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}


<ChatbotWidget
  motherId={user?.user_id}
  childId={firstChild?.child_id}
/>

 {consentModalOpen && (
      <MentalHealthConsentModal
        userId={user?.user_id}
        isAr={isAr}
        onClose={() => setConsentModalOpen(false)}
        onConsented={({ monitoring }) => {
          if (monitoring) calculatePPDRisk(user.user_id)
            .then(r => { if (!r.skipped) setRiskLevel(r.finalRiskLevel); });
        }}
      />
    )}


      {/* ── HEADER ── */}
      <header className="master-header">
        <div className="brand-logo">Journey of Motherhood</div>
        <div className={`header-controls ${isAr ? "header-controls-ar" : ""}`}>
          <nav className="desktop-nav">
            <a href="#" className="active"><i className="fas fa-th-large" /><span>{isAr ? "اللوحة" : "Dashboard"}</span></a>
           <a
  href="#"
  className={location.pathname === "/mother/health" ? "active" : ""}
  onClick={(e) => { e.preventDefault(); navigate("/mother/health"); }}
>
  <i className="fas fa-heart-pulse" />
  <span>{isAr ? "صحتي" : "My Health"}</span>
</a>
            <a href="#" onClick={() => firstChild && navigate(`/mother/child/${firstChild.child_id}`)}>
              <i className="fas fa-baby" /><span>{isAr ? "تطور الطفل" : "Baby Growth"}</span>
            </a>
  {/* المقالات الطبية - الربط الجديد */}
  <a href="#" onClick={() => navigate("/articles")}>
    <i className="fas fa-newspaper" />
    <span>{isAr ? "المقالات" : "Articles"}</span>
  </a>

  

        <a href="#" onClick={(e) => { e.preventDefault(); navigate("/mother/doctors"); }}><i className="fas fa-user-md" /><span>{isAr ? "الأطباء" : "Doctors"}</span></a>
       
 {/* المتجر مع عداد السلة */}
  <a href="#" onClick={() => navigate("/stores")} style={{ position: "relative" }}>
    <i className="fas fa-shopping-bag" />
    <span>{isAr ? "المتجر" : "Shop"}</span>
    {cartCount > 0 && <span className="cart-badge-nav">{cartCount}</span>}
  </a>
  <a href="#" onClick={() => navigate("/recommendations")}>
  <i className="fas fa-lightbulb" />
  <span>{isAr ? "التوصيات" : "Recommendations"}</span>
</a>
          </nav>
  {/*} */ } <XPScoreBadge userId={user?.user_id} isAr={isAr} />     
          <div className="lang-pill desktop-only" onClick={switchLang}>
            <span className="lang-active">{isAr ? "عربي" : "English"}</span>
            <span className="lang-inactive">{isAr ? "English" : "عربي"}</span>
          </div>
        <div className="noti-btn-wrapper desktop-only" style={{ position: "relative" }}>
  <div
    className="noti-btn"
    onClick={(e) => {
      e.stopPropagation();
      setNotiOpen(!notiOpen);
      if (!notiOpen) markNotiRead();
    }}
  >
    <i className="fas fa-bell" />
    {unreadCount > 0 && <span className="noti-badge">{unreadCount}</span>}
  </div>
  {notiOpen && (
    <div className="noti-dropdown" onClick={(e) => e.stopPropagation()}>
    <div className="noti-dropdown-header">
      <span>{isAr ? "الإشعارات" : "Notifications"}</span>
      {notifications.filter(n => !n.is_read).length > 0 && (
     <button
  type="button"
  className="noti-mark-all-btn"
  onClick={(e) => { e.preventDefault(); e.stopPropagation(); markNotiRead(); }}
>
          {isAr ? "تحديد الكل كمقروء" : "Mark all read"}
        </button>
      )}
    </div>
    {notifications.length === 0 ? (
      <div className="noti-empty">
        <i className="fas fa-bell-slash" />
        <p>{isAr ? "لا توجد إشعارات" : "No notifications"}</p>
      </div>
    ) : (
      notifications.map(n => (
        <div
          key={n.notification_id}
          className={`noti-item ${!n.is_read ? "noti-unread" : ""}`}
          onClick={() => handleNotiClick(n)}
        >
          <div className="noti-item-icon">
            {NOTI_ICON(n.notification_type)}
          </div>
          <div className="noti-item-body">
            <p>{n.message}</p>
            <small>
              {new Date(n.created_at).toLocaleDateString(
                isAr ? "ar-SA" : "en-US",
                { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
              )}
            </small>
          </div>
          {!n.is_read && <div className="noti-unread-dot" />}
        </div>
      ))
    )}
  </div>
)}
          </div>
          <button className="logout-btn desktop-only" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt" /><span>{isAr ? "خروج" : "Logout"}</span>
          </button>
          <button className="hamburger mobile-only" onClick={() => setSidebarOpen(true)}>
            <i className="fas fa-bars" />
          </button>
        </div>
      </header>

      {/* ── MOBILE SIDEBAR ── */}
      <aside className={`mobile-sidebar ${sidebarOpen ? "active" : ""}`}>
        <div className="mobile-sidebar-header">
          <h2>{isAr ? "القائمة" : "Menu"}</h2>
          <button onClick={() => setSidebarOpen(false)}><i className="fas fa-times" /></button>
        </div>
        <div className="lang-pill" style={{ margin: "10px 10px 20px" }} onClick={switchLang}>
          <span className="lang-active">{isAr ? "عربي" : "English"}</span>
          <span className="lang-inactive">{isAr ? "English" : "عربي"}</span>
        </div>
        <nav className="mobile-nav">
          <a href="#" className="active"><i className="fas fa-th-large" /><span>{isAr ? "اللوحة" : "Dashboard"}</span></a>
          <a
  href="#"
  onClick={(e) => { e.preventDefault(); navigate("/mother/health"); }}
>
  <i className="fas fa-heart-pulse" />
  <span>{isAr ? "صحتي" : "My Health"}</span>
</a>
            {/* المقالات الطبية - الربط الجديد */}
  <a href="#" onClick={() => navigate("/articles")}>
    <i className="fas fa-newspaper" />
    <span>{isAr ? "المقالات" : "Articles"}</span>
  </a>
         <a href="#" onClick={() => firstChild && navigate(`/mother/child/${firstChild.child_id}`)}>
              <i className="fas fa-baby" /><span>{isAr ? "تطور الطفل" : "Baby Growth"}</span>
            </a>
          
       

     <a href="#" onClick={(e) => { e.preventDefault(); navigate("/mother/doctors"); }}><i className="fas fa-user-md" /><span>{isAr ? "الأطباء" : "Doctors"}</span></a>

          <a href="#" onClick={() => navigate("/stores")} style={{ position: "relative" }}>
  <i className="fas fa-shopping-bag" />
  <span>{isAr ? "المتجر" : "Shop"}</span>
  {cartCount > 0 && (
    <span style={{
      background: "var(--primary)", color: "white",
      padding: "1px 6px", borderRadius: 10,
      fontSize: ".65rem", fontWeight: 800, marginRight: "auto",
    }}>
      {cartCount}
    </span>
  )}
</a>
<a href="#" onClick={() => navigate("/recommendations")}>
  <i className="fas fa-lightbulb" />
  <span>{isAr ? "التوصيات" : "Recommendations"}</span>
</a>

          <a className="logout-side" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt" /><span>{isAr ? "تسجيل الخروج" : "Logout"}</span>
          </a>
        </nav>
      </aside>

      {/* ── MAIN ── */}
      <main className="main-content">

        {/* Search */}
        <div className="search-wrap animate delay-1">
          <div className="search-bar">
            <i className="fas fa-search" style={{ color: "#aaa" }} />
            <input type="text"
              placeholder={isAr ? "ابحثي عن موعد، طبيب، أو مقال..." : "Search for an appointment, doctor, or article..."} />
          </div>
        </div>

        {/* Page header */}
        <header className="page-header animate delay-1">
          <div className="welcome-text">
            <h2 className="greeting">{getGreeting(userName)}</h2>
            <p className="greeting-sub">
              {isAr ? "إليكِ ملخص اليوم لنمو طفلكِ ونشاطاتكِ." : "Here's today's summary of your baby's growth and activities."}
            </p>
          </div>
          <div className="header-actions">
            <div className="user-profile-card" onClick={() => navigate("/mother/complete-profile")}>
              {user?.avatar_url
                ? <img src={user.avatar_url} alt="avatar" className="avatar-img" />
                : <div className="avatar-initials">{userName.charAt(0).toUpperCase()}</div>}
              <div>
                <h4>{userName}</h4>
                <p>{firstChild ? (isAr ? `أم ${firstChild.name}` : `${firstChild.name}'s Mom`) : (isAr ? "الأم" : "Mother")}</p>
              </div>
            </div>
            <div className="action-btns">
              <button className="btn-secondary" onClick={() => setAddRecordOpen(true)}>
                <i className="fas fa-plus" />{isAr ? " إضافة سجل" : " Add Record"}
              </button>
              <button className="btn-primary" onClick={() => navigate("/mother/complete-profile")}>
                <i className="fas fa-user-edit" />{isAr ? " تعديل ملفي" : " Edit Profile"}
              </button>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="hero-card animate delay-2">
          <div className="hero-text">
            <h1>{isAr ? "أنتِ تقومين بعمل عظيم! 🌸" : "You are doing an amazing job! 🌸"}</h1>
            <p>{isAr
              ? "صحة طفلكِ تبدأ من اهتمامكِ بنفسكِ. نحن هنا لنرافقكِ خطوة بخطوة."
              : "Your baby's health starts with taking care of yourself. We're here every step of the way."}</p>
            {firstChild && (
              <div className="age-badge">
                <i className="fas fa-baby" />
                <span>{firstChild.name} {isAr ? "الآن:" : "is now:"} {ageDisplay(firstChild.birth_date, isAr)}</span>
              </div>
            )}
          </div>
          <div className="hero-decoration">
            <div className="hero-circle c1" /><div className="hero-circle c2" /><div className="hero-circle c3" />
            <span style={{ fontSize: "5rem", position: "relative", zIndex: 2 }}>🤱</span>
          </div>
        </section>
    {/* Daily Tip */}
        <section className="tip-card animate delay-3">
          <div className="tip-icon"><i className="fas fa-seedling" /></div>
          <div className="tip-content">
            <h3>{isAr ? "نصيحة اليوم 🌿" : "Today's Tip 🌿"}</h3>
            <p>{TIPS[tipIndex]}</p>
          </div>
        </section>

   {riskBannerOpen && riskLevel && (
        <PPDRiskBanner
          riskLevel={riskLevel}
          isAr={isAr}
          onDismiss={() => setRiskBannerOpen(false)}
        />
      )}
<MotherArticleSuggestions
  motherId={user?.user_id}
/>



<DashboardArticlesWidget isAr={isAr} navigate={navigate} />

<DoctorVideosSection isAr={isAr} />

        {/* ── CHILDREN ── */}
        <section className="section-card animate delay-2">
          <div className="section-header">
            <h3>
              <div className="-icon"><i className="fas fa-baby" /></div>
              {isAr ? "أطفالي" : "My Children"}
            </h3>
            <button className="add-child-btn" onClick={() => setAddChildOpen(true)}>
              <i className="fas fa-plus" />{isAr ? " إضافة طفل" : " Add Child"}
            </button>
          </div>
          {children.length === 0 ? (
            <div className="empty-children">
              <span style={{ fontSize: "3rem" }}>👶</span>
              <p>{isAr ? "أضيفي طفلكِ الأول للبدء بتتبع نموه!" : "Add your first child to start tracking their growth!"}</p>
              <button className="btn-primary" style={{ marginTop: 15 }} onClick={() => setAddChildOpen(true)}>
                <i className="fas fa-plus" /> {isAr ? "إضافة طفل" : "Add Child"}
              </button>
            </div>
          ) : (
            <div className="children-grid">
              {children.map(child => {
                const latestGrowth = child.child_growth
                  ?.sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at))[0];
                return (
                  <div key={child.child_id} className="child-card"
                    onClick={() => navigate(`/mother/child/${child.child_id}`)}>
                    <div className="child-avatar">{GENDER_EMOJI[child.gender] || "👶"}</div>
                    <div className="child-info">
                      <h4>{child.name}</h4>
                      <p className="child-age">{ageDisplay(child.birth_date, isAr)}</p>
                      {latestGrowth && (
                        <div className="child-stats">
                          {latestGrowth.weight && <span><i className="fas fa-weight" /> {latestGrowth.weight} kg</span>}
                          {latestGrowth.height && <span><i className="fas fa-ruler-vertical" /> {latestGrowth.height} cm</span>}
                        </div>
                      )}
                    </div>
                    <div className="child-arrow"><i className={`fas fa-chevron-${isAr ? "left" : "right"}`} /></div>
                    <div className="child-card-bg" />
                  </div>
                );
              })}
            </div>
          )}
        </section>
<AccessRequestsNotifications motherUserId={user?.user_id} isAr={isAr} />
<ChildAccessManager motherUserId={user?.user_id} isAr={isAr} />

        {/* ── DASHBOARD GRID ── */}
        <div className="dashboard-grid animate delay-3">


  {/* ── DEVELOPMENT MAP ── */}
  {children.length === 0 ? (
    <div className="card card-timeline">
      <div className="card-header">
        <h3>
          <div className="card-icon"><i className="fas fa-route" /></div>
          {isAr ? "خريطة التطور" : "Development Map"}
        </h3>
      </div>
      <div className="empty-state">
        <p>{isAr ? "أضيفي طفلكِ لعرض خريطة التطور" : "Add a child to see the development map"}</p>
      </div>
    </div>
  ) : (
    children.map(child => {
      const childAgeMos = ageInMonths(child.birth_date);
      const clamped     = Math.min(12, Math.max(1, childAgeMos));
      const curActive   = (activeMilestone[child.child_id]) || clamped;
      const photos      = childPhotos[child.child_id] || {};
      const msData      = MILESTONES[curActive] || MILESTONES[1];

      return (
        <div key={child.child_id} className="card card-timeline">
          <div className="card-header">
            <h3>
              <div className="card-icon"><i className="fas fa-route" /></div>
              {isAr ? `خريطة تطور ${child.name}` : `${child.name}'s Development Map`}
            </h3>
            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
              <span className="current-age-badge">
                <i className="fas fa-star" />
                {isAr ? `العمر الحالي: شهر ${clamped}` : `Current: Month ${clamped}`}
              </span>
              <button
                style={{
                  display:"flex", alignItems:"center", gap:6,
                  background:"var(--primary)", color:"white", border:"none",
                  padding:"6px 12px", borderRadius:10,
                  fontFamily:"inherit", fontWeight:800, fontSize:".75rem", cursor:"pointer"
                }}
                onClick={() => navigate(`/mother/milestones/${child.child_id}`)}
              >
                <i className="fas fa-expand-alt" />
                {isAr ? " عرض كامل" : " Full View"}
              </button>
            </div>
          </div>

          <div className="timeline-scroll-outer">
            <div className="timeline-track">
              <div className="timeline-line" />
              <div className="timeline-fill"
                style={{ width:`${((curActive - 1) / 11) * 100}%` }} />
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
                const isCompleted = m < clamped;
                const isCurrent   = m === clamped;
                const isActive    = m === curActive;
                const photo       = photos[m];
                return (
                  <div
  key={m}
  className={`timeline-step${isCompleted?" completed":""}${isCurrent?" current":""}${isActive?" active":""}`}
>
                   <div
  className="step-circle"
  onClick={() =>
    setActiveMilestone(prev => ({
      ...prev,
      [child.child_id]: m
    }))
  }
>
  {photo ? (
 <img
  src={photo}
  alt=""
  className="timeline-photo"
/>
  ) : isCompleted ? (
    <i className="fas fa-check" />
  ) : isCurrent ? (
    <i className="fas fa-star" />
  ) : m}
</div>
                    <div className="step-label">{isAr ? `ش${m}` : `M${m}`}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`milestone-info ${curActive === clamped ? "milestone-current" : ""}`}>
            <div className="milestone-info-header">
              <h4>{msData.title}</h4>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                {curActive === clamped && (
                  <span className="milestone-now-badge">{isAr ? "🌟 الآن" : "🌟 Now"}</span>
                )}
                <button
                  style={{ background:"none", border:"none", color:"var(--primary)", fontFamily:"inherit", fontWeight:800, fontSize:".78rem", cursor:"pointer", textDecoration:"underline" }}
                  onClick={() => navigate(`/mother/milestones/${child.child_id}`)}
                >
                  {isAr ? "تفاصيل أكثر ←" : "More details →"}
                </button>
              </div>
            </div>
            <ul>{msData.items.map((item, i) => <li key={i}>{item}</li>)}</ul>
          </div>
        </div>
      );
    })
  )}











<MoodTracker
  userId={user?.user_id}
  isAr={isAr}
  navigate={navigate}
/>

          {/* Appointments */}
         <AppointmentsCard
    appointments={appointments}
    isAr={isAr}
    userId={user?.user_id}
    children={children}
    onBooked={refetch}
  />

          {/* Todo */}
          <div className="card card-todo">
            <div className="card-header">
              <h3><div className="card-icon"><i className="fas fa-check-square" /></div>
                {isAr ? "مهام اليوم" : "Today's Tasks"}</h3>
              <button className="card-action-btn" onClick={() => setAddTodoOpen(true)}>
                <i className="fas fa-plus" />
              </button>
            </div>
            {addTodoOpen && (
              <div className="todo-add-row">
                <input type="text" value={newTodo} onChange={e => setNewTodo(e.target.value)}
                  placeholder={isAr ? "اكتبي المهمة..." : "Write a task..."}
                  className="todo-input" onKeyDown={e => e.key === "Enter" && addTodo()} autoFocus />
                <button className="btn-primary-sm" onClick={addTodo} disabled={savingTodo}>
                  {savingTodo ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-check" />}
                </button>
                <button className="btn-ghost-sm" onClick={() => setAddTodoOpen(false)}>
                  <i className="fas fa-times" />
                </button>
              </div>
            )}
            {todoItems.length === 0 && !addTodoOpen ? (
              <div className="empty-state">
                <i className="fas fa-check-circle" style={{ fontSize: "2rem", color: "#eee" }} />
                <p>{isAr ? "لا توجد مهام اليوم" : "No tasks for today"}</p>
              </div>
            ) : (
              <ul className="todo-list">
                {todoItems.map(todo => (
                  <li key={todo.todo_id} className={`todo-item ${todo.status === "completed" ? "completed" : ""}`}>
                    <div className="todo-check" onClick={() => toggleTodo(todo)}>
                      {todo.status === "completed" && <i className="fas fa-check" />}
                    </div>
                    <span className="todo-text">{todo.title}</span>
                    <button className="todo-delete" onClick={() => deleteTodo(todo.todo_id)}>
                      <i className="fas fa-trash-alt" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quick Stats */}
<div className="card" style={{ background: "white" }}>
  <div className="card-header">
    <h3>
      <div className="card-icon" style={{ background: "#fdf2f5" }}>
        <i className="fas fa-star" style={{ color: "#d68b9d" }} />
      </div>
      {isAr ? "رحلتي الصحية" : "My Health Journey"}
    </h3>
    <button className="card-action-btn"
      onClick={() => navigate("/mother/health")}>
      <i className="fas fa-arrow-left" style={{ transform: isAr ? "none" : "rotate(180deg)" }} />
    </button>
  </div>

 
 <XpMiniCard userId={user?.user_id} isAr={isAr} navigate={navigate} /> 
</div>

          <div className="card card-stats">
            <div className="card-header">
              <h3><div className="card-icon"><i className="fas fa-chart-bar" /></div>
                {isAr ? "إحصائيات سريعة" : "Quick Stats"}</h3>
            </div>
            <div className="stats-grid">
              {[
                { icon: "fa-baby",          val: children.length,                                       lbl: isAr ? "أطفال"        : "Children",     bg: "#fdf2f5", color: "#d68b9d" },
                { icon: "fa-calendar-check",val: appointments.length,                                   lbl: isAr ? "مواعيد"       : "Appointments", bg: "#f0faf4", color: "#2ecc71" },
                { icon: "fa-check-circle",  val: todoItems.filter(t => t.status === "completed").length, lbl: isAr ? "مهام مكتملة" : "Done tasks",   bg: "#fff8f0", color: "#f39c12" },
                { icon: "fa-bell",          val: unreadCount,                                            lbl: isAr ? "إشعارات"      : "Notifications",bg: "#f5f0ff", color: "#9b59b6" },
              ].map((s, i) => (
                <div key={i} className="stat-item">
                  <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
                    <i className={`fas ${s.icon}`} />
                  </div>
                  <div>
                    <div className="stat-value">{s.val}</div>
                    <div className="stat-label">{s.lbl}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>



        </div>



{/* ── SHOP SECTION ── */}
<ShopSection navigate={navigate} isAr={isAr} cartCount={cartCount} />

{/* ── RECOMMENDATIONS ── 
<section className="articles-section animate delay-3" style={{ marginBottom: 26 }}>
  <RecommendationsSection
    isAr={isAr}
    mode="home"
    children={children}          // أطفال الأم للتخصيص
    myUserId={user?.user_id}
    maxCards={3}
  />
</section>*/}
  {/* ── RECOMMENDATIONS — مخصصة لعمر الطفل فقط ── */}
{children.length > 0 && (
  <PersonalizedRecsWidget
    isAr={isAr}
    children={children}
    myUserId={user?.user_id}
    navigate={navigate}
  />
)}    

      
      </main>

      {/* Modals */}
      <AddChildModal
        isOpen={addChildOpen} onClose={() => setAddChildOpen(false)}
        userId={user?.user_id} isAr={isAr}
        onSuccess={() => { setAddChildOpen(false); refetch(); }}
      />

      {addRecordOpen && (
        <AddRecordModal
          isOpen={addRecordOpen} onClose={() => setAddRecordOpen(false)}
          children={children} userId={user?.user_id} isAr={isAr}
           recordActivity={recordActivity}   // ← أضف هذا
    showXP={showXP}                   // ← أضف هذا
          onSuccess={() => { setAddRecordOpen(false); refetch(); }}
        />
      )}

   <BadgeToast badge={newBadge} isAr={isAr} />
<XPToast message={toast.message} points={toast.points}
  visible={toast.visible} onHide={hideXP} />

     
    </div>



  );
};



// ─── ARTICLE CARD with ratings/comments/save ─────────────────────────
const ArticleCard = ({
  art,
  isAr,
  avgRating,
  commentCount,
  doctorName,
  user,
  recordActivity,
  refetch,
}) => {
  const navigate = useNavigate();
  const [liked,  setLiked]  = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [userRating, setUserRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const loadComments = async () => {
    const { data } = await supabase
      .from("article_comments")
      .select("*, users(name, avatar_url)")
      .eq("article_id", art.article_id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true });
    setComments(data || []);
    setShowComments(true);
  };

  const submitComment = async () => {
    if (!newComment.trim() || !user) return;
    setSubmitting(true);
    const { data } = await supabase
      .from("article_comments")
      .insert({ article_id: art.article_id, user_id: user.user_id, content: newComment.trim() })
      .select("*, users(name, avatar_url)").single();
    if (data) {
  setComments(p => [...p, data]);
  if (recordActivity) await recordActivity("article_comment", art.article_id); // ← أضف
}

    setNewComment("");
    setSubmitting(false);
  };

  const submitRating = async (val) => {
    if (!user) return;
    setUserRating(val);
    await supabase.from("article_ratings")
      .upsert({ article_id: art.article_id, user_id: user.user_id, rating: val },
        { onConflict: "article_id,user_id" });
        if (recordActivity) await recordActivity("article_rate", art.article_id);
  };

  const toggleSave = async () => {
    if (!user) return;
    if (saved) {
      await supabase.from("saved_articles").delete()
        .eq("article_id", art.article_id).eq("user_id", user.user_id);
    } else {
      await supabase.from("saved_articles")
        .insert({ article_id: art.article_id, user_id: user.user_id });
    }
    setSaved(!saved);
  };

   return (
    <div className="article-card">
      <div className="article-card-body">
        <div className="article-doctor-row">
          {art.doctor_profiles?.users?.avatar_url
            ? <img src={art.doctor_profiles.users.avatar_url} alt="" className="article-doctor-avatar" />
            : <div className="article-doctor-init">{doctorName.charAt(0)}</div>}
          <span>{doctorName}</span>
          <span className="article-date-dot">•</span>
          <span className="article-date-text">
            {new Date(art.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", { month: "short", day: "numeric" })}
          </span>
        </div>
        <h3 className="article-title">{art.title}</h3>
        <p className="article-excerpt">
          {(art.content || "").slice(0, 100)}{art.content?.length > 100 ? "…" : ""}
        </p>
      </div>






     {/* Rating row */}
      <div className="article-rating-row">
        {[1, 2, 3, 4, 5].map(n => (
          <i key={n}
            className={`fas fa-star ${n <= userRating ? "rated" : ""}`}
            onClick={() => submitRating(n)}
            style={{ cursor: "pointer", color: n <= userRating ? "#f1c40f" : "#ddd", fontSize: ".85rem" }}
          />
        ))}
        {avgRating && <span className="article-avg-rating">{avgRating}</span>}
      </div>

      {/* Actions */}
      <div className="article-actions">
        <button className="art-action-btn" onClick={showComments ? () => setShowComments(false) : loadComments}>
          <i className="fas fa-comment" /> {commentCount}
        </button>
        <button className={`art-action-btn ${saved ? "art-saved" : ""}`} onClick={toggleSave}>
          <i className={`fa${saved ? "s" : "r"} fa-bookmark`} />
          {isAr ? (saved ? "محفوظ" : "حفظ") : (saved ? "Saved" : "Save")}
        </button>
        <button className="art-action-btn art-read-btn"
          onClick={() => navigate(`/articles/${art.article_id}`)}>
          {isAr ? "قراءة المزيد ←" : "Read more →"}
        </button>
      </div>

      {/* Comments panel */}
      {showComments && (
        <div className="article-comments-panel">
          {comments.length === 0
            ? <p className="no-comments">{isAr ? "لا توجد تعليقات بعد" : "No comments yet"}</p>
            : comments.map(c => (
              <div key={c.comment_id} className="comment-row">
                <div className="comment-avatar">
                  {c.users?.avatar_url
                    ? <img src={c.users.avatar_url} alt="" />
                    : <div>{(c.users?.name || "U").charAt(0)}</div>}
                </div>
                <div className="comment-body">
                  <strong>{c.users?.name || (isAr ? "مجهول" : "Anonymous")}</strong>
                  <p>{c.content}</p>
                </div>
              </div>
            ))
          }
          {user ? (
            <div className="comment-input-row">
              <input
                type="text" value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submitComment()}
                placeholder={isAr ? "أضيفي تعليقاً..." : "Add a comment..."}
                className="comment-input"
              />
              <button className="comment-submit-btn" onClick={submitComment} disabled={submitting}>
                {submitting ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-paper-plane" />}
              </button>
            </div>
          ) : (
            <p className="login-to-comment">
              {isAr ? "سجلي دخولك للتعليق" : "Login to comment"}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const ShopSection = ({ navigate, isAr, cartCount }) => {
  const [featuredStores, setFeaturedStores] = useState([]);
  const [categories, setCategories]         = useState([]);
  const [loadingShop, setLoadingShop]       = useState(true);

  useEffect(() => {
    const load = async () => {
      // جلب أول 4 متاجر موثّقة
      const { data: stores } = await supabase
        .from("stores")
        .select(`
          store_id, store_name, logo, description, is_verified,
          products(product_id, is_active)
        `)
        .eq("is_verified", true)
        .limit(4);

      // جلب التصنيفات
      const { data: cats } = await supabase
        .from("product_categories")
        .select("*")
        .limit(6);

      setFeaturedStores(stores || []);
      setCategories(cats || []);
      setLoadingShop(false);
    };
    load();
  }, []);
return (
  <section className="shop-section animate delay-3">
   <div className="section-header">
  <h2>{isAr ? "المتجر" : "Shop"}</h2>

  <button
    className="view-all-btn"
    onClick={() => navigate("/stores")}
  >
    {isAr ? "عرض الكل ←" : "View All →"}
  </button>
</div>

    {loadingShop ? (
      <p style={{ textAlign: "center", color: "#aaa" }}>
        {isAr ? "جاري التحميل..." : "Loading..."}
      </p>
    ) : (
      <div className="stores-grid">
        {featuredStores.length === 0 ? (
          <p style={{ textAlign: "center", color: "#aaa" }}>
            {isAr ? "لا توجد متاجر" : "No stores available"}
          </p>
        ) : (
          featuredStores.map(store => (
           <div
  key={store.store_id}
  className="store-card"
  onClick={() => navigate(`/stores/${store.store_id}`)}
>
              <img src={store.logo} alt={store.store_name} />
              <h4>{store.store_name}</h4>
            </div>
          ))
        )}
      </div>
    )}
  </section>

  
);


};

// المواعيد

const AppointmentsCard = ({ appointments, isAr, userId, children, onBooked }) => {
  const navigate = useNavigate();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [doctors,     setDoctors]     = useState([]);
 
  useEffect(() => {
    const fetchDoctors = async () => {
      const { data } = await supabase
        .from("doctor_profiles")
        .select(`
          doctor_id, specialization,
          users!doctor_profiles_doctor_id_fkey (user_id, name, avatar_url)
        `);
      setDoctors(data || []);
    };
    fetchDoctors();
  }, []);
 
  // ── عرض المواعيد: الكل (pending + confirmed + completed) ──────
  const upcoming = [...appointments]
    .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));
 
  const STATUS_AR = {
    pending:   "قيد الانتظار",
    confirmed: "مؤكد",
    cancelled: "ملغى",
    completed: "مكتمل",
  };
 
  return (
    <>
      <div className="card card-appointments">
        <div className="card-header">
          <h3>
            <div className="card-icon"><i className="fas fa-calendar-alt" /></div>
            {isAr ? "المواعيد" : "Appointments"}
          </h3>
          {/* ✅ زر + يفتح نموذج حجز موعد مع طبيب */}
          <button
            className="card-action-btn"
            onClick={() => setBookingOpen(true)}
            title={isAr ? "حجز موعد جديد" : "Book new appointment"}
          >
            <i className="fas fa-plus" />
          </button>
        </div>
 
        {upcoming.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-calendar-check" style={{ fontSize: "2rem", color: "#eee" }} />
            <p>{isAr ? "لا توجد مواعيد" : "No appointments"}</p>
            <button
              className="btn-primary"
              style={{ marginTop: 10, fontSize: ".8rem", padding: "8px 16px" }}
              onClick={() => setBookingOpen(true)}
            >
              <i className="fas fa-plus" />
              {isAr ? " احجزي موعداً" : " Book Appointment"}
            </button>
          </div>
        ) : (
          <ul className="appointment-list">
            {upcoming.slice(0, 4).map(appt => {
              const d = new Date(appt.appointment_date);
              const isPast = d < new Date();
              const doctorName =
                appt.doctor_profiles?.users?.name || (isAr ? "طبيب" : "Doctor");
              const typeLabels = {
                checkup:      isAr ? "فحص"      : "Checkup",
                vaccination:  isAr ? "تطعيم"    : "Vaccination",
                consultation: isAr ? "استشارة"  : "Consultation",
              };
              const statusColor = {
                pending:   { bg: "#fff8f0", color: "#f39c12" },
                confirmed: { bg: "#f0faf4", color: "#2ecc71" },
                cancelled: { bg: "#fef0f0", color: "#e74c3c" },
                completed: { bg: "#f0f0f0", color: "#888"    },
              };
              const sc = statusColor[appt.status] || statusColor.pending;
 
              return (
                <li
                  key={appt.appointment_id}
                  className="appt-item"
                  style={{ opacity: isPast && appt.status === "completed" ? 0.6 : 1 }}
                >
                  <div className="appt-date">
                    <span>{d.getDate()}</span>
                    <small>
                      {d.toLocaleString(isAr ? "ar-SA" : "en-US", { month: "short" })}
                    </small>
                  </div>
                  <div className="appt-info">
                    <h4>
                      {typeLabels[appt.type] || appt.type} — {doctorName}
                    </h4>
                    <p style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <i className="fas fa-clock" style={{ fontSize: ".7rem", color: "#bbb" }} />
                      {d.toLocaleTimeString(isAr ? "ar-SA" : "en-US", {
                        hour: "2-digit", minute: "2-digit"
                      })}
                      {appt.children?.name && (
                        <span style={{ marginInlineStart: 6, color: "#d68b9d", fontSize: ".75rem", fontWeight: 700 }}>
                          • {appt.children.name}
                        </span>
                      )}
                    </p>
                  </div>
                  <span
                    className={`appt-status status-${appt.status}`}
                    style={{ background: sc.bg, color: sc.color }}
                  >
                    {isAr
                      ? STATUS_AR[appt.status] || appt.status
                      : appt.status}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
 
        {upcoming.length > 4 && (
          <button
            className="view-all-btn"
            style={{ width: "100%", marginTop: 10 }}
            onClick={() => navigate("/mother/doctors")}
          >
            {isAr
              ? `عرض كل المواعيد (${upcoming.length}) ←`
              : `View all (${upcoming.length}) →`}
          </button>
        )}
      </div>
 
      {/* ✅ Modal حجز موعد مع طبيب */}
      {bookingOpen && (
        <DashboardBookingModal
          isAr={isAr}
          userId={userId}
          children={children}
          doctors={doctors}
          onClose={() => setBookingOpen(false)}
          onSuccess={() => { setBookingOpen(false); onBooked(); }}
        />
      )}
    </>
  );
};
 
// ═══════════════════════════════════════════════════════════════
// 3) Modal حجز الموعد — مطابق لـ BookingModal في صفحة الأطباء
// ═══════════════════════════════════════════════════════════════
 
const DashboardBookingModal = ({
  isAr, userId, children, doctors, onClose, onSuccess,
}) => {
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [form, setForm] = useState({
    type:             "consultation",
    appointment_date: "",
    appointment_time: "10:00",
    child_id:         "",
    notes:            "",
  });
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");
 
  const today = new Date().toISOString().split("T")[0];
 
  const TYPE_LABELS = {
    ar: { checkup: "فحص دوري", vaccination: "تطعيم", consultation: "استشارة طبية" },
    en: { checkup: "Checkup",  vaccination: "Vaccination", consultation: "Consultation" },
  };
  const typeLabels = isAr ? TYPE_LABELS.ar : TYPE_LABELS.en;
 
  const handleSave = async () => {
    if (!selectedDoctor) {
      setError(isAr ? "يرجى اختيار الطبيب" : "Please select a doctor");
      return;
    }
    if (!form.appointment_date) {
      setError(isAr ? "يرجى اختيار التاريخ" : "Please select a date");
      return;
    }
 
    setSaving(true);
    setError("");
 
    try {
      const dateTime = new Date(
        `${form.appointment_date}T${form.appointment_time}:00`
      );
 
      const payload = {
        mother_id:        userId,
        doctor_id:        selectedDoctor,
        appointment_date: dateTime.toISOString(),
        type:             form.type,
        status:           "pending",
        notes:            form.notes || null,
      };
      if (form.child_id) payload.child_id = form.child_id;
 
      const { error: dbErr } = await supabase
        .from("appointments")
        .insert(payload);
 
      if (dbErr) throw dbErr;
 
      // إشعار للطبيب
      const doc = doctors.find(d => d.doctor_id === selectedDoctor);
      await supabase.from("notifications").insert({
        user_id:           selectedDoctor,
        message:           isAr
          ? `طلب موعد جديد`
          : `New appointment request`,
        notification_type: "appointment",
        related_type:      "appointment",
      });
 
      setSuccess(true);
      setTimeout(() => onSuccess(), 1500);
    } catch (err) {
      setError(err.message || (isAr ? "حدث خطأ" : "An error occurred"));
    } finally {
      setSaving(false);
    }
  };
 
  const selectedDoc = doctors.find(d => d.doctor_id === selectedDoctor);
 
  return (
    <div className="modal-overlay active">
      <div className="modal-box" dir={isAr ? "rtl" : "ltr"}>
        <div className="modal-head">
          <h2>
            <i className="fas fa-calendar-plus" style={{ color: "#d68b9d", marginInlineEnd: 8 }} />
            {isAr ? "حجز موعد جديد" : "Book New Appointment"}
          </h2>
          <button onClick={onClose}><i className="fas fa-times" /></button>
        </div>
 
        {success ? (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>✅</div>
            <h3 style={{ fontWeight: 800, color: "#2ecc71" }}>
              {isAr ? "تم إرسال طلب الموعد!" : "Appointment request sent!"}
            </h3>
            <p style={{ color: "#888", fontSize: ".88rem", marginTop: 6 }}>
              {isAr
                ? "سيتواصل معكِ الطبيب لتأكيد الموعد."
                : "The doctor will confirm your appointment."}
            </p>
          </div>
        ) : (
          <div className="modal-fields">
 
            {/* ── اختيار الطبيب ── */}
            <div className="modal-field">
              <label>
                <i className="fas fa-user-md" style={{ color: "#d68b9d" }} />
                {" "}{isAr ? "اختاري الطبيب *" : "Select Doctor *"}
              </label>
              <select
                className="modal-input"
                value={selectedDoctor}
                onChange={e => setSelectedDoctor(e.target.value)}
              >
                <option value="">
                  {isAr ? "— اختاري طبيباً —" : "— Choose a doctor —"}
                </option>
                {doctors.map(doc => (
                  <option key={doc.doctor_id} value={doc.doctor_id}>
                    {doc.users?.name || doc.doctor_id}
                    {doc.specialization ? ` — ${doc.specialization}` : ""}
                  </option>
                ))}
              </select>
              {/* معلومات الطبيب المختار */}
              {selectedDoc && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "#fdf2f5", borderRadius: 12, padding: "10px 14px",
                  marginTop: 8,
                }}>
                  {selectedDoc.users?.avatar_url ? (
                    <img
                      src={selectedDoc.users.avatar_url}
                      alt=""
                      style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: "#eab8c6", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 800, fontSize: ".95rem",
                    }}>
                      {(selectedDoc.users?.name || "D").charAt(0)}
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 800, fontSize: ".88rem" }}>
                      {selectedDoc.users?.name}
                    </div>
                    <div style={{ fontSize: ".75rem", color: "#d68b9d", fontWeight: 700 }}>
                      {selectedDoc.specialization}
                    </div>
                  </div>
                </div>
              )}
            </div>
 
            {/* ── نوع الموعد ── */}
            <div className="modal-field">
              <label>{isAr ? "نوع الموعد" : "Appointment Type"}</label>
              <div className="record-type-tabs">
                {Object.entries(typeLabels).map(([key, lbl]) => (
                  <button
                    key={key}
                    type="button"
                    className={`type-tab ${form.type === key ? "active" : ""}`}
                    onClick={() => setForm(p => ({ ...p, type: key }))}
                  >
                    {key === "checkup"      && <i className="fas fa-stethoscope" />}
                    {key === "vaccination"  && <i className="fas fa-syringe" />}
                    {key === "consultation" && <i className="fas fa-comments" />}
                    {" "}{lbl}
                  </button>
                ))}
              </div>
            </div>
 
            {/* ── التاريخ والوقت ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="modal-field">
                <label>
                  <i className="fas fa-calendar" style={{ color: "#d68b9d" }} />
                  {" "}{isAr ? "التاريخ *" : "Date *"}
                </label>
                <input
                  type="date"
                  className="modal-input"
                  min={today}
                  value={form.appointment_date}
                  onChange={e => setForm(p => ({ ...p, appointment_date: e.target.value }))}
                />
              </div>
              <div className="modal-field">
                <label>
                  <i className="fas fa-clock" style={{ color: "#d68b9d" }} />
                  {" "}{isAr ? "الوقت" : "Time"}
                </label>
                <input
                  type="time"
                  className="modal-input"
                  value={form.appointment_time}
                  onChange={e => setForm(p => ({ ...p, appointment_time: e.target.value }))}
                />
              </div>
            </div>
 
            {/* ── اختيار الطفل (اختياري) ── */}
            {children.length > 0 && (
              <div className="modal-field">
                <label>
                  <i className="fas fa-baby" style={{ color: "#d68b9d" }} />
                  {" "}{isAr ? "الطفل (اختياري)" : "Child (optional)"}
                </label>
                <select
                  className="modal-input"
                  value={form.child_id}
                  onChange={e => setForm(p => ({ ...p, child_id: e.target.value }))}
                >
                  <option value="">
                    {isAr ? "— بدون طفل —" : "— No child —"}
                  </option>
                  {children.map(c => (
                    <option key={c.child_id} value={c.child_id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
 
            {/* ── ملاحظات ── */}
            <div className="modal-field">
              <label>
                <i className="fas fa-sticky-note" style={{ color: "#d68b9d" }} />
                {" "}{isAr ? "ملاحظات (اختياري)" : "Notes (optional)"}
              </label>
              <textarea
                className="modal-input"
                rows="3"
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder={
                  isAr
                    ? "اكتبي أي ملاحظات للطبيب..."
                    : "Any notes for the doctor..."
                }
              />
            </div>
 
            {error && (
              <div style={{
                background: "#fef0f0", color: "#e74c3c",
                padding: "10px 14px", borderRadius: 10,
                fontSize: ".82rem", fontWeight: 700,
                display: "flex", alignItems: "center", gap: 7,
              }}>
                <i className="fas fa-exclamation-circle" /> {error}
              </div>
            )}
 
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                className="btn-secondary"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={onClose}
              >
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button
                className="btn-primary modal-save-btn"
                style={{ flex: 2 }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? <><i className="fas fa-spinner fa-spin" /> {isAr ? "جارٍ الإرسال..." : "Sending..."}</>
                  : <><i className="fas fa-paper-plane" /> {isAr ? "إرسال الطلب" : "Send Request"}</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
 

// ─── ADD RECORD MODAL ──────────────────────────────────────────────────
const AddRecordModal = ({
  isOpen,
  onClose,
  children,
  userId,
  isAr,
  onSuccess,
  recordActivity,
  showXP,
}) => {
  const [recordType, setRecordType] = useState("feeding");
  const [selectedChild, setSelectedChild] = useState(children[0]?.child_id || "");
  const [form, setForm] = useState({
    weight: "", height: "", notes: "",
    feeding_type: "breastfeeding", duration_minutes: "", quantity_ml: "",
    sleep_start: "", sleep_end: "", sleep_quality: "good",
    event_type: "vaccination", event_title: "", event_date: new Date().toISOString().split("T")[0],
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
  if (!selectedChild) return;

  setSaving(true);

  try {

    // ═══════════════════════════
    // Growth
    // ═══════════════════════════
    if (recordType === "growth") {

      const { data, error } = await supabase
        .from("child_growth")
        .insert({
          child_id: selectedChild,
          weight: form.weight ? parseFloat(form.weight) : null,
          height: form.height ? parseFloat(form.height) : null,
          notes: form.notes || null,
          recorded_at: new Date().toISOString().split("T")[0],
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        await recordActivity("growth_record", data.record_id);
        showXP(
          isAr ? "تم تسجيل قياس نمو" : "Growth record added",
          20
        );
      }

    }

    // ═══════════════════════════
    // Feeding
    // ═══════════════════════════
    else if (recordType === "feeding") {

      const { data, error } = await supabase
        .from("child_feeding_tracking")
        .insert({
          child_id: selectedChild,
          feeding_type: form.feeding_type,
          feeding_time: new Date().toISOString(),
          duration_minutes: form.duration_minutes
            ? parseInt(form.duration_minutes)
            : null,
          quantity_ml: form.quantity_ml
            ? parseInt(form.quantity_ml)
            : null,
          notes: form.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        await recordActivity("feeding_record", data.feeding_id);
        showXP(
          isAr ? "تم تسجيل رضاعة" : "Feeding recorded",
          10
        );
      }

    }

    // ═══════════════════════════
    // Sleep
    // ═══════════════════════════
    else if (recordType === "sleep") {

      if (form.sleep_start && form.sleep_end) {

        const { data, error } = await supabase
          .from("child_sleep_tracking")
          .insert({
            child_id: selectedChild,
            sleep_start: new Date(form.sleep_start).toISOString(),
            sleep_end: new Date(form.sleep_end).toISOString(),
            sleep_quality: form.sleep_quality,
            notes: form.notes || null,
          })
          .select()
          .single();

        if (error) throw error;

        if (data) {
          await recordActivity("sleep_record", data.sleep_id);
          showXP(
            isAr ? "تم تسجيل نوم الطفل" : "Sleep recorded",
            15
          );
        }

      }

    }

    // ═══════════════════════════
    // Medical
    // ═══════════════════════════
    else if (recordType === "medical") {

      const { data, error } = await supabase
        .from("child_medical_events")
        .insert({
          child_id: selectedChild,
          event_type: form.event_type,
          title: form.event_title,
          description: form.notes || null,
          event_date: form.event_date,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        await recordActivity("medical_event", data.event_id);
        showXP(
          isAr ? "تم تسجيل حدث طبي" : "Medical event added",
          25
        );
      }

    }

    onSuccess();

  } catch (err) {
    console.error(err);
    alert(isAr ? "حدث خطأ" : "Error saving record");
  } finally {
    setSaving(false);
  }
};

  if (!isOpen) return null;

  const TYPES = [
    { key: "growth",  label: isAr ? "📏 نمو"    : "📏 Growth"  },
    { key: "feeding", label: isAr ? "🍼 رضاعة"  : "🍼 Feeding" },
    { key: "sleep",   label: isAr ? "😴 نوم"    : "😴 Sleep"   },
    { key: "medical", label: isAr ? "💉 طبي"    : "💉 Medical" },
  ];

  const F = f => ({ target: { value: v } }) => setForm(p => ({ ...p, [f]: v }));

  return (
     <>
    <div className="modal-overlay active">
      <div className="modal-box">
        <div className="modal-head">
          <h2>{isAr ? "إضافة سجل جديد" : "Add New Record"}</h2>
          <button onClick={onClose}><i className="fas fa-times" /></button>
        </div>
        {children.length > 1 && (
          <div className="modal-field">
            <label>{isAr ? "اختاري الطفل" : "Select Child"}</label>
            <select value={selectedChild} onChange={e => setSelectedChild(e.target.value)} className="modal-input">
              {children.map(c => <option key={c.child_id} value={c.child_id}>{c.name}</option>)}
            </select>
          </div>
        )}
        <div className="record-type-tabs">
          {TYPES.map(t => (
            <button key={t.key} className={`type-tab ${recordType === t.key ? "active" : ""}`}
              onClick={() => setRecordType(t.key)}>{t.label}</button>
          ))}
        </div>

        {recordType === "growth" && (
          <div className="modal-fields">
            <div className="modal-field"><label>{isAr ? "الوزن (كغ)" : "Weight (kg)"}</label>
              <input type="number" step="0.1" value={form.weight} className="modal-input" placeholder="6.2"
                onChange={e => setForm(p => ({ ...p, weight: e.target.value }))} /></div>
            <div className="modal-field"><label>{isAr ? "الطول (سم)" : "Height (cm)"}</label>
              <input type="number" step="0.1" value={form.height} className="modal-input" placeholder="62"
                onChange={e => setForm(p => ({ ...p, height: e.target.value }))} /></div>
            <div className="modal-field"><label>{isAr ? "ملاحظات" : "Notes"}</label>
              <textarea value={form.notes} className="modal-input" rows="2"
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
          </div>
        )}
        {recordType === "feeding" && (
          <div className="modal-fields">
            <div className="modal-field"><label>{isAr ? "نوع الرضاعة" : "Feeding Type"}</label>
              <select value={form.feeding_type} className="modal-input"
                onChange={e => setForm(p => ({ ...p, feeding_type: e.target.value }))}>
                <option value="breastfeeding">{isAr ? "رضاعة طبيعية" : "Breastfeeding"}</option>
                <option value="formula">{isAr ? "حليب صناعي" : "Formula"}</option>
                <option value="solid_food">{isAr ? "طعام صلب" : "Solid Food"}</option>
              </select></div>
            <div className="modal-field"><label>{isAr ? "المدة (دقيقة)" : "Duration (min)"}</label>
              <input type="number" value={form.duration_minutes} className="modal-input" placeholder="15"
                onChange={e => setForm(p => ({ ...p, duration_minutes: e.target.value }))} /></div>
            <div className="modal-field"><label>{isAr ? "الكمية (مل)" : "Quantity (ml)"}</label>
              <input type="number" value={form.quantity_ml} className="modal-input" placeholder="120"
                onChange={e => setForm(p => ({ ...p, quantity_ml: e.target.value }))} /></div>
          </div>
        )}
        {recordType === "sleep" && (
          <div className="modal-fields">
            <div className="modal-field"><label>{isAr ? "وقت البداية" : "Sleep Start"}</label>
              <input type="datetime-local" value={form.sleep_start} className="modal-input"
                onChange={e => setForm(p => ({ ...p, sleep_start: e.target.value }))} /></div>
            <div className="modal-field"><label>{isAr ? "وقت النهاية" : "Sleep End"}</label>
              <input type="datetime-local" value={form.sleep_end} className="modal-input"
                onChange={e => setForm(p => ({ ...p, sleep_end: e.target.value }))} /></div>
            <div className="modal-field"><label>{isAr ? "جودة النوم" : "Sleep Quality"}</label>
              <select value={form.sleep_quality} className="modal-input"
                onChange={e => setForm(p => ({ ...p, sleep_quality: e.target.value }))}>
                <option value="excellent">{isAr ? "ممتاز" : "Excellent"}</option>
                <option value="good">{isAr ? "جيد" : "Good"}</option>
                <option value="average">{isAr ? "متوسط" : "Average"}</option>
                <option value="poor">{isAr ? "ضعيف" : "Poor"}</option>
              </select></div>
          </div>
        )}
        {recordType === "medical" && (
          <div className="modal-fields">
            <div className="modal-field"><label>{isAr ? "نوع الحدث" : "Event Type"}</label>
              <select value={form.event_type} className="modal-input"
                onChange={e => setForm(p => ({ ...p, event_type: e.target.value }))}>
                <option value="vaccination">{isAr ? "تطعيم" : "Vaccination"}</option>
                <option value="disease">{isAr ? "مرض" : "Disease"}</option>
                <option value="allergy">{isAr ? "حساسية" : "Allergy"}</option>
                <option value="checkup">{isAr ? "فحص" : "Checkup"}</option>
              </select></div>
            <div className="modal-field"><label>{isAr ? "العنوان" : "Title"}</label>
              <input type="text" value={form.event_title} className="modal-input"
                onChange={e => setForm(p => ({ ...p, event_title: e.target.value }))} /></div>
            <div className="modal-field"><label>{isAr ? "التاريخ" : "Date"}</label>
              <input type="date" value={form.event_date} className="modal-input"
                onChange={e => setForm(p => ({ ...p, event_date: e.target.value }))} /></div>
            <div className="modal-field"><label>{isAr ? "وصف" : "Description"}</label>
              <textarea value={form.notes} className="modal-input" rows="2"
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
          </div>
        )}

        <button className="btn-primary modal-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-save" />}
          {isAr ? " حفظ" : " Save"}
        </button>
      </div>

      


    </div>

  </>

  );
};

// ─── CSS ───────────────────────────────────────────────────────────────
const DASHBOARD_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800;900&family=Cairo:wght@400;600;700;800;900&display=swap');
:root {
  --primary:#d68b9d; --primary-light:#fdf2f5; --secondary:#eab8c6;
  --bg:#FBF9F8; --text:#333; --gray:#777; --white:#fff;
  --shadow:0 5px 20px rgba(0,0,0,.04); --shadow-hover:0 10px 25px rgba(214,139,157,.15);
  --radius:20px;
}
*{margin:0;padding:0;box-sizing:border-box;font-family:'Cairo','Poppins',sans-serif;}
html{overflow-x:hidden;}
body,.dash-root{background:var(--bg);color:var(--text);min-height:100vh;}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(214,139,157,.7)}70%{box-shadow:0 0 0 15px rgba(214,139,157,0)}100%{box-shadow:0 0 0 0 rgba(214,139,157,0)}}
@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}
.animate{animation:fadeUp .8s ease forwards;opacity:0;}
.delay-1{animation-delay:.1s}.delay-2{animation-delay:.2s}.delay-3{animation-delay:.3s}

/* Header */
.master-header{position:fixed;top:0;left:0;right:0;height:80px;background:var(--white);box-shadow:var(--shadow);display:flex;align-items:center;justify-content:space-between;padding:0 35px;z-index:1000;}
.brand-logo{font-family:'Georgia',serif;font-style:italic;font-weight:bold;font-size:1.6rem;color:var(--text);white-space:nowrap;}
.header-controls{display:flex;align-items:center;gap:10px;}
.desktop-nav{display:flex;align-items:center;gap:4px;}
.desktop-nav a{display:flex;align-items:center;gap:7px;text-decoration:none;color:var(--gray);font-weight:700;padding:8px 12px;border-radius:12px;transition:.3s;font-size:.85rem;white-space:nowrap;}
.desktop-nav a:hover,.desktop-nav a.active{background:var(--primary-light);color:var(--primary);}
.lang-pill{display:flex;background:#f4f4f4;border-radius:30px;padding:4px;cursor:pointer;border:1px solid #eee;user-select:none;}
.lang-active{background:var(--primary);color:white;border-radius:25px;padding:5px 12px;font-weight:700;font-size:.78rem;box-shadow:0 3px 8px rgba(214,139,157,.3);}
.lang-inactive{color:var(--gray);border-radius:25px;padding:5px 12px;font-weight:700;font-size:.78rem;}
.noti-btn{position:relative;font-size:1.2rem;color:var(--gray);cursor:pointer;padding:9px;border-radius:50%;transition:.3s;}
.noti-btn:hover{background:var(--primary-light);color:var(--primary);}
.noti-badge{position:absolute;top:5px;right:5px;background:#e89cae;color:white;width:18px;height:18px;border-radius:50%;font-size:.62rem;display:flex;align-items:center;justify-content:center;font-weight:700;border:2px solid white;}
.noti-dropdown{position:absolute;top:calc(100% + 10px);right:0;width:280px;background:white;border-radius:16px;box-shadow:0 15px 40px rgba(0,0,0,.12);border:1px solid #f0f0f0;z-index:2000;overflow:hidden;}
.noti-dropdown-header{padding:14px 16px;font-weight:800;border-bottom:1px solid #f0f0f0;}
.noti-item{padding:12px 16px;border-bottom:1px solid #f9f9f9;transition:.2s;}
.noti-item:hover{background:#fafafa;}
.noti-unread{background:var(--primary-light);}
.noti-item p{font-size:.83rem;font-weight:700;margin-bottom:3px;}
.noti-item small{font-size:.72rem;color:var(--gray);}
.noti-empty{padding:20px;text-align:center;color:var(--gray);font-size:.88rem;}
.logout-btn{display:flex;align-items:center;gap:7px;background:none;border:none;color:#e89cae;font-weight:700;cursor:pointer;padding:8px 12px;border-radius:12px;transition:.3s;font-size:.85rem;font-family:'Cairo','Poppins',sans-serif;}
.logout-btn:hover{background:var(--primary-light);color:var(--primary);}
.hamburger{background:none;border:none;font-size:1.5rem;cursor:pointer;color:var(--text);}
.desktop-only{display:flex!important;} .mobile-only{display:none!important;}

/* Mobile Sidebar */
.sidebar-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:1001;}
.mobile-sidebar{position:fixed;top:0;bottom:0;left:0;width:280px;background:white;z-index:1002;box-shadow:5px 0 25px rgba(0,0,0,.1);display:flex;flex-direction:column;padding:25px 15px;transform:translateX(-100%);transition:.4s cubic-bezier(.4,0,.2,1);border-radius:0 20px 20px 0;}
[dir=rtl] .mobile-sidebar{left:auto;right:0;transform:translateX(100%);border-radius:20px 0 0 20px;}
.mobile-sidebar.active{transform:translateX(0)!important;}
.mobile-sidebar-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;padding-bottom:15px;border-bottom:1px solid #eee;}
.mobile-sidebar-header h2{font-size:1.2rem;font-weight:800;}
.mobile-sidebar-header button{background:none;border:none;font-size:1.4rem;cursor:pointer;color:var(--gray);}
.mobile-nav{display:flex;flex-direction:column;overflow-y:auto;flex:1;margin-top:10px;}
.mobile-nav a{display:flex;align-items:center;gap:12px;padding:11px 14px;text-decoration:none;color:var(--gray);font-weight:700;border-radius:12px;margin-bottom:4px;font-size:.88rem;cursor:pointer;}
.mobile-nav a:hover,.mobile-nav a.active{background:var(--primary-light);color:var(--primary);}
.mobile-nav a i{width:20px;text-align:center;}
.logout-side{margin-top:20px;color:#e89cae!important;border-top:1px solid #eee;padding-top:15px!important;}

/* Main */
.main-content{max-width:1250px;margin:0 auto;padding:110px 25px 50px;}
.search-wrap{margin-bottom:22px;}
.search-bar{background:white;border-radius:18px;padding:11px 20px;display:flex;align-items:center;gap:12px;width:350px;max-width:100%;border:1px solid #eee;box-shadow:var(--shadow);}
.search-bar input{border:none;background:transparent;outline:none;width:100%;font-size:.88rem;font-family:'Cairo','Poppins',sans-serif;}
.page-header{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:22px;gap:15px;flex-wrap:wrap;}
.welcome-text h2.greeting{font-size:1.8rem;font-weight:900;color:var(--text);}
.welcome-text p.greeting-sub{color:var(--gray);font-weight:700;margin-top:4px;font-size:.88rem;}
.header-actions{display:flex;flex-direction:column;align-items:flex-end;gap:10px;}
.user-profile-card{display:flex;align-items:center;gap:11px;background:white;padding:9px 16px;border-radius:18px;box-shadow:var(--shadow);border:1px solid var(--primary-light);cursor:pointer;transition:.3s;}
.user-profile-card:hover{box-shadow:var(--shadow-hover);}
.avatar-img{width:42px;height:42px;border-radius:50%;object-fit:cover;border:2px solid var(--secondary);}
.avatar-initials{width:42px;height:42px;border-radius:50%;background:var(--secondary);color:white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.2rem;}
.user-profile-card h4{font-size:.95rem;font-weight:800;line-height:1.1;}
.user-profile-card p{font-size:.75rem;color:var(--gray);font-weight:700;}
.action-btns{display:flex;gap:10px;flex-wrap:wrap;}
.btn-primary{background:var(--primary);color:white;border:none;padding:10px 20px;border-radius:12px;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:8px;transition:.3s;box-shadow:0 4px 15px rgba(214,139,157,.3);font-family:'Cairo','Poppins',sans-serif;font-size:.88rem;}
.btn-primary:hover{background:#c27a8c;transform:translateY(-2px);}
.btn-primary:disabled{opacity:.7;cursor:not-allowed;transform:none;}
.btn-secondary{background:white;color:var(--text);border:1px solid #eee;padding:10px 20px;border-radius:12px;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:8px;transition:.3s;box-shadow:var(--shadow);font-family:'Cairo','Poppins',sans-serif;font-size:.88rem;}
.btn-secondary:hover{background:var(--primary-light);color:var(--primary);border-color:var(--secondary);}

/* Hero */
.hero-card{background:linear-gradient(135deg,#fff 0%,#fdf2f5 100%);border-radius:25px;box-shadow:var(--shadow);margin-bottom:26px;border:1px solid #fdf2f5;overflow:hidden;display:flex;align-items:center;min-height:190px;padding:32px 40px;gap:30px;position:relative;}
.hero-text h1{font-size:1.9rem;color:var(--text);font-weight:900;margin-bottom:8px;}
.hero-text p{font-size:.92rem;color:var(--gray);line-height:1.7;font-weight:700;max-width:520px;}
.age-badge{background:var(--primary-light);color:var(--primary);padding:8px 14px;border-radius:16px;font-weight:800;font-size:.85rem;display:inline-flex;align-items:center;gap:8px;margin-top:12px;}
.hero-decoration{position:relative;width:140px;min-width:140px;height:140px;display:flex;align-items:center;justify-content:center;}
.hero-circle{position:absolute;border-radius:50%;opacity:.15;}
.c1{width:120px;height:120px;background:var(--primary);}
.c2{width:80px;height:80px;background:var(--secondary);top:10px;right:10px;}
.c3{width:50px;height:50px;background:var(--primary);bottom:10px;left:10px;}

/* Section card */
.section-card{background:white;border-radius:var(--radius);padding:24px;border:1px solid #fdf2f5;box-shadow:var(--shadow);margin-bottom:26px;}
.section-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;}
.section-header h3{font-size:1.05rem;font-weight:800;display:flex;align-items:center;gap:10px;}
.card-icon{width:34px;height:34px;border-radius:10px;background:var(--primary-light);color:var(--primary);display:flex;justify-content:center;align-items:center;font-size:.95rem;min-width:34px;}
.add-child-btn{background:var(--primary);color:white;border:none;padding:8px 16px;border-radius:12px;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:7px;transition:.3s;font-family:'Cairo','Poppins',sans-serif;font-size:.82rem;}
.add-child-btn:hover{background:#c27a8c;transform:translateY(-1px);}
.children-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;}
.child-card{background:#fafafa;border-radius:18px;padding:16px;border:1px solid #f0f0f0;cursor:pointer;transition:.3s;display:flex;align-items:center;gap:12px;position:relative;overflow:hidden;}
.child-card:hover{background:white;border-color:var(--secondary);box-shadow:var(--shadow-hover);transform:translateY(-2px);}
.child-avatar{font-size:2.6rem;min-width:48px;text-align:center;}
.child-info{flex:1;min-width:0;}
.child-info h4{font-size:.95rem;font-weight:800;margin-bottom:2px;}
.child-age{font-size:.78rem;color:var(--primary);font-weight:800;}
.child-stats{display:flex;gap:8px;margin-top:4px;flex-wrap:wrap;}
.child-stats span{font-size:.72rem;color:var(--gray);font-weight:700;display:flex;align-items:center;gap:4px;}
.child-arrow{color:#ddd;font-size:.88rem;}
.child-card-bg{position:absolute;bottom:-20px;right:-20px;width:80px;height:80px;border-radius:50%;background:var(--primary-light);opacity:.5;}
.empty-children{text-align:center;padding:28px 20px;color:var(--gray);}
.empty-children span{display:block;margin-bottom:10px;}
.empty-children p{font-weight:700;font-size:.9rem;}

/* Dashboard grid */
.dashboard-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:26px;}
@media(max-width:900px){
  .dashboard-grid{grid-template-columns:1fr!important;}
  .card-timeline{grid-column:span 1!important;}
  .card-appointments{grid-column:span 1!important;}
  .card{width:100%!important;max-width:100%!important;overflow:hidden!important;}
  .mood-selector{gap:4px;}
  .mood-item{padding:8px 4px;}
  .mood-item span{font-size:1.5rem;}
  .mood-item p{font-size:.68rem;}
}
.card{background:white;border-radius:var(--radius);padding:20px;border:1px solid #fdf2f5;box-shadow:var(--shadow);}
.card-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;}
.card-header h3{font-size:.95rem;font-weight:800;display:flex;align-items:center;gap:9px;}
.card-action-btn{background:var(--primary-light);color:var(--primary);border:none;width:28px;height:28px;border-radius:8px;cursor:pointer;font-size:.85rem;transition:.3s;}
.card-action-btn:hover{background:var(--primary);color:white;}
.card-timeline{grid-column:span 3;}
.card-appointments{grid-column:span 2;}

/* Timeline 12 months */
.current-age-badge{background:var(--primary-light);color:var(--primary);padding:4px 10px;border-radius:20px;font-size:.75rem;font-weight:800;display:flex;align-items:center;gap:5px;}
.timeline-scroll-outer{overflow-x:auto;padding-bottom:6px;}
.timeline-track{display:flex;justify-content:space-between;align-items:flex-start;position:relative;padding:20px 10px;min-width:700px;}
.timeline-line{position:absolute;top:35px;left:10px;right:10px;height:4px;background:#f4f4f4;z-index:1;}
.timeline-fill{position:absolute;top:35px;left:10px;height:4px;background:var(--secondary);z-index:2;transition:.8s;}
.timeline-step{position:relative;z-index:3;display:flex;flex-direction:column;align-items:center;cursor:pointer;transition:.3s;flex:1;}
.step-circle{width:36px;height:36px;border-radius:50%;background:white;border:3px solid #eee;display:flex;align-items:center;justify-content:center;font-weight:800;color:#bbb;transition:.3s;font-size:.78rem;}
.timeline-step.active .step-circle{border-color:var(--primary);background:var(--primary-light);color:var(--primary);box-shadow:0 0 14px rgba(214,139,157,.35);transform:scale(1.1);}
.timeline-step.current .step-circle{border-color:var(--primary);background:var(--primary);color:white;box-shadow:0 0 18px rgba(214,139,157,.5);transform:scale(1.2);animation:pulse 2s infinite;}
.timeline-step.completed .step-circle{border-color:var(--secondary);background:#fff8fa;color:var(--secondary);}
.step-label{margin-top:8px;font-size:.7rem;font-weight:800;color:var(--gray);text-align:center;}
.timeline-step.current .step-label{color:var(--primary);font-weight:900;}

.milestone-info{background:var(--primary-light);border-radius:14px;padding:16px 20px;margin-top:14px;border-inline-start:4px solid var(--secondary);animation:fadeUp .4s ease;}
.milestone-current{border-inline-start-color:var(--primary);background:linear-gradient(135deg,#fdf2f5,#fff8fa);}
.milestone-info-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;}
.milestone-info h4{color:var(--primary);font-size:.9rem;font-weight:900;}
.milestone-now-badge{background:var(--primary);color:white;padding:3px 10px;border-radius:12px;font-size:.7rem;font-weight:800;}
.milestone-info ul{padding-inline-start:18px;color:var(--gray);font-size:.83rem;line-height:1.8;}

/* Mood */
.mood-selector{display:flex;justify-content:space-around;gap:6px;}
.mood-item{text-align:center;cursor:pointer;transition:.3s;padding:10px 6px;border-radius:14px;flex:1;border:2px solid transparent;background:#fafafa;}
.mood-item span{display:block;font-size:1.8rem;filter:grayscale(100%);transition:.3s;}
.mood-item p{font-size:.75rem;font-weight:800;color:var(--gray);margin-top:6px;}
.mood-item:hover,.mood-item.active{background:white;border-color:var(--secondary);box-shadow:0 5px 15px rgba(234,184,198,.2);}
.mood-item:hover span,.mood-item.active span{filter:grayscale(0%);transform:scale(1.12);}
.mood-item.active p{color:var(--primary);}
.mood-message{text-align:center;margin-top:12px;font-weight:800;color:var(--primary);font-size:.85rem;}

/* Appointments */
.appointment-list{list-style:none;}
.appt-item{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #f5f5f5;}
.appt-item:last-child{border-bottom:none;}
.appt-date{background:var(--primary-light);padding:7px 10px;border-radius:10px;text-align:center;color:var(--primary);min-width:48px;}
.appt-date span{display:block;font-weight:900;font-size:1rem;line-height:1;}
.appt-date small{font-size:.68rem;font-weight:800;}
.appt-info{flex:1;}
.appt-info h4{font-size:.85rem;font-weight:800;margin-bottom:2px;}
.appt-info p{font-size:.72rem;color:var(--gray);font-weight:700;}
.appt-status{font-size:.7rem;font-weight:800;padding:3px 8px;border-radius:20px;}
.status-pending{background:#fff8f0;color:#f39c12;}
.status-confirmed{background:#f0faf4;color:#2ecc71;}
.status-cancelled{background:#fef0f0;color:#e74c3c;}
.status-completed{background:#f0f0f0;color:#888;}
.empty-state{text-align:center;padding:18px;color:var(--gray);}
.empty-state p{font-size:.85rem;font-weight:700;margin-top:8px;}

/* Todo */
.todo-add-row{display:flex;gap:8px;margin-bottom:10px;align-items:center;}
.todo-input{flex:1;padding:9px 12px;border-radius:10px;border:1px solid #eee;outline:none;font-family:'Cairo','Poppins',sans-serif;font-size:.85rem;}
.todo-input:focus{border-color:var(--secondary);box-shadow:0 0 0 3px var(--primary-light);}
.btn-primary-sm{background:var(--primary);color:white;border:none;padding:8px 12px;border-radius:10px;cursor:pointer;transition:.3s;}
.btn-primary-sm:hover{background:#c27a8c;}
.btn-ghost-sm{background:#f4f4f4;color:var(--gray);border:none;padding:8px 12px;border-radius:10px;cursor:pointer;transition:.3s;}
.btn-ghost-sm:hover{color:#e74c3c;}
.todo-list{list-style:none;}
.todo-item{display:flex;align-items:center;gap:10px;padding:10px;background:#fafafa;border-radius:11px;margin-bottom:8px;border:1px solid transparent;transition:.3s;}
.todo-item:hover{background:white;border-color:var(--primary-light);}
.todo-check{width:22px;height:22px;border-radius:6px;border:2px solid var(--secondary);display:flex;justify-content:center;align-items:center;color:transparent;transition:.3s;cursor:pointer;min-width:22px;font-size:.68rem;}
.todo-item.completed .todo-check{background:var(--primary);border-color:var(--primary);color:white;}
.todo-text{flex:1;font-weight:700;font-size:.88rem;transition:.3s;}
.todo-item.completed .todo-text{text-decoration:line-through;color:#bbb;}
.todo-delete{background:none;border:none;color:#ddd;cursor:pointer;font-size:.78rem;transition:.3s;padding:4px;border-radius:6px;}
.todo-delete:hover{color:#e74c3c;background:#fef0f0;}

/* Quick Stats */
.stats-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.stat-item{display:flex;align-items:center;gap:10px;padding:11px;background:#fafafa;border-radius:14px;border:1px solid #f0f0f0;}
.stat-icon{width:38px;height:38px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1rem;min-width:38px;}
.stat-value{font-size:1.3rem;font-weight:900;line-height:1;}
.stat-label{font-size:.72rem;color:var(--gray);font-weight:700;margin-top:2px;}

/* ── ARTICLES SECTION ── */
.articles-section{background:white;border-radius:var(--radius);padding:28px;border:1px solid #fdf2f5;box-shadow:var(--shadow);margin-bottom:26px;}
.articles-section-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;}
.articles-section-header h2{font-size:1.2rem;font-weight:900;display:flex;align-items:center;gap:10px;}
.articles-section-header h2 i{color:var(--primary);}
.articles-section-header p{color:var(--gray);font-size:.82rem;font-weight:700;margin-top:4px;}
.category-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;overflow-x:auto;padding-bottom:4px;}
.cat-tab{background:#f4f4f4;border:none;padding:7px 16px;border-radius:25px;font-family:'Cairo','Poppins',sans-serif;font-weight:800;font-size:.78rem;cursor:pointer;transition:.3s;color:var(--gray);white-space:nowrap;}
.cat-tab:hover{background:var(--primary-light);color:var(--primary);}
.cat-tab.active{background:var(--primary);color:white;}
.articles-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:18px;}
.articles-empty{text-align:center;padding:40px;color:var(--gray);}
.articles-empty span{font-size:3rem;display:block;margin-bottom:12px;}
.articles-empty p{font-weight:700;}

/* Article card */
.article-card{background:#fafafa;border-radius:18px;border:1px solid #f0f0f0;overflow:hidden;transition:.3s;}
.article-card:hover{box-shadow:var(--shadow-hover);transform:translateY(-3px);background:white;}
.article-card-body{padding:18px 18px 10px;}
.article-doctor-row{display:flex;align-items:center;gap:8px;margin-bottom:10px;font-size:.75rem;color:var(--gray);font-weight:700;}
.article-doctor-avatar{width:28px;height:28px;border-radius:50%;object-fit:cover;}
.article-doctor-init{width:28px;height:28px;border-radius:50%;background:var(--primary-light);color:var(--primary);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.75rem;}
.article-date-dot{color:#ddd;}
.article-date-text{color:#aaa;}
.article-title{font-size:.95rem;font-weight:800;margin-bottom:8px;line-height:1.4;}
.article-excerpt{font-size:.8rem;color:var(--gray);line-height:1.6;}
.article-rating-row{padding:8px 18px;display:flex;align-items:center;gap:4px;}
.article-avg-rating{font-size:.75rem;font-weight:800;color:#f1c40f;margin-inline-start:4px;}
.article-actions{display:flex;align-items:center;gap:6px;padding:8px 12px 12px;border-top:1px solid #f0f0f0;}
.art-action-btn{display:flex;align-items:center;gap:5px;background:#f4f4f4;border:none;padding:6px 12px;border-radius:20px;font-family:'Cairo','Poppins',sans-serif;font-size:.75rem;font-weight:800;cursor:pointer;color:var(--gray);transition:.3s;}
.art-action-btn:hover{background:var(--primary-light);color:var(--primary);}
.art-action-btn.art-saved{background:var(--primary-light);color:var(--primary);}
.art-read-btn{margin-inline-start:auto;background:var(--primary-light);color:var(--primary);}
.art-read-btn:hover{background:var(--primary);color:white;}
.article-comments-panel{border-top:1px solid #f0f0f0;padding:14px 16px;}
.no-comments{text-align:center;font-size:.8rem;color:#bbb;padding:8px 0;font-weight:700;}
.comment-row{display:flex;gap:10px;margin-bottom:10px;}
.comment-avatar{min-width:32px;}
.comment-avatar img,.comment-avatar div{width:32px;height:32px;border-radius:50%;object-fit:cover;}
.comment-avatar div{background:var(--primary-light);color:var(--primary);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.8rem;}
.comment-body strong{font-size:.8rem;font-weight:800;}
.comment-body p{font-size:.8rem;color:var(--gray);margin-top:3px;}
.comment-input-row{display:flex;gap:8px;margin-top:10px;}
.comment-input{flex:1;padding:8px 12px;border-radius:10px;border:1px solid #eee;outline:none;font-family:'Cairo','Poppins',sans-serif;font-size:.83rem;}
.comment-input:focus{border-color:var(--secondary);box-shadow:0 0 0 3px var(--primary-light);}
.comment-submit-btn{background:var(--primary);color:white;border:none;padding:8px 12px;border-radius:10px;cursor:pointer;transition:.3s;}
.comment-submit-btn:hover{background:#c27a8c;}
.login-to-comment{text-align:center;font-size:.8rem;color:#aaa;font-weight:700;margin-top:8px;}

/* Tip */
.tip-card{background:white;border-radius:var(--radius);padding:22px;border:1px solid var(--primary-light);display:flex;align-items:center;gap:20px;margin-bottom:28px;box-shadow:var(--shadow);}
.tip-icon{width:56px;height:56px;min-width:56px;border-radius:50%;background:white;border:2px solid var(--secondary);display:flex;align-items:center;justify-content:center;color:var(--secondary);font-size:1.5rem;}
.tip-content h3{font-size:1rem;font-weight:800;margin-bottom:5px;}
.tip-content p{color:var(--gray);line-height:1.6;font-weight:700;font-size:.88rem;}

/* Modal */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(4px);display:flex;justify-content:center;align-items:center;z-index:3000;padding:15px;}
.modal-box{background:white;width:100%;max-width:470px;border-radius:25px;padding:32px;box-shadow:0 20px 50px rgba(0,0,0,.15);max-height:90vh;overflow-y:auto;}
.modal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;}
.modal-head h2{font-size:1.3rem;font-weight:900;}
.modal-head button{background:none;border:none;font-size:1.4rem;color:var(--gray);cursor:pointer;transition:.3s;}
.modal-head button:hover{color:#e74c3c;transform:rotate(90deg);}
.modal-fields{display:flex;flex-direction:column;gap:14px;margin-bottom:16px;}
.modal-field{display:flex;flex-direction:column;gap:6px;}
.modal-field label{font-size:.85rem;font-weight:800;}
.modal-input{width:100%;padding:10px 13px;border-radius:12px;border:1px solid #ddd;outline:none;font-family:'Cairo','Poppins',sans-serif;font-size:.85rem;background:#fafafa;transition:.3s;}
.modal-input:focus{border-color:var(--secondary);background:white;box-shadow:0 0 0 3px var(--primary-light);}
.record-type-tabs{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;}
.type-tab{background:#f4f4f4;border:none;padding:7px 13px;border-radius:10px;font-family:'Cairo','Poppins',sans-serif;font-weight:800;font-size:.8rem;cursor:pointer;transition:.3s;color:var(--gray);}
.type-tab.active{background:var(--primary-light);color:var(--primary);}
.modal-save-btn{width:100%;justify-content:center;margin-top:4px;}

/* Chat */
.chat-window{position:fixed;bottom:110px;right:30px;width:310px;max-width:90%;height:410px;background:white;border-radius:20px;box-shadow:0 15px 40px rgba(0,0,0,.15);display:flex;flex-direction:column;z-index:1500;overflow:hidden;border:1px solid var(--primary-light);}
[dir=rtl] .chat-window{right:auto;left:30px;}
.chat-header{background:var(--secondary);color:white;padding:13px 16px;font-weight:800;display:flex;justify-content:space-between;align-items:center;font-size:.9rem;}
.chat-header i{cursor:pointer;}
.chat-body{flex:1;padding:14px;overflow-y:auto;background:#fafafa;display:flex;flex-direction:column;gap:10px;}
.chat-user-msg{align-self:flex-end;background:var(--primary);color:white;padding:9px 13px;border-radius:14px 14px 4px 14px;font-size:.82rem;max-width:80%;font-weight:700;}
.chat-ai-msg{align-self:flex-start;background:white;color:var(--text);padding:9px 13px;border-radius:14px 14px 14px 4px;font-size:.82rem;max-width:85%;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,.06);}
.chat-typing{display:flex;gap:5px;align-items:center;}
.chat-typing span{width:7px;height:7px;border-radius:50%;background:var(--secondary);animation:bounce .9s infinite;}
.chat-typing span:nth-child(2){animation-delay:.2s}
.chat-typing span:nth-child(3){animation-delay:.4s}
.chat-input-row{padding:10px;border-top:1px solid #eee;display:flex;gap:8px;background:white;}
.chat-input-row input{flex:1;padding:8px 12px;border-radius:18px;border:1px solid #ddd;outline:none;font-size:.83rem;font-family:'Cairo','Poppins',sans-serif;}
.chat-input-row button{background:var(--primary);color:white;border:none;width:34px;height:34px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.3s;}
.chat-input-row button:hover{background:#c27a8c;}
.ai-fab{position:fixed;bottom:30px;right:30px;width:60px;height:60px;background:var(--primary);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:1.5rem;cursor:pointer;box-shadow:0 10px 25px rgba(214,139,157,.4);border:none;z-index:1501;transition:.3s;animation:pulse 2s infinite;}
[dir=rtl] .ai-fab{right:auto;left:30px;}
.ai-fab:hover{transform:scale(1.1);background:#c27a8c;animation:none;}

/* Loading */
.dash-loading{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg);}
.dash-spinner{width:40px;height:40px;border-radius:50%;border:4px solid #fdf2f5;border-top-color:var(--primary);animation:spin .8s linear infinite;margin-bottom:14px;}

/* Responsive */
@media(max-width:1200px){
  .desktop-nav{display:none!important;}
  .desktop-only{display:none!important;}
  .mobile-only{display:flex!important;}
  .master-header{padding:0 20px;height:70px;}
  .main-content{padding:90px 18px 35px;}
}
@media(max-width:768px){
.card { padding: 14px; }
.mood-selector { gap: 3px; }
.mood-item { padding: 7px 3px; }
.mood-item span { font-size: 1.4rem; }
.mood-item p { font-size: .65rem; }
.stats-grid { grid-template-columns: 1fr 1fr; }
.main-content { padding: 90px 12px 35px; }

  .page-header{flex-direction:column;align-items:flex-start;}
  .header-actions{width:100%;align-items:flex-start;}
  .action-btns{width:100%;}
  .action-btns button{flex:1;justify-content:center;}
  .hero-card{flex-direction:column;padding:22px 18px;}
  .hero-decoration{display:none;}
  .dashboard-grid{grid-template-columns:1fr;gap:14px;}
  .card-timeline,.card-appointments{grid-column:span 1!important;}
  .children-grid{grid-template-columns:1fr;}
  .articles-grid{grid-template-columns:1fr;}
  .tip-card{flex-direction:column;text-align:center;}
  .chat-window{width:92%;right:4%;left:auto;}
  [dir=rtl] .chat-window{left:4%;right:auto;}
}
  .cart-badge-nav {
  position: absolute; top: -4px; right: -4px;
  background: var(--primary); color: white;
  width: 16px; height: 16px; border-radius: 50%;
  font-size: .6rem; fontWeight: 800;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid white;
}
.shop-section {
  margin-top: 20px;
  padding: 20px;
}

.stores-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
  margin-top: 10px;
}

.store-card {
  background: white;
  border-radius: 16px;
  padding: 12px;
  box-shadow: var(--shadow);
  text-align: center;
  transition: 0.3s;
  cursor: pointer;
}

.store-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-hover);
}

.store-card img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 12px;
  margin-bottom: 8px;
}

.store-card h4 {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text);
}
 .view-all-btn{
  border:none;
  background:var(--primary-light);
  color:var(--primary);
  padding:10px 16px;
  border-radius:12px;
  font-weight:800;
  cursor:pointer;
  transition:.3s;
}

.view-all-btn:hover{
  background:var(--primary);
  color:white;
  transform:translateY(-2px);
} 

/* Development Map: multi-child stacking */
.card-timeline {
  grid-column: span 3;
}
/* زر Full View */
.ms-view-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--primary);
  color: white;
  border: none;
  padding: 7px 14px;
  border-radius: 10px;
  font-family: 'Cairo','Poppins',sans-serif;
  font-weight: 800;
  font-size: .78rem;
  cursor: pointer;
  transition: .3s;
}
.ms-view-btn:hover { background: #c27a8c; }

/* رابط التفاصيل */
.ms-detail-link {
  background: none;
  border: none;
  color: var(--primary);
  font-family: 'Cairo','Poppins',sans-serif;
  font-weight: 800;
  font-size: .78rem;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}
.ms-detail-link:hover { color: #c27a8c; }

/* تعديل RTL للـ timeline-fill */
[dir=rtl] .timeline-fill {
  left: auto;
  right: 10px;
}
[dir=rtl] .timeline-line {
  left: 10px;
  right: 10px;
}
/* حجم صور الأطفال في الدوائر */
.step-circle img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}
/* Responsive: إخفاء grid-column على الموبايل */
@media (max-width: 768px) {
  .card-timeline { grid-column: span 1 !important; }
}
/* ═════════════════════════════════════
   TIMELINE PHOTO
═════════════════════════════════════ */

.timeline-photo{
  width:100%;
  height:100%;
  object-fit:cover;
  border-radius:50%;
  cursor:pointer;
  transition:.25s;
}

.timeline-photo:hover{
  transform:scale(1.08);
}

/* ═════════════════════════════════════
   FULLSCREEN IMAGE PREVIEW
═════════════════════════════════════ */

.fullscreen-preview{
  position:fixed;
  inset:0;
  width:100vw;
  height:100vh;

  background:rgba(0,0,0,.88);
  backdrop-filter:blur(10px);

  display:flex;
  align-items:center;
  justify-content:center;

  z-index:999999999;

  animation:previewFade .25s ease;
}

.fullscreen-preview-img{
  max-width:92vw;
  max-height:92vh;

  object-fit:contain;

  border-radius:24px;

  box-shadow:
    0 30px 80px rgba(0,0,0,.6),
    0 0 0 1px rgba(255,255,255,.08);

  animation:previewZoom .25s ease;
}

.fullscreen-preview-close{
  position:fixed;
  top:24px;
  right:24px;

  width:56px;
  height:56px;

  border:none;
  border-radius:50%;

  background:white;
  color:#111;

  font-size:1.2rem;
  cursor:pointer;

  display:flex;
  align-items:center;
  justify-content:center;

  box-shadow:0 10px 30px rgba(0,0,0,.35);

  transition:.2s;
}

.fullscreen-preview-close:hover{
  transform:scale(1.08) rotate(90deg);
}

@keyframes previewFade{
  from{
    opacity:0;
  }
  to{
    opacity:1;
  }
}

@keyframes previewZoom{
  from{
    transform:scale(.85);
    opacity:0;
  }
  to{
    transform:scale(1);
    opacity:1;
  }
}
 .noti-dropdown-header{
  padding:14px 16px;
  font-weight:800;
  border-bottom:1px solid #f0f0f0;
  display:flex;
  justify-content:space-between;
  align-items:center;
}
.noti-mark-all-btn{
  background:none;
  border:none;
  color:var(--primary);
  font-size:.72rem;
  font-weight:700;
  cursor:pointer;
  font-family:inherit;
  padding:4px 8px;
  border-radius:8px;
  transition:.2s;
}
.noti-mark-all-btn:hover{
  background:var(--primary-light);
}
.noti-item{
  padding:12px 16px;
  border-bottom:1px solid #f9f9f9;
  transition:.2s;
  cursor:pointer;
  display:flex;
  align-items:flex-start;
  gap:10px;
}
.noti-item:hover{background:#fafafa;}
.noti-unread{background:var(--primary-light);}
.noti-item-icon{
  font-size:1.2rem;
  min-width:28px;
  text-align:center;
  margin-top:2px;
}
.noti-item-body{flex:1;}
.noti-item-body p{
  font-size:.83rem;
  font-weight:700;
  margin-bottom:3px;
  line-height:1.4;
}
.noti-item-body small{
  font-size:.72rem;
  color:var(--gray);
}
.noti-unread-dot{
  width:8px;
  height:8px;
  background:var(--primary);
  border-radius:50%;
  margin-top:5px;
  flex-shrink:0;
}
.noti-empty{
  padding:30px 20px;
  text-align:center;
  color:var(--gray);
}
.noti-empty i{
  font-size:2rem;
  display:block;
  margin-bottom:10px;
  color:#ddd;
}
.noti-empty p{
  font-size:.88rem;
  font-weight:600;
} 
 /* ── Doctor Videos Section ── */
.mc-videos-section {
  padding: 3rem 1rem;
  background: #FBF9F8;
  text-align: center;
}
.mc-section-eyebrow {
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #e89cae;
  margin-bottom: 0.4rem;
}
.mc-section-sub {
  color: #888;
  font-size: 0.93rem;
  max-width: 540px;
  margin: 0.3rem auto 2rem;
  line-height: 1.7;
}
.mc-video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px,1fr));
  gap: 1.4rem;
  max-width: 960px;
  margin: 0 auto;
}
.mc-video-card {
  background: #fff;
  border-radius: 18px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 4px 18px rgba(232,156,174,0.12);
  transition: transform 0.4s, box-shadow 0.4s;
}
.mc-video-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 18px 46px rgba(232,156,174,0.25);
}
.mc-video-thumb {
  position: relative;
  aspect-ratio: 16/9;
  background-size: cover;
  background-position: center;
  overflow: hidden;
}
.mc-video-overlay {
  position: absolute; inset: 0;
  background: rgba(232,156,174,0.52);
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity 0.3s;
}
.mc-video-card:hover .mc-video-overlay { opacity: 1; }
.mc-play-ripple {
  width: 60px; height: 60px; border-radius: 50%;
  background: rgba(255,255,255,0.2);
  display: flex; align-items: center; justify-content: center;
  animation: mc-ripple 1.6s ease-in-out infinite;
}
@keyframes mc-ripple {
  0%   { box-shadow: 0 0 0 0 rgba(255,255,255,0.5); }
  70%  { box-shadow: 0 0 0 18px rgba(255,255,255,0); }
  100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
}
.mc-play-inner {
  width: 46px; height: 46px; background: #fff; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}
.mc-play-inner i { color: #e89cae; font-size: 17px; }
.mc-video-tag {
  position: absolute; top: 0.7rem; inset-inline-start: 0.7rem;
  background: #e89cae; color: #fff;
  font-size: 0.68rem; padding: 3px 10px; border-radius: 20px; font-weight: 500;
}
.mc-video-meta {
  padding: 0.9rem 1.1rem;
  display: flex; align-items: center; gap: 0.7rem; text-align: start;
}
.mc-doc-avatar {
  width: 38px; height: 38px; border-radius: 50%;
  background: #F4E4DF; color: #e89cae;
  font-weight: 700; font-size: 1rem;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.mc-doc-name { font-weight: 600; font-size: 0.9rem; color: #4A3F3D; }
.mc-doc-spec { font-size: 0.76rem; color: #888; margin-top: 2px; }
.mc-modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(30,10,18,0.82); backdrop-filter: blur(8px);
  z-index: 9999; display: flex; align-items: center; justify-content: center;
  padding: 1rem;
}
.mc-modal {
  background: #fff; border-radius: 22px; padding: 1.5rem;
  max-width: 620px; width: 100%; position: relative;
}
.mc-modal-close {
  position: absolute; top: 0.9rem; inset-inline-end: 0.9rem;
  background: #F4E4DF; border: none; width: 34px; height: 34px; border-radius: 50%;
  cursor: pointer; color: #e89cae; display: flex; align-items: center; justify-content: center;
}
.mc-modal-close:hover { background: #eab8c6; color: #fff; }
.mc-modal-name { font-size: 1.1rem; font-weight: 600; color: #e89cae; margin-bottom: 0.5rem; }
.mc-modal-placeholder {
  aspect-ratio: 16/9; background: #FBF9F8; border-radius: 14px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 0.75rem; color: #888;
}
.mc-modal-placeholder i { font-size: 2.8rem; color: #eab8c6; } 
/* داخل DASHBOARD_CSS — أضيفي في النهاية */
.dv-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(30,10,18,0.82);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  animation: dv-fade 0.22s ease;
}
@keyframes dv-fade { from { opacity: 0; } to { opacity: 1; } }

.dv-modal-box {
  background: #fff;
  border-radius: 22px;
  padding: 1.5rem;
  max-width: 760px;
  width: 95vw;
  position: relative;
  animation: dv-slide-up 0.32s cubic-bezier(0.34,1.56,0.64,1);
}
@keyframes dv-slide-up {
  from { transform: translateY(40px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}
.dv-modal-close-btn {
  position: absolute;
  top: 0.9rem;
  inset-inline-end: 0.9rem;
  background: #F4E4DF;
  border: none;
  width: 34px; height: 34px;
  border-radius: 50%;
  cursor: pointer;
  color: #e89cae;
  font-size: 0.88rem;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.2s;
}
.dv-modal-close-btn:hover { background: #eab8c6; color: #fff; }
.dv-modal-doctor-name { font-size: 1.15rem; font-weight: 600; color: #e89cae; margin-bottom: 0.5rem; }
.dv-modal-title { color: #aaa; font-size: 0.88rem; margin-bottom: 16px; font-weight: 600; }
.dv-video-player {
  width: 100%; border-radius: 12px;
  height: 380px; background: #000; display: block;
}
.dv-modal-placeholder {
  aspect-ratio: 16/9;
  background: #FBF9F8;
  border-radius: 14px;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 0.75rem; color: #888;
}
.dv-modal-placeholder i { font-size: 2.8rem; color: #eab8c6; }
.dv-modal-placeholder p { font-size: 0.88rem; }
.dv-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  padding: 8px 20px 16px;
  max-width: 1200px;
  margin: 0 auto;
}
@media (min-width: 640px) { .dv-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .dv-grid { grid-template-columns: repeat(3, 1fr); } }
.dv-duration {
  position: absolute;
  bottom: 10px; left: 10px;
  background: rgba(0,0,0,0.6);
  color: #fff;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.75rem; font-weight: 700;
}
.dv-interview-title { font-size: 0.72rem; color: #aaa; margin-top: 2px; font-weight: 600; }
.dv-loading { text-align: center; padding: 60px; }
.dv-spinner {
  width: 44px; height: 44px;
  border: 4px solid #fdf2f5;
  border-top-color: #eab8c6;
  border-radius: 50%;
  animation: dv-spin 0.8s linear infinite;
  margin: 0 auto;
}
@keyframes dv-spin { to { transform: rotate(360deg); } }
.dv-empty { text-align: center; padding: 60px 20px; color: #ccc; }
.dv-empty i { font-size: 3rem; display: block; margin-bottom: 14px; color: #eab8c6; }
.dv-empty p { font-size: 1rem; font-weight: 700; color: #aaa; margin-bottom: 6px; }
.dv-empty span { font-size: 0.82rem; color: #ccc; }
`;
// ─── Personalized Recommendations Widget ──────────────────────
const PersonalizedRecsWidget = ({ isAr, children, myUserId, navigate }) => {
  const [recs,    setRecs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [myLikes, setMyLikes] = useState(new Set());
  const [mySaves, setMySaves] = useState(new Set());

  // حساب العمر بالأشهر
  const ageInMonths = (birthDate) => {
    if (!birthDate) return 0;
    const birth = new Date(birthDate);
    const now = new Date();
    return (now.getFullYear() - birth.getFullYear()) * 12
      + now.getMonth() - birth.getMonth();
  };

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        // نطاق عمر الأطفال
        const ages  = children.map(c => ageInMonths(c.birth_date));
        const minAge = Math.max(0, Math.min(...ages) - 2);
        const maxAge = Math.max(...ages) + 2;

        const { data } = await supabase
          .from("doctor_recommendations")
          .select(`
            id, title, description, target_age_min, target_age_max,
            cover_image, status, created_at,
            doctor_profiles!doctor_recommendations_doctor_id_fkey(
              doctor_id, specialization,
              users!doctor_profiles_doctor_id_fkey(name, avatar_url)
            ),
            recommendation_products(
              id, usage_instructions, duration_days, notes,
              is_alternative, sort_order,
              products(
                product_id, name, price, image_url, stock,
                stores(store_id, store_name, logo)
              )
            ),
            recommendation_tags(tags(name)),
            recommendation_likes(id, user_id),
            recommendation_comments(comment_id, is_deleted),
            saved_recommendations(id, user_id)
          `)
          .eq("status", "published")
          .lte("target_age_min", maxAge)
          .gte("target_age_max", minAge)
          .order("created_at", { ascending: false })
          .limit(3);

        setRecs(data || []);

        if (myUserId && data) {
          setMyLikes(new Set(
            data.filter(r =>
              (r.recommendation_likes || []).some(l => l.user_id === myUserId)
            ).map(r => r.id)
          ));
          setMySaves(new Set(
            data.filter(r =>
              (r.saved_recommendations || []).some(s => s.user_id === myUserId)
            ).map(r => r.id)
          ));
        }
      } catch (e) {
        console.error("PersonalizedRecsWidget:", e.message);
      }
      setLoading(false);
    };
    fetch();
  }, [children, myUserId]);

  const toggleLike = async (recId) => {
    if (!myUserId) return;
    if (myLikes.has(recId)) {
      await supabase.from("recommendation_likes").delete()
        .eq("recommendation_id", recId).eq("user_id", myUserId);
      setMyLikes(p => { const n = new Set(p); n.delete(recId); return n; });
    } else {
      await supabase.from("recommendation_likes")
        .insert({ recommendation_id: recId, user_id: myUserId });
      setMyLikes(p => new Set([...p, recId]));
    }
  };

  const toggleSave = async (recId) => {
    if (!myUserId) return;
    if (mySaves.has(recId)) {
      await supabase.from("saved_recommendations").delete()
        .eq("recommendation_id", recId).eq("user_id", myUserId);
      setMySaves(p => { const n = new Set(p); n.delete(recId); return n; });
    } else {
      await supabase.from("saved_recommendations")
        .insert({ recommendation_id: recId, user_id: myUserId });
      setMySaves(p => new Set([...p, recId]));
    }
  };

  const addToCart = async (productId) => {
    if (!myUserId) return;
    let { data: cart } = await supabase.from("cart")
      .select("cart_id").eq("user_id", myUserId).maybeSingle();
    if (!cart) {
      const { data: nc } = await supabase.from("cart")
        .insert({ user_id: myUserId }).select().single();
      cart = nc;
    }
    const { data: ex } = await supabase.from("cart_items")
      .select("cart_item_id, quantity")
      .eq("cart_id", cart.cart_id).eq("product_id", productId).maybeSingle();
    if (ex) {
      await supabase.from("cart_items")
        .update({ quantity: ex.quantity + 1 }).eq("cart_item_id", ex.cart_item_id);
    } else {
      await supabase.from("cart_items")
        .insert({ cart_id: cart.cart_id, product_id: productId, quantity: 1 });
    }
  };

  if (loading) return (
    <section className="articles-section animate delay-3" style={{ marginBottom: 26 }}>
      <div style={{ textAlign: "center", padding: "30px 0" }}>
        <div className="dash-spinner" />
      </div>
    </section>
  );

  if (recs.length === 0) return null; // لا تعرض شيء لو ما في توصيات مناسبة

  // نص عمر الأطفال
  const ageInMonthsFn = (bd) => {
    if (!bd) return 0;
    const b = new Date(bd), n = new Date();
    return (n.getFullYear() - b.getFullYear()) * 12 + n.getMonth() - b.getMonth();
  };
  const agesText = children.map(c => {
    const m = ageInMonthsFn(c.birth_date);
    return isAr ? `${c.name} (${m} شهر)` : `${c.name} (${m} mo)`;
  }).join(" • ");

  return (
    <section className="articles-section animate delay-3" style={{ marginBottom: 26 }}>
      {/* Header */}
      <div className="articles-section-header">
        <div>
          <h2>
            <i className="fas fa-lightbulb" />
            {isAr ? " توصيات لطفلكِ" : " For Your Baby"}
          </h2>
          <p>{isAr ? `مخصصة لـ: ${agesText}` : `Matched to: ${agesText}`}</p>
        </div>
        <button
          className="view-all-btn"
          onClick={() => navigate("/recommendations")}
        >
          {isAr ? "عرض الكل ←" : "View All →"}
        </button>
      </div>

      {/* Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 16,
      }}>
        {recs.map(rec => {
          const doctor = rec.doctor_profiles?.users?.name || (isAr ? "طبيب" : "Doctor");
          const spec   = rec.doctor_profiles?.specialization || "";
          const avatar = rec.doctor_profiles?.users?.avatar_url;
          const tags   = rec.recommendation_tags?.map(t => t.tags?.name).filter(Boolean) || [];
          const likes  = rec.recommendation_likes?.length || 0;
          const comments = rec.recommendation_comments?.filter(c => !c.is_deleted).length || 0;
          const products = rec.recommendation_products || [];
          const liked  = myLikes.has(rec.id);
          const saved  = mySaves.has(rec.id);

          return (
            <div key={rec.id} style={{
              background: "white",
              borderRadius: 18,
              border: "1px solid #f0f0f0",
              boxShadow: "0 4px 16px rgba(0,0,0,.04)",
              overflow: "hidden",
              transition: ".25s",
            }}>
              {/* صورة الغلاف */}
              {rec.cover_image && (
                <div style={{
                  height: 130,
                  backgroundImage: `url(${rec.cover_image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }} />
              )}

              <div style={{ padding: "14px 16px" }}>
                {/* نطاق العمر */}
                <div style={{
                  display: "inline-block",
                  background: "#fdf2f5",
                  color: "#d68b9d",
                  fontSize: ".7rem",
                  fontWeight: 800,
                  padding: "3px 10px",
                  borderRadius: 20,
                  marginBottom: 8,
                }}>
                  <i className="fas fa-baby" style={{ marginInlineEnd: 4 }} />
                  {rec.target_age_min}–{rec.target_age_max} {isAr ? "شهر" : "mo"}
                </div>

                {/* العنوان */}
                <h4 style={{
                  fontSize: ".92rem",
                  fontWeight: 800,
                  color: "#2d2825",
                  marginBottom: 6,
                  lineHeight: 1.4,
                }}>
                  {rec.title}
                </h4>

                {/* الوصف */}
                {rec.description && (
                  <p style={{
                    fontSize: ".78rem",
                    color: "#888",
                    lineHeight: 1.5,
                    marginBottom: 10,
                  }}>
                    {rec.description.slice(0, 90)}{rec.description.length > 90 ? "…" : ""}
                  </p>
                )}

                {/* الطبيب */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                }}>
                  {avatar
                    ? <img src={avatar} alt="" style={{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover" }} />
                    : <div style={{
                        width: 26, height: 26, borderRadius: "50%",
                        background: "#fdf2f5", color: "#d68b9d",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: ".7rem", fontWeight: 800,
                      }}>{doctor.charAt(0)}</div>}
                  <div>
                    <div style={{ fontSize: ".75rem", fontWeight: 700, color: "#555" }}>{doctor}</div>
                    {spec && <div style={{ fontSize: ".65rem", color: "#aaa" }}>{spec}</div>}
                  </div>
                </div>

                {/* التاغات */}
                {tags.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
                    {tags.slice(0, 3).map((t, i) => (
                      <span key={i} style={{
                        background: "#f4f4f4", color: "#888",
                        fontSize: ".65rem", fontWeight: 700,
                        padding: "2px 8px", borderRadius: 10,
                      }}>#{t}</span>
                    ))}
                  </div>
                )}

                {/* المنتجات */}
                {products.length > 0 && (
                  <div style={{
                    background: "#f0faf4",
                    borderRadius: 10,
                    padding: "7px 10px",
                    fontSize: ".75rem",
                    color: "#1a6b5c",
                    fontWeight: 700,
                    marginBottom: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}>
                    <i className="fas fa-box" />
                    {products.length} {isAr ? "منتج موصى به" : "recommended products"}
                    <button
                      onClick={() => products.forEach(p => p.products?.product_id && addToCart(p.products.product_id))}
                      style={{
                        marginInlineStart: "auto",
                        background: "#1a6b5c",
                        color: "white",
                        border: "none",
                        padding: "3px 10px",
                        borderRadius: 8,
                        fontSize: ".68rem",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      <i className="fas fa-cart-plus" /> {isAr ? "إضافة للسلة" : "Add All"}
                    </button>
                  </div>
                )}

                {/* أزرار التفاعل */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  paddingTop: 10,
                  borderTop: "1px solid #f5f5f5",
                }}>
                  <button
                    onClick={() => toggleLike(rec.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 4,
                      background: liked ? "#fdf2f5" : "#f4f4f4",
                      color: liked ? "#d68b9d" : "#aaa",
                      border: "none", padding: "5px 10px", borderRadius: 20,
                      fontSize: ".72rem", fontWeight: 800, cursor: "pointer",
                    }}
                  >
                    <i className={`fa${liked ? "s" : "r"} fa-heart`} /> {likes}
                  </button>

                  <button
                    onClick={() => toggleSave(rec.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 4,
                      background: saved ? "#fdf2f5" : "#f4f4f4",
                      color: saved ? "#d68b9d" : "#aaa",
                      border: "none", padding: "5px 10px", borderRadius: 20,
                      fontSize: ".72rem", fontWeight: 800, cursor: "pointer",
                    }}
                  >
                    <i className={`fa${saved ? "s" : "r"} fa-bookmark`} />
                    {isAr ? (saved ? "محفوظ" : "حفظ") : (saved ? "Saved" : "Save")}
                  </button>

                  <span style={{ fontSize: ".72rem", color: "#bbb", marginInlineStart: 4 }}>
                    <i className="fas fa-comment" /> {comments}
                  </span>

                  <button
                    onClick={() => navigate("/recommendations")}
                    style={{
                      marginInlineStart: "auto",
                      background: "#fdf2f5",
                      color: "#d68b9d",
                      border: "none",
                      padding: "5px 12px",
                      borderRadius: 20,
                      fontSize: ".72rem",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    {isAr ? "التفاصيل ←" : "Details →"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
export default MotherDashboard;