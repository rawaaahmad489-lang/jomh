// =========================================================
// src/components/recommendations/RecommendationsSection.jsx
// =========================================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import RecCard from "./RecCard";

export default function RecommendationsSection({
  isAr,
  mode = "home",
  storeId = null,
  children = [],
  myUserId = null,
  maxCards = 3,
}) {
  const navigate = useNavigate();

  const [recs, setRecs] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [loading, setLoading] = useState(true);

  const [myLikes, setMyLikes] = useState(new Set());
  const [mySaves, setMySaves] = useState(new Set());

  // ✅ حل مشكلة userId null
  const [resolvedUserId, setResolvedUserId] = useState(myUserId);

  useEffect(() => {
    if (myUserId) {
      setResolvedUserId(myUserId);
      return;
    }

    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { data: u } = await supabase
          .from("users")
          .select("user_id")
          .eq("auth_id", user.id)
          .maybeSingle();

        if (u?.user_id) {
          setResolvedUserId(u.user_id);
        }
      } catch (err) {
        console.error("Resolve User Error:", err.message);
      }
    };

    getUser();
  }, [myUserId]);

  const REC_SELECT = `
    id, title, description, target_age_min, target_age_max,
    cover_image, video_url, media_urls, created_at, age_group, status,

    doctor_profiles!doctor_recommendations_doctor_id_fkey(
      doctor_id,
      specialization,
      users!doctor_profiles_doctor_id_fkey(
        name,
        avatar_url
      )
    ),

    recommendation_products(
      id,
      usage_instructions,
      duration_days,
      notes,
      is_alternative,
      sort_order,

      products(
        product_id,
        name,
        price,
        image_url,
        stock,

        stores(
          store_id,
          store_name,
          logo
        )
      )
    ),

    recommendation_tags(
      tags(name)
    ),

    recommendation_likes(
      id,
      user_id
    ),

    recommendation_comments(
      comment_id,
      is_deleted
    ),

    saved_recommendations(
      id,
      user_id
    )
  `;

  useEffect(() => {
    fetchAll();
  }, [storeId, mode, resolvedUserId]);

  const fetchAll = async () => {
    setLoading(true);

    try {
      // ─────────────────────────────────────────────
      // General Recommendations
      // ─────────────────────────────────────────────
      let q = supabase
        .from("doctor_recommendations")
        .select(REC_SELECT)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(maxCards);

      // ─────────────────────────────────────────────
      // Store Mode
      // ─────────────────────────────────────────────
      if (mode === "store" && storeId) {
        const { data: storeProds } = await supabase
          .from("products")
          .select("product_id")
          .eq("store_id", storeId);

        const prodIds = (storeProds || []).map(
          (p) => p.product_id
        );

        if (prodIds.length === 0) {
          setRecs([]);
          setLoading(false);
          return;
        }

        const { data: recIds } = await supabase
          .from("recommendation_products")
          .select("recommendation_id")
          .in("product_id", prodIds);

        const ids = [
          ...new Set(
            (recIds || []).map(
              (r) => r.recommendation_id
            )
          ),
        ];

        if (ids.length === 0) {
          setRecs([]);
          setLoading(false);
          return;
        }

        q = q.in("id", ids);
      }

      const { data, error } = await q;

      if (error) {
        console.error(error);
      }

      setRecs(data || []);

      // ─────────────────────────────────────────────
      // Personalized Recommendations
      // ─────────────────────────────────────────────
      if (mode === "home" && children.length > 0) {
        const ages = children.map((c) =>
          Math.floor(
            (Date.now() - new Date(c.birth_date)) /
              (1000 * 60 * 60 * 24 * 30.44)
          )
        );

        const minAge = Math.max(
          0,
          Math.min(...ages) - 2
        );

        const maxAge = Math.max(...ages) + 2;

        const { data: pData } = await supabase
          .from("doctor_recommendations")
          .select(REC_SELECT)
          .eq("status", "published")
          .lte("target_age_min", maxAge)
          .gte("target_age_max", minAge)
          .order("created_at", {
            ascending: false,
          })
          .limit(3);

        setPersonal(pData || []);
      }

      // ─────────────────────────────────────────────
      // Likes / Saves
      // ─────────────────────────────────────────────
      if (resolvedUserId && data) {
        const allRecs = [...(data || [])];

        setMyLikes(
          new Set(
            allRecs
              .filter((r) =>
                (r.recommendation_likes || []).some(
                  (l) =>
                    l.user_id === resolvedUserId
                )
              )
              .map((r) => r.id)
          )
        );

        setMySaves(
          new Set(
            allRecs
              .filter((r) =>
                (r.saved_recommendations || []).some(
                  (s) =>
                    s.user_id === resolvedUserId
                )
              )
              .map((r) => r.id)
          )
        );
      }
    } catch (e) {
      console.error(
        "RecommendationsSection:",
        e.message
      );
    }

    setLoading(false);
  };

  // ─────────────────────────────────────────────
  // Cart
  // ─────────────────────────────────────────────
  const addToCart = async (productId) => {
    if (!resolvedUserId) {
      navigate("/login");
      return;
    }

    let { data: cart } = await supabase
      .from("cart")
      .select("cart_id")
      .eq("user_id", resolvedUserId)
      .maybeSingle();

    if (!cart) {
      const { data: nc } = await supabase
        .from("cart")
        .insert({
          user_id: resolvedUserId,
        })
        .select()
        .single();

      cart = nc;
    }

    const { data: ex } = await supabase
      .from("cart_items")
      .select("cart_item_id, quantity")
      .eq("cart_id", cart.cart_id)
      .eq("product_id", productId)
      .maybeSingle();

    if (ex) {
      await supabase
        .from("cart_items")
        .update({
          quantity: ex.quantity + 1,
        })
        .eq("cart_item_id", ex.cart_item_id);
    } else {
      await supabase
        .from("cart_items")
        .insert({
          cart_id: cart.cart_id,
          product_id: productId,
          quantity: 1,
        });
    }
  };

  const addAllToCart = async (recProds) => {
    for (const rp of recProds) {
      if (rp.products?.product_id) {
        await addToCart(
          rp.products.product_id
        );
      }
    }

    alert(
      isAr
        ? `✅ تمت إضافة ${recProds.length} منتجات للسلة`
        : `✅ Added ${recProds.length} products to cart`
    );
  };

  // ─────────────────────────────────────────────
  // Like
  // ─────────────────────────────────────────────
  const toggleLike = async (recId) => {
    if (!resolvedUserId) return;

    if (myLikes.has(recId)) {
      await supabase
        .from("recommendation_likes")
        .delete()
        .eq("recommendation_id", recId)
        .eq("user_id", resolvedUserId);

      setMyLikes((p) => {
        const n = new Set(p);
        n.delete(recId);
        return n;
      });
    } else {
      await supabase
        .from("recommendation_likes")
        .insert({
          recommendation_id: recId,
          user_id: resolvedUserId,
        });

      setMyLikes(
        (p) => new Set([...p, recId])
      );
    }

    fetchAll();
  };

  // ─────────────────────────────────────────────
  // Save
  // ─────────────────────────────────────────────
  const toggleSave = async (recId) => {
    if (!resolvedUserId) return;

    if (mySaves.has(recId)) {
      await supabase
        .from("saved_recommendations")
        .delete()
        .eq("recommendation_id", recId)
        .eq("user_id", resolvedUserId);

      setMySaves((p) => {
        const n = new Set(p);
        n.delete(recId);
        return n;
      });
    } else {
      await supabase
        .from("saved_recommendations")
        .insert({
          recommendation_id: recId,
          user_id: resolvedUserId,
        });

      setMySaves(
        (p) => new Set([...p, recId])
      );
    }
  };

  // ─────────────────────────────────────────────
  // Comment
  // ─────────────────────────────────────────────
  const addComment = async (
    recId,
    content
  ) => {
    if (
      !resolvedUserId ||
      !content.trim()
    ) {
      return false;
    }

    const { error } = await supabase
      .from("recommendation_comments")
      .insert({
        recommendation_id: recId,
        user_id: resolvedUserId,
        content: content.trim(),
      });

    if (!error) {
      fetchAll();
    }

    return !error;
  };

  const commonCardProps = (rec) => ({
    rec,
    isAr,

    isLiked: myLikes.has(rec.id),
    isSaved: mySaves.has(rec.id),

    onLike: () => toggleLike(rec.id),
    onSave: () => toggleSave(rec.id),

    onAddToCart: addToCart,

    onAddAllToCart: () =>
      addAllToCart(
        rec.recommendation_products || []
      ),

    onComment: (c) =>
      addComment(rec.id, c),

    myUserId: resolvedUserId,

    compact: true,
  });

  if (loading) {
    return (
      <div style={S.loadWrap}>
        <div style={S.spinner} />
      </div>
    );
  }

  return (
    <div style={S.wrapper}>
      <style>{CSS}</style>

      {/* HOME MODE */}
      {mode === "home" && (
        <>
          {personal.length > 0 && (
            <div style={S.block}>
              <div style={S.blockHeader}>
                <div>
                  <h2 style={S.blockTitle}>
                    <span style={S.dot}>✨</span>

                    {isAr
                      ? "توصيات مخصصة لطفلكِ"
                      : "Personalized for Your Baby"}
                  </h2>

                  <p style={S.blockSub}>
                    {isAr
                      ? "بناءً على عمر طفلكِ، اختار أطباؤنا هذه التوصيات لكِ"
                      : "Selected by our doctors based on your baby's age"}
                  </p>
                </div>

                <button
                  style={S.viewAllBtn}
                  onClick={() =>
                    navigate(
                      "/recommendations"
                    )
                  }
                >
                  {isAr
                    ? "عرض الكل ←"
                    : "View All →"}
                </button>
              </div>

              <div style={S.grid}>
                {personal.map((rec) => (
                  <RecCard
                    key={rec.id}
                    {...commonCardProps(rec)}
                  />
                ))}
              </div>
            </div>
          )}

          {recs.length > 0 && (
            <div style={S.block}>
              <div style={S.blockHeader}>
                <div>
                  <h2 style={S.blockTitle}>
                    <span style={S.dot}>💡</span>

                    {isAr
                      ? "توصيات الأطباء"
                      : "Doctor Recommendations"}
                  </h2>

                  <p style={S.blockSub}>
                    {isAr
                      ? "آراء أطبائنا المعتمدين حول أفضل المنتجات"
                      : "Our certified doctors' picks for the best products"}
                  </p>
                </div>

                <button
                  style={S.viewAllBtn}
                  onClick={() =>
                    navigate(
                      "/recommendations"
                    )
                  }
                >
                  {isAr
                    ? "عرض الكل ←"
                    : "View All →"}
                </button>
              </div>

              <div style={S.grid}>
                {recs.map((rec) => (
                  <RecCard
                    key={rec.id}
                    {...commonCardProps(rec)}
                  />
                ))}
              </div>
            </div>
          )}

          {personal.length === 0 &&
            recs.length === 0 && (
              <div style={S.empty}>
                <span>💡</span>

                <p>
                  {isAr
                    ? "لا توجد توصيات بعد"
                    : "No recommendations yet"}
                </p>
              </div>
            )}
        </>
      )}

      {/* STORE MODE */}
      {mode === "store" && (
        <div style={S.block}>
          <div style={S.blockHeader}>
            <div>
              <h2 style={S.blockTitle}>
                <span style={S.dot}>👨‍⚕️</span>

                {isAr
                  ? "ماذا يقول أطباؤنا؟"
                  : "What Our Doctors Say"}
              </h2>

              <p style={S.blockSub}>
                {isAr
                  ? "توصيات طبية معتمدة تتضمن منتجات من هذا المتجر"
                  : "Certified medical recommendations featuring products from this store"}
              </p>
            </div>
          </div>

          {recs.length === 0 ? (
            <div style={S.empty}>
              <span>💡</span>

              <p>
                {isAr
                  ? "لا توجد توصيات لهذا المتجر بعد"
                  : "No recommendations for this store yet"}
              </p>
            </div>
          ) : (
            <>
              <div style={S.grid}>
                {recs.map((rec) => (
                  <RecCard
                    key={rec.id}
                    {...commonCardProps(rec)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const S = {
  wrapper: {
    fontFamily:
      "'Cairo','Poppins',sans-serif",
  },

  block: {
    marginBottom: 36,
  },

  blockHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 12,
  },

  blockTitle: {
    fontSize: "1.15rem",
    fontWeight: 900,
    color: "#333",
    display: "flex",
    alignItems: "center",
    gap: 8,
    margin: 0,
  },

  blockSub: {
    fontSize: ".82rem",
    color: "#888",
    fontWeight: 600,
    marginTop: 4,
  },

  dot: {
    fontSize: "1.2rem",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fill, minmax(300px, 1fr))",
    gap: 18,
  },

  viewAllBtn: {
    background: "#fdf2f5",
    color: "#d68b9d",
    border: "1.5px solid #eab8c6",
    padding: "9px 18px",
    borderRadius: 12,
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 800,
    fontSize: ".82rem",
    display: "flex",
    alignItems: "center",
    gap: 6,
    whiteSpace: "nowrap",
    transition: ".3s",
  },

  bigBtn: {
    background: "#d68b9d",
    color: "#fff",
    border: "none",
    padding: "12px 28px",
    borderRadius: 14,
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 800,
    fontSize: ".9rem",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    boxShadow:
      "0 4px 15px rgba(214,139,157,.3)",
    transition: ".3s",
  },

  empty: {
    textAlign: "center",
    padding: "32px",
    color: "#bbb",
  },

  loadWrap: {
    textAlign: "center",
    padding: "40px",
  },

  spinner: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    border: "4px solid #fdf2f5",
    borderTopColor: "#d68b9d",
    animation:
      "spin .8s linear infinite",
    margin: "0 auto",
  },
};

const CSS = `
@keyframes spin{
  to{
    transform:rotate(360deg)
  }
}
`;