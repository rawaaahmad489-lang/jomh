// src/hooks/useChildData.js
import { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";

export const useChildData = (childId) => {
  const [loading, setLoading] = useState(true);
  const [child, setChild] = useState(null);
  const [growthRecords, setGrowthRecords] = useState([]);
  const [medicalEvents, setMedicalEvents] = useState([]);
  const [medicalFiles, setMedicalFiles] = useState([]);
  const [sleepRecords, setSleepRecords] = useState([]);
  const [feedingRecords, setFeedingRecords] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [healthSummary, setHealthSummary] = useState(null);
const [dailySummary, setDailySummary] = useState([]);
  const fetchChildData = async () => {
    if (!childId) return;
    setLoading(true);

    try {
      // Child basic info
      const { data: childData } = await supabase
        .from("children")
        .select(`
          *,
          milestones (stage_name, min_age_months, max_age_months, description, icon)
        `)
        .eq("child_id", childId)
        .single();

      setChild(childData);

      // Growth records (all for chart)
      const { data: growth } = await supabase
        .from("child_growth")
        .select("*")
        .eq("child_id", childId)
        .order("recorded_at", { ascending: true });
      setGrowthRecords(growth || []);

      // Medical events
      const { data: events } = await supabase
        .from("child_medical_events")
        .select("*")
        .eq("child_id", childId)
        .order("event_date", { ascending: false });
      setMedicalEvents(events || []);

      // Medical files
      const { data: files } = await supabase
        .from("child_medical_files")
        .select("*")
        .eq("child_id", childId)
        .order("uploaded_at", { ascending: false });
      setMedicalFiles(files || []);

      // Sleep tracking (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data: sleep } = await supabase
        .from("child_sleep_tracking")
        .select("*")
        .eq("child_id", childId)
        .gte("sleep_start", sevenDaysAgo.toISOString())
        .order("sleep_start", { ascending: false });
      setSleepRecords(sleep || []);

      // Feeding tracking (last 3 days)
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const { data: feeding } = await supabase
        .from("child_feeding_tracking")
        .select("*")
        .eq("child_id", childId)
        .gte("feeding_time", threeDaysAgo.toISOString())
        .order("feeding_time", { ascending: false });
      setFeedingRecords(feeding || []);

    const { data: apptsByChild } = await supabase
  .from("appointments")
  .select(`
    appointment_id, mother_id, doctor_id, child_id,
    appointment_date, type, status, notes,
    doctor_profiles (
      doctor_id, specialization,
      users!doctor_profiles_doctor_id_fkey (user_id, name, avatar_url)
    )
  `)
  .eq("child_id", childId)
  .order("appointment_date", { ascending: false });
 
// المواعيد المحجوزة بدون تحديد طفل (child_id = null)
const motherId = childData?.mother_id;
const { data: apptsByMother } = motherId
  ? await supabase
      .from("appointments")
      .select(`
        appointment_id, mother_id, doctor_id, child_id,
        appointment_date, type, status, notes,
        doctor_profiles (
          doctor_id, specialization,
          users!doctor_profiles_doctor_id_fkey (user_id, name, avatar_url)
        )
      `)
      .eq("mother_id", motherId)
      .is("child_id", null)
      .order("appointment_date", { ascending: false })
  : { data: [] };
 
// دمج النتيجتين وإزالة التكرار
const combined = [...(apptsByChild || []), ...(apptsByMother || [])];
const unique = combined.filter(
  (a, i, self) =>
    i === self.findIndex(b => b.appointment_id === a.appointment_id)
);
setAppointments(unique);
 

      // Today's health summary
      const today = new Date().toISOString().split("T")[0];
      const { data: summary } = await supabase
        .from("child_daily_health_summary")
        .select("*")
        .eq("child_id", childId)
        .eq("date", today)
        .maybeSingle();
      setHealthSummary(summary);

      // Daily summary (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data: daily } = await supabase
        .from("child_daily_health_summary")
        .select("*")
        .eq("child_id", childId)
        .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
        .order("date", { ascending: false });
      setDailySummary(daily || []);

  

    } catch (err) {
      console.error("useChildData error:", err);
    } finally {
      setLoading(false);
    }
    
  };

  useEffect(() => {
    fetchChildData();
  }, [childId]);

  return {
    loading,
    child,
    growthRecords,
    medicalEvents,
    medicalFiles,
    sleepRecords,
    feedingRecords,
    appointments,
    healthSummary,
    dailySummary,
    refetch: fetchChildData,
  };
};