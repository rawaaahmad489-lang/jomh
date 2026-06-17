// src/core/hooks/useChildAccess.js
// هوك لإدارة طلبات وصول الدكتور لملف الطفل
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../services/supabaseClient";

// ─── للأم: ترى الطلبات الواردة وتوافق أو ترفض ─────────────
export const useMotherAccessRequests = (motherUserId) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);

  const fetchRequests = useCallback(async () => {
    if (!motherUserId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("doctor_child_access")
      .select(`
        id, status, request_message, requested_at, responded_at,
        doctor_id,
        child_id,
        users!doctor_child_access_doctor_id_fkey (
          user_id, name, avatar_url
        ),
        children (child_id, name, birth_date, gender)
      `)
      .eq("mother_id", motherUserId)
      .order("requested_at", { ascending: false });

    if (error) console.error("useMotherAccessRequests:", error.message);
    setRequests(data || []);
    setLoading(false);
  }, [motherUserId]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const respond = async (requestId, approved) => {
    const { error } = await supabase
      .from("doctor_child_access")
      .update({
        status: approved ? "approved" : "rejected",
        responded_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (!error) fetchRequests();
    return !error;
  };

  return { requests, loading, respond, refetch: fetchRequests };
};

// ─── للدكتور: يرسل طلب ويرى حالة طلباته ───────────────────
export const useDoctorAccessRequests = (doctorUserId) => {
  const [myRequests, setMyRequests] = useState([]); // { child_id -> status }
  const [loading, setLoading]       = useState(true);

  const fetchMyRequests = useCallback(async () => {
    if (!doctorUserId) return;
    setLoading(true);
    const { data } = await supabase
      .from("doctor_child_access")
      .select("id, child_id, status, requested_at")
      .eq("doctor_id", doctorUserId);
    setMyRequests(data || []);
    setLoading(false);
  }, [doctorUserId]);

  useEffect(() => { fetchMyRequests(); }, [fetchMyRequests]);

  // doctorUserId هو user_id وليس auth_id
  const sendRequest = async ({ childId, motherId, message = "" }) => {
    // تحقق أن الدكتور approved
    const { data: docUser } = await supabase
      .from("users")
      .select("state")
      .eq("user_id", doctorUserId)
      .single();

    if (!docUser || docUser.state !== "approved") {
      return { error: { message: "يجب أن يكون حسابك معتمداً لإرسال طلبات المتابعة" } };
    }

    const { error } = await supabase
      .from("doctor_child_access")
      .insert({
        doctor_id:       doctorUserId,
        child_id:        childId,
        mother_id:       motherId,
        request_message: message,
      });

    if (!error) {
      // إشعار للأم
      await supabase.from("notifications").insert({
        user_id:           motherId,
        message:           `طلب متابعة طفلك من دكتور`,
        notification_type: "access_request",
        related_type:      "child_access",
        related_id:        childId,
      });
      fetchMyRequests();
    }
    return { error };
  };

  const getStatusForChild = (childId) => {
    const req = myRequests.find(r => r.child_id === childId);
    return req?.status || null; // null = لم يرسل طلب بعد
  };

  return { myRequests, loading, sendRequest, getStatusForChild, refetch: fetchMyRequests };
};

// ─── جلب بيانات الطفل الكاملة للدكتور (بعد الموافقة) ────────
export const useChildDataForDoctor = (childId, doctorUserId) => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!childId || !doctorUserId) return;
    (async () => {
      setLoading(true);

      // تحقق من الصلاحية
      const { data: access } = await supabase
        .from("doctor_child_access")
        .select("status")
        .eq("doctor_id", doctorUserId)
        .eq("child_id", childId)
        .maybeSingle();

      if (!access || access.status !== "approved") {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      setHasAccess(true);

      // جلب كل البيانات دفعة واحدة
      const sevenDays  = new Date(Date.now() - 7  * 86400000).toISOString();
      const thirtyDays = new Date(Date.now() - 30 * 86400000).toISOString();

      const [
        { data: child },
        { data: growth },
        { data: events },
        { data: files },
        { data: sleep },
        { data: feeding },
        { data: appts },
        { data: summary },
      ] = await Promise.all([
        supabase.from("children")
          .select("*, milestones(stage_name,min_age_months,max_age_months,description)")
          .eq("child_id", childId).single(),
        supabase.from("child_growth")
          .select("*").eq("child_id", childId)
          .order("recorded_at", { ascending: true }),
        supabase.from("child_medical_events")
          .select("*").eq("child_id", childId)
          .order("event_date", { ascending: false }),
        supabase.from("child_medical_files")
          .select("*").eq("child_id", childId)
          .order("uploaded_at", { ascending: false }),
        supabase.from("child_sleep_tracking")
          .select("*").eq("child_id", childId)
          .gte("sleep_start", sevenDays)
          .order("sleep_start", { ascending: false }),
        supabase.from("child_feeding_tracking")
          .select("*").eq("child_id", childId)
          .gte("feeding_time", thirtyDays)
          .order("feeding_time", { ascending: false }),
        supabase.from("appointments")
          .select("*, doctor_profiles(users(name), specialization)")
          .eq("child_id", childId)
          .order("appointment_date", { ascending: false }).limit(10),
        supabase.from("child_daily_health_summary")
          .select("*").eq("child_id", childId)
          .order("date", { ascending: false }).limit(30),
      ]);

      setData({ child, growth: growth||[], events: events||[], files: files||[],
        sleep: sleep||[], feeding: feeding||[], appointments: appts||[], dailySummary: summary||[] });
      setLoading(false);
    })();
  }, [childId, doctorUserId]);

  return { data, loading, hasAccess };
};