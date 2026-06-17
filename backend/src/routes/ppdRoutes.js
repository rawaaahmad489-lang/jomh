// backend/src/routes/ppdRoutes.js
import express from "express";
import { createClient } from "@supabase/supabase-js";
import { calculatePPDRisk } from "../services/ppdRiskService.js";

const router = express.Router();

const getAdminClient = () =>
  createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

// POST /api/ppd/check
router.post("/check", async (req, res) => {
  const { userId } = req.body;
  
  
  if (!userId) return res.status(400).json({ error: "userId required" });

  try {
    const result = await calculatePPDRisk(userId);
    
    if (result.skipped) {
      return res.json({ skipped: true, reason: result.reason });
    }
    
    // ← غيّري riskLevel إلى finalRiskLevel
    return res.json({
      finalRiskLevel: result.finalRiskLevel,
      sleepBumped:    result.sleepBumped,
      epdsOverride:   result.epdsOverride,
    });
  } catch (err) {
    console.error("PPD check error:", err);
    return res.status(500).json({ error: "Risk assessment failed" });
  }
});

// GET /api/ppd/history/:userId
router.get("/history/:userId", async (req, res) => {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("ppd_risk_assessments")
    .select("*")
    .eq("user_id", req.params.userId)
    .order("assessed_at", { ascending: false })
    .limit(30);

  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// POST /api/ppd/consent
router.post("/consent", async (req, res) => {
  const { userId, monitoringConsent, doctorAlertConsent } = req.body;
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("mother_profiles")
    .update({
      mental_health_monitoring_consent: monitoringConsent,
      doctor_alert_consent:             doctorAlertConsent,
      consent_updated_at:               new Date().toISOString(),
    })
    .eq("mother_id", userId);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true });
});

// POST /api/ppd/epds
router.post("/epds", async (req, res) => {
  const { userId, answers } = req.body;
  const supabase = getAdminClient();

  const REVERSED = new Set([3, 5, 6, 7, 8, 9, 10]);
  let totalScore = 0;
  for (let q = 1; q <= 10; q++) {
    const raw = answers[`q${q}`] ?? 0;
    totalScore += REVERSED.has(q) ? (3 - raw) : raw;
  }

  const isElevated = totalScore >= 13;

  const { data, error } = await supabase
    .from("epds_submissions")
    .insert({ user_id: userId, answers, total_score: totalScore, is_elevated: isElevated })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  await calculatePPDRisk(userId);

  return res.json({ totalScore, isElevated, submission: data });
});

// GET /api/ppd/doctor-alerts
router.get("/doctor-alerts", async (req, res) => {
  const { doctorId } = req.query;
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("ppd_doctor_alerts")
    .select(`
      id, alert_message, is_read, created_at,
      ppd_risk_assessments(final_risk_level, assessed_at)
    `)
    .or(`doctor_id.eq.${doctorId},doctor_id.is.null`)
    .eq("is_read", false)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

export default router;