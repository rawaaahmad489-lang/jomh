// src/core/hooks/useHealthTracking.js
// ─────────────────────────────────────────────────────────────────────
// Hook لتتبع النشاطات الصحية اليومية للأم
// ─────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../services/supabaseClient";

// تكوين كل نشاط: الاسم / الأيقونة / الألوان / الهدف اليومي / نقاط XP
export const ACTIVITY_CONFIG = {
  sleep: {
    label_ar:   "النوم",
    icon:       "🌙",
    unit:       "ساعة",
    daily_goal: 8,
    xp_action:  "health_sleep",
    color:      "#9b59b6",
    bg:         "#f5eeff",
    questions:  [
      { key: "value",   label: "كم ساعة نمتِ؟",       type: "number", placeholder: "7.5" },
      { key: "mood",    label: "كيف شعرتِ عند الاستيقاظ؟", type: "select",
        options: [{ v: "great", l: "رائعة 😄" }, { v: "good", l: "بخير 😊" }, { v: "okay", l: "مقبول 😐" }, { v: "tired", l: "متعبة 😴" }] },
      { key: "notes",   label: "ملاحظات (اختياري)",    type: "textarea" },
    ],
  },
  exercise: {
    label_ar:   "الرياضة",
    icon:       "💪",
    unit:       "دقيقة",
    daily_goal: 30,
    xp_action:  "health_exercise",
    color:      "#3498db",
    bg:         "#eaf4fe",
    questions:  [
      { key: "value",   label: "كم دقيقة مارستِ الرياضة؟", type: "number", placeholder: "30" },
      { key: "notes",   label: "نوع الرياضة",              type: "text",   placeholder: "مشي، يوغا، سباحة..." },
    ],
  },
  mental_health: {
    label_ar:   "الصحة النفسية",
    icon:       "🧘",
    unit:       "جلسة",
    daily_goal: 1,
    xp_action:  "health_mental",
    color:      "#e74c3c",
    bg:         "#fef0f0",
    questions:  [
      { key: "mood",    label: "كيف مزاجكِ اليوم؟", type: "select",
        options: [{ v: "great", l: "ممتاز 🌟" }, { v: "good", l: "جيد 😊" }, { v: "okay", l: "عادي 😐" }, { v: "tired", l: "محتاجة دعم 💛" }] },
      { key: "value",   label: "دقائق التأمل / التنفس", type: "number", placeholder: "10" },
      { key: "notes",   label: "ما الذي ساعدكِ اليوم؟",  type: "textarea" },
    ],
  },
  hydration: {
    label_ar:   "الترطيب",
    icon:       "💧",
    unit:       "كوب",
    daily_goal: 8,
    xp_action:  "health_hydration",
    color:      "#1abc9c",
    bg:         "#e8faf5",
    questions:  [
      { key: "value",   label: "كم كوب ماء شربتِ؟", type: "number", placeholder: "8" },
    ],
  },
  self_care: {
    label_ar:   "وقت لنفسكِ",
    icon:       "🌸",
    unit:       "دقيقة",
    daily_goal: 30,
    xp_action:  "health_self_care",
    color:      "#d68b9d",
    bg:         "#fdf2f5",
    questions:  [
      { key: "value",   label: "كم دقيقة خصصتِ لنفسكِ؟", type: "number", placeholder: "30" },
      { key: "notes",   label: "ماذا فعلتِ؟",             type: "text", placeholder: "قراءة، حمام استرخاء، تمشية..." },
    ],
  },
  nutrition: {
    label_ar:   "التغذية",
    icon:       "🥗",
    unit:       "وجبة",
    daily_goal: 3,
    xp_action:  "health_nutrition",
    color:      "#27ae60",
    bg:         "#eaf5ee",
    questions:  [
      { key: "value",   label: "كم وجبة أكلتِ اليوم؟", type: "number", placeholder: "3" },
      { key: "mood",    label: "كيف كانت تغذيتكِ؟", type: "select",
        options: [{ v: "great", l: "ممتازة 🥦" }, { v: "good", l: "جيدة 🍎" }, { v: "okay", l: "مقبولة 🍞" }, { v: "tired", l: "ضعيفة 😬" }] },
    ],
  },
};

export function useHealthTracking(userId) {
  const [todayLogs,   setTodayLogs]   = useState({});   // activity_type → log row
  const [streaks,     setStreaks]      = useState({});   // activity_type → streak row
  const [weeklyData,  setWeeklyData]  = useState([]);   // آخر 7 أيام (للجراف)
  const [monthlyData, setMonthlyData] = useState([]);   // آخر 30 يوم
  const [challenges,  setChallenges]  = useState([]);
  const [userChallenges, setUserChallenges] = useState([]);
  const [loading,     setLoading]     = useState(true);

  const today = new Date().toISOString().split("T")[0];

  const fetchAll = useCallback(async () => {
    if (!userId) return;
    try {
      const weekAgo  = new Date(Date.now() - 7  * 86400000).toISOString().split("T")[0];
      const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

      const [
        { data: todayData },
        { data: streakData },
        { data: weekly },
        { data: monthly },
        { data: challs },
        { data: userChalls },
      ] = await Promise.all([
        supabase.from("mother_health_logs").select("*")
          .eq("user_id", userId).eq("logged_date", today),
        supabase.from("mother_activity_streaks").select("*")
          .eq("user_id", userId),
        supabase.from("mother_health_logs").select("activity_type, value, xp_earned, logged_date")
          .eq("user_id", userId).gte("logged_date", weekAgo).order("logged_date"),
        supabase.from("mother_health_logs").select("activity_type, value, xp_earned, logged_date")
          .eq("user_id", userId).gte("logged_date", monthAgo).order("logged_date"),
        supabase.from("health_challenges").select("*").eq("is_active", true),
        supabase.from("user_challenges").select("*, health_challenges(*)")
          .eq("user_id", userId),
      ]);

      // تحويل سجلات اليوم إلى map
      const logsMap = {};
      (todayData || []).forEach(l => { logsMap[l.activity_type] = l; });
      setTodayLogs(logsMap);

      // تحويل الـ streaks إلى map
      const streakMap = {};
      (streakData || []).forEach(s => { streakMap[s.activity_type] = s; });
      setStreaks(streakMap);

      setWeeklyData(weekly || []);
      setMonthlyData(monthly || []);
      setChallenges(challs || []);
      setUserChallenges(userChalls || []);
    } catch (e) {
      console.error("useHealthTracking:", e);
    } finally {
      setLoading(false);
    }
  }, [userId, today]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── تسجيل نشاط جديد ────────────────────────────────────────────
  const logActivity = useCallback(async (activityType, formData) => {
    if (!userId) return null;
    const cfg = ACTIVITY_CONFIG[activityType];
    if (!cfg) return null;

    const payload = {
      user_id:       userId,
      activity_type: activityType,
      value:         parseFloat(formData.value) || null,
      unit:          cfg.unit,
      mood:          formData.mood || null,
      notes:         formData.notes || null,
      xp_earned:     cfg.xp_action ? 15 : 0,
      logged_date:   today,
    };

    const { data, error } = await supabase.from("mother_health_logs")
      .upsert(payload, { onConflict: "user_id,activity_type,logged_date" })
      .select().single();

    if (error) { console.error("logActivity:", error); return null; }

    // تحديث الـ streak
    await supabase.rpc("update_activity_streak", {
      p_user_id: userId, p_activity: activityType,
    });

    await fetchAll();
    return data;
  }, [userId, today, fetchAll]);

  // ── الانضمام لتحدي ──────────────────────────────────────────────
  const joinChallenge = useCallback(async (challengeId) => {
    if (!userId) return;
    await supabase.from("user_challenges")
      .upsert({ user_id: userId, challenge_id: challengeId },
        { onConflict: "user_id,challenge_id", ignoreDuplicates: true });
    await fetchAll();
  }, [userId, fetchAll]);

  // ── تحديث تقدم التحديات بناءً على السجلات ───────────────────────
  const updateChallengeProgress = useCallback(async (activityType) => {
    if (!userId) return;
    const relevant = userChallenges.filter(
      uc => !uc.is_completed && uc.health_challenges?.activity_type === activityType
    );
    for (const uc of relevant) {
      const newProgress = uc.progress_days + 1;
      const target      = uc.health_challenges.target_days;
      const completed   = newProgress >= target;
      await supabase.from("user_challenges").update({
        progress_days: newProgress,
        is_completed: completed,
        completed_at: completed ? new Date().toISOString() : null,
      }).eq("id", uc.id);
    }
    await fetchAll();
  }, [userId, userChallenges, fetchAll]);

  // ── بناء بيانات الجراف الأسبوعي ─────────────────────────────────
  const buildChartData = useCallback((period = "weekly") => {
    const source = period === "weekly" ? weeklyData : monthlyData;
    const days   = period === "weekly" ? 7 : 30;

    // مجموع XP لكل يوم
    const xpByDay = {};
    source.forEach(row => {
      xpByDay[row.logged_date] = (xpByDay[row.logged_date] || 0) + (row.xp_earned || 0);
    });

    const labels = [];
    const values = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().split("T")[0];
      labels.push(d.toLocaleDateString("ar-SA", { weekday: period === "weekly" ? "short" : undefined, day: "numeric" }));
      values.push(xpByDay[key] || 0);
    }
    return { labels, values };
  }, [weeklyData, monthlyData]);

  return {
    loading,
    todayLogs,
    streaks,
    weeklyData,
    monthlyData,
    challenges,
    userChallenges,
    logActivity,
    joinChallenge,
    updateChallengeProgress,
    buildChartData,
    refetch: fetchAll,
    isLoggedToday: (type) => !!todayLogs[type],
    getStreak:     (type) => streaks[type]?.current_streak || 0,
    getLongest:    (type) => streaks[type]?.longest_streak || 0,
    allLogs: [...(weeklyData || []), ...(monthlyData || [])],
  };
}