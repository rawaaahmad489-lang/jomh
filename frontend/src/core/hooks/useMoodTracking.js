// src/core/hooks/useMoodTracking.js
// ═══════════════════════════════════════════════════════════════════
// هوك تتبع مزاج الأم — حفظ + تحليل + إشعار ذكي
// ═══════════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../services/supabaseClient";
import { calculatePPDRisk } from "../../services/ppdService";
// المزاج السيء هو: anxious أو sad (الفهرس 2 أو 3 في مصفوفة MOOD_EN)
// نعتبر مزاجاً "يحتاج انتباهاً" إذا كان: sad أو anxious
const BAD_MOODS = ["anxious", "sad", "حزينة", "قلقة"];

/**
 * useMoodTracking
 * @param {string|null} userId
 * @returns مجموعة دوال وحالات لتتبع المزاج
 */
export function useMoodTracking(userId) {
  const [moodHistory,       setMoodHistory]       = useState([]);  // آخر 30 يوماً
  const [todayMood,         setTodayMood]         = useState(null); // { mood, emoji, label }
  const [alertNeeded,       setAlertNeeded]       = useState(false);
  const [alertDismissed,    setAlertDismissed]    = useState(false);
  const [psychiatristDocs,  setPsychiatristDocs]  = useState([]);
  const [loading,           setLoading]           = useState(true);
const [riskLevel, setRiskLevel] = useState(null); // 'none'|'low'|'moderate'|'high'
const [riskData,  setRiskData]  = useState(null);
  // ── جلب سجلات المزاج ────────────────────────────────────────
  const fetchMoods = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from("mother_mood_logs")
.select("*")
.eq("user_id", userId)
      .gte("logged_date", thirtyDaysAgo.toISOString().split("T")[0])
.order("logged_date", { ascending: false });
    if (error) {
      console.error("useMoodTracking fetchMoods:", error.message);
      setLoading(false);
      return;
    }

    const logs = data || [];
    setMoodHistory(logs);

    // اليوم
    const todayStr = new Date().toISOString().split("T")[0];
const today = logs.find(l => l.logged_date === todayStr);
    setTodayMood(today || null);

    // تحليل المزاج — هل يجب الإشعار؟
    analyzeAndAlert(logs, userId);

    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchMoods(); }, [fetchMoods]);

  // ── جلب الأطباء النفسيين ────────────────────────────────────
  useEffect(() => {
    const fetchPsychiatrists = async () => {
      const { data } = await supabase
        .from("doctor_profiles")
        .select(`
          doctor_id, specialization,
          users!doctor_profiles_doctor_id_fkey(user_id, name, avatar_url)
        `)
        .or("specialization.ilike.%نفس%,specialization.ilike.%psych%,specialization.ilike.%mental%");
      setPsychiatristDocs(data || []);
    };
    fetchPsychiatrists();
  }, []);

  // ── تحليل وإشعار ────────────────────────────────────────────
  const analyzeAndAlert = (logs, uid) => {
    if (!logs || logs.length === 0) return;

    const now = new Date();

    // القاعدة 1: 3 أيام متتالية مزاج سيء
    const last3 = logs.slice(0, 3);
    const consecutive3 = last3.length === 3 && last3.every(l => BAD_MOODS.includes(l.mood));

    // القاعدة 2: 5 أيام متفرقة خلال آخر 7 أيام
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const last7DaysLogs = logs.filter(l => new Date(l.logged_at) >= sevenDaysAgo);
    const badIn7 = last7DaysLogs.filter(l => BAD_MOODS.includes(l.mood)).length;
    const scattered5 = badIn7 >= 5;

    if (consecutive3 || scattered5) {
      // هل أُرسل إشعار مماثل مؤخراً؟ (خلال آخر 48 ساعة)
      checkRecentAlert(uid, consecutive3, scattered5);
    }
  };

  const checkRecentAlert = async (uid, consecutive3, scattered5) => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setHours(twoDaysAgo.getHours() - 48);

    const { data } = await supabase
      .from("notifications")
      .select("notification_id, created_at")
      .eq("user_id", uid)
      .eq("notification_type", "mood_alert")
      .gte("created_at", twoDaysAgo.toISOString())
      .limit(1);

    // إذا لم يُرسل إشعار مؤخراً → أظهر التنبيه للمستخدم
    if (!data || data.length === 0) {
      setAlertNeeded(true);
      setAlertDismissed(false);
    }
  };
const triggerRiskCheck = useCallback(async () => {
  if (!userId) return;
  try {
    const result = await calculatePPDRisk(userId);
    if (result.skipped) return;   // لا توجد موافقة
    setRiskLevel(result.finalRiskLevel);
    setRiskData(result);
  } catch (err) {
    console.error("PPD risk check failed:", err.message);
  }
}, [userId]);
  // ── تسجيل مزاج جديد ─────────────────────────────────────────
const logMood = useCallback(async (moodKey, emoji, label) => {  
    if (!userId) return null;

    const todayStr = new Date().toISOString().split("T")[0];

    // هل سُجّل مزاج اليوم؟ → تحديث بدلاً من إدخال جديد
   const existing = moodHistory.find(l => l.logged_date === todayStr);

    let result;
    if (existing) {
      const { data } = await supabase
        .from("mother_mood_logs")
        .update({ mood: moodKey, emoji, label })
      .eq("id", existing.id)
        .select()
        .single();
      result = data;
    } else {
      const { data } = await supabase
        .from("mother_mood_logs")
        .insert({
          user_id:     userId,
          mood:        moodKey,
          emoji,
          label,
          logged_date: new Date().toISOString().split("T")[0],
        })
        .select()
        .single();
      result = data;
    }

    if (result) {
      setTodayMood(result);
      // أعد الجلب لتحديث التحليل
      await fetchMoods();
      await triggerRiskCheck();
    }

    return result;
  }, [userId, moodHistory, fetchMoods,triggerRiskCheck]);

  // ── إرسال إشعار رسمي + إغلاق التنبيه ──────────────────────
  const sendMoodAlert = useCallback(async (reason) => {
    if (!userId) return;
    await supabase.from("notifications").insert({
      user_id:           userId,
      message:           reason,
      notification_type: "mood_alert",
      related_type:      "mood",
      is_read:           false,
    });
    setAlertNeeded(false);
    setAlertDismissed(true);
  }, [userId]);

  const dismissAlert = () => {
    setAlertNeeded(false);
    setAlertDismissed(true);
  };

  // ── بيانات الرسم البياني (آخر 30 يوم) ──────────────────────
  const buildMoodChartData = () => {
    // بناء مصفوفة من آخر 30 يوم
    const days = 30;
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
    const log = moodHistory.find(l => l.logged_date === dateStr);
      result.push({
        date:     dateStr,
        label:    d.toLocaleDateString("ar-SA", { month: "short", day: "numeric" }),
        moodKey:  log?.mood || null,
        emoji:    log?.emoji || null,
        score:    log ? moodScore(log.mood) : null,
      });
    }
    return result;
  };

  // تحويل المزاج إلى رقم للرسم البياني
  const moodScore = (moodKey) => {
    const map = {
      happy:  4, سعيدة: 4,
      tired:  2, متعبة: 2,
      anxious: 1, قلقة: 1,
      sad:    0, حزينة: 0,
    };
    return map[moodKey] ?? 2;
  };

  // ── إحصائيات ────────────────────────────────────────────────
  const getMoodStats = () => {
    if (moodHistory.length === 0) return null;
    const counts = {};
    moodHistory.forEach(l => {
      counts[l.mood] = (counts[l.mood] || 0) + 1;
    });
    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    const avgScore = moodHistory.reduce((s, l) => s + moodScore(l.mood), 0) / moodHistory.length;
    return { counts, dominant: dominant?.[0], avgScore: avgScore.toFixed(1) };
  };

  return {
    loading,
    moodHistory,
    todayMood,
    alertNeeded,
    alertDismissed,
    psychiatristDocs,
    logMood,
    sendMoodAlert,
    dismissAlert,
    buildMoodChartData,
    getMoodStats,
    riskLevel,
     riskData, 
     triggerRiskCheck,
    refetch: fetchMoods,
  };
}