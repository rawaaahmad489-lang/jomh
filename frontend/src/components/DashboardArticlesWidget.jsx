// src/components/DashboardArticlesWidget.jsx
// ─── Drop into MotherDashboard between the hero and the children section ────
// Usage: <DashboardArticlesWidget isAr={isAr} navigate={navigate} />
import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

export default function DashboardArticlesWidget({ isAr, navigate }) {
  const [articles, setArticles] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    fetchTopRated();
  }, []);

 const fetchTopRated = async () => {
const { data, error } = await supabase
  .from("articles")
  .select(`
    article_id, title, content, cover_image_url,
    reading_time_minutes, created_at, subcategory_id,
    article_subcategories (
      name_ar, name_en, icon,
      article_main_categories ( target )
    ),
    doctor_profiles!articles_doctor_id_fkey (
      specialization,
      users!doctor_profiles_doctor_id_fkey ( name, avatar_url )
    ),
    article_ratings ( rating )
  `)
  .eq("status", "approved")
  .order("created_at", { ascending: false })
  .limit(40);
  if (error) {
    console.error("❌ fetchTopRated error:", error.message);
    setLoading(false);
    return;
  }
 
  if (data) {
    const withAvg = data.map(a => ({
      ...a,
      _avg: a.article_ratings?.length
        ? a.article_ratings.reduce((s, r) => s + r.rating, 0) / a.article_ratings.length
        : 0,
    }));
    const top = withAvg.sort((a, b) => b._avg - a._avg).slice(0, 4);
    setArticles(top);
  }
  setLoading(false);
};
 

  const stars = (avg) =>
    Array.from({ length: 5 }, (_, i) => (
      <i key={i}
        className="fas fa-star"
        style={{ color: i < Math.round(avg) ? "#f1c40f" : "#e0e0e0", fontSize: ".75rem" }}
      />
    ));

  return (
    <section className="daw-section animate delay-2">
      <style>{CSS}</style>

      {/* Header */}
      <div className="daw-header">
        <div>
          <h3 className="daw-title">
            <span className="daw-icon"><i className="fas fa-star" /></span>
            {isAr ? "المقالات الأعلى تقييماً" : "Top Rated Articles"}
          </h3>
          <p className="daw-sub">
            {isAr
              ? "منتقاة بناءً على تقييمات الأمهات"
              : "Curated based on mothers' ratings"}
          </p>
        </div>
        <button className="daw-all-btn" onClick={() => navigate("/articles")}>
          <i className="fas fa-newspaper" />
          {isAr ? "كل المقالات" : "All Articles"}
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="daw-loading">
          <div className="daw-spinner" />
        </div>
      ) : articles.length === 0 ? (
        <div className="daw-empty">
          <span>📄</span>
          <p>{isAr ? "لا توجد مقالات بعد" : "No articles yet"}</p>
        </div>
      ) : (
        <div className="daw-grid">
          {articles.map(art => {
            const doctor  = art.doctor_profiles?.users?.name || (isAr ? "طبيب" : "Doctor");
            const spec    = art.doctor_profiles?.specialization || "";
            const avatar  = art.doctor_profiles?.users?.avatar_url;
            const avg     = art._avg || 0;
            const count   = art.article_ratings?.length || 0;
            const subName = isAr
              ? art.article_subcategories?.name_ar
              : art.article_subcategories?.name_en;
            const target  = art.article_subcategories?.article_main_categories?.target;

            return (
              <div
                key={art.article_id}
                className="daw-card"
                onClick={() => navigate(`/articles/${art.article_id}`)}
              >
                {/* Cover or default */}
                <div
                  className="daw-card-cover"
                  style={art.cover_image_url
                    ? { backgroundImage: `url(${art.cover_image_url})` }
                    : {}}
                >
                  {!art.cover_image_url && <i className="fas fa-newspaper" />}
                  {target && (
                    <span className={`daw-target-chip daw-target-${target}`}>
                      <i className={target === "mother" ? "fas fa-heart" : "fas fa-baby"} />
                      {isAr
                        ? (target === "mother" ? "الأم" : "الطفل")
                        : (target === "mother" ? "Mother" : "Child")}
                    </span>
                  )}
                </div>

                <div className="daw-card-body">
                  {subName && (
                    <span className="daw-subcat">
                      <i className={art.article_subcategories?.icon} />
                      {subName}
                    </span>
                  )}

                  <h4 className="daw-card-title">{art.title}</h4>

                  <p className="daw-card-excerpt">
                    {(art.content || "").replace(/<[^>]+>/g, "").slice(0, 80)}…
                  </p>

                  {/* Rating */}
                  {avg > 0 && (
                    <div className="daw-stars">
                      {stars(avg)}
                      <span className="daw-avg-val">{avg.toFixed(1)}</span>
                      <span className="daw-rating-count">({count})</span>
                    </div>
                  )}

                  {/* Doctor */}
                  <div className="daw-doctor">
                    {avatar
                      ? <img src={avatar} alt="" className="daw-doc-avatar" />
                      : <div className="daw-doc-init">{doctor.charAt(0)}</div>}
                    <div>
                      <span className="daw-doc-name">{doctor}</span>
                      {spec && <span className="daw-doc-spec">{spec}</span>}
                    </div>
                    {art.reading_time_minutes && (
                      <span className="daw-read-time">
                        <i className="fas fa-clock" />
                        {art.reading_time_minutes}{isAr ? "د" : "m"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom CTA */}
      <div className="daw-cta">
        <button className="daw-cta-btn" onClick={() => navigate("/articles")}>
          <i className="fas fa-arrow-left" style={{ transform: isAr ? "none" : "rotate(180deg)" }} />
          {isAr ? "استعراض كل المقالات" : "Browse All Articles"}
        </button>
      </div>
    </section>
  );
}

const CSS = `
.daw-section{
  background:white;border-radius:20px;padding:24px;
  border:1px solid #fdf2f5;box-shadow:0 5px 20px rgba(0,0,0,.04);
  margin-bottom:26px;
}
.daw-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;flex-wrap:wrap;gap:12px;}
.daw-title{font-size:1.05rem;font-weight:800;color:#333;display:flex;align-items:center;gap:9px;margin-bottom:4px;}
.daw-icon{width:34px;height:34px;border-radius:10px;background:#fdf2f5;color:#d68b9d;
  display:flex;align-items:center;justify-content:center;font-size:.9rem;}
.daw-sub{font-size:.78rem;color:#999;font-weight:600;padding-inline-start:43px;}
.daw-all-btn{
  display:flex;align-items:center;gap:8px;
  background:#d68b9d;color:white;border:none;
  padding:9px 18px;border-radius:12px;
  font-family:'Cairo','Poppins',sans-serif;font-weight:800;font-size:.82rem;
  cursor:pointer;transition:.3s;box-shadow:0 3px 12px rgba(214,139,157,.25);
}
.daw-all-btn:hover{background:#c27a8c;transform:translateY(-1px);}

/* grid */
.daw-grid{
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(240px,1fr));
  gap:14px;margin-bottom:18px;
}

/* card */
.daw-card{
  border-radius:16px;border:1px solid #f0f0f0;overflow:hidden;
  cursor:pointer;transition:.3s;background:#fafafa;display:flex;flex-direction:column;
}
.daw-card:hover{box-shadow:0 6px 22px rgba(214,139,157,.15);transform:translateY(-3px);background:white;}
.daw-card-cover{
  height:110px;background-size:cover;background-position:center;
  background-color:#fdf2f5;position:relative;
  display:flex;align-items:center;justify-content:center;
}
.daw-card-cover>i{font-size:1.8rem;color:#eab8c6;opacity:.6;}
.daw-target-chip{
  position:absolute;top:8px;inset-inline-end:8px;
  display:flex;align-items:center;gap:4px;
  padding:3px 8px;border-radius:10px;font-size:.68rem;font-weight:800;
}
.daw-target-mother{background:rgba(253,242,245,.9);color:#d68b9d;}
.daw-target-child{background:rgba(240,250,244,.9);color:#2ecc71;}
.daw-card-body{padding:12px;display:flex;flex-direction:column;gap:6px;flex:1;}
.daw-subcat{
  display:inline-flex;align-items:center;gap:4px;
  background:#fdf2f5;color:#d68b9d;
  padding:2px 8px;border-radius:8px;font-size:.68rem;font-weight:800;align-self:flex-start;
}
.daw-card-title{font-size:.88rem;font-weight:800;color:#333;line-height:1.4;}
.daw-card-excerpt{font-size:.75rem;color:#888;line-height:1.5;}
.daw-stars{display:flex;align-items:center;gap:4px;}
.daw-avg-val{font-size:.75rem;font-weight:800;color:#f1c40f;}
.daw-rating-count{font-size:.68rem;color:#bbb;}
.daw-doctor{display:flex;align-items:center;gap:7px;margin-top:4px;}
.daw-doc-avatar{width:24px;height:24px;border-radius:50%;object-fit:cover;border:1.5px solid #fdf2f5;}
.daw-doc-init{width:24px;height:24px;border-radius:50%;background:#fdf2f5;color:#d68b9d;
  display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.65rem;}
.daw-doc-name{display:block;font-size:.72rem;font-weight:700;color:#333;line-height:1.1;}
.daw-doc-spec{display:block;font-size:.65rem;color:#d68b9d;}
.daw-read-time{font-size:.65rem;color:#bbb;display:flex;align-items:center;gap:3px;margin-inline-start:auto;}

/* CTA */
.daw-cta{text-align:center;}
.daw-cta-btn{
  background:#fdf2f5;color:#d68b9d;border:none;
  padding:10px 28px;border-radius:12px;
  font-family:'Cairo','Poppins',sans-serif;font-weight:800;font-size:.85rem;
  cursor:pointer;transition:.3s;display:inline-flex;align-items:center;gap:8px;
}
.daw-cta-btn:hover{background:#d68b9d;color:white;}

/* loading / empty */
.daw-loading{text-align:center;padding:30px;}
.daw-spinner{width:32px;height:32px;border:3px solid #fdf2f5;border-top-color:#d68b9d;
  border-radius:50%;animation:daw-spin .8s linear infinite;margin:0 auto;}
@keyframes daw-spin{to{transform:rotate(360deg)}}
.daw-empty{text-align:center;padding:30px;color:#bbb;}
.daw-empty span{font-size:2rem;display:block;margin-bottom:8px;}
.daw-empty p{font-size:.85rem;font-weight:600;}

@media(max-width:600px){.daw-grid{grid-template-columns:1fr;}}
`;