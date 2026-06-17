// src/components/HomeArticlesSection.jsx
// ─── Add this inside HomePage.jsx, before the footer ────────────────────────
// Usage: <HomeArticlesSection />
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";

export default function HomeArticlesSection({ isAr = false }) {
  const navigate  = useNavigate();
  const [articles,      setArticles]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [previewArticle,setPreviewArticle]= useState(null); // article shown in teaser modal
  const [isLoggedIn,    setIsLoggedIn]    = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setIsLoggedIn(!!user));
    fetchTopArticles();
  }, []);

  const fetchTopArticles = async () => {
    // Get approved articles with their avg rating, ordered by rating desc
  const { data } = await supabase
  .from("articles")
  .select(`
    article_id, title, content, cover_image_url,
    reading_time_minutes, created_at,
    article_subcategories (
      name_ar, name_en, icon,
      article_main_categories ( name_ar, name_en, target )
    ),
    doctor_profiles!articles_doctor_id_fkey (
      specialization,
      users!doctor_profiles_doctor_id_fkey ( name, avatar_url )
    ),
    article_ratings ( rating )
  `)
  .eq("status", "approved")
  .order("created_at", { ascending: false })
  .limit(30);

    if (data) {
      // Sort by avg rating in JS
      const sorted = data
        .map(a => ({
          ...a,
          _avg: a.article_ratings?.length
            ? a.article_ratings.reduce((s, r) => s + r.rating, 0) / a.article_ratings.length
            : 0,
        }))
        .filter(a => a._avg > 0)
        .sort((a, b) => b._avg - a._avg)
        .slice(0, 6);
      setArticles(sorted.length >= 3 ? sorted : data.slice(0, 6));
    }
    setLoading(false);
  };

  const handleReadMore = (art) => {
    if (isLoggedIn) {
      navigate(`/articles/${art.article_id}`);
    } else {
      setPreviewArticle(art);
    }
  };

  const stars = (avg) =>
    Array.from({ length: 5 }, (_, i) => (
      <i key={i} className={`fas fa-star${i < Math.round(avg) ? "" : " hs-star-off"}`} />
    ));

  return (
    <section className="hs-articles-section" dir={isAr ? "rtl" : "ltr"}>
      <style>{CSS}</style>

      {/* ── Section Header ── */}
      <div className="hs-header">
        <div className="hs-header-text">
          <div className="hs-header-tag">
            <i className="fas fa-star" />
            {isAr ? "الأعلى تقييماً" : "Top Rated"}
          </div>
          <h2 className="hs-title">
            {isAr ? "مقالات طبية معتمدة من أطبائنا" : "Medically Reviewed Articles"}
          </h2>
          <p className="hs-subtitle">
            {isAr
              ? "اقرئي أحدث المقالات الصحية المكتوبة ومراجعتها من قِبل أطبائنا المتخصصين"
              : "Read the latest health articles written and reviewed by our specialist doctors"}
          </p>
        </div>
        <button className="hs-view-all-btn" onClick={() => navigate("/articles")}>
          <i className="fas fa-newspaper" />
          {isAr ? "عرض كل المقالات" : "View All Articles"}
        </button>
      </div>

      {/* ── Articles Grid ── */}
      {loading ? (
        <div className="hs-loading">
          <div className="hs-spinner" />
          <p>{isAr ? "جارٍ التحميل..." : "Loading..."}</p>
        </div>
      ) : articles.length === 0 ? (
        <div className="hs-empty">
          <span>📄</span>
          <p>{isAr ? "لا توجد مقالات بعد" : "No articles yet"}</p>
        </div>
      ) : (
        <div className="hs-grid">
          {articles.map((art) => {
            const doctor    = art.doctor_profiles?.users?.name || (isAr ? "طبيب" : "Doctor");
            const spec      = art.doctor_profiles?.specialization || "";
            const avatar    = art.doctor_profiles?.users?.avatar_url;
            const avg       = art._avg || 0;
            const subcatName = isAr
              ? art.article_subcategories?.name_ar
              : art.article_subcategories?.name_en;
            const target = art.article_subcategories?.article_main_categories?.target;

            return (
              <div key={art.article_id} className="hs-card">
                {/* Cover */}
                <div
                  className="hs-card-cover"
                  style={art.cover_image_url
                    ? { backgroundImage: `url(${art.cover_image_url})` }
                    : {}}
                >
                  {!art.cover_image_url && (
                    <div className="hs-cover-default">
                      <i className="fas fa-newspaper" />
                    </div>
                  )}
                  {/* Target badge */}
                  {target && (
                    <span className={`hs-target-badge hs-target-${target}`}>
                      <i className={target === "mother" ? "fas fa-heart" : "fas fa-baby"} />
                      {isAr
                        ? (target === "mother" ? "الأم" : "الطفل")
                        : (target === "mother" ? "Mother" : "Child")}
                    </span>
                  )}
                  {/* Rating badge */}
                  {avg > 0 && (
                    <span className="hs-rating-badge">
                      <i className="fas fa-star" /> {avg.toFixed(1)}
                    </span>
                  )}
                </div>

                <div className="hs-card-body">
                  {subcatName && (
                    <span className="hs-cat-chip">
                      <i className={art.article_subcategories?.icon || "fas fa-tag"} />
                      {subcatName}
                    </span>
                  )}

                  <h3 className="hs-card-title">{art.title}</h3>

                  <p className="hs-card-excerpt">
                    {(art.content || "").replace(/<[^>]+>/g, "").slice(0, 90)}…
                  </p>

                  {/* Stars */}
                  {avg > 0 && (
                    <div className="hs-stars-row">
                      <span style={{ color: "#f1c40f", fontSize: ".8rem" }}>{stars(avg)}</span>
                      <span className="hs-avg-text">{avg.toFixed(1)}</span>
                      <span className="hs-rating-count">
                        ({art.article_ratings?.length} {isAr ? "تقييم" : "ratings"})
                      </span>
                    </div>
                  )}

                  {/* Doctor */}
                  <div className="hs-doctor-row">
                    {avatar
                      ? <img src={avatar} alt="" className="hs-doc-avatar" />
                      : <div className="hs-doc-init">{doctor.charAt(0)}</div>}
                    <div>
                      <span className="hs-doc-name">{doctor}</span>
                      {spec && <span className="hs-doc-spec">{spec}</span>}
                    </div>
                    {art.reading_time_minutes && (
                      <span className="hs-read-time">
                        <i className="fas fa-clock" /> {art.reading_time_minutes}m
                      </span>
                    )}
                  </div>

                  <button className="hs-read-btn" onClick={() => handleReadMore(art)}>
                    {isAr ? "قراءة المقال ←" : "Read Article →"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CTA for guests ── */}
      {!isLoggedIn && (
        <div className="hs-guest-cta">
          <div className="hs-guest-cta-inner">
            <i className="fas fa-lock" />
            <div>
              <h3>{isAr ? "هل تريدين قراءة المزيد؟" : "Want to read more?"}</h3>
              <p>
                {isAr
                  ? "سجّلي الدخول للوصول إلى مكتبة كاملة من المقالات الطبية المعتمدة، التقييمات، والتعليقات"
                  : "Login to access our full library of approved medical articles, ratings, and comments"}
              </p>
            </div>
            <button className="hs-register-btn" onClick={() => navigate("/register")}>
              <i className="fas fa-user-plus" />
              {isAr ? "سجّلي الآن" : "Register Now"}
            </button>
          </div>
        </div>
      )}

      {/* ── Preview Modal (for guests) ── */}
      {previewArticle && (
        <div className="hs-modal-overlay" onClick={() => setPreviewArticle(null)}>
          <div
            className="hs-preview-modal"
            dir={isAr ? "rtl" : "ltr"}
            onClick={e => e.stopPropagation()}
          >
            <button className="hs-modal-close" onClick={() => setPreviewArticle(null)}>
              <i className="fas fa-times" />
            </button>

            {previewArticle.cover_image_url && (
              <div
                className="hs-preview-cover"
                style={{ backgroundImage: `url(${previewArticle.cover_image_url})` }}
              />
            )}

            <div className="hs-preview-body">
              <h2 className="hs-preview-title">{previewArticle.title}</h2>
              <p className="hs-preview-excerpt">
                {(previewArticle.content || "").replace(/<[^>]+>/g, "").slice(0, 200)}…
              </p>

              {/* Blur overlay to tease content */}
              <div className="hs-preview-blur">
                <div className="hs-preview-blur-text">
                  {(previewArticle.content || "").replace(/<[^>]+>/g, "").slice(200, 350)}…
                </div>
              </div>

              {/* CTA */}
              <div className="hs-preview-cta">
                <i className="fas fa-lock" style={{ fontSize: "1.5rem", color: "#d68b9d" }} />
                <h3>
                  {isAr ? "سجّلي دخولك لقراءة المقالة كاملة" : "Login to read the full article"}
                </h3>
                <p>
                  {isAr
                    ? "انضمي إلى مجتمع الأمهات واحصلي على وصول غير محدود لجميع المقالات"
                    : "Join our mothers community and get unlimited access to all articles"}
                </p>
                <div className="hs-preview-cta-btns">
                  <button className="hs-register-btn" onClick={() => navigate("/register")}>
                    <i className="fas fa-user-plus" />
                    {isAr ? "تسجيل جديد" : "Register"}
                  </button>
                  <button
                    className="hs-login-btn"
                    onClick={() => navigate("/login")}
                  >
                    <i className="fas fa-sign-in-alt" />
                    {isAr ? "تسجيل الدخول" : "Login"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

const CSS = `
.hs-articles-section{
  padding:70px 28px;
  background:linear-gradient(180deg,#fff 0%,#fdf2f5 100%);
  font-family:'Cairo','Poppins',sans-serif;
}
.hs-header{
  display:flex;justify-content:space-between;align-items:flex-start;
  max-width:1200px;margin:0 auto 40px;flex-wrap:wrap;gap:20px;
}
.hs-header-tag{
  display:inline-flex;align-items:center;gap:6px;
  background:#fdf2f5;color:#d68b9d;
  padding:5px 14px;border-radius:20px;font-size:.8rem;font-weight:800;
  margin-bottom:10px;
}
.hs-header-tag i{color:#f1c40f;}
.hs-title{font-size:2rem;font-weight:900;color:#333;margin-bottom:8px;line-height:1.3;}
.hs-subtitle{color:#777;font-size:.92rem;font-weight:600;max-width:560px;line-height:1.6;}
.hs-view-all-btn{
  display:flex;align-items:center;gap:9px;
  background:#d68b9d;color:white;border:none;
  padding:12px 24px;border-radius:14px;font-family:'Cairo','Poppins';
  font-weight:800;font-size:.9rem;cursor:pointer;
  box-shadow:0 4px 15px rgba(214,139,157,.3);transition:.3s;
  white-space:nowrap;align-self:flex-start;
}
.hs-view-all-btn:hover{background:#c27a8c;transform:translateY(-2px);}

/* grid */
.hs-grid{
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(320px,1fr));
  gap:22px;max-width:1200px;margin:0 auto;
}

/* card */
.hs-card{
  background:white;border-radius:20px;overflow:hidden;
  box-shadow:0 4px 20px rgba(0,0,0,.06);border:1px solid #f0f0f0;
  transition:.3s;display:flex;flex-direction:column;
}
.hs-card:hover{box-shadow:0 10px 35px rgba(214,139,157,.15);transform:translateY(-4px);}
.hs-card-cover{
  height:160px;background-size:cover;background-position:center;
  position:relative;background-color:#fdf2f5;
}
.hs-cover-default{
  height:100%;display:flex;align-items:center;justify-content:center;
}
.hs-cover-default i{font-size:2.5rem;color:#eab8c6;opacity:.6;}
.hs-target-badge{
  position:absolute;top:10px;inset-inline-start:10px;
  display:flex;align-items:center;gap:5px;
  padding:4px 10px;border-radius:12px;font-size:.72rem;font-weight:800;
}
.hs-target-mother{background:#fdf2f5;color:#d68b9d;}
.hs-target-child{background:#f0faf4;color:#2ecc71;}
.hs-rating-badge{
  position:absolute;top:10px;inset-inline-end:10px;
  background:rgba(0,0,0,.6);color:#f1c40f;
  padding:4px 10px;border-radius:12px;font-size:.75rem;font-weight:800;
  display:flex;align-items:center;gap:4px;
}
.hs-card-body{padding:18px;display:flex;flex-direction:column;gap:9px;flex:1;}
.hs-cat-chip{
  display:inline-flex;align-items:center;gap:5px;
  background:#fdf2f5;color:#d68b9d;
  padding:3px 10px;border-radius:10px;font-size:.72rem;font-weight:800;align-self:flex-start;
}
.hs-card-title{font-size:.98rem;font-weight:800;color:#333;line-height:1.4;}
.hs-card-excerpt{font-size:.8rem;color:#777;line-height:1.6;}
.hs-stars-row{display:flex;align-items:center;gap:6px;}
.hs-star-off{color:#e0e0e0 !important;}
.hs-avg-text{font-weight:800;color:#f1c40f;font-size:.8rem;}
.hs-rating-count{font-size:.72rem;color:#bbb;font-weight:600;}
.hs-doctor-row{display:flex;align-items:center;gap:9px;margin-top:4px;}
.hs-doc-avatar{width:30px;height:30px;border-radius:50%;object-fit:cover;border:2px solid #fdf2f5;}
.hs-doc-init{
  width:30px;height:30px;border-radius:50%;
  background:#fdf2f5;color:#d68b9d;
  display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.78rem;
}
.hs-doc-name{display:block;font-size:.78rem;font-weight:700;color:#333;}
.hs-doc-spec{display:block;font-size:.7rem;color:#d68b9d;}
.hs-read-time{font-size:.72rem;color:#bbb;display:flex;align-items:center;gap:4px;margin-inline-start:auto;}
.hs-read-btn{
  background:#fdf2f5;color:#d68b9d;border:none;
  padding:9px 16px;border-radius:12px;font-family:'Cairo','Poppins';
  font-weight:800;font-size:.82rem;cursor:pointer;
  transition:.3s;margin-top:auto;align-self:stretch;
  display:flex;align-items:center;justify-content:center;
}
.hs-read-btn:hover{background:#d68b9d;color:white;}

/* Guest CTA */
.hs-guest-cta{max-width:1200px;margin:36px auto 0;}
.hs-guest-cta-inner{
  background:linear-gradient(135deg,#d68b9d,#eab8c6);
  border-radius:20px;padding:28px 32px;
  display:flex;align-items:center;gap:22px;flex-wrap:wrap;
  color:white;
}
.hs-guest-cta-inner>i{font-size:2.5rem;opacity:.8;}
.hs-guest-cta-inner>div{flex:1;}
.hs-guest-cta-inner h3{font-size:1.15rem;font-weight:800;margin-bottom:5px;}
.hs-guest-cta-inner p{font-size:.85rem;opacity:.9;line-height:1.5;}
.hs-register-btn{
  background:white;color:#d68b9d;border:none;
  padding:11px 24px;border-radius:12px;font-family:'Cairo','Poppins';
  font-weight:800;font-size:.88rem;cursor:pointer;
  display:flex;align-items:center;gap:8px;white-space:nowrap;transition:.3s;
}
.hs-register-btn:hover{background:#fdf2f5;transform:translateY(-1px);}
.hs-login-btn{
  background:rgba(255,255,255,.2);color:white;border:2px solid rgba(255,255,255,.5);
  padding:11px 24px;border-radius:12px;font-family:'Cairo','Poppins';
  font-weight:800;font-size:.88rem;cursor:pointer;
  display:flex;align-items:center;gap:8px;white-space:nowrap;transition:.3s;
}
.hs-login-btn:hover{background:rgba(255,255,255,.3);}

/* Modal */
.hs-modal-overlay{
  position:fixed;inset:0;background:rgba(0,0,0,.6);
  backdrop-filter:blur(4px);z-index:5000;
  display:flex;align-items:center;justify-content:center;padding:16px;
}
.hs-preview-modal{
  background:white;border-radius:22px;width:100%;max-width:520px;
  max-height:88vh;overflow-y:auto;position:relative;
  box-shadow:0 25px 60px rgba(0,0,0,.2);
}
.hs-modal-close{
  position:absolute;top:14px;inset-inline-end:14px;
  background:rgba(0,0,0,.5);color:white;border:none;
  width:30px;height:30px;border-radius:50%;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  font-size:.85rem;z-index:1;
}
.hs-preview-cover{height:160px;background-size:cover;background-position:center;}
.hs-preview-body{padding:22px;}
.hs-preview-title{font-size:1.15rem;font-weight:800;margin-bottom:10px;color:#333;}
.hs-preview-excerpt{font-size:.88rem;color:#555;line-height:1.7;margin-bottom:10px;}
.hs-preview-blur{
  position:relative;margin-bottom:20px;
  max-height:70px;overflow:hidden;
}
.hs-preview-blur::after{
  content:'';position:absolute;inset:0;
  background:linear-gradient(transparent 0%,white 80%);
}
.hs-preview-blur-text{font-size:.85rem;color:#777;line-height:1.7;}
.hs-preview-cta{text-align:center;padding:22px 16px;border-top:1px solid #f0f0f0;}
.hs-preview-cta h3{font-size:1.05rem;font-weight:800;margin:10px 0 6px;color:#333;}
.hs-preview-cta p{font-size:.82rem;color:#777;line-height:1.5;margin-bottom:18px;}
.hs-preview-cta-btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;}
.hs-preview-cta-btns .hs-register-btn{background:#d68b9d;color:white;}
.hs-preview-cta-btns .hs-register-btn:hover{background:#c27a8c;}
.hs-preview-cta-btns .hs-login-btn{background:white;color:#d68b9d;border-color:#d68b9d;}

/* Loading */
.hs-loading{text-align:center;padding:50px;color:#bbb;}
.hs-spinner{
  width:36px;height:36px;border:4px solid #fdf2f5;
  border-top-color:#d68b9d;border-radius:50%;
  animation:hs-spin .8s linear infinite;margin:0 auto 12px;
}
@keyframes hs-spin{to{transform:rotate(360deg)}}
.hs-empty{text-align:center;padding:40px;color:#bbb;}
.hs-empty span{font-size:2.5rem;display:block;margin-bottom:10px;}

@media(max-width:768px){
  .hs-articles-section{padding:40px 16px;}
  .hs-title{font-size:1.4rem;}
  .hs-grid{grid-template-columns:1fr;}
  .hs-header{flex-direction:column;}
  .hs-guest-cta-inner{flex-direction:column;text-align:center;}
}
`;