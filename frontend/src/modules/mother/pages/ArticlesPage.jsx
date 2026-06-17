// src/pages/mother/ArticlesPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../../../services/supabaseClient";
import UnifiedNavbar from "../../../components/UnifiedNavbar";
// ── helpers ──────────────────────────────────────────────────────────────────
const avgRating = (arr) =>
  arr?.length
    ? (arr.reduce((s, r) => s + r.rating, 0) / arr.length).toFixed(1)
    : null;

const StarRow = ({ rating, max = 5 }) => (
  <span style={{ color: "#f1c40f", fontSize: ".82rem" }}>
    {Array.from({ length: max }, (_, i) => (
      <i
        key={i}
        className="fas fa-star"
        style={{ color: i < Math.round(rating) ? "#f1c40f" : "#e0e0e0" }}
      />
    ))}
  </span>
);

// ── merge doctor info into articles ──────────────────────────────────────────
async function enrichWithDoctors(articles) {
  if (!articles?.length) return articles;

  const doctorIds = [...new Set(articles.map(a => a.doctor_id).filter(Boolean))];
  if (!doctorIds.length) return articles;

  // Fetch doctor_profiles + users separately (avoids relationship ambiguity)
  const { data: profiles } = await supabase
    .from("doctor_profiles")
    .select("doctor_id, specialization")
    .in("doctor_id", doctorIds);

  const { data: usersData } = await supabase
    .from("users")
    .select("user_id, name, avatar_url")
    .in("user_id", doctorIds);

  const profileMap = {};
  (profiles || []).forEach(p => { profileMap[p.doctor_id] = p; });

  const userMap = {};
  (usersData || []).forEach(u => { userMap[u.user_id] = u; });

  return articles.map(a => ({
    ...a,
    doctor_profiles: a.doctor_id
      ? {
          ...(profileMap[a.doctor_id] || {}),
          users: userMap[a.doctor_id] || null,
        }
      : null,
  }));
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function ArticlesPage() {
  const { i18n } = useTranslation();
  const navigate  = useNavigate();
  const isAr = i18n.language === "ar";
  const dir  = isAr ? "rtl" : "ltr";

  const [user,          setUser]          = useState(null);
  const [mainCats,      setMainCats]      = useState([]);
  const [subcats,       setSubcats]       = useState([]);
  const [activeMain,    setActiveMain]    = useState("mother");
  const [activeSubcat,  setActiveSubcat]  = useState(null);
  const [articles,      setArticles]      = useState([]);
  const [savedIds,      setSavedIds]      = useState(new Set());
  const [savedArticles, setSavedArticles] = useState([]);
  const [search,        setSearch]        = useState("");
  const [loading,       setLoading]       = useState(true);
  const [showSaved,     setShowSaved]     = useState(false);

  // ── init ──
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: au } }) => {
      if (!au) return;
      const { data: u } = await supabase
        .from("users")
        .select("user_id, name, avatar_url, role")
        .eq("auth_id", au.id)
        .single();
      setUser(u);
    });
    fetchMainCats();
  }, []);

  // ── main categories ──
  const fetchMainCats = async () => {
    const { data } = await supabase
      .from("article_main_categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    setMainCats(data || []);
  };

  // ── subcategories when main changes ──
  useEffect(() => {
    const mc = mainCats.find(c => c.target === activeMain);
    if (!mc) return;
    setActiveSubcat(null);
    supabase
      .from("article_subcategories")
      .select("*")
      .eq("main_category_id", mc.id)
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => setSubcats(data || []));
  }, [activeMain, mainCats]);

  // ── fetch articles ──
  const fetchArticles = async () => {
    setLoading(true);
    try {
      const mc = mainCats.find(c => c.target === activeMain);
      if (!mc && mainCats.length) { setLoading(false); return; }

      // Base query — NO doctor join here (avoids ambiguity)
      let query = supabase
        .from("articles")
        .select(`
          article_id,
          title,
          content,
          cover_image_url,
          reading_time_minutes,
          views_count,
          created_at,
          subcategory_id,
          doctor_id,
          article_subcategories (
            id, name_ar, name_en, icon,
            article_main_categories ( id, name_ar, name_en, target )
          ),
          article_ratings ( rating ),
          article_comments ( comment_id, is_deleted )
        `)
        .eq("status", "approved");

      // Filter by subcategory
      if (activeSubcat) {
        query = query.eq("subcategory_id", activeSubcat);
      } else if (mc) {
        const { data: scData } = await supabase
          .from("article_subcategories")
          .select("id")
          .eq("main_category_id", mc.id)
          .eq("is_active", true);

        const scIds = (scData || []).map(s => s.id);
        if (scIds.length) {
          query = query.in("subcategory_id", scIds);
        }
      }

      if (search.trim()) {
        query = query.ilike("title", `%${search.trim()}%`);
      }

      const { data: rawData, error } = await query
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("❌ fetchArticles error:", error.message);
        setArticles([]);
      } else {
        // Enrich with doctor info (separate query, no ambiguity)
        const enriched = await enrichWithDoctors(rawData || []);
        setArticles(enriched);
      }
    } catch (e) {
      console.error("fetchArticles exception:", e);
      setArticles([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (mainCats.length) fetchArticles();
  }, [activeMain, activeSubcat, search, mainCats]);

  // ── fetch saved articles ──
  const fetchSaved = async () => {
    if (!user) return;

    const { data: savedRows, error } = await supabase
      .from("saved_articles")
      .select("article_id")
      .eq("user_id", user.user_id);

    if (error) { console.error("saved fetch error:", error.message); return; }

    const ids = (savedRows || []).map(s => s.article_id);
    setSavedIds(new Set(ids));

    if (!ids.length) { setSavedArticles([]); return; }

    const { data: rawArts } = await supabase
      .from("articles")
      .select(`
        article_id, title, content, cover_image_url,
        reading_time_minutes, created_at, subcategory_id, doctor_id,
        article_subcategories (
          id, name_ar, name_en, icon,
          article_main_categories ( target, name_ar, name_en )
        ),
        article_ratings ( rating )
      `)
      .in("article_id", ids)
      .eq("status", "approved");

    const enriched = await enrichWithDoctors(rawArts || []);
    setSavedArticles(enriched);
  };

  useEffect(() => {
    if (user) fetchSaved();
  }, [user]);

  // ── toggle save ──
  const toggleSave = async (articleId) => {
    if (!user) { navigate("/login"); return; }
    if (savedIds.has(articleId)) {
      await supabase
        .from("saved_articles")
        .delete()
        .eq("user_id", user.user_id)
        .eq("article_id", articleId);
      setSavedIds(p => { const n = new Set(p); n.delete(articleId); return n; });
      setSavedArticles(p => p.filter(a => a?.article_id !== articleId));
    } else {
      await supabase
        .from("saved_articles")
        .insert({ user_id: user.user_id, article_id: articleId });
      setSavedIds(p => new Set([...p, articleId]));
      // Refresh saved list
      fetchSaved();
    }
  };



  const activeMC     = mainCats.find(c => c.target === activeMain);
  const activeSubObj = subcats.find(s => s.id === activeSubcat);

  return (
    <div className="ap-root" dir={dir}>
      <style>{CSS}</style>

   <UnifiedNavbar
  isAr={isAr}
  onBack={() => navigate(-1)}
  pageTitle={isAr ? "المقالات الطبية" : "Medical Articles"}
/>

      <div className="ap-body">

        {/* ── SEARCH ── */}
        <div className="ap-search-wrap">
          <div className="ap-search-box">
            <i className="fas fa-search" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={isAr ? "ابحثي عن مقال..." : "Search articles..."}
            />
            {search && (
              <button onClick={() => setSearch("")} className="ap-clear-search">
                <i className="fas fa-times" />
              </button>
            )}
          </div>
        </div>

        {/* ── MAIN TABS ── */}
        <div className="ap-main-tabs">
          {mainCats.map(mc => (
            <button
              key={mc.id}
              className={`ap-main-tab ${activeMain === mc.target ? "active" : ""}`}
              onClick={() => setActiveMain(mc.target)}
            >
              <i className={mc.icon} />
              {isAr ? mc.name_ar : mc.name_en}
            </button>
          ))}
        </div>

        {/* ── SUBCATEGORY CHIPS ── */}
        <div className="ap-subcats">
          <button
            className={`ap-subcat-chip ${!activeSubcat ? "active" : ""}`}
            onClick={() => setActiveSubcat(null)}
          >
            {isAr ? "الكل" : "All"}
          </button>
          {subcats.map(sc => (
            <button
              key={sc.id}
              className={`ap-subcat-chip ${activeSubcat === sc.id ? "active" : ""}`}
              onClick={() => setActiveSubcat(activeSubcat === sc.id ? null : sc.id)}
            >
              <i className={sc.icon} />
              {isAr ? sc.name_ar : sc.name_en}
            </button>
          ))}
        </div>

        {/* ── SECTION TITLE ── */}
        <div className="ap-section-title">
          <i className={activeMC?.icon || "fas fa-newspaper"} />
          <span>
            {activeSubObj
              ? (isAr ? activeSubObj.name_ar : activeSubObj.name_en)
              : (isAr ? activeMC?.name_ar : activeMC?.name_en)}
          </span>
          <span className="ap-count-badge">{articles.length}</span>
        </div>

        {/* ── ARTICLES GRID ── */}
        {loading ? (
          <div className="ap-spinner-wrap">
            <div className="ap-spinner" />
            <p>{isAr ? "جارٍ التحميل..." : "Loading..."}</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="ap-empty">
            <span>📄</span>
            <p>{isAr ? "لا توجد مقالات في هذا القسم" : "No articles in this section"}</p>
          </div>
        ) : (
          <div className="ap-grid">
            {articles.map(art => (
              <ArticleCard
                key={art.article_id}
                art={art}
                isAr={isAr}
                isSaved={savedIds.has(art.article_id)}
                onSave={() => toggleSave(art.article_id)}
                onOpen={() => navigate(`/articles/${art.article_id}`)}

                
              />
            ))}
          </div>
        )}

        {/* ── SAVED ARTICLES ── */}
        {user && savedArticles.length > 0 && (
          <div className="ap-saved-section">
            <button
              className="ap-saved-toggle"
              onClick={() => setShowSaved(p => !p)}
            >
              <i className="fas fa-bookmark" />
              {isAr ? "المقالات المحفوظة" : "Saved Articles"}
              <span className="ap-count-badge">{savedArticles.length}</span>
              <i className={`fas fa-chevron-${showSaved ? "up" : "down"} ap-toggle-arrow`} />
            </button>

            {showSaved && (
              <div className="ap-grid" style={{ marginTop: 16 }}>
                {savedArticles.map(art =>
                  art && (
                    <ArticleCard
                      key={art.article_id}
                      art={art}
                      isAr={isAr}
                      isSaved={true}
                      onSave={() => toggleSave(art.article_id)}
                      onOpen={() => navigate(`/articles/${art.article_id}`)}
                    />
                  )
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── ARTICLE CARD ──────────────────────────────────────────────────────────────
function ArticleCard({ art, isAr, isSaved, onSave, onOpen }) {
  const rating     = avgRating(art.article_ratings);
  const comments   = (art.article_comments || []).filter(c => !c.is_deleted).length;
  const doctor     = art.doctor_profiles?.users?.name     || (isAr ? "طبيب" : "Doctor");
  const spec       = art.doctor_profiles?.specialization  || "";
  const avatar     = art.doctor_profiles?.users?.avatar_url;
  const subcatName = isAr
    ? art.article_subcategories?.name_ar
    : art.article_subcategories?.name_en;
  const subcatIcon = art.article_subcategories?.icon;

  return (
    <div className="ap-card">
      {art.cover_image_url ? (
        <div
          className="ap-card-cover"
          style={{ backgroundImage: `url(${art.cover_image_url})` }}
        />
      ) : (
        <div className="ap-card-cover ap-card-cover-default">
          <i className="fas fa-newspaper" />
        </div>
      )}

      <div className="ap-card-body">
        {subcatName && (
          <div className="ap-card-cat">
            {subcatIcon && <i className={subcatIcon} />}
            {subcatName}
          </div>
        )}

        <h3 className="ap-card-title" onClick={onOpen}>{art.title}</h3>

        <p className="ap-card-excerpt">
          {(art.content || "").replace(/<[^>]+>/g, "").slice(0, 100)}
          {(art.content || "").length > 100 ? "…" : ""}
        </p>

        <div className="ap-card-doctor">
          {avatar
            ? <img src={avatar} alt="" className="ap-doc-avatar" />
            : <div className="ap-doc-init">{doctor.charAt(0)}</div>}
          <div>
            <span className="ap-doc-name">{doctor}</span>
            {spec && <span className="ap-doc-spec">{spec}</span>}
          </div>
        </div>

        <div className="ap-card-meta">
          {rating ? (
            <span className="ap-card-rating">
              <StarRow rating={parseFloat(rating)} />
              <span className="ap-rating-val">{rating}</span>
            </span>
          ) : (
            <span className="ap-card-no-rating">
              <i className="fas fa-star" style={{ color: "#ddd" }} />
              {isAr ? "لا يوجد تقييم" : "No ratings yet"}
            </span>
          )}
          {art.reading_time_minutes && (
            <span className="ap-card-read-time">
              <i className="fas fa-clock" />
              {art.reading_time_minutes} {isAr ? "دقيقة" : "min"}
            </span>
          )}
        </div>

        <div className="ap-card-actions">
          <button
            className={`ap-card-save ${isSaved ? "saved" : ""}`}
            onClick={e => { e.stopPropagation(); onSave(); }}
          >
            <i className={`${isSaved ? "fas" : "far"} fa-bookmark`} />
            {isAr ? (isSaved ? "محفوظ" : "حفظ") : (isSaved ? "Saved" : "Save")}
          </button>
          <span className="ap-card-comments">
            <i className="fas fa-comment" /> {comments}
          </span>
          <button className="ap-card-read-btn" onClick={onOpen}>
            {isAr ? "قراءة المقال ←" : "Read Article →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CSS ────────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Poppins:wght@400;600;700;800&display=swap');
:root{
  --primary:#d68b9d; --primary-light:#fdf2f5; --secondary:#eab8c6;
  --bg:#FBF9F8; --text:#333; --gray:#777; --white:#fff;
  --shadow:0 4px 20px rgba(0,0,0,.05); --radius:18px;
}
*{margin:0;padding:0;box-sizing:border-box;font-family:'Cairo','Poppins',sans-serif;}
.ap-root{min-height:100vh;background:var(--bg);}
.ap-header{position:sticky;top:0;z-index:200;background:var(--white);
  border-bottom:1px solid #f0e8ec;padding:0 24px;height:68px;
  display:flex;align-items:center;justify-content:space-between;
  box-shadow:0 2px 12px rgba(214,139,157,.08);}
.ap-header-title{font-size:1.1rem;font-weight:800;color:var(--text);
  display:flex;align-items:center;gap:9px;}
.ap-header-title i{color:var(--primary);}
.ap-back-btn{background:none;border:none;font-size:1.1rem;color:var(--gray);
  cursor:pointer;padding:8px;border-radius:50%;transition:.2s;}
.ap-back-btn:hover{background:var(--primary-light);color:var(--primary);}
.ap-lang-btn{background:#f4f4f4;border:none;padding:6px 14px;border-radius:20px;
  font-weight:700;font-size:.8rem;cursor:pointer;color:var(--gray);
  font-family:'Cairo','Poppins',sans-serif;}
.ap-lang-btn:hover{background:var(--primary-light);color:var(--primary);}
.ap-body{max-width:1200px;margin:0 auto;padding:28px 20px 60px;}
.ap-search-wrap{margin-bottom:22px;}
.ap-search-box{display:flex;align-items:center;gap:10px;background:var(--white);
  border:1px solid #eee;border-radius:14px;padding:10px 16px;
  box-shadow:var(--shadow);max-width:480px;}
.ap-search-box i{color:#bbb;}
.ap-search-box input{border:none;background:transparent;outline:none;width:100%;
  font-family:'Cairo','Poppins';font-size:.88rem;}
.ap-clear-search{background:none;border:none;color:#bbb;cursor:pointer;
  font-size:.85rem;padding:2px 5px;border-radius:50%;}
.ap-clear-search:hover{color:#e74c3c;}
.ap-main-tabs{display:flex;gap:10px;margin-bottom:18px;flex-wrap:wrap;}
.ap-main-tab{display:flex;align-items:center;gap:9px;padding:11px 24px;
  border-radius:50px;border:2px solid #eee;background:var(--white);
  font-family:'Cairo','Poppins';font-weight:800;font-size:.88rem;
  color:var(--gray);cursor:pointer;transition:.3s;box-shadow:var(--shadow);}
.ap-main-tab i{font-size:1rem;}
.ap-main-tab:hover{border-color:var(--secondary);color:var(--primary);}
.ap-main-tab.active{background:var(--primary);color:white;border-color:var(--primary);
  box-shadow:0 4px 15px rgba(214,139,157,.3);}
.ap-subcats{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:22px;}
.ap-subcat-chip{display:flex;align-items:center;gap:6px;padding:7px 16px;
  border-radius:25px;border:1.5px solid #eee;background:var(--white);
  font-family:'Cairo','Poppins';font-weight:700;font-size:.8rem;
  color:var(--gray);cursor:pointer;transition:.3s;white-space:nowrap;}
.ap-subcat-chip i{font-size:.8rem;}
.ap-subcat-chip:hover{border-color:var(--secondary);color:var(--primary);}
.ap-subcat-chip.active{background:var(--primary-light);border-color:var(--secondary);color:var(--primary);}
.ap-section-title{display:flex;align-items:center;gap:10px;font-size:1.1rem;
  font-weight:800;color:var(--text);margin-bottom:18px;}
.ap-section-title i{color:var(--primary);}
.ap-count-badge{background:var(--primary-light);color:var(--primary);
  padding:3px 10px;border-radius:12px;font-size:.78rem;font-weight:700;}
.ap-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px;}
.ap-card{background:var(--white);border-radius:var(--radius);border:1px solid #f0f0f0;
  box-shadow:var(--shadow);overflow:hidden;transition:.3s;display:flex;flex-direction:column;}
.ap-card:hover{box-shadow:0 8px 30px rgba(214,139,157,.15);transform:translateY(-3px);}
.ap-card-cover{height:140px;background-size:cover;background-position:center;}
.ap-card-cover-default{background:linear-gradient(135deg,#fdf2f5,#f8edf2);
  display:flex;align-items:center;justify-content:center;}
.ap-card-cover-default i{font-size:2.5rem;color:var(--secondary);opacity:.6;}
.ap-card-body{padding:16px;flex:1;display:flex;flex-direction:column;gap:8px;}
.ap-card-cat{display:inline-flex;align-items:center;gap:5px;background:var(--primary-light);
  color:var(--primary);padding:3px 10px;border-radius:12px;
  font-size:.72rem;font-weight:800;align-self:flex-start;}
.ap-card-title{font-size:.95rem;font-weight:800;color:var(--text);
  line-height:1.4;cursor:pointer;transition:.2s;}
.ap-card-title:hover{color:var(--primary);}
.ap-card-excerpt{font-size:.8rem;color:var(--gray);line-height:1.6;}
.ap-card-doctor{display:flex;align-items:center;gap:9px;margin-top:4px;}
.ap-doc-avatar{width:30px;height:30px;border-radius:50%;object-fit:cover;
  border:2px solid var(--primary-light);}
.ap-doc-init{width:30px;height:30px;border-radius:50%;background:var(--primary-light);
  color:var(--primary);display:flex;align-items:center;justify-content:center;
  font-weight:800;font-size:.78rem;}
.ap-doc-name{display:block;font-size:.8rem;font-weight:700;color:var(--text);}
.ap-doc-spec{display:block;font-size:.7rem;color:var(--gray);}
.ap-card-meta{display:flex;align-items:center;justify-content:space-between;
  gap:8px;font-size:.75rem;}
.ap-card-rating{display:flex;align-items:center;gap:5px;}
.ap-rating-val{font-weight:800;color:#f1c40f;}
.ap-card-no-rating{color:#ccc;font-weight:600;display:flex;align-items:center;gap:4px;}
.ap-card-read-time{color:var(--gray);display:flex;align-items:center;gap:4px;}
.ap-card-actions{display:flex;align-items:center;gap:8px;padding-top:8px;
  border-top:1px solid #f5f5f5;margin-top:auto;}
.ap-card-save{display:flex;align-items:center;gap:5px;background:#f4f4f4;border:none;
  padding:6px 12px;border-radius:20px;font-family:'Cairo','Poppins';
  font-size:.75rem;font-weight:700;color:var(--gray);cursor:pointer;transition:.3s;}
.ap-card-save:hover,.ap-card-save.saved{background:var(--primary-light);color:var(--primary);}
.ap-card-comments{color:var(--gray);font-size:.75rem;font-weight:600;
  display:flex;align-items:center;gap:4px;}
.ap-card-read-btn{margin-inline-start:auto;background:var(--primary-light);border:none;
  padding:7px 14px;border-radius:20px;font-family:'Cairo','Poppins';
  font-size:.75rem;font-weight:800;color:var(--primary);cursor:pointer;
  transition:.3s;white-space:nowrap;}
.ap-card-read-btn:hover{background:var(--primary);color:white;}
.ap-saved-section{margin-top:36px;padding-top:24px;border-top:2px dashed #f0e8ec;}
.ap-saved-toggle{display:flex;align-items:center;gap:10px;background:none;border:none;
  font-family:'Cairo','Poppins';font-size:1.05rem;font-weight:800;color:var(--primary);
  cursor:pointer;padding:8px 0;width:100%;}
.ap-toggle-arrow{margin-inline-start:auto;font-size:.8rem;}
.ap-spinner-wrap{text-align:center;padding:60px;color:var(--gray);}
.ap-spinner{width:40px;height:40px;border:4px solid var(--primary-light);
  border-top-color:var(--primary);border-radius:50%;
  animation:ap-spin .8s linear infinite;margin:0 auto 14px;}
@keyframes ap-spin{to{transform:rotate(360deg)}}
.ap-empty{text-align:center;padding:60px 20px;color:var(--gray);}
.ap-empty span{font-size:3rem;display:block;margin-bottom:12px;}
.ap-empty p{font-weight:700;}
@media(max-width:600px){
  .ap-grid{grid-template-columns:1fr;}
  .ap-main-tab{padding:9px 18px;font-size:.82rem;}
}
`;