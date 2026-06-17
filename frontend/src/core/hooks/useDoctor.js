
// src/hooks/useDoctor.js
import { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";

export const useDoctor = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser]     = useState(null);
  const [profile, setProfile] = useState(null);
  const [articles, setArticles] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [stats, setStats] = useState({
    totalArticles: 0,
    approvedArticles: 0,
    pendingArticles: 0,
    totalRecs: 0,
    totalAppointments: 0,
    avgRating: 0,
    totalPatients: 0,
  });
const [notifications, setNotifications] = useState([]);
const [unreadCount,   setUnreadCount]   = useState(0);
  const fetchAll = async () => {
    try {
      setLoading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      // User record
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", authUser.id)
        .maybeSingle();
      setUser(userData);

      // Doctor profile
      const { data: profileData } = await supabase
        .from("doctor_profiles")
        .select("*")
        .eq("doctor_id", userData.user_id)
        .maybeSingle();
      setProfile(profileData);

      const doctorId = userData.user_id;

      // Articles
      const { data: articlesData } = await supabase
        .from("articles")
        .select(`
          *,
          article_ratings (rating),
          article_comments (comment_id, is_deleted)
        `)
        .eq("doctor_id", doctorId)
        .order("created_at", { ascending: false });
      setArticles(articlesData || []);

      // Recommendations
      const { data: recsData } = await supabase
        .from("doctor_recommendations")
        .select(`
          *,
          recommendation_likes (id),
          recommendation_comments (comment_id),
          saved_recommendations (id),
          recommendation_tags (tags (name)),
          recommendation_products (
            product_id, usage_instructions, duration_days,
            products (name, price, image_url)
          )
        `)
        .eq("doctor_id", doctorId)
        .order("created_at", { ascending: false });
      setRecommendations(recsData || []);

      // Appointments
      const { data: apptsData } = await supabase
        .from("appointments")
        .select(`
          *,
          mother_profiles (
            mother_id,
            users (name, avatar_url)
          ),
          children (name, birth_date, gender)
        `)
        .eq("doctor_id", doctorId)
        .order("appointment_date", { ascending: false })
        .limit(30);
      setAppointments(apptsData || []);

      // Ratings
      const { data: ratingsData } = await supabase
        .from("doctor_ratings")
        .select(`*, users (name, avatar_url)`)
        .eq("doctor_id", doctorId)
        .order("rating", { ascending: false });
      setRatings(ratingsData || []);
const { data: notifs } = await supabase
  .from("notifications")
  .select("*")
  .eq("user_id", userData.user_id)
  .order("created_at", { ascending: false })
  .limit(20);

setNotifications(notifs || []);
setUnreadCount((notifs || []).filter(n => !n.is_read).length);

      // Calculate stats
      const approved = (articlesData || []).filter(a => a.status === "approved").length;
      const pending  = (articlesData || []).filter(a => a.status === "pending").length;
      const avgRating = ratingsData?.length
        ? (ratingsData.reduce((s, r) => s + r.rating, 0) / ratingsData.length).toFixed(1)
        : 0;
      const uniquePatients = new Set((apptsData || []).map(a => a.mother_id)).size;

      setStats({
        totalArticles: (articlesData || []).length,
        approvedArticles: approved,
        pendingArticles: pending,
        totalRecs: (recsData || []).length,
        totalAppointments: (apptsData || []).length,
        avgRating: parseFloat(avgRating),
        totalPatients: uniquePatients,
      });
    } catch (err) {
      console.error("useDoctor error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  return { loading, user, profile, articles, recommendations, appointments, ratings, stats,  notifications, unreadCount,refetch: fetchAll };
};