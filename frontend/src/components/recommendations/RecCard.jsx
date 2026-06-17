// =========================================================
// src/components/recommendations/RecCard.jsx
// =========================================================
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";

export default function RecCard({
  rec,
  isAr,
  isLiked,
  isSaved,
  onLike,
  onSave,
  onAddToCart,       // (productId) => void
  onAddAllToCart,    // () => void
  onComment,         // (content) => Promise<bool>
  myUserId,
  compact = false,   // true = داخل الداشبورد (أصغر)
}) {
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [comments,     setComments]     = useState([]);
  const [newComment,   setNewComment]   = useState("");
  const [commLoading,  setCommLoading]  = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [addedIds,     setAddedIds]     = useState(new Set()); // products added individually
  const [showMedia,    setShowMedia]    = useState(false);

  const prods      = rec.recommendation_products || [];
  const tags       = (rec.recommendation_tags || []).map(t => t.tags?.name).filter(Boolean);
  const likeCount  = (rec.recommendation_likes || []).length;
  const cmtCount   = (rec.recommendation_comments || []).filter(c => !c.is_deleted).length;
  const saveCount  = (rec.saved_recommendations || []).length;
  const doctorName = rec.doctor_profiles?.users?.name || (isAr ? "الطبيب" : "Doctor");
  const spec       = rec.doctor_profiles?.specialization || "";
  const doctorAv   = rec.doctor_profiles?.users?.avatar_url;
  const mediaUrls  = Array.isArray(rec.media_urls) ? rec.media_urls : [];

  const loadComments = async () => {
    if (showComments) { setShowComments(false); return; }
    setCommLoading(true);
    const { data } = await supabase
      .from("recommendation_comments")
      .select("*, users(name, avatar_url)")
      .eq("recommendation_id", rec.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true });
    setComments(data || []);
    setCommLoading(false);
    setShowComments(true);
  };

  const submitComment = async () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    const ok = await onComment(newComment);
    if (ok) {
      // reload comments
      const { data } = await supabase
        .from("recommendation_comments")
        .select("*, users(name, avatar_url)")
        .eq("recommendation_id", rec.id)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true });
      setComments(data || []);
      setNewComment("");
    }
    setSubmitting(false);
  };

  const handleAddOne = async (prod) => {
    await onAddToCart(prod.products.product_id);
    setAddedIds(p => new Set([...p, prod.products.product_id]));
  };

  const handleAddAll = async () => {
    await onAddAllToCart();
    setAddedIds(new Set(prods.map(p => p.products?.product_id)));
  };

  return (
    <div className={`rc-card ${compact ? "rc-compact" : ""}`}>
      <style>{CARD_CSS}</style>

      {/* Cover image */}
      {rec.cover_image && !compact && (
        <div className="rc-cover">
          <img src={rec.cover_image} alt={rec.title} />
        </div>
      )}

      {/* Header */}
      <div className="rc-header">
        <div className="rc-doctor-row">
          {doctorAv
            ? <img src={doctorAv} className="rc-doc-av" alt={doctorName} />
            : <div className="rc-doc-av rc-doc-init">{doctorName.charAt(0)}</div>}
          <div>
            <span className="rc-doc-name">د. {doctorName}</span>
            {spec && <span className="rc-doc-spec">{spec}</span>}
          </div>
          <span className="rc-date">
            {new Date(rec.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", { month: "short", day: "numeric" })}
          </span>
        </div>

        <h3 className="rc-title">{rec.title}</h3>

        {/* Age range */}
        <div className="rc-age-badge">
          <i className="fas fa-baby" />
          {rec.target_age_min}–{rec.target_age_max} {isAr ? "شهر" : "months"}
        </div>
      </div>

      {/* Description */}
      {!compact && (
        <p className="rc-desc">{rec.description}</p>
      )}
      {compact && rec.description && (
        <p className="rc-desc">{rec.description.slice(0, 120)}{rec.description.length > 120 ? "…" : ""}</p>
      )}

      {/* Video */}
      {rec.video_url && !compact && (
        <div className="rc-video-wrap">
          <iframe
            src={rec.video_url.includes("youtube") ? rec.video_url.replace("watch?v=", "embed/") : rec.video_url}
            title="video"
            allowFullScreen
            style={{ width: "100%", height: 220, border: "none", borderRadius: 12 }}
          />
        </div>
      )}

      {/* Extra media */}
      {mediaUrls.length > 0 && !compact && (
        <div>
          <button className="rc-media-toggle" onClick={() => setShowMedia(!showMedia)}>
            <i className="fas fa-images" /> {isAr ? `صور إضافية (${mediaUrls.length})` : `Extra media (${mediaUrls.length})`}
          </button>
          {showMedia && (
            <div className="rc-media-grid">
              {mediaUrls.map((m, i) => (
                m.type?.startsWith("image/")
                  ? <img key={i} src={m.url} alt={m.name} className="rc-media-img" />
                  : <a key={i} href={m.url} target="_blank" rel="noreferrer" className="rc-media-link">
                      <i className="fas fa-file" /> {m.name}
                    </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="rc-tags">
          {tags.map((t, i) => <span key={i} className="rc-tag">#{t}</span>)}
        </div>
      )}

      {/* ── PRODUCTS ── */}
      {prods.length > 0 && (
        <div className="rc-products-section">
          <div className="rc-products-header">
            <h4><i className="fas fa-box-open" /> {isAr ? "المنتجات الموصى بها" : "Recommended Products"}</h4>
            {prods.length > 1 && (
              <button className="rc-add-all-btn" onClick={handleAddAll}>
                <i className="fas fa-cart-plus" />
                {isAr ? ` إضافة الكل للسلة (${prods.length})` : ` Add All to Cart (${prods.length})`}
              </button>
            )}
          </div>

          <div className="rc-products-list">
            {prods
              .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
              .map(rp => {
                if (!rp.products) return null;
                const p       = rp.products;
                const added   = addedIds.has(p.product_id);
                const noStock = p.stock === 0;
                return (
                  <div key={rp.id} className="rc-product-row">
                    {/* Product image */}
                    <div className="rc-prod-img-wrap">
                      {p.image_url
                        ? <img src={p.image_url} alt={p.name} className="rc-prod-img" />
                        : <div className="rc-prod-img rc-prod-img-ph">🛍️</div>}
                      {rp.is_alternative && (
                        <span className="rc-alt-badge">{isAr ? "بديل" : "Alt"}</span>
                      )}
                    </div>

                    {/* Product info */}
                    <div className="rc-prod-info">
                      <div className="rc-prod-top">
                        <strong
                          className="rc-prod-name"
                          onClick={() => navigate(`/stores/${p.stores?.store_id}`)}
                        >
                          {p.name}
                        </strong>
                        <span className="rc-prod-price">₪{p.price}</span>
                      </div>
                      {p.stores?.store_name && (
                        <span className="rc-prod-store">
                          <i className="fas fa-store" /> {p.stores.store_name}
                        </span>
                      )}
                      {rp.usage_instructions && (
                        <p className="rc-prod-usage">
                          <i className="fas fa-info-circle" /> {rp.usage_instructions}
                        </p>
                      )}
                      {rp.duration_days && (
                        <p className="rc-prod-duration">
                          <i className="fas fa-calendar-day" />
                          {isAr ? ` مدة الاستخدام: ${rp.duration_days} يوم` : ` Duration: ${rp.duration_days} days`}
                        </p>
                      )}
                      {rp.notes && <p className="rc-prod-notes">{rp.notes}</p>}
                    </div>

                    {/* Add to cart */}
                    <button
                      className={`rc-add-btn ${added ? "rc-added" : ""} ${noStock ? "rc-no-stock" : ""}`}
                      onClick={() => !added && !noStock && handleAddOne(rp)}
                      disabled={added || noStock}
                    >
                      {noStock
                        ? (isAr ? "نفد" : "Out")
                        : added
                          ? <><i className="fas fa-check" /> {isAr ? "مضاف" : "Added"}</>
                          : <><i className="fas fa-cart-plus" /> {isAr ? "أضف" : "Add"}</>
                      }
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ── ACTIONS BAR ── */}
      <div className="rc-actions">
        <button className={`rc-action-btn ${isLiked ? "rc-liked" : ""}`} onClick={onLike}>
          <i className={`fa${isLiked ? "s" : "r"} fa-heart`} /> {likeCount}
        </button>
        <button className={`rc-action-btn ${showComments ? "rc-active" : ""}`} onClick={loadComments}>
          <i className="fas fa-comment" /> {cmtCount}
        </button>
        <button className={`rc-action-btn ${isSaved ? "rc-saved" : ""}`} onClick={onSave}>
          <i className={`fa${isSaved ? "s" : "r"} fa-bookmark`} />
          {isAr ? (isSaved ? "محفوظ" : "حفظ") : (isSaved ? "Saved" : "Save")}
        </button>

        {compact && (
          <button className="rc-view-btn" onClick={() => navigate("/recommendations")}>
            {isAr ? "عرض المزيد ←" : "View more →"}
          </button>
        )}
      </div>

      {/* ── COMMENTS ── */}
      {showComments && (
        <div className="rc-comments">
          {commLoading && <div className="rc-comm-loading"><i className="fas fa-spinner fa-spin" /></div>}
          {comments.map(c => (
            <div key={c.comment_id} className="rc-comment">
              <div className="rc-comm-av">
                {c.users?.avatar_url
                  ? <img src={c.users.avatar_url} alt="" />
                  : <div className="rc-comm-av-init">{(c.users?.name || "U").charAt(0)}</div>}
              </div>
              <div>
                <strong>{c.users?.name || (isAr ? "مجهول" : "Anonymous")}</strong>
                <p>{c.content}</p>
              </div>
            </div>
          ))}
          {myUserId ? (
            <div className="rc-comm-input-row">
              <input
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submitComment()}
                placeholder={isAr ? "أضيفي تعليقاً..." : "Add a comment..."}
                className="rc-comm-input"
              />
              <button className="rc-comm-send" onClick={submitComment} disabled={submitting}>
                {submitting ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-paper-plane" />}
              </button>
            </div>
          ) : (
            <p className="rc-login-note">
              {isAr ? "سجلي دخولك للتعليق" : "Login to comment"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── CSS ────────────────────────────────────────────────
const CARD_CSS = `
:root{--rc-primary:#d68b9d;--rc-pl:#fdf2f5;--rc-sec:#eab8c6;--rc-teal:#1a6b5c;--rc-text:#333;--rc-gray:#777;--rc-border:#f0ebe4;}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.rc-card{background:#fff;border-radius:20px;border:1px solid var(--rc-border);overflow:hidden;box-shadow:0 4px 18px rgba(0,0,0,.04);animation:fadeUp .4s ease;transition:.3s;font-family:'Cairo','Poppins',sans-serif;}
.rc-card:hover{box-shadow:0 10px 30px rgba(214,139,157,.14);transform:translateY(-3px);}
.rc-compact{border-radius:16px;}

.rc-cover{height:200px;overflow:hidden;}
.rc-cover img{width:100%;height:100%;object-fit:cover;}

.rc-header{padding:18px 18px 10px;}
.rc-doctor-row{display:flex;align-items:center;gap:10px;margin-bottom:12px;}
.rc-doc-av{width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid var(--rc-pl);}
.rc-doc-init{background:var(--rc-pl);color:var(--rc-primary);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.95rem;min-width:40px;}
.rc-doc-name{font-weight:800;font-size:.88rem;color:var(--rc-text);display:block;}
.rc-doc-spec{font-size:.72rem;color:var(--rc-gray);font-weight:600;}
.rc-date{margin-inline-start:auto;font-size:.72rem;color:#bbb;font-weight:600;white-space:nowrap;}
.rc-title{font-size:1rem;font-weight:800;color:var(--rc-text);margin-bottom:8px;line-height:1.4;}
.rc-age-badge{display:inline-flex;align-items:center;gap:5px;background:var(--rc-pl);color:var(--rc-primary);padding:4px 10px;border-radius:12px;font-size:.73rem;font-weight:700;}

.rc-desc{padding:0 18px;font-size:.83rem;color:var(--rc-gray);line-height:1.65;margin-bottom:12px;}
.rc-video-wrap{padding:0 18px 14px;}
.rc-media-toggle{margin:0 18px 8px;background:var(--rc-pl);color:var(--rc-primary);border:none;padding:7px 14px;border-radius:10px;cursor:pointer;font-family:inherit;font-size:.78rem;font-weight:700;display:flex;align-items:center;gap:6px;}
.rc-media-grid{display:flex;flex-wrap:wrap;gap:8px;padding:0 18px 10px;}
.rc-media-img{width:80px;height:80px;border-radius:10px;object-fit:cover;border:1px solid var(--rc-border);}
.rc-media-link{display:flex;align-items:center;gap:5px;background:#f4f4f4;padding:6px 12px;border-radius:8px;font-size:.75rem;text-decoration:none;color:var(--rc-teal);font-weight:700;}

.rc-tags{display:flex;flex-wrap:wrap;gap:6px;padding:0 18px 10px;}
.rc-tag{background:#f4f4f4;color:var(--rc-gray);padding:3px 9px;border-radius:12px;font-size:.7rem;font-weight:700;}

/* Products */
.rc-products-section{background:#fafafa;border-top:1px solid var(--rc-border);padding:14px 18px;}
.rc-products-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;}
.rc-products-header h4{font-size:.88rem;font-weight:800;color:var(--rc-text);display:flex;align-items:center;gap:6px;}
.rc-products-header h4 i{color:var(--rc-teal);}
.rc-add-all-btn{background:var(--rc-teal);color:#fff;border:none;padding:8px 14px;border-radius:12px;cursor:pointer;font-family:inherit;font-weight:700;font-size:.78rem;display:flex;align-items:center;gap:5px;transition:.3s;}
.rc-add-all-btn:hover{background:#145e50;}

.rc-products-list{display:flex;flex-direction:column;gap:10px;}
.rc-product-row{display:flex;align-items:flex-start;gap:12px;background:#fff;border-radius:14px;padding:12px;border:1px solid var(--rc-border);transition:.3s;}
.rc-product-row:hover{border-color:var(--rc-sec);box-shadow:0 3px 12px rgba(214,139,157,.1);}
.rc-prod-img-wrap{position:relative;flex-shrink:0;}
.rc-prod-img{width:60px;height:60px;border-radius:10px;object-fit:cover;border:1px solid var(--rc-border);}
.rc-prod-img-ph{display:flex;align-items:center;justify-content:center;font-size:1.5rem;background:var(--rc-pl);}
.rc-alt-badge{position:absolute;top:-4px;right:-4px;background:#f39c12;color:#fff;font-size:.6rem;font-weight:800;padding:2px 5px;border-radius:6px;}
.rc-prod-info{flex:1;min-width:0;}
.rc-prod-top{display:flex;justify-content:space-between;align-items:flex-start;gap:6px;margin-bottom:3px;}
.rc-prod-name{font-size:.85rem;font-weight:800;color:var(--rc-text);cursor:pointer;}
.rc-prod-name:hover{color:var(--rc-primary);text-decoration:underline;}
.rc-prod-price{font-size:.88rem;font-weight:800;color:var(--rc-teal);white-space:nowrap;}
.rc-prod-store{font-size:.72rem;color:var(--rc-gray);font-weight:600;display:flex;align-items:center;gap:4px;margin-bottom:4px;}
.rc-prod-usage,.rc-prod-duration,.rc-prod-notes{font-size:.75rem;color:#888;line-height:1.5;margin-top:3px;display:flex;align-items:flex-start;gap:4px;}
.rc-prod-usage i,.rc-prod-duration i{color:var(--rc-primary);margin-top:2px;flex-shrink:0;}

.rc-add-btn{flex-shrink:0;padding:8px 12px;border-radius:12px;border:none;cursor:pointer;font-family:inherit;font-weight:700;font-size:.78rem;background:var(--rc-primary);color:#fff;display:flex;align-items:center;gap:4px;transition:.3s;white-space:nowrap;}
.rc-add-btn:hover{background:#c27a8c;}
.rc-add-btn.rc-added{background:#2ecc71;cursor:default;}
.rc-add-btn.rc-no-stock{background:#e0e0e0;color:#aaa;cursor:not-allowed;}

/* Actions */
.rc-actions{display:flex;align-items:center;gap:6px;padding:10px 14px;border-top:1px solid var(--rc-border);}
.rc-action-btn{display:flex;align-items:center;gap:5px;background:#f4f4f4;border:none;padding:7px 12px;border-radius:20px;font-family:inherit;font-size:.75rem;font-weight:800;cursor:pointer;color:var(--rc-gray);transition:.3s;}
.rc-action-btn:hover{background:var(--rc-pl);color:var(--rc-primary);}
.rc-action-btn.rc-liked{background:#fdf2f5;color:#e74c3c;}
.rc-action-btn.rc-liked i{color:#e74c3c;}
.rc-action-btn.rc-saved{background:var(--rc-pl);color:var(--rc-primary);}
.rc-action-btn.rc-active{background:var(--rc-pl);color:var(--rc-primary);}
.rc-view-btn{margin-inline-start:auto;background:var(--rc-primary);color:#fff;border:none;padding:7px 14px;border-radius:12px;cursor:pointer;font-family:inherit;font-weight:700;font-size:.78rem;transition:.3s;}
.rc-view-btn:hover{background:#c27a8c;}

/* Comments */
.rc-comments{padding:12px 16px;border-top:1px solid var(--rc-border);background:#fafafa;display:flex;flex-direction:column;gap:10px;}
.rc-comm-loading{text-align:center;padding:10px;color:#bbb;}
.rc-comment{display:flex;gap:10px;align-items:flex-start;}
.rc-comm-av{width:32px;height:32px;min-width:32px;border-radius:50%;overflow:hidden;}
.rc-comm-av img{width:100%;height:100%;object-fit:cover;}
.rc-comm-av-init{width:32px;height:32px;background:var(--rc-pl);color:var(--rc-primary);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.8rem;border-radius:50%;}
.rc-comment strong{font-size:.8rem;font-weight:800;display:block;}
.rc-comment p{font-size:.8rem;color:var(--rc-gray);margin-top:2px;line-height:1.5;}
.rc-comm-input-row{display:flex;gap:8px;}
.rc-comm-input{flex:1;padding:9px 13px;border-radius:12px;border:1.5px solid var(--rc-border);outline:none;font-family:inherit;font-size:.83rem;}
.rc-comm-input:focus{border-color:var(--rc-sec);box-shadow:0 0 0 3px var(--rc-pl);}
.rc-comm-send{background:var(--rc-primary);color:#fff;border:none;padding:9px 13px;border-radius:12px;cursor:pointer;transition:.3s;}
.rc-comm-send:hover{background:#c27a8c;}
.rc-login-note{text-align:center;font-size:.78rem;color:#bbb;font-weight:700;}
`;