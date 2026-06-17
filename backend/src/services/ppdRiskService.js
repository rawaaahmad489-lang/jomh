// src/services/ppdRiskService.js
// ═══════════════════════════════════════════════════════════════════
// خدمة الكشف المبكر عن خطر اكتئاب ما بعد الولادة
// ⚠️  هذا النظام لا يشخّص — يُقدّر الخطر فقط
// ═══════════════════════════════════════════════════════════════════
// backend/src/services/ppdRiskService.js
// backend/src/services/ppdRiskService.js
import { createClient } from "@supabase/supabase-js";

let _supabase = null;
let _supabaseAdmin = null;

function getSupabase() {
  if (!_supabase) _supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
  return _supabase;
}

function getSupabaseAdmin() {
  if (!_supabaseAdmin) _supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  return _supabaseAdmin;
}

export const MOOD_POINTS = {
  happy: 0, neutral: 0, tired: 1,
  sad: 2, anxious: 2, angry: 2, overwhelmed: 3,
  سعيدة: 0, محايدة: 0, متعبة: 1,
  حزينة: 2, قلقة: 2, غاضبة: 2, مرهقة: 3,
};

const HIGH_RISK_MOODS = new Set([
  "sad", "anxious", "overwhelmed",
  "حزينة", "قلقة", "مرهقة",
]);

const EPDS_ELEVATED_THRESHOLD = 13;

export async function calculatePPDRisk(userId) {
  const consent = await fetchConsent(userId);
  if (!consent.mental_health_monitoring_consent) {
    return { skipped: true, reason: "no_consent" };
  }

  const [moodLogs, sleepLogs, latestEpds] = await Promise.all([
    fetchMoodLogs(userId, 14),
    fetchSleepLogs(userId, 14),
    fetchLatestEpds(userId),
  ]);

  const { weeklyScore, biweeklyScore, badDaysLast7, consecutiveBadDays }
    = scoreMoods(moodLogs);
  const { lowSleepDays, sleepBump } = scoreSleep(sleepLogs);
  const { baseLevel, epdsOverride } = classifyRisk({
    weeklyScore, biweeklyScore, badDaysLast7,
    consecutiveBadDays, latestEpds,
  });

  const finalLevel = sleepBump ? bumpLevel(baseLevel) : baseLevel;

  const assessment = {
    userId,
    weeklyMoodScore:    weeklyScore,
    biweeklyMoodScore:  biweeklyScore,
    badDaysLast7,
    consecutiveBadDays,
    lowSleepDays,
    epdsScore:          latestEpds?.total_score ?? null,
    baseRiskLevel:      baseLevel,
    finalRiskLevel:     finalLevel,
    sleepBumped:        sleepBump,
    epdsOverride,
    doctorAlertConsent: consent.doctor_alert_consent,
  };

  await persistAssessment(assessment);
  return assessment;
}
/*
async function fetchConsent(userId) {
  console.log("🔐 fetchConsent userId:", userId);
  
  // جرّبي مباشرةً بـ mother_id
  let { data } = await getSupabase()
    .from("mother_profiles")
    .select("mental_health_monitoring_consent, doctor_alert_consent")
    .eq("mother_id", userId)
    .maybeSingle();

  console.log("🔐 consent result:", data);
  
  return data ?? {
    mental_health_monitoring_consent: false,
    doctor_alert_consent: false,
  };
}*/

async function fetchConsent(userId) {
  console.log("🔐 fetchConsent userId:", userId);
  
  // Admin client يتجاوز RLS تماماً
  const { data, error } = await getSupabaseAdmin()
    .from("mother_profiles")
    .select("mental_health_monitoring_consent, doctor_alert_consent")
    .eq("mother_id", userId)
    .maybeSingle();

  console.log("🔐 consent result:", data, "error:", error);
  
  return data ?? {
    mental_health_monitoring_consent: false,
    doctor_alert_consent: false,
  };
}
/*
async function fetchConsent(userId) {
  const { data } = await getSupabase()
    .from("mother_profiles")
    .select("mental_health_monitoring_consent, doctor_alert_consent")
    .eq("mother_id", userId)
    .single();
  return data ?? {
    mental_health_monitoring_consent: false,
    doctor_alert_consent: false,
  };
}*/

async function fetchMoodLogs(userId, days) {
  const { data } = await getSupabaseAdmin() // ← Admin بدل Anon
    .from("mother_mood_logs")
    .select("mood, logged_date")
    .eq("user_id", userId)
    .gte("logged_date", daysAgoISO(days))
    .order("logged_date", { ascending: false });
  return data ?? [];
}

async function fetchSleepLogs(userId, days) {
  const { data } = await getSupabaseAdmin() // ← Admin بدل Anon
    .from("mother_health_logs")
    .select("value, logged_date")
    .eq("user_id", userId)
    .eq("activity_type", "sleep")
    .gte("logged_date", daysAgoISO(days))
    .order("logged_date", { ascending: false });
  return data ?? [];
}

async function fetchLatestEpds(userId) {
  const { data } = await getSupabaseAdmin() // ← Admin بدل Anon
    .from("epds_submissions")
    .select("total_score, is_elevated, submitted_at")
    .eq("user_id", userId)
    .gte("submitted_at", daysAgoISO(7))
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

function scoreMoods(logs) {
  const last7Dates  = last7DayStrings();
  const last14Dates = last14DayStrings();

  const logsBy7  = logs.filter(l => last7Dates.has(l.logged_date));
  const logsBy14 = logs.filter(l => last14Dates.has(l.logged_date));

  const weeklyScore   = logsBy7.reduce((s, l)  => s + (MOOD_POINTS[l.mood] ?? 0), 0);
  const biweeklyScore = logsBy14.reduce((s, l) => s + (MOOD_POINTS[l.mood] ?? 0), 0);
  const badDaysLast7  = logsBy7.filter(l => HIGH_RISK_MOODS.has(l.mood)).length;

  let consecutiveBadDays = 0;
  for (const log of logs) {
    if (HIGH_RISK_MOODS.has(log.mood)) consecutiveBadDays++;
    else break;
  }

  return { weeklyScore, biweeklyScore, badDaysLast7, consecutiveBadDays };
}

function scoreSleep(sleepLogs) {
  let lowSleepDays = 0;
  for (let i = 0; i < 3; i++) {
    const dateStr = daysAgoISO(i);
    const log = sleepLogs.find(l => l.logged_date === dateStr);
    if (!log || parseFloat(log.value ?? 0) < 5) lowSleepDays++;
  }
  return { lowSleepDays, sleepBump: lowSleepDays >= 3 };
}

function classifyRisk({ weeklyScore, biweeklyScore, badDaysLast7, consecutiveBadDays, latestEpds }) {
  if (latestEpds?.is_elevated || (latestEpds?.total_score ?? 0) >= EPDS_ELEVATED_THRESHOLD) {
    return { baseLevel: "high", epdsOverride: true };
  }
  if (biweeklyScore >= 12 || badDaysLast7 >= 5) {
    return { baseLevel: "high", epdsOverride: false };
  }
  if (weeklyScore >= 8 || consecutiveBadDays >= 3) {
    return { baseLevel: "moderate", epdsOverride: false };
  }
  if (weeklyScore >= 5) {
    return { baseLevel: "low", epdsOverride: false };
  }
  return { baseLevel: "none", epdsOverride: false };
}

function bumpLevel(level) {
  const order = ["none", "low", "moderate", "high"];
  const i = order.indexOf(level);
  return order[Math.min(i + 1, order.length - 1)];
}

async function persistAssessment(a) {
  const { data: record } = await getSupabaseAdmin()
    .from("ppd_risk_assessments")
    .insert({
      user_id:              a.userId,
      weekly_mood_score:    a.weeklyMoodScore,
      biweekly_mood_score:  a.biweeklyMoodScore,
      bad_days_last_7:      a.badDaysLast7,
      consecutive_bad_days: a.consecutiveBadDays,
      low_sleep_days:       a.lowSleepDays,
      epds_score:           a.epdsScore,
      base_risk_level:      a.baseRiskLevel,
      final_risk_level:     a.finalRiskLevel,
      sleep_bumped:         a.sleepBumped,
      epds_override:        a.epdsOverride,
    })
    .select()
    .single();

  if (!record) return;

  if (a.finalRiskLevel !== "none") {
    await sendMotherNotification(a.userId, a.finalRiskLevel, record.id);
  }

  if (a.finalRiskLevel === "high" && a.doctorAlertConsent) {
    await createDoctorAlert(a.userId, record.id);
  }
}

async function sendMotherNotification(userId, level, assessmentId) {
  const messages = {
    low:      "لاحظنا أن مزاجكِ يحتاج اهتماماً هذا الأسبوع. إليكِ بعض المحتوى الداعم. 🌸",
    moderate: "نحرص على صحتكِ النفسية. نوصي بملء استبيان إدنبرة للمتابعة. 💛",
    high:     "أنتِ مهمة. إذا كنتِ تمرّين بوقت صعب، تواصلي مع متخصص. نحن معكِ. 💙",
  };

  await getSupabaseAdmin().from("notifications").insert({
    user_id:           userId,
    message:           messages[level],
    notification_type: "mood_alert",
    related_type:      "ppd_assessment",
    related_id:        assessmentId,
    is_read:           false,
  });
}
/*
async function createDoctorAlert(motherId, assessmentId) {
  await getSupabaseAdmin().from("ppd_doctor_alerts").insert({
    assessment_id: assessmentId,
    mother_id:     motherId,
    doctor_id:     null,
    alert_message: "إشعار: إحدى المتابِعات قد تحتاج متابعة نفسية. يُرجى مراجعة سجلها.",
    is_read:       false,
  });
}
*/
async function createDoctorAlert(motherId, assessmentId) {
  // جلب الأطباء الذين لديهم مواعيد مع هذه الأم
  const { data: doctors } = await getSupabaseAdmin()
    .from("appointments")
    .select("doctor_id")
    .eq("mother_id", motherId)
    .eq("status", "confirmed");

  const uniqueDoctors = [...new Set((doctors || []).map(d => d.doctor_id))];

  if (uniqueDoctors.length === 0) {
    // لا يوجد أطباء مرتبطون — أرسل للجدول بـ null (للادمن يتابع)
    await getSupabaseAdmin().from("ppd_doctor_alerts").insert({
      assessment_id: assessmentId,
      mother_id:     motherId,
      doctor_id:     null,
      alert_message: "إشعار: إحدى المتابِعات قد تحتاج متابعة نفسية. يُرجى مراجعة سجلها.",
      is_read:       false,
    });
    return;
  }

  // أرسل لكل طبيب مرتبط
  for (const doctorId of uniqueDoctors) {
    await getSupabaseAdmin().from("ppd_doctor_alerts").insert({
      assessment_id: assessmentId,
      mother_id:     motherId,
      doctor_id:     doctorId,
      alert_message: "إشعار: إحدى المتابِعات قد تحتاج متابعة نفسية. يُرجى مراجعة سجلها.",
      is_read:       false,
    });

    // إشعار في جدول notifications للطبيب
    await getSupabaseAdmin().from("notifications").insert({
      user_id:           doctorId,
      message:           "⚠️ إحدى مريضاتكِ قد تحتاج متابعة نفسية عاجلة.",
      notification_type: "medical",
      related_type:      "ppd_assessment",
      related_id:        assessmentId,
      is_read:           false,
    });
  }
}
function daysAgoISO(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function last7DayStrings() {
  return new Set([...Array(7)].map((_, i) => daysAgoISO(i)));
}

function last14DayStrings() {
  return new Set([...Array(14)].map((_, i) => daysAgoISO(i)));
}