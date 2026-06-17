// src/core/hooks/useGamification.js

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../services/supabaseClient";

// ── نقاط كل نشاط ──────────────────────────────────────────────────────
export const XP_ACTIONS = {
  // سجلات الطفل
  sleep_record:      { xp: 15, label_ar: "تسجيل نوم الطفل"         },
  feeding_record:    { xp: 10, label_ar: "تسجيل رضاعة"              },
  growth_record:     { xp: 20, label_ar: "تسجيل قياس نمو"           },
  medical_event:     { xp: 25, label_ar: "تسجيل حدث طبي"            },
  medical_file:      { xp: 30, label_ar: "رفع ملف طبي"              },
  add_child:         { xp: 50, label_ar: "إضافة طفل جديد"           },
  // صحة الأم
  health_sleep:      { xp: 15, label_ar: "تسجيل نوم الأم"           },
  health_exercise:   { xp: 15, label_ar: "تسجيل رياضة"              },
  health_mental:     { xp: 12, label_ar: "اهتمام بالصحة النفسية"     },
  health_hydration:  { xp: 8,  label_ar: "تسجيل الترطيب"            },
  health_self_care:  { xp: 10, label_ar: "وقت خاص لنفسكِ"           },
  health_nutrition:  { xp: 8,  label_ar: "تسجيل التغذية"            },
  // تفاعل طبي
  todo_complete:     { xp: 5,  label_ar: "إتمام مهمة يومية"         },
  appointment_book:  { xp: 20, label_ar: "حجز موعد"                 },
  appointment_done:  { xp: 40, label_ar: "إتمام موعد طبي"           },
  article_read:      { xp: 10, label_ar: "قراءة مقال طبي"           },
  article_rate:      { xp: 5,  label_ar: "تقييم مقال"               },
  article_comment:   { xp: 5,  label_ar: "التعليق على مقال"         },
  rec_save:          { xp: 10, label_ar: "حفظ توصية طبية"           },
  order_complete:    { xp: 25, label_ar: "إتمام طلب شراء"           },
};

// ── حساب المستوى (كل 200 XP) ──────────────────────────────────────────
export function calcLevel(xp = 0)         { return Math.max(1, Math.floor(xp / 200) + 1); }
export function xpInCurrentLevel(xp = 0)  { return xp - (calcLevel(xp) - 1) * 200; }
export function xpForNextLevel()          { return 200; }
export function progressPct(xp = 0) {
  return Math.min(100, Math.round((xpInCurrentLevel(xp) / 200) * 100));
}

// ── ألقاب المستويات ─────────────────────────────────────────────────
export const LEVEL_TITLES = [
  "", "أم مبتدئة 🌱", "أم مجتهدة 🌿", "أم متميزة ⭐",
  "أم نشيطة 🌟", "أم محترفة 💪", "أم متفوقة 🏅",
  "أم خبيرة 🏆", "أم أسطورة 👑", "أم ملهمة 🌺", "رائدة الأمومة 🎖️",
];
export function getLevelTitle(level) {
  return LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length - 1)] || `المستوى ${level} 🌸`;
}

// ═════════════════════════════════════════════════════════════════════
// HOOK
// ═════════════════════════════════════════════════════════════════════
export function useGamification(userId) {
  const [gamData,    setGamData]    = useState(null);
  const [badges,     setBadges]     = useState([]);
  const [userBadges, setUserBadges] = useState([]);
  const [recentXP,   setRecentXP]   = useState([]);
  const [newBadge,   setNewBadge]   = useState(null);  // للإشعار المؤقت
  const [loading,    setLoading]    = useState(true);
  const awardedRef = useRef(new Set());

  // ── جلب كل البيانات ─────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!userId) return;
    try {
      // تأكد من وجود صف gamification
      await supabase.from("user_gamification")
        .upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });

      const [
        { data: gam },
        { data: allBadges },
        { data: earnedBadges },
        { data: history },
      ] = await Promise.all([
        supabase.from("user_gamification").select("*").eq("user_id", userId).single(),
        supabase.from("badges").select("*").order("xp_reward"),
        supabase.from("user_badges").select("*, badges(*)").eq("user_id", userId)
          .order("earned_at", { ascending: false }),
        supabase.from("xp_log").select("*").eq("user_id", userId)
          .order("created_at", { ascending: false }).limit(20),
      ]);

      setGamData(gam);
      setBadges(allBadges || []);
      setUserBadges(earnedBadges || []);
      setRecentXP(history || []);
      (earnedBadges || []).forEach(ub => awardedRef.current.add(ub.badge_id));
    } catch (e) {
      console.error("useGamification:", e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── منح XP ──────────────────────────────────────────────────────
  const awardXP = useCallback(async (actionKey, actionId = null) => {
    if (!userId) return;
    const action = XP_ACTIONS[actionKey];
    if (!action) return;

    // منع التكرار لنفس الـ actionId في نفس اليوم
    if (actionId) {
      const today = new Date().toISOString().split("T")[0];
      const { data: dup } = await supabase.from("xp_log").select("log_id")
        .eq("user_id", userId).eq("action_type", actionKey).eq("action_id", actionId)
        .gte("created_at", today).maybeSingle();
      if (dup) return;
    }

    // سجّل النقطة
    await supabase.from("xp_log").insert({
      user_id: userId, xp_earned: action.xp,
      action_type: actionKey, action_id: actionId,
      description: action.label_ar,
    });

    // احسب المجموع الجديد
    const { data: cur } = await supabase.from("user_gamification")
      .select("xp_total, streak_days, last_active_date").eq("user_id", userId).single();

    const newXP   = (cur?.xp_total || 0) + action.xp;
    const newLvl  = calcLevel(newXP);
    const today   = new Date().toISOString().split("T")[0];
    const yest    = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const lastDay = cur?.last_active_date;

    let newStreak = cur?.streak_days || 0;
    if (!lastDay || lastDay < yest)      newStreak = 1;
    else if (lastDay === yest)           newStreak += 1;
    // lastDay === today → لا تغيير

    await supabase.from("user_gamification").update({
      xp_total: newXP, level: newLvl,
      streak_days: newStreak, last_active_date: today,
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId);

    // شارات الـ streak
    if (newStreak === 7)  _awardBadge(userId, "Week Warrior");
    if (newStreak === 30) _awardBadge(userId, "Month Champion");
    // شارات الـ milestone
    if (newXP >= 500)  _awardBadge(userId, "Committed Mom");
    if (newXP >= 1000) _awardBadge(userId, "Super Mom");

    await fetchAll();
  }, [userId, fetchAll]);

  // ── التحقق وإعطاء شارة ─────────────────────────────────────────
  const _awardBadge = useCallback(async (uid, badgeName) => {
    const { data: badge } = await supabase.from("badges").select("*")
      .eq("name", badgeName).maybeSingle();
    if (!badge || awardedRef.current.has(badge.badge_id)) return;

    const { error } = await supabase.from("user_badges")
      .insert({ user_id: uid, badge_id: badge.badge_id });
    if (!error) {
      awardedRef.current.add(badge.badge_id);
      // XP مكافأة الشارة
      await supabase.from("xp_log").insert({
        user_id: uid, xp_earned: badge.xp_reward,
        action_type: "badge_earned", description: `🏅 شارة: ${badge.name_ar}`,
      });
      setNewBadge(badge);
      setTimeout(() => setNewBadge(null), 4500);
    }
  }, []);

  // ── التحقق من شارات count بعد كل نشاط ─────────────────────────
  const checkCountBadges = useCallback(async (actionKey) => {
    if (!userId) return;
    const { count } = await supabase.from("xp_log")
      .select("log_id", { count: "exact", head: true })
      .eq("user_id", userId).eq("action_type", actionKey);

    const matching = badges.filter(b =>
      b.condition_type === "count" &&
      b.condition_value <= (count || 0) &&
      !awardedRef.current.has(b.badge_id)
    );
    for (const b of matching) await _awardBadge(userId, b.name);
  }, [userId, badges, _awardBadge]);

  // ── الدالة الرئيسية المُصدَّرة ──────────────────────────────────
  const recordActivity = useCallback(async (actionKey, actionId = null) => {
    await awardXP(actionKey, actionId);
    await checkCountBadges(actionKey);
  }, [awardXP, checkCountBadges]);

  // ── بيانات مشتقة ────────────────────────────────────────────────
  const xpTotal    = gamData?.xp_total    || 0;
  const level      = calcLevel(xpTotal);
  const streakDays = gamData?.streak_days || 0;

  return {
    loading,
    gamData,
    xpTotal,
    level,
    streakDays,
    levelTitle:   getLevelTitle(level),
    progress:     xpInCurrentLevel(xpTotal),
    nextLevelXP:  200,
    progressPct:  progressPct(xpTotal),
    badges,
    userBadges,
    recentXP,
    newBadge,
    recordActivity,
    refetch: fetchAll,
  };
}