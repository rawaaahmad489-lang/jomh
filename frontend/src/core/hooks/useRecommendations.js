// src/hooks/useRecommendations.js
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabaseClient";

async function getMyUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("users").select("user_id")
    .eq("auth_id", user.id).maybeSingle();
  return data?.user_id || null;
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

// ─── 1. Public browse ────────────────────────────────
export function useRecommendations({ doctorId = null, ageMonths = null, searchQuery = "", limit = 20 } = {}) {
  const [recs, setRecs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [myLikes, setMyLikes] = useState(new Set());
  const [mySaves, setMySaves] = useState(new Set());

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      let q = supabase.from("doctor_recommendations").select(REC_SELECT)
        .eq("status", "published").order("created_at", { ascending: false }).limit(limit);
      if (doctorId) q = q.eq("doctor_id", doctorId);
      if (ageMonths !== null) q = q.lte("target_age_min", ageMonths).gte("target_age_max", ageMonths);
      if (searchQuery.trim()) q = q.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      const { data, error } = await q;
      if (error) throw error;
      setRecs(data || []);
      const uid = await getMyUserId();
      if (uid && data) {
        setMyLikes(new Set(data.filter(r => (r.recommendation_likes || []).some(l => l.user_id === uid)).map(r => r.id)));
        setMySaves(new Set(data.filter(r => (r.saved_recommendations || []).some(s => s.user_id === uid)).map(r => r.id)));
      }
    } catch (e) { console.error("useRecommendations:", e.message); }
    finally { setLoading(false); }
  }, [doctorId, ageMonths, searchQuery, limit]);

  useEffect(() => { fetch(); }, [fetch]);

  const toggleLike = async (recId) => {
    const uid = await getMyUserId(); if (!uid) return;
    if (myLikes.has(recId)) {
      await supabase.from("recommendation_likes").delete().eq("recommendation_id", recId).eq("user_id", uid);
      setMyLikes(p => { const n = new Set(p); n.delete(recId); return n; });
    } else {
      await supabase.from("recommendation_likes").insert({ recommendation_id: recId, user_id: uid });
      setMyLikes(p => new Set([...p, recId]));
    }
    fetch();
  };

  const toggleSave = async (recId) => {
    const uid = await getMyUserId(); if (!uid) return;
    if (mySaves.has(recId)) {
      await supabase.from("saved_recommendations").delete().eq("recommendation_id", recId).eq("user_id", uid);
      setMySaves(p => { const n = new Set(p); n.delete(recId); return n; });
    } else {
      await supabase.from("saved_recommendations").insert({ recommendation_id: recId, user_id: uid });
      setMySaves(p => new Set([...p, recId]));
    }
  };

  const addComment = async (recId, content) => {
    const uid = await getMyUserId(); if (!uid || !content.trim()) return false;
    const { error } = await supabase.from("recommendation_comments")
      .insert({ recommendation_id: recId, user_id: uid, content: content.trim() });
    if (!error) fetch();
    return !error;
  };

  return { recs, loading, myLikes, mySaves, toggleLike, toggleSave, addComment, refetch: fetch };
}

// ─── 2. Doctor manage own recs ───────────────────────
export function useDoctorRecs(doctorId) {
  const [recs, setRecs]         = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);

  const fetchRecs = useCallback(async () => {
    if (!doctorId) return;
    setLoading(true);
    const { data, error } = await supabase.from("doctor_recommendations")
      .select(REC_SELECT).eq("doctor_id", doctorId).order("created_at", { ascending: false });
    if (!error) setRecs(data || []);
    setLoading(false);
  }, [doctorId]);

  const fetchProducts = useCallback(async () => {
    const { data } = await supabase.from("products")
      .select(`product_id, name, price, image_url, description, stock, stores(store_id, store_name, logo), product_categories(name)`)
      .eq("is_active", true).order("name").limit(300);
    setProducts(data || []);
  }, []);

  useEffect(() => { fetchRecs(); fetchProducts(); }, [fetchRecs, fetchProducts]);

  const uploadFile = async (file, folder = "covers") => {
    const ext  = file.name.split(".").pop();
    const path = `${doctorId}/${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("recommendations").upload(path, file, { upsert: true });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from("recommendations").getPublicUrl(path);
    return data.publicUrl;
  };

  const createRec = async ({ title, description, targetAgeMin = 0, targetAgeMax = 12, status = "published",
    coverImageFile = null, videoUrl = "", extraFiles = [], ageGroup = "", tagNames = [], linkedProducts = [] }) => {
    try {
      let coverImage = null;
      if (coverImageFile) coverImage = await uploadFile(coverImageFile, "covers");
      const mediaUrls = [];
      for (const f of extraFiles) { const url = await uploadFile(f, "media"); mediaUrls.push({ url, name: f.name, type: f.type }); }
      const { data: rec, error } = await supabase.from("doctor_recommendations").insert({
        doctor_id: doctorId, title: title.trim(), description: description.trim(),
        target_age_min: parseInt(targetAgeMin) || 0, target_age_max: parseInt(targetAgeMax) || 12,
        status, cover_image: coverImage, video_url: videoUrl.trim() || null,
        media_urls: mediaUrls, age_group: ageGroup.trim() || null,
      }).select().single();
      if (error) throw error;
      for (const name of tagNames) {
        if (!name.trim()) continue;
        let { data: tag } = await supabase.from("tags").select("tag_id").eq("name", name.trim()).maybeSingle();
        if (!tag) { const { data: nt } = await supabase.from("tags").insert({ name: name.trim() }).select().single(); tag = nt; }
        if (tag) await supabase.from("recommendation_tags").insert({ recommendation_id: rec.id, tag_id: tag.tag_id });
      }
      for (let i = 0; i < linkedProducts.length; i++) {
        const lp = linkedProducts[i];
        await supabase.from("recommendation_products").insert({
          recommendation_id: rec.id, product_id: lp.product_id,
          usage_instructions: lp.usage_instructions || null, duration_days: lp.duration_days ? parseInt(lp.duration_days) : null,
          notes: lp.notes || null, is_alternative: lp.is_alternative || false, sort_order: i,
        });
      }
      await fetchRecs();
      return { ok: true, id: rec.id };
    } catch (err) { console.error("createRec:", err.message); return { ok: false, error: err.message }; }
  };

  const updateStatus = async (recId, status) => {
    await supabase.from("doctor_recommendations").update({ status }).eq("id", recId);
    fetchRecs();
  };

  const deleteRec = async (recId) => {
    await supabase.from("doctor_recommendations").delete().eq("id", recId);
    fetchRecs();
  };

  return { recs, products, loading, createRec, updateStatus, deleteRec, uploadFile, refetch: fetchRecs };
}

// ─── 3. Personalized for mother ──────────────────────
export function usePersonalizedRecs(children = []) {
  const [recs, setRecs]       = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!children.length) return;
    const ages = children.map(c => Math.floor((Date.now() - new Date(c.birth_date)) / (1000 * 60 * 60 * 24 * 30.44)));
    const minAge = Math.max(0, Math.min(...ages) - 2);
    const maxAge = Math.max(...ages) + 2;
    setLoading(true);
    supabase.from("doctor_recommendations")
      .select(`id, title, description, target_age_min, target_age_max, cover_image, created_at,
        doctor_profiles(specialization, users(name, avatar_url)),
        recommendation_products(id, products(product_id, name, price, image_url)),
        recommendation_likes(id), recommendation_tags(tags(name))`)
      .eq("status", "published").lte("target_age_min", maxAge).gte("target_age_max", minAge)
      .order("created_at", { ascending: false }).limit(4)
      .then(({ data }) => { setRecs(data || []); setLoading(false); });
  }, [JSON.stringify(children.map(c => c.birth_date))]);

  return { recs, loading };
}