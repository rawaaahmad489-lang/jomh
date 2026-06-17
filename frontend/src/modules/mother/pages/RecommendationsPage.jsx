// src/pages/mother/RecommendationsPage.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../../../services/supabaseClient";
import RecCard from "../../../components/recommendations/RecCard";
import UnifiedNavbar from "../../../components/UnifiedNavbar";

function ageInMonths(birthDate) {
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  const now   = new Date();
  return (now.getFullYear() - birth.getFullYear()) * 12
       + now.getMonth()   - birth.getMonth();
}

const REC_SELECT = `
  id, title, description, target_age_min, target_age_max,
  cover_image, video_url, media_urls, created_at, age_group, status,
  doctor_profiles!doctor_recommendations_doctor_id_fkey(
    doctor_id, specialization,
    users!doctor_profiles_doctor_id_fkey(name, avatar_url)
  ),
  recommendation_products(
    id, usage_instructions, duration_days, notes, is_alternative, sort_order,
    products(
      product_id, name, price, image_url, stock,
      stores(store_id, store_name, logo)
    )
  ),
  recommendation_tags(tags(name)),
  recommendation_likes(id, user_id),
  recommendation_comments(comment_id, is_deleted),
  saved_recommendations(id, user_id)
`;

export default function RecommendationsPage() {
  const { i18n } = useTranslation();
  const navigate  = useNavigate();
  const isAr = i18n.language === "ar";
  const dir  = isAr ? "rtl" : "ltr";

  const [userId,      setUserId]      = useState(null);
  const [children,    setChildren]    = useState([]);
  const [personal,    setPersonal]    = useState([]);
  const [general,     setGeneral]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [myLikes,     setMyLikes]     = useState(new Set());
  const [mySaves,     setMySaves]     = useState(new Set());
  const [activeTab,   setActiveTab]   = useState("personal"); // personal | all
  const [searchTerm,  setSearchTerm]  = useState("");

  // ── جلب المستخدم والأطفال ──────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: au } }) => {
      if (!au) { navigate("/login"); return; }
      const { data: u } = await supabase
        .from("users").select("user_id").eq("auth_id", au.id).single();
      if (!u) return;
      setUserId(u.user_id);

      const { data: kids } = await supabase
        .from("children").select("child_id, birth_date, name")
        .eq("mother_id", u.user_id);
      setChildren(kids || []);
    });
  }, [navigate]);

  // ── جلب التوصيات ────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (userId === null) return;
    setLoading(true);
    try {
      // كل التوصيات
      const { data: allData } = await supabase
        .from("doctor_recommendations")
        .select(REC_SELECT)
        .eq("status", "published")
        .order("created_at", { ascending: false });

      setGeneral(allData || []);

      // المخصصة لعمر الأطفال
      if (children.length > 0) {
        const ages   = children.map(c => ageInMonths(c.birth_date));
        const minAge = Math.max(0, Math.min(...ages) - 2);
        const maxAge = Math.max(...ages) + 2;

        const { data: pData } = await supabase
          .from("doctor_recommendations")
          .select(REC_SELECT)
          .eq("status", "published")
          .lte("target_age_min", maxAge)
          .gte("target_age_max", minAge)
          .order("created_at", { ascending: false });

        setPersonal(pData || []);
        if (!pData || pData.length === 0) setActiveTab("all");
      } else {
        setActiveTab("all");
      }

      // إعجابات وحفظ
      if (userId && allData) {
        setMyLikes(new Set(
          allData.filter(r =>
            (r.recommendation_likes || []).some(l => l.user_id === userId)
          ).map(r => r.id)
        ));
        setMySaves(new Set(
          allData.filter(r =>
            (r.saved_recommendations || []).some(s => s.user_id === userId)
          ).map(r => r.id)
        ));
      }
    } catch (e) {
      console.error("RecommendationsPage:", e.message);
    }
    setLoading(false);
  }, [userId, children]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── سلة ─────────────────────────────────────────────────────
  const addToCart = async (productId) => {
    if (!userId) { navigate("/login"); return; }
    let { data: cart } = await supabase.from("cart")
      .select("cart_id").eq("user_id", userId).maybeSingle();
    if (!cart) {
      const { data: nc } = await supabase.from("cart")
        .insert({ user_id: userId }).select().single();
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

  // ── إعجاب ────────────────────────────────────────────────────
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
    fetchAll();
  };

  // ── حفظ ──────────────────────────────────────────────────────
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

  // ── تعليق ────────────────────────────────────────────────────
  const addComment = async (recId, content) => {
    if (!userId || !content.trim()) return false;
    const { error } = await supabase.from("recommendation_comments")
      .insert({ recommendation_id: recId, user_id: userId, content: content.trim() });
    if (!error) fetchAll();
    return !error;
  };

  const cardProps = (rec) => ({
    rec, isAr,
    isLiked: myLikes.has(rec.id),
    isSaved: mySaves.has(rec.id),
    onLike:        () => toggleLike(rec.id),
    onSave:        () => toggleSave(rec.id),
    onAddToCart:   addToCart,
    onAddAllToCart: () =>
      (rec.recommendation_products || []).forEach(rp => {
        if (rp.products?.product_id) addToCart(rp.products.product_id);
      }),
    onComment: (c) => addComment(rec.id, c),
    myUserId: userId,
    compact: false,
  });

  // ── ما يُعرض ─────────────────────────────────────────────────
  const sourceList = activeTab === "personal" ? personal : general;
  const displayed  = searchTerm.trim()
    ? sourceList.filter(r =>
        r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : sourceList;

  const hasPersonal = personal.length > 0;

  // نص عمر الأطفال
  const agesText = children.map(c => {
    const m = ageInMonths(c.birth_date);
    return isAr ? `${c.name} (${m} شهر)` : `${c.name} (${m} mo)`;
  }).join(" • ");

  return (
    <div className="rp-root" dir={dir}>
      <style>{RP_CSS}</style>

      {/* ══ NAVBAR الموحّدة ══ */}
      <UnifiedNavbar
        isAr={isAr}
        onBack={() => navigate(-1)}
        pageTitle={isAr ? "التوصيات الطبية" : "Medical Recommendations"}
      />

      <main className="rp-main">

        {/* ══ HERO ══ */}
        <div className="rp-hero">
          <div className="rp-hero-left">
            <div className="rp-hero-icon">💡</div>
            <div>
              <h1 className="rp-hero-title">
                {isAr ? "توصيات الأطباء" : "Doctor Recommendations"}
              </h1>
              <p className="rp-hero-sub">
                {hasPersonal && children.length > 0
                  ? isAr
                    ? `مخصصة لأطفالكِ: ${agesText}`
                    : `Personalized for: ${agesText}`
                  : isAr
                    ? "توصيات طبية معتمدة من أطبائنا المتخصصين"
                    : "Certified recommendations from our specialist doctors"}
              </p>
            </div>
          </div>

          {/* بحث */}
          <div className="rp-search-wrap">
            <i className="fas fa-search rp-search-icon" />
            <input
              className="rp-search"
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={isAr ? "ابحثي عن توصية..." : "Search recommendations..."}
            />
            {searchTerm && (
              <button className="rp-search-clear" onClick={() => setSearchTerm("")}>
                <i className="fas fa-times" />
              </button>
            )}
          </div>
        </div>

        {/* ══ TABS ══ */}
        <div className="rp-tabs">
          {hasPersonal && (
            <button
              className={`rp-tab ${activeTab === "personal" ? "active" : ""}`}
              onClick={() => setActiveTab("personal")}
            >
              <i className="fas fa-baby" />
              {isAr ? "مناسبة لطفلكِ" : "For Your Baby"}
              <span className="rp-tab-count">{personal.length}</span>
            </button>
          )}
          <button
            className={`rp-tab ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            <i className="fas fa-lightbulb" />
            {isAr ? "جميع التوصيات" : "All Recommendations"}
            <span className="rp-tab-count">{general.length}</span>
          </button>
        </div>

        {/* بانر العمر */}
        {activeTab === "personal" && hasPersonal && !searchTerm && (
          <div className="rp-age-banner">
            <i className="fas fa-star" />
            <span>
              {isAr
                ? "يتم عرض التوصيات المناسبة لعمر طفلكِ فقط"
                : "Showing recommendations matched to your child's age only"}
            </span>
          </div>
        )}

        {/* ══ LOADING ══ */}
        {loading ? (
          <div className="rp-loading">
            <div className="rp-spinner" />
            <p>{isAr ? "جارٍ التحميل..." : "Loading..."}</p>
          </div>

        /* ══ EMPTY ══ */
        ) : displayed.length === 0 ? (
          <div className="rp-empty">
            <div className="rp-empty-icon">💡</div>
            <h3>
              {searchTerm
                ? isAr ? "لا توجد نتائج" : "No results found"
                : activeTab === "personal"
                  ? isAr ? "لا توجد توصيات مناسبة لعمر طفلكِ حالياً" : "No recommendations match your child's age yet"
                  : isAr ? "لا توجد توصيات بعد" : "No recommendations yet"}
            </h3>
            {activeTab === "personal" && !searchTerm && (
              <button className="rp-empty-btn" onClick={() => setActiveTab("all")}>
                {isAr ? "عرض جميع التوصيات" : "View All Recommendations"}
              </button>
            )}
          </div>

        /* ══ GRID ══ */
        ) : (
          <>
            <p className="rp-result-count">
              {displayed.length} {isAr ? "توصية" : "recommendations"}
              {searchTerm && ` ${isAr ? `لـ "${searchTerm}"` : `for "${searchTerm}"`}`}
            </p>
            <div className="rp-grid">
              {displayed.map(rec => (
                <RecCard key={rec.id} {...cardProps(rec)} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CSS
═══════════════════════════════════════════════════════════════ */
const RP_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Poppins:wght@400;600;700&display=swap');

:root {
  --rp-primary: #d68b9d;
  --rp-light:   #fdf2f5;
  --rp-secondary: #eab8c6;
  --rp-bg:      #FBF9F8;
  --rp-text:    #2d2825;
  --rp-gray:    #888;
  --rp-shadow:  0 4px 20px rgba(0,0,0,.05);
  --rp-radius:  18px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

.rp-root {
  min-height: 100vh;
  background: var(--rp-bg);
  font-family: 'Cairo','Poppins',sans-serif;
  color: var(--rp-text);
}

/* ── MAIN ── */
.rp-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 28px 22px 70px;
}

/* ── HERO ── */
.rp-hero {
  background: white;
  border-radius: var(--rp-radius);
  padding: 24px 28px;
  border: 1px solid var(--rp-light);
  box-shadow: var(--rp-shadow);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 22px;
}
.rp-hero-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 200px;
}
.rp-hero-icon { font-size: 2.6rem; }
.rp-hero-title {
  font-size: 1.35rem;
  font-weight: 900;
  color: var(--rp-text);
  margin-bottom: 5px;
}
.rp-hero-sub {
  font-size: .82rem;
  color: var(--rp-gray);
  font-weight: 600;
  line-height: 1.5;
}

/* ── SEARCH ── */
.rp-search-wrap {
  position: relative;
  width: 280px;
  flex-shrink: 0;
}
.rp-search-icon {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  color: var(--rp-primary);
  font-size: .88rem;
  pointer-events: none;
}
[dir="ltr"] .rp-search-icon { left: 14px; }
[dir="rtl"] .rp-search-icon { right: 14px; }

.rp-search {
  width: 100%;
  padding: 11px 40px;
  border-radius: 30px;
  border: 2px solid var(--rp-light);
  background: var(--rp-bg);
  font-family: 'Cairo','Poppins',sans-serif;
  font-size: .85rem;
  outline: none;
  transition: .25s;
}
.rp-search:focus {
  border-color: var(--rp-secondary);
  background: white;
  box-shadow: 0 0 0 3px var(--rp-light);
}
.rp-search-clear {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: #f0e0e5;
  border: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  cursor: pointer;
  color: var(--rp-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: .65rem;
  transition: .2s;
}
[dir="ltr"] .rp-search-clear { right: 12px; }
[dir="rtl"] .rp-search-clear { left: 12px; }
.rp-search-clear:hover { background: var(--rp-secondary); color: white; }

/* ── TABS ── */
.rp-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.rp-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  border: 2px solid #eee;
  padding: 10px 22px;
  border-radius: 30px;
  font-family: 'Cairo','Poppins',sans-serif;
  font-weight: 700;
  font-size: .85rem;
  color: var(--rp-gray);
  cursor: pointer;
  transition: .25s;
  box-shadow: var(--rp-shadow);
}
.rp-tab i { font-size: .88rem; }
.rp-tab:hover {
  border-color: var(--rp-secondary);
  color: var(--rp-primary);
}
.rp-tab.active {
  background: var(--rp-primary);
  color: white;
  border-color: var(--rp-primary);
  box-shadow: 0 4px 14px rgba(214,139,157,.3);
}
.rp-tab-count {
  background: rgba(255,255,255,.25);
  padding: 1px 8px;
  border-radius: 10px;
  font-size: .72rem;
  font-weight: 800;
}
.rp-tab:not(.active) .rp-tab-count {
  background: var(--rp-light);
  color: var(--rp-primary);
}

/* ── AGE BANNER ── */
.rp-age-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--rp-light);
  border: 1px solid var(--rp-secondary);
  border-radius: 12px;
  padding: 10px 16px;
  font-size: .82rem;
  font-weight: 700;
  color: var(--rp-primary);
  margin-bottom: 20px;
}

/* ── عدد النتائج ── */
.rp-result-count {
  font-size: .78rem;
  color: #bbb;
  font-weight: 700;
  margin-bottom: 16px;
}

/* ── GRID ── */
.rp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

/* ── LOADING ── */
.rp-loading {
  text-align: center;
  padding: 70px 20px;
  color: var(--rp-gray);
}
.rp-spinner {
  width: 42px;
  height: 42px;
  border: 4px solid var(--rp-light);
  border-top-color: var(--rp-primary);
  border-radius: 50%;
  animation: rp-spin .8s linear infinite;
  margin: 0 auto 14px;
}
@keyframes rp-spin { to { transform: rotate(360deg); } }

/* ── EMPTY ── */
.rp-empty {
  text-align: center;
  padding: 70px 20px;
  color: var(--rp-gray);
}
.rp-empty-icon {
  font-size: 3.5rem;
  margin-bottom: 14px;
}
.rp-empty h3 {
  font-size: 1rem;
  font-weight: 800;
  color: #bbb;
  margin-bottom: 18px;
}
.rp-empty-btn {
  background: var(--rp-primary);
  color: white;
  border: none;
  padding: 11px 28px;
  border-radius: 14px;
  font-family: 'Cairo','Poppins',sans-serif;
  font-weight: 700;
  font-size: .88rem;
  cursor: pointer;
  transition: .25s;
  box-shadow: 0 4px 14px rgba(214,139,157,.3);
}
.rp-empty-btn:hover { background: #c27a8c; transform: translateY(-1px); }

/* ── RESPONSIVE ── */
@media (max-width: 768px) {
  .rp-hero { flex-direction: column; align-items: flex-start; padding: 18px; }
  .rp-search-wrap { width: 100%; }
  .rp-grid { grid-template-columns: 1fr; }
  .rp-main { padding: 18px 14px 50px; }
}
@media (max-width: 480px) {
  .rp-tab { padding: 9px 14px; font-size: .8rem; }
}
`;