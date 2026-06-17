// src/pages/mother/ArticleDetailPage.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../../../services/supabaseClient";

export default function ArticleDetailPage() {
  const { id }   = useParams();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isAr = i18n.language === "ar";
  const dir  = isAr ? "rtl" : "ltr";

  const articleBodyRef = useRef(null);
  const [progress,    setProgress]    = useState(0);
  const [article,     setArticle]     = useState(null);
  const [doctorInfo,  setDoctorInfo]  = useState(null); // { name, avatar_url, specialization, bio, experience_years }
  const [user,        setUser]        = useState(null);
  const [isSaved,     setIsSaved]     = useState(false);
  const [userRating,  setUserRating]  = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [avgRating,   setAvgRating]   = useState(null);
  const [ratingCount, setRatingCount] = useState(0);
  const [comments,    setComments]    = useState([]);
  const [newComment,  setNewComment]  = useState("");
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [ratingAnim,  setRatingAnim]  = useState(false);
// أضف هذه الدالة لعرض الصور بحجم أكبر عند النقر
const [selectedImage, setSelectedImage] = useState(null);
  // ── scroll progress ───────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      const el = articleBodyRef.current;
      if (!el) return;
      const { top, height } = el.getBoundingClientRect();
      const scrollable = height - window.innerHeight;
      const pct = scrollable > 0
        ? Math.min(100, Math.max(0, (-top / scrollable) * 100))
        : 100;
      setProgress(pct);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── load current user ─────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: au } }) => {
      if (!au) return;
      const { data } = await supabase
        .from("users")
        .select("user_id, name, avatar_url, role")
        .eq("auth_id", au.id)
        .single();
      setUser(data);
    });
  }, []);

  // ── load article (NO nested users join) ───────────────────────────────────
  const loadArticle = useCallback(async () => {
    setLoading(true);

   

  // Step 1: fetch article core data مع إضافة media_files
  const { data: art, error } = await supabase
    .from("articles")
    .select(`
      article_id,
      title,
      content,
      cover_image_url,
      cover_image_storage_path,
      media_urls,
      media_files,
      reading_time_minutes,
      views_count,
      created_at,
      updated_at,
      doctor_id,
      subcategory_id,
      article_subcategories (
        id, name_ar, name_en, icon,
        article_main_categories ( id, name_ar, name_en, target )
      ),
      article_ratings ( user_id, rating ),
      article_comments (
        comment_id, content, is_deleted, created_at, user_id
      )
    `)
    .eq("article_id", id)
    .single();

  if (error || !art) {
    console.error("❌ loadArticle error:", error?.message);
    setLoading(false);
    return;
  }

  setArticle(art);

    // Step 2: fetch doctor profile separately
    if (art.doctor_id) {
      const { data: profile } = await supabase
        .from("doctor_profiles")
        .select("doctor_id, specialization, certifications, experience_years, bio")
        .eq("doctor_id", art.doctor_id)
        .single();

      const { data: docUser } = await supabase
        .from("users")
        .select("user_id, name, avatar_url")
        .eq("user_id", art.doctor_id)
        .single();

      setDoctorInfo({
        ...(profile || {}),
        name:       docUser?.name       || "",
        avatar_url: docUser?.avatar_url || null,
      });
    }

    // Step 3: enrich comments with user info
    const rawComments = (art.article_comments || []).filter(c => !c.is_deleted);
    if (rawComments.length) {
      const userIds = [...new Set(rawComments.map(c => c.user_id).filter(Boolean))];
      const { data: commentUsers } = await supabase
        .from("users")
        .select("user_id, name, avatar_url")
        .in("user_id", userIds);

      const userMap = {};
      (commentUsers || []).forEach(u => { userMap[u.user_id] = u; });

      const enriched = rawComments
        .map(c => ({ ...c, users: userMap[c.user_id] || null }))
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      setComments(enriched);
    } else {
      setComments([]);
    }

    // Step 4: compute avg rating
    const ratings = art.article_ratings || [];
    if (ratings.length) {
      setAvgRating((ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1));
      setRatingCount(ratings.length);
    }

    // Step 5: increment view count (fire-and-forget)
    supabase.from("articles")
      .update({ views_count: (art.views_count || 0) + 1 })
      .eq("article_id", id);

    setLoading(false);
  }, [id]);

  useEffect(() => { loadArticle(); }, [loadArticle]);

  // ── check saved + user's own rating after both user & article load ────────
  useEffect(() => {
    if (!user || !article) return;

    // Is this article saved?
    supabase.from("saved_articles")
      .select("id")
      .eq("user_id", user.user_id)
      .eq("article_id", id)
      .maybeSingle()
      .then(({ data }) => setIsSaved(!!data));

    // User's own rating
    const mine = (article.article_ratings || []).find(r => r.user_id === user.user_id);
    if (mine) setUserRating(mine.rating);
  }, [user, article, id]);

  // ── toggle save ────────────────────────────────────────────────────────────
  const toggleSave = async () => {
    if (!user) { navigate("/login"); return; }
    if (isSaved) {
      await supabase.from("saved_articles")
        .delete()
        .eq("user_id", user.user_id)
        .eq("article_id", id);
      setIsSaved(false);
    } else {
      await supabase.from("saved_articles")
        .insert({ user_id: user.user_id, article_id: id });
      setIsSaved(true);
    }
  };

  // ── submit rating ──────────────────────────────────────────────────────────
  const submitRating = async (val) => {
    if (!user) { navigate("/login"); return; }
    setUserRating(val);
    setRatingAnim(true);
    setTimeout(() => setRatingAnim(false), 600);

    await supabase.from("article_ratings")
      .upsert(
        { article_id: id, user_id: user.user_id, rating: val },
        { onConflict: "article_id,user_id" }
      );

    // Refresh avg
    const { data } = await supabase
      .from("article_ratings")
      .select("rating")
      .eq("article_id", id);

    if (data?.length) {
      setAvgRating((data.reduce((s, r) => s + r.rating, 0) / data.length).toFixed(1));
      setRatingCount(data.length);
    }
  };

  // ── submit comment ─────────────────────────────────────────────────────────
  const submitComment = async () => {
    if (!newComment.trim() || !user) return;
    setSubmitting(true);

    // Insert comment
    const { data: inserted } = await supabase
      .from("article_comments")
      .insert({
        article_id: id,
        user_id:    user.user_id,
        content:    newComment.trim(),
      })
      .select("comment_id, content, created_at, user_id")
      .single();

    if (inserted) {
      // Attach user info locally (no extra query needed)
      setComments(prev => [
        ...prev,
        {
          ...inserted,
          users: {
            user_id:    user.user_id,
            name:       user.name,
            avatar_url: user.avatar_url,
          },
        },
      ]);
    }

    setNewComment("");
    setSubmitting(false);
  };

  // ── media renderer ─────────────────────────────────────────────────────────

const renderMedia = (articleData) => {
  // دمج الملفات المرفوعة والروابط القديمة
  let allMedia = [];
  
  // إضافة media_files (الملفات المرفوعة حديثاً)
  if (articleData?.media_files && Array.isArray(articleData.media_files)) {
    allMedia = [...allMedia, ...articleData.media_files];
  }
  
  // إضافة media_urls القديمة (للتوافق مع المقالات القديمة)
  if (articleData?.media_urls && Array.isArray(articleData.media_urls)) {
    allMedia = [...allMedia, ...articleData.media_urls];
  }
  
  // إزالة التكرارات بناءً على URL
  allMedia = allMedia.filter((item, index, self) => 
    index === self.findIndex((t) => t.url === item.url)
  );
  
  if (!allMedia.length) return null;
  
  return (
    <div className="adp-media-grid">
      {allMedia.map((m, i) => {
        // صورة
        if (m.type === "image") {
          return (
            <div key={i} className="adp-media-item">
            <img
  src={m.url}
  alt={m.caption || ""}
  className="adp-media-img"
  loading="lazy"
  onClick={() => setSelectedImage(m.url)}
  style={{ cursor: "pointer" }}
  onError={(e) => {
    e.target.src = "/placeholder-image.png";
    e.target.alt = "Image failed to load";
  }}
/>
              {m.caption && <p className="adp-media-caption">{m.caption}</p>}
            </div>
          );
        }
        
        // فيديو
        if (m.type === "video") {
          // معالجة روابط YouTube
          let videoUrl = m.url;
          if (m.url.includes("youtube.com/watch?v=")) {
            videoUrl = m.url.replace("watch?v=", "embed/");
          } else if (m.url.includes("youtu.be/")) {
            const videoId = m.url.split("youtu.be/")[1]?.split("?")[0];
            videoUrl = `https://www.youtube.com/embed/${videoId}`;
          }
          
          return (
            <div key={i} className="adp-media-item">
              <div className="adp-video-wrap">
                <iframe 
                  src={videoUrl} 
                  frameBorder="0" 
                  allowFullScreen
                  title={m.caption || "video"} 
                  className="adp-video-iframe"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
              {m.caption && <p className="adp-media-caption">{m.caption}</p>}
            </div>
          );
        }
        
        // رابط / ملف صوتي / آخر
        if (m.type === "link" || m.type === "audio") {
          return (
            <div key={i} className="adp-media-item adp-link-item">
              <i className={`fas ${m.type === "audio" ? "fa-headphones" : "fa-link"}`} />
              <a href={m.url} target="_blank" rel="noopener noreferrer">
                {m.caption || m.url}
              </a>
            </div>
          );
        }
        
        return null;
      })}
    </div>
  );
};







  // ── derived values ────────────────────────────────────────────────────────
  const doctor     = doctorInfo?.name          || (isAr ? "طبيب" : "Doctor");
  const spec       = doctorInfo?.specialization || "";
  const avatar     = doctorInfo?.avatar_url     || null;
  const bio        = doctorInfo?.bio            || "";
  const exp        = doctorInfo?.experience_years;
  const subcat = article?.article_subcategories || null;
  const subcatName = subcat
  ? (isAr ? subcat.name_ar : subcat.name_en)
  : "";
if (loading || !article) {
  return (
    <div className="adp-loading">
      <div className="adp-spinner" />
      <p>{isAr ? "جاري تحميل المقال..." : "Loading article..."}</p>
    </div>
  );
}
  return (
    <div className="adp-root" dir={dir} ref={articleBodyRef}>
      <style>{CSS}</style>

      {/* ══ SCROLL PROGRESS BAR ══ */}
      <div className="adp-progress-bar" style={{ width: `${progress}%` }} />

      {/* ══ TOP NAV ══ */}
      <header className="adp-topnav">
        <button className="adp-back" onClick={() => navigate(-1)}>
          <i className={`fas fa-chevron-${isAr ? "right" : "left"}`} />
          {isAr ? "رجوع" : "Back"}
        </button>
        <div className="adp-topnav-actions">
          <button
            className={`adp-save-btn ${isSaved ? "saved" : ""}`}
            onClick={toggleSave}
          >
            <i className={`${isSaved ? "fas" : "far"} fa-bookmark`} />
            {isAr ? (isSaved ? "محفوظ" : "حفظ") : (isSaved ? "Saved" : "Save")}
          </button>
        </div>
      </header>

      {/* ══ ARTICLE ══ */}
      <article className="adp-article">

      {/* Cover */}
{article?.cover_image_url && (
  <div className="adp-cover">
    <img
      src={article.cover_image_url}
      alt={article.title}
      onError={(e) => {
        if (article.cover_image_storage_path) {
          const { data: { publicUrl } } = supabase.storage
            .from("article-media")
            .getPublicUrl(article.cover_image_storage_path);

          e.target.src = publicUrl;
        }
      }}
    />
  </div>
)}

        <div className="adp-content-wrap">

          {/* Breadcrumb */}
          {subcatName && (
            <div className="adp-breadcrumb">
              <i className={subcat.icon || "fas fa-folder"} />
              <span>
                {isAr
                  ? subcat.article_main_categories?.name_ar
                  : subcat.article_main_categories?.name_en}
              </span>
              <i className="fas fa-chevron-right adp-bc-arrow" />
              <span>{subcatName}</span>
            </div>
          )}

          {/* Title */}
          <h1 className="adp-title">{article.title}</h1>

          {/* Meta row */}
          <div className="adp-meta-row">
            <div className="adp-author">
              {avatar
                ? <img src={avatar} alt="" className="adp-author-avatar" />
                : <div className="adp-author-init">{doctor.charAt(0)}</div>}
              <div>
                <span className="adp-author-name">{doctor}</span>
                {spec && <span className="adp-author-spec">{spec}</span>}
              </div>
            </div>
            <div className="adp-meta-right">
              {article.reading_time_minutes && (
                <span className="adp-read-time">
                  <i className="fas fa-clock" />
                  {article.reading_time_minutes} {isAr ? "دقيقة" : "min read"}
                </span>
              )}
              <span className="adp-date">
                <i className="fas fa-calendar" />
                {new Date(article.created_at).toLocaleDateString(
                  isAr ? "ar-SA" : "en-US",
                  { year: "numeric", month: "long", day: "numeric" }
                )}
              </span>
            </div>
          </div>

          {/* Rating summary */}
          {avgRating && (
            <div className="adp-rating-summary">
              <span className="adp-avg-num">{avgRating}</span>
              <div className="adp-stars-display">
                {Array.from({ length: 5 }, (_, i) => (
                  <i key={i} className="fas fa-star"
                    style={{ color: i < Math.round(avgRating) ? "#f1c40f" : "#e0e0e0" }} />
                ))}
              </div>
              <span className="adp-rating-count">
                ({ratingCount} {isAr ? "تقييم" : "ratings"})
              </span>
            </div>
          )}

          {/* Article body */}
          <div
            className="adp-body-text"
            dangerouslySetInnerHTML={{ __html: article.content || "" }}
          />

          {/* Media */}
          {renderMedia(article)}


          {/* Doctor card */}
          {(bio || spec || exp) && (
            <div className="adp-doctor-card">
              <h3 className="adp-doctor-card-title">
                <i className="fas fa-user-md" />
                {isAr ? "عن الطبيب" : "About the Doctor"}
              </h3>
              <div className="adp-doctor-card-inner">
                {avatar
                  ? <img src={avatar} alt="" className="adp-doctor-card-avatar" />
                  : <div className="adp-doctor-card-init">{doctor.charAt(0)}</div>}
                <div>
                  <h4>{doctor}</h4>
                  {spec && <p className="adp-doctor-spec">{spec}</p>}
                  {exp && (
                    <p className="adp-doctor-exp">
                      <i className="fas fa-briefcase" />
                      {exp} {isAr ? "سنوات خبرة" : "years experience"}
                    </p>
                  )}
                  {bio && <p className="adp-doctor-bio">{bio}</p>}
                </div>
              </div>
            </div>
          )}

          {/* ── Interactive Rating ── */}
          <div className="adp-rate-section">
            <h3>
              <i className="fas fa-star" />
              {isAr ? "قيّمي هذا المقال" : "Rate this Article"}
            </h3>
            <div className={`adp-rate-stars ${ratingAnim ? "anim" : ""}`}>
              {Array.from({ length: 5 }, (_, i) => {
                const val    = i + 1;
                const filled = val <= (hoverRating || userRating);
                return (
                  <i
                    key={i}
                    className={`fas fa-star adp-star ${filled ? "active" : ""}`}
                    onMouseEnter={() => setHoverRating(val)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => submitRating(val)}
                  />
                );
              })}
            </div>
            {userRating > 0 && (
              <p className="adp-your-rating">
                {isAr ? `تقييمكِ: ${userRating}/5 ⭐` : `Your rating: ${userRating}/5 ⭐`}
              </p>
            )}
            {!user && (
              <p className="adp-login-to-rate">
                <button onClick={() => navigate("/login")} className="adp-login-link">
                  {isAr ? "سجّلي دخولك للتقييم" : "Login to rate"}
                </button>
              </p>
            )}
          </div>

          {/* ── Comments ── */}
          <div className="adp-comments-section">
            <h3 className="adp-comments-title">
              <i className="fas fa-comments" />
              {isAr ? "التعليقات" : "Comments"}
              <span className="adp-comment-count">{comments.length}</span>
            </h3>

            {comments.length === 0 ? (
              <div className="adp-no-comments">
                <i className="fas fa-comment-slash" />
                <p>
                  {isAr
                    ? "لا توجد تعليقات بعد. كوني أول من يعلّق!"
                    : "No comments yet. Be the first!"}
                </p>
              </div>
            ) : (
              <div className="adp-comments-list">
                {comments.map(c => (
                  <div key={c.comment_id} className="adp-comment">
                    {c.users?.avatar_url
                      ? <img src={c.users.avatar_url} alt="" className="adp-comment-avatar" />
                      : <div className="adp-comment-init">
                          {(c.users?.name || "U").charAt(0)}
                        </div>}
                    <div className="adp-comment-body">
                      <div className="adp-comment-header">
                        <strong>{c.users?.name || (isAr ? "مجهول" : "Anonymous")}</strong>
                        <span className="adp-comment-time">
                          {new Date(c.created_at).toLocaleDateString(
                            isAr ? "ar-SA" : "en-US",
                            { month: "short", day: "numeric" }
                          )}
                        </span>
                      </div>
                      <p>{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {user ? (
              <div className="adp-comment-input-wrap">
                <div className="adp-comment-input-row">
                  {user.avatar_url
                    ? <img src={user.avatar_url} alt="" className="adp-comment-avatar" />
                    : <div className="adp-comment-init">{(user.name || "U").charAt(0)}</div>}
                  <textarea
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        submitComment();
                      }
                    }}
                    placeholder={isAr ? "أضيفي تعليقاً..." : "Add a comment..."}
                    className="adp-comment-textarea"
                    rows="2"
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    className="adp-submit-comment"
                    onClick={submitComment}
                    disabled={submitting || !newComment.trim()}
                  >
                    {submitting
                      ? <i className="fas fa-spinner fa-spin" />
                      : <><i className="fas fa-paper-plane" /> {isAr ? "إرسال" : "Send"}</>}
                  </button>
                </div>
              </div>
            ) : (
              <div className="adp-login-prompt">
                <i className="fas fa-lock" />
                <span>{isAr ? "سجّلي دخولك للتعليق" : "Login to leave a comment"}</span>
                <button onClick={() => navigate("/login")} className="adp-login-link">
                  {isAr ? "تسجيل الدخول" : "Login"}
                </button>
              </div>
            )}
          </div>

        </div>
      </article>
{/* Lightbox */}
{selectedImage && (
  <div
    className="adp-lightbox"
    onClick={() => setSelectedImage(null)}
  >
    <div
      className="adp-lightbox-content"
      onClick={(e) => e.stopPropagation()}
    >
      <img src={selectedImage} alt="Full size" />

      <button
        className="adp-lightbox-close"
        onClick={() => setSelectedImage(null)}
      >
        <i className="fas fa-times" />
      </button>
    </div>
  </div>
)}


    </div>
  );
}

// ── CSS ────────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Poppins:wght@400;600;700;800&display=swap');
:root{
  --primary:#d68b9d;--primary-light:#fdf2f5;--secondary:#eab8c6;
  --bg:#FBF9F8;--text:#333;--gray:#777;--white:#fff;
  --shadow:0 4px 20px rgba(0,0,0,.05);--radius:18px;
}
*{margin:0;padding:0;box-sizing:border-box;font-family:'Cairo','Poppins',sans-serif;}

/* ── progress bar ── */
.adp-progress-bar{
  position:fixed;top:0;left:0;height:4px;
  background:linear-gradient(to right,#d68b9d,#eab8c6,#d68b9d);
  background-size:200% auto;z-index:9999;
  transition:width .1s linear;
  animation:shimmer 2s linear infinite;
  box-shadow:0 0 10px rgba(214,139,157,.5);
}
[dir=rtl] .adp-progress-bar{left:auto;right:0;}
@keyframes shimmer{0%{background-position:0% center}100%{background-position:200% center}}

.adp-root{min-height:100vh;background:var(--bg);}

/* ── top nav ── */
.adp-topnav{
  position:sticky;top:4px;z-index:200;background:var(--white);
  border-bottom:1px solid #f0e8ec;padding:0 28px;height:62px;
  display:flex;align-items:center;justify-content:space-between;
  box-shadow:0 2px 12px rgba(0,0,0,.04);
}
.adp-back{
  display:flex;align-items:center;gap:7px;background:none;border:none;
  font-family:'Cairo','Poppins';font-weight:700;color:var(--gray);
  cursor:pointer;font-size:.88rem;padding:8px 12px;border-radius:10px;transition:.2s;
}
.adp-back:hover{background:var(--primary-light);color:var(--primary);}
.adp-topnav-actions{display:flex;gap:10px;}
.adp-save-btn{
  display:flex;align-items:center;gap:7px;background:#f4f4f4;border:none;
  padding:8px 16px;border-radius:20px;font-family:'Cairo','Poppins';
  font-weight:700;font-size:.82rem;color:var(--gray);cursor:pointer;transition:.3s;
}
.adp-save-btn:hover,.adp-save-btn.saved{background:var(--primary-light);color:var(--primary);}

/* ── article ── */
.adp-article{max-width:780px;margin:0 auto;padding:0 0 80px;}
.adp-cover{width:100%;height:320px;overflow:hidden;}
.adp-cover img{width:100%;height:100%;object-fit:cover;}
.adp-content-wrap{padding:32px 28px;}

/* breadcrumb */
.adp-breadcrumb{
  display:inline-flex;align-items:center;gap:7px;
  font-size:.78rem;font-weight:700;color:var(--primary);
  margin-bottom:16px;background:var(--primary-light);
  padding:7px 14px;border-radius:12px;
}
.adp-bc-arrow{font-size:.65rem;}

/* title */
.adp-title{font-size:1.8rem;font-weight:900;color:var(--text);line-height:1.35;margin-bottom:18px;}

/* meta */
.adp-meta-row{
  display:flex;justify-content:space-between;align-items:center;
  padding-bottom:18px;border-bottom:1px solid #f0f0f0;
  margin-bottom:18px;flex-wrap:wrap;gap:12px;
}
.adp-author{display:flex;align-items:center;gap:12px;}
.adp-author-avatar{width:46px;height:46px;border-radius:50%;object-fit:cover;border:2px solid var(--primary-light);}
.adp-author-init{
  width:46px;height:46px;border-radius:50%;background:var(--primary-light);
  color:var(--primary);display:flex;align-items:center;justify-content:center;
  font-weight:800;font-size:1.2rem;
}
.adp-author-name{display:block;font-weight:800;color:var(--text);}
.adp-author-spec{display:block;font-size:.78rem;color:var(--primary);font-weight:700;}
.adp-meta-right{display:flex;gap:14px;font-size:.78rem;color:var(--gray);font-weight:600;}
.adp-meta-right span{display:flex;align-items:center;gap:5px;}
.adp-meta-right i{color:var(--secondary);}

/* rating summary bar */
.adp-rating-summary{
  display:inline-flex;align-items:center;gap:10px;
  background:var(--primary-light);padding:10px 18px;
  border-radius:14px;margin-bottom:22px;
}
.adp-avg-num{font-size:1.4rem;font-weight:800;color:var(--primary);}
.adp-stars-display{display:flex;gap:3px;}
.adp-rating-count{font-size:.8rem;color:var(--gray);font-weight:600;}

/* body text */
.adp-body-text{font-size:1rem;color:#444;line-height:1.9;margin-bottom:28px;}
.adp-body-text h1,.adp-body-text h2,.adp-body-text h3{color:var(--text);margin:20px 0 10px;font-weight:800;}
.adp-body-text p{margin-bottom:14px;}
.adp-body-text ul,.adp-body-text ol{padding-inline-start:22px;margin-bottom:14px;}
.adp-body-text li{margin-bottom:6px;}
.adp-body-text blockquote{
  border-inline-start:4px solid var(--secondary);padding:10px 18px;
  background:var(--primary-light);border-radius:0 10px 10px 0;
  font-style:italic;margin:16px 0;
}
.adp-body-text a{color:var(--primary);text-decoration:underline;}
.adp-body-text img{max-width:100%;border-radius:12px;margin:14px 0;}

/* media */
.adp-media-grid{display:flex;flex-direction:column;gap:16px;margin-bottom:28px;}
.adp-media-item{border-radius:14px;overflow:hidden;background:#fafafa;border:1px solid #eee;}
.adp-media-img{width:100%;max-height:400px;object-fit:cover;display:block;}
.adp-media-caption{padding:8px 12px;font-size:.78rem;color:var(--gray);font-weight:600;text-align:center;}
.adp-video-wrap{position:relative;padding-bottom:56.25%;height:0;}
.adp-video-iframe{position:absolute;top:0;left:0;width:100%;height:100%;border:none;}
.adp-link-item{display:flex;align-items:center;gap:12px;padding:14px 18px;}
.adp-link-item i{color:var(--primary);}
.adp-link-item a{color:var(--primary);font-weight:700;text-decoration:none;font-size:.9rem;}

/* doctor card */
.adp-doctor-card{
  background:linear-gradient(135deg,#fdf2f5,#fff);border:1px solid var(--secondary);
  border-radius:18px;padding:22px;margin-bottom:28px;
}
.adp-doctor-card-title{
  font-size:.95rem;font-weight:800;color:var(--primary);
  display:flex;align-items:center;gap:9px;margin-bottom:16px;
}
.adp-doctor-card-inner{display:flex;gap:16px;align-items:flex-start;}
.adp-doctor-card-avatar{width:64px;height:64px;border-radius:50%;object-fit:cover;border:3px solid var(--primary-light);}
.adp-doctor-card-init{
  width:64px;height:64px;border-radius:50%;background:var(--secondary);
  color:white;display:flex;align-items:center;justify-content:center;
  font-size:1.6rem;font-weight:800;
}
.adp-doctor-card-inner h4{font-size:1rem;font-weight:800;margin-bottom:4px;}
.adp-doctor-spec{font-size:.82rem;color:var(--primary);font-weight:700;}
.adp-doctor-exp{font-size:.8rem;color:var(--gray);margin:4px 0;display:flex;align-items:center;gap:5px;}
.adp-doctor-bio{font-size:.83rem;color:#555;line-height:1.6;margin-top:6px;}

/* interactive rating */
.adp-rate-section{
  background:var(--primary-light);border-radius:18px;
  padding:22px;margin-bottom:28px;text-align:center;
}
.adp-rate-section h3{
  font-size:1rem;font-weight:800;color:var(--text);margin-bottom:14px;
  display:flex;align-items:center;justify-content:center;gap:8px;
}
.adp-rate-section h3 i{color:#f1c40f;}
.adp-rate-stars{display:flex;justify-content:center;gap:10px;}
.adp-star{font-size:2rem;color:#e0e0e0;cursor:pointer;transition:.2s;}
.adp-star.active{color:#f1c40f;}
.adp-star:hover{transform:scale(1.2);}
@keyframes pop{0%{transform:scale(1)}50%{transform:scale(1.3)}100%{transform:scale(1)}}
.adp-rate-stars.anim .adp-star.active{animation:pop .4s ease;}
.adp-your-rating{font-size:.88rem;font-weight:700;color:var(--primary);margin-top:12px;}
.adp-login-to-rate{
  display:flex;align-items:center;gap:8px;justify-content:center;
  font-size:.85rem;color:var(--gray);margin-top:10px;font-weight:600;
}
.adp-login-link{
  background:var(--primary);color:white;border:none;padding:7px 16px;
  border-radius:10px;font-family:'Cairo','Poppins';font-weight:700;
  cursor:pointer;font-size:.82rem;
}
.adp-login-link:hover{background:#c27a8c;}

/* comments */
.adp-comments-section{border-top:2px solid #f0f0f0;padding-top:28px;}
.adp-comments-title{
  font-size:1.05rem;font-weight:800;color:var(--text);margin-bottom:18px;
  display:flex;align-items:center;gap:9px;
}
.adp-comments-title i{color:var(--primary);}
.adp-comment-count{
  background:var(--primary-light);color:var(--primary);
  padding:2px 10px;border-radius:12px;font-size:.78rem;font-weight:700;
}
.adp-no-comments{text-align:center;padding:24px;color:#bbb;}
.adp-no-comments i{font-size:1.8rem;display:block;margin-bottom:8px;}
.adp-no-comments p{font-size:.88rem;font-weight:600;}
.adp-comments-list{display:flex;flex-direction:column;gap:14px;margin-bottom:20px;}
.adp-comment{display:flex;gap:12px;}
.adp-comment-avatar{width:38px;height:38px;border-radius:50%;object-fit:cover;border:2px solid var(--primary-light);}
.adp-comment-init{
  width:38px;height:38px;border-radius:50%;background:var(--primary-light);
  color:var(--primary);display:flex;align-items:center;justify-content:center;font-weight:800;
}
.adp-comment-body{flex:1;background:#f9f9f9;border-radius:0 14px 14px 14px;padding:10px 14px;}
.adp-comment-header{display:flex;justify-content:space-between;margin-bottom:5px;}
.adp-comment-header strong{font-size:.85rem;color:var(--text);}
.adp-comment-time{font-size:.72rem;color:#bbb;}
.adp-comment-body p{font-size:.85rem;color:#555;line-height:1.5;}
.adp-comment-input-wrap{background:var(--primary-light);border-radius:14px;padding:16px;}
.adp-comment-input-row{display:flex;gap:10px;margin-bottom:10px;}
.adp-comment-textarea{
  flex:1;border:1px solid #eee;border-radius:12px;padding:10px 14px;
  font-family:'Cairo','Poppins';font-size:.88rem;outline:none;
  resize:none;background:white;
}
.adp-comment-textarea:focus{border-color:var(--secondary);box-shadow:0 0 0 3px var(--primary-light);}
.adp-submit-comment{
  background:var(--primary);color:white;border:none;padding:10px 20px;
  border-radius:12px;font-family:'Cairo','Poppins';font-weight:700;
  cursor:pointer;display:flex;align-items:center;gap:7px;font-size:.85rem;transition:.3s;
}
.adp-submit-comment:hover:not(:disabled){background:#c27a8c;}
.adp-submit-comment:disabled{opacity:.6;cursor:not-allowed;}
.adp-login-prompt{
  background:var(--primary-light);padding:14px;border-radius:14px;
  display:flex;flex-wrap:wrap;align-items:center;gap:10px;
  justify-content:center;text-align:center;font-size:.85rem;
  color:var(--gray);font-weight:600;
}

/* loading / not-found */
.adp-loading{
  min-height:100vh;display:flex;flex-direction:column;
  align-items:center;justify-content:center;background:var(--bg);gap:14px;
}
.adp-spinner{
  width:42px;height:42px;border:4px solid var(--primary-light);
  border-top-color:var(--primary);border-radius:50%;
  animation:adp-spin .8s linear infinite;
}
@keyframes adp-spin{to{transform:rotate(360deg)}}
.adp-back-btn-plain{
  background:var(--primary);color:white;border:none;
  padding:10px 22px;border-radius:12px;
  font-family:'Cairo','Poppins';font-weight:700;cursor:pointer;font-size:.9rem;
}
.adp-back-btn-plain:hover{background:#c27a8c;}

@media(max-width:680px){
  .adp-content-wrap{padding:20px 16px;}
  .adp-title{font-size:1.35rem;}
  .adp-cover{height:200px;}
  .adp-topnav{padding:0 16px;}
}
  /* Lightbox for images */
.adp-lightbox{
  position:fixed;top:0;left:0;right:0;bottom:0;
  background:rgba(0,0,0,.9);z-index:10000;
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;
}
.adp-lightbox-content{
  position:relative;max-width:90vw;max-height:90vh;
}
.adp-lightbox-content img{
  max-width:100%;max-height:90vh;object-fit:contain;
  border-radius:8px;
}
.adp-lightbox-close{
  position:absolute;top:-40px;right:0;
  background:none;border:none;color:white;
  font-size:1.5rem;cursor:pointer;padding:8px;
}
.adp-lightbox-close:hover{color:var(--primary);}
`;