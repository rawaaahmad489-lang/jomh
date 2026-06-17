// =========================================================
// ملف مستقل: src/modules/doctor/components/ChildAccessSection.jsx
// أضيفي هذا الملف كاملاً — لا تعديل على ملفات قديمة
// =========================================================
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../services/supabaseClient";
import { printChildReport } from "../../../utils/printChildReport";

// ─── helpers ─────────────────────────────────────────────
const fmt = (d, isAr) =>
  d
    ? new Date(d).toLocaleDateString(isAr ? "ar-SA" : "en-US", {
        year: "numeric", month: "short", day: "numeric",
      })
    : "—";

const calcAge = (birthDate, isAr) => {
  if (!birthDate) return "—";
  const months =
    (new Date().getFullYear() - new Date(birthDate).getFullYear()) * 12 +
    new Date().getMonth() - new Date(birthDate).getMonth();
  const years = Math.floor(months / 12);
  const rem   = months % 12;
  if (isAr) return years > 0 ? `${years}س ${rem > 0 ? `${rem}ش` : ""}` : `${months}ش`;
  return years > 0 ? `${years}y ${rem > 0 ? rem + "mo" : ""}`.trim() : `${months}mo`;
};

const GENDER_EMOJI = { male: "👦", female: "👧" };

// =========================================================
// MAIN COMPONENT
// =========================================================
const ChildAccessSection = ({ isAr, doctorUserId, doctorName = "" }) => {
  // حالات الجلب
  const [availableChildren, setAvailableChildren] = useState([]);  // أطفال يمكن للدكتور طلب متابعتهم
  const [myRequests,        setMyRequests]        = useState([]);  // طلباتي الحالية
  const [approvedChildren,  setApprovedChildren]  = useState([]);  // الأطفال المعتمدين
  const [loading,           setLoading]           = useState(true);
  const [activeView,        setActiveView]        = useState("browse"); // browse | approved | requests
  const [selectedChild,     setSelectedChild]     = useState(null); // لعرض ملف الطفل
  const [childFullData,     setChildFullData]     = useState(null);
  const [loadingChild,      setLoadingChild]      = useState(false);
  const [isDoctorApproved,  setIsDoctorApproved]  = useState(false);
  const [requestModal,      setRequestModal]      = useState(null); // child object
  const [requestMsg,        setRequestMsg]        = useState("");
  const [sending,           setSending]           = useState(false);
  const [toast,             setToast]             = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  // ─── تحقق أن الدكتور approved ─────────────────────────
useEffect(() => {
    if (!doctorUserId) return;
    const checkApproval = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("state")
          .eq("user_id", doctorUserId)
          .maybeSingle();
        if (error) {
          // إذا RLS منع القراءة، افترض أن الدكتور approved
          setIsDoctorApproved(true);
          return;
        }
        setIsDoctorApproved(data?.state === "approved");
      } catch {
        setIsDoctorApproved(true);
      }
    };
    checkApproval();
  }, [doctorUserId]);
  // ─── جلب الأطفال المتاحين + طلباتي ───────────────────
 const fetchData = useCallback(async () => {
    if (!doctorUserId) return;
    setLoading(true);

    try {
      // جلب الأطفال
      const { data: childrenRaw } = await supabase
        .from("children")
        .select("child_id, name, birth_date, gender, blood_type, mother_id")
        .order("name");

      // جلب طلباتي
      const { data: requestsData } = await supabase
        .from("doctor_child_access")
        .select("id, child_id, mother_id, status, requested_at, request_count")
        .eq("doctor_id", doctorUserId);

      // جلب أسماء الأمهات
      const motherIds = [...new Set((childrenRaw || []).map(c => c.mother_id).filter(Boolean))];
      let mothersMap = {};
      if (motherIds.length > 0) {
        const { data: mothersRaw } = await supabase
          .from("users")
          .select("user_id, name, avatar_url")
          .in("user_id", motherIds);
        (mothersRaw || []).forEach(m => { mothersMap[m.user_id] = m; });
      }

      // دمج بيانات الأطفال مع الأمهات
      const childrenData = (childrenRaw || []).map(c => ({
        ...c,
        users: mothersMap[c.mother_id] || null,
      }));

      const requests = requestsData || [];
      setMyRequests(requests);

      // استخرج الأطفال المعتمدين
      const approvedIds = new Set(
        requests.filter(r => r.status === "approved").map(r => r.child_id)
      );
      setApprovedChildren(
        childrenData.filter(c => approvedIds.has(c.child_id))
      );

      setAvailableChildren(childrenData);
    } catch (err) {
      console.error("fetchData error:", err);
    } finally {
      setLoading(false);
    }
  }, [doctorUserId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── إرسال طلب ────────────────────────────────────────
const sendRequest = async () => {
    if (!requestModal || !doctorUserId) return;
    setSending(true);

    // تحقق من البلوك أولاً
    const { data: blockData } = await supabase
      .from("mother_doctor_blocks")
      .select("id")
      .eq("mother_id", requestModal.mother_id)
      .eq("doctor_id", doctorUserId)
      .maybeSingle();

    if (blockData) {
      showToast(isAr ? "هذه الأم قامت بحظرك 🚫" : "This mother has blocked you 🚫");
      setSending(false);
      setRequestModal(null);
      return;
    }

    // هل يوجد طلب مرفوض سابق؟ إعادة إرسال
    const existing = myRequests.find(r => r.child_id === requestModal.child_id);
if (existing && existing.status === "rejected") {
      // نجلب السجل مباشرة من الداتا بيس بدل الاعتماد على الـ state
      const { data: freshRecord } = await supabase
        .from("doctor_child_access")
        .select("id, request_count")
        .eq("doctor_id", doctorUserId)
        .eq("child_id", requestModal.child_id)
        .maybeSingle();

      if (!freshRecord) {
        showToast(isAr ? "حدث خطأ، لم يتم العثور على الطلب" : "Error: request not found");
        setSending(false);
        return;
      }

      const { error } = await supabase
        .from("doctor_child_access")
        .update({
          status:          "pending",
          request_message: requestMsg || null,
          requested_at:    new Date().toISOString(),
          request_count:   (freshRecord.request_count || 1) + 1,
        })
        .eq("id", freshRecord.id);

      if (!error) {
        await supabase.from("notifications").insert({
          user_id:           requestModal.mother_id,
          message:           isAr
            ? `طلب متابعة جديد لطفلك "${requestModal.name}" من الدكتور ${doctorName}`
            : `New follow-up request for "${requestModal.name}" from Dr. ${doctorName}`,
       notification_type: "appointment",
related_type:      "appointment",
related_id:        null,
        });
        showToast(isAr ? "تم إعادة إرسال الطلب ✅" : "Request resent ✅");
        setRequestModal(null);
        setRequestMsg("");
        fetchData();
      } else {
        console.error("Update error:", error);
        showToast(isAr ? "حدث خطأ في إعادة الإرسال" : "Error resending request");
      }
      setSending(false);
      return;
    }

    // طلب جديد
    const { error } = await supabase
      .from("doctor_child_access")
      .insert({
        doctor_id:       doctorUserId,
        child_id:        requestModal.child_id,
        mother_id:       requestModal.mother_id,
        request_message: requestMsg || null,
        request_count:   1,
      });

    if (!error) {
      await supabase.from("notifications").insert({
        user_id:           requestModal.mother_id,
        message:           isAr
          ? `طلب متابعة طفلك "${requestModal.name}" من الدكتور ${doctorName}`
          : `Dr. ${doctorName} requested access to your child "${requestModal.name}"`,
        notification_type: "system",
related_type:      "child",
        related_id:        requestModal.child_id,
      });
      showToast(isAr ? "تم إرسال الطلب للأم ✅" : "Request sent to mother ✅");
      setRequestModal(null);
      setRequestMsg("");
      fetchData();
    } else {
      if (error.code === "23505") {
        showToast(isAr ? "لقد أرسلت طلباً مسبقاً لهذا الطفل" : "You already sent a request for this child");
      } else {
        showToast(isAr ? "حدث خطأ، حاول مجدداً" : "Error occurred, try again");
      }
    }
    setSending(false);
  };

  // ─── جلب بيانات طفل معتمد ─────────────────────────────
  const loadChildData = async (child) => {
    setSelectedChild(child);
    setLoadingChild(true);
    setActiveView("profile");

    const sevenDays  = new Date(Date.now() - 7  * 86400000).toISOString();
    const thirtyDays = new Date(Date.now() - 30 * 86400000).toISOString();

    const [
      { data: childInfo },
      { data: growth },
      { data: events },
      { data: files },
      { data: sleep },
      { data: feeding },
      { data: appts },
      { data: summary },
      { data: todaySummary },
    ] = await Promise.all([
      supabase.from("children")
        .select("*, milestones(stage_name,min_age_months,max_age_months,description)")
        .eq("child_id", child.child_id).single(),
      supabase.from("child_growth")
        .select("*").eq("child_id", child.child_id)
        .order("recorded_at", { ascending: true }),
      supabase.from("child_medical_events")
        .select("*").eq("child_id", child.child_id)
        .order("event_date", { ascending: false }),
      supabase.from("child_medical_files")
        .select("*").eq("child_id", child.child_id)
        .order("uploaded_at", { ascending: false }),
      supabase.from("child_sleep_tracking")
        .select("*").eq("child_id", child.child_id)
        .gte("sleep_start", sevenDays)
        .order("sleep_start", { ascending: false }),
      supabase.from("child_feeding_tracking")
        .select("*").eq("child_id", child.child_id)
        .gte("feeding_time", thirtyDays)
        .order("feeding_time", { ascending: false }),
      supabase.from("appointments")
        .select("*, doctor_profiles(users(name), specialization)")
        .eq("child_id", child.child_id)
        .order("appointment_date", { ascending: false }).limit(10),
      supabase.from("child_daily_health_summary")
        .select("*").eq("child_id", child.child_id)
        .order("date", { ascending: false }).limit(30),
      supabase.from("child_daily_health_summary")
        .select("*").eq("child_id", child.child_id)
        .eq("date", new Date().toISOString().split("T")[0]).maybeSingle(),
    ]);

    setChildFullData({
      child:        childInfo,
      growth:       growth       || [],
      events:       events       || [],
      files:        files        || [],
      sleep:        sleep        || [],
      feeding:      feeding      || [],
      appointments: appts        || [],
      dailySummary: summary      || [],
      healthSummary: todaySummary,
    });
    setLoadingChild(false);
  };

  // ─── حالة الطلب للطفل ─────────────────────────────────
  const getRequestStatus = (childId) => {
    const r = myRequests.find(r => r.child_id === childId);
    return r?.status || null;
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: 50 }}>
      <div className="doc-spinner" />
    </div>
  );

  // ─── JSX ──────────────────────────────────────────────
  return (
    <div dir={isAr ? "rtl" : "ltr"}>
      <style>{CAS_CSS}</style>

      {toast && <div className="cas-toast">{toast}</div>}

      {/* Header */}
      <div className="doc-section-header">
        <h2>
          <i className="fas fa-child" />
          {isAr ? "متابعة ملفات الأطفال" : "Child File Monitoring"}
        </h2>
        {!isDoctorApproved && (
          <div className="cas-warn">
            <i className="fas fa-exclamation-triangle" />
            {isAr ? "حسابك قيد المراجعة — يجب الاعتماد لإرسال طلبات" : "Account pending approval — must be approved to send requests"}
          </div>
        )}
      </div>

      {/* Sub tabs */}
      <div className="cas-tabs">
        {[
          { key: "browse",   icon: "fa-search",         label: isAr ? "تصفح الأطفال" : "Browse Children" },
          { key: "approved", icon: "fa-check-circle",   label: isAr ? `ملفات معتمدة (${approvedChildren.length})` : `Approved (${approvedChildren.length})` },
          { key: "requests", icon: "fa-clock",          label: isAr ? `طلباتي (${myRequests.length})` : `My Requests (${myRequests.length})` },
        ].map(tab => (
          <button
            key={tab.key}
            className={`cas-tab ${activeView === tab.key ? "active" : ""}`}
            onClick={() => { setActiveView(tab.key); setSelectedChild(null); setChildFullData(null); }}
          >
            <i className={`fas ${tab.icon}`} /> {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ BROWSE ═══ */}
      {activeView === "browse" && (
        <div>
          <p className="cas-hint">
            <i className="fas fa-info-circle" />
            {isAr
              ? "اختر طفلاً وأرسل طلباً للأم لمتابعة ملفه الصحي. ستصلها إشعار للموافقة."
              : "Select a child and send the mother a follow-up request. She'll receive a notification to approve."}
          </p>
          <div className="cas-children-grid">
            {availableChildren.map(child => {
              const status = getRequestStatus(child.child_id);
              return (
                <div key={child.child_id} className="cas-child-card">
                  <div className="cas-child-avatar">
                    {GENDER_EMOJI[child.gender] || "👶"}
                  </div>
                  <div className="cas-child-info">
                    <h4>{child.name}</h4>
                    <p>{calcAge(child.birth_date, isAr)}</p>
                    <p className="cas-mother-name">
                      <i className="fas fa-user" /> {child.users?.name || "—"}
                    </p>
                  </div>
                  <div className="cas-child-action">
                    {status === "approved" ? (
                      <button
                        className="cas-btn-view"
                        onClick={() => loadChildData(child)}
                      >
                        <i className="fas fa-eye" />
                        {isAr ? "عرض الملف" : "View File"}
                      </button>
                    ) : status === "pending" ? (
                      <span className="cas-badge-pending">
                        <i className="fas fa-clock" />
                        {isAr ? "بانتظار الموافقة" : "Awaiting Approval"}
                      </span>
                    ) : status === "rejected" ? (
                      <span className="cas-badge-rejected">
                        <i className="fas fa-times-circle" />
                        {isAr ? "تم الرفض" : "Rejected"}
                      </span>
                   ) : (
                      <button
                        className="cas-btn-request"
                        disabled={!isDoctorApproved}
                        onClick={() => { setRequestModal(child); setRequestMsg(""); }}
                      >
                        <i className="fas fa-paper-plane" />
                        {isAr ? "طلب متابعة" : "Request Access"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ APPROVED CHILDREN ═══ */}
      {activeView === "approved" && (
        <div>
          {approvedChildren.length === 0 ? (
            <div className="doc-empty">
              <span>👶</span>
              <p>{isAr ? "لا توجد ملفات معتمدة بعد" : "No approved files yet"}</p>
            </div>
          ) : (
            <div className="cas-approved-grid">
              {approvedChildren.map(child => (
                <div key={child.child_id} className="cas-approved-card"
                  onClick={() => loadChildData(child)}>
                  <div className="cas-child-avatar" style={{ fontSize: "2.5rem" }}>
                    {GENDER_EMOJI[child.gender] || "👶"}
                  </div>
                  <div>
                    <h4>{child.name}</h4>
                    <p>{calcAge(child.birth_date, isAr)}</p>
                    <p style={{ fontSize: ".75rem", color: "#aaa" }}>
                      {child.users?.name}
                    </p>
                  </div>
                  <i className="fas fa-chevron-left cas-arrow" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ MY REQUESTS ═══ */}
      {activeView === "requests" && (
        <div>
          {myRequests.length === 0 ? (
            <div className="doc-empty">
              <span>📋</span>
              <p>{isAr ? "لم ترسل طلبات بعد" : "No requests sent yet"}</p>
            </div>
          ) : (
            <div className="cas-requests-list">
              {myRequests.map(req => {
                const child = availableChildren.find(c => c.child_id === req.child_id);
                return (
                  <div key={req.id} className="cas-req-row">
                    <div className="cas-req-icon">{GENDER_EMOJI[child?.gender] || "👶"}</div>
                    <div className="cas-req-info">
                      <h4>{child?.name || "—"}</h4>
                      <p>{calcAge(child?.birth_date, isAr)}</p>
                      <small>{fmt(req.requested_at, isAr)}</small>
                    </div>
                    <span className={`cas-badge-${req.status}`}>
                      {isAr
                        ? { pending: "انتظار", approved: "معتمد", rejected: "مرفوض" }[req.status]
                        : req.status}
                    </span>
{req.status === "rejected" && (
  <button  onClick={() => {
  const child = availableChildren.find(c => c.child_id === req.child_id);
  console.log("child found:", child, "req:", req);
  if (child) { setRequestModal(child); setRequestMsg(""); }
}}
    className="cas-btn-request"
    style={{ fontSize: ".72rem", padding: "6px 10px" }}
    onClick={() => {
      const child = availableChildren.find(c => c.child_id === req.child_id);
      if (child) { setRequestModal(child); setRequestMsg(""); }
    }}
  >
  
                        <i className="fas fa-redo" />
                        {isAr ? "إعادة إرسال" : "Resend"}
                      </button>
                    )}

                    {req.status === "approved" && (
                      <button className="cas-btn-view" style={{ marginInlineStart: 8 }}
                        onClick={() => child && loadChildData(child)}>
                        <i className="fas fa-eye" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ CHILD FULL PROFILE VIEW ═══ */}
      {activeView === "profile" && selectedChild && (
        <div>
          <button className="cas-back-btn"
            onClick={() => { setActiveView("approved"); setSelectedChild(null); setChildFullData(null); }}>
            <i className={`fas fa-arrow-${isAr ? "right" : "left"}`} />
            {isAr ? "رجوع" : "Back"}
          </button>

          {loadingChild ? (
            <div style={{ textAlign: "center", padding: 50 }}>
              <div className="doc-spinner" />
            </div>
          ) : childFullData ? (
            <ChildProfileView
              data={childFullData}
              isAr={isAr}
              doctorName={doctorName}
            />
          ) : null}
        </div>
      )}

      {/* ═══ REQUEST MODAL ═══ */}
      {requestModal && (
        <div className="cas-modal-overlay" onClick={e => e.target === e.currentTarget && setRequestModal(null)}>
          <div className="cas-modal" dir={isAr ? "rtl" : "ltr"}>
            <div className="cas-modal-head">
              <h2>
                <i className="fas fa-paper-plane" />
                {isAr ? " طلب متابعة طفل" : " Request Child Access"}
              </h2>
              <button onClick={() => setRequestModal(null)}><i className="fas fa-times" /></button>
            </div>

            <div className="cas-modal-child-info">
              <span style={{ fontSize: "2rem" }}>{GENDER_EMOJI[requestModal.gender] || "👶"}</span>
              <div>
                <h4>{requestModal.name}</h4>
                <p>{calcAge(requestModal.birth_date, isAr)}</p>
                <p style={{ fontSize: ".8rem", color: "#888" }}>
                  {isAr ? "الأم: " : "Mother: "}{requestModal.users?.name}
                </p>
              </div>
            </div>

            <div className="cas-modal-field">
              <label>
                <i className="fas fa-comment-alt" />
                {isAr ? " رسالة للأم (اختياري)" : " Message to mother (optional)"}
              </label>
              <textarea
                className="cas-modal-input"
                rows="3"
                value={requestMsg}
                onChange={e => setRequestMsg(e.target.value)}
                placeholder={
                  isAr
                    ? "مثال: أودّ متابعة وضع طفلك بعد الزيارة الأخيرة..."
                    : "e.g. I'd like to follow up on your child's progress..."
                }
              />
            </div>

            <div className="cas-modal-info">
              <i className="fas fa-bell" />
              {isAr
                ? "ستصل إشعار للأم لتوافق أو ترفض طلبك."
                : "The mother will receive a notification to approve or reject your request."}
            </div>

            <div className="cas-modal-actions">
              <button className="cas-btn-cancel" onClick={() => setRequestModal(null)}>
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button className="cas-btn-send" onClick={sendRequest} disabled={sending}>
                {sending
                  ? <><i className="fas fa-spinner fa-spin" /> {isAr ? "جارٍ الإرسال..." : "Sending..."}</>
                  : <><i className="fas fa-paper-plane" /> {isAr ? "إرسال الطلب" : "Send Request"}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================
// CHILD PROFILE VIEW (للدكتور)
// =========================================================
const ChildProfileView = ({ data, isAr, doctorName }) => {
  const { child, growth, events, files, sleep, feeding, appointments, dailySummary, healthSummary } = data;

  const fmt = (d) =>
    d ? new Date(d).toLocaleDateString(isAr ? "ar-SA" : "en-US",
      { year: "numeric", month: "short", day: "numeric" }) : "—";

  const fmtTime = (d) =>
    d ? new Date(d).toLocaleTimeString(isAr ? "ar-SA" : "en-US",
      { hour: "2-digit", minute: "2-digit" }) : "—";

  const latestGrowth = growth.length ? growth[growth.length - 1] : null;

  const EVENT_ICONS = { vaccination: "💉", disease: "🤒", allergy: "⚠️", checkup: "🔍", growth: "📏" };
  const QUALITY_COLOR = { excellent: "#2ecc71", good: "#27ae60", average: "#f39c12", poor: "#e74c3c" };

  return (
    <div className="cpv-root">
      {/* Action bar */}
      <div className="cpv-actions">
        <button
          className="cpv-print-btn"
          onClick={() =>
            printChildReport({
              child, growthRecords: growth, medicalEvents: events,
              medicalFiles: files, sleepRecords: sleep, feedingRecords: feeding,
              appointments, dailySummary, healthSummary,
              isAr, doctorMode: true, doctorName,
            })
          }
        >
          <i className="fas fa-print" />
          {isAr ? "طباعة التقرير الطبي" : "Print Medical Report"}
        </button>
        <button
          className="cpv-download-btn"
          onClick={() =>
            printChildReport({
              child, growthRecords: growth, medicalEvents: events,
              medicalFiles: files, sleepRecords: sleep, feedingRecords: feeding,
              appointments, dailySummary, healthSummary,
              isAr, doctorMode: true, doctorName,
            })
          }
        >
          <i className="fas fa-download" />
          {isAr ? "تنزيل PDF" : "Download PDF"}
        </button>
      </div>

      {/* Child header */}
      <div className="cpv-header">
        <div className="cpv-avatar">{({ male: "👦", female: "👧" }[child?.gender]) || "👶"}</div>
        <div className="cpv-header-info">
          <h2>{child?.name}</h2>
          <div className="cpv-meta-row">
            {child?.birth_date && <span><i className="fas fa-birthday-cake" /> {fmt(child.birth_date)}</span>}
            {child?.blood_type && <span><i className="fas fa-tint" /> {child.blood_type}</span>}
            {latestGrowth?.weight && <span><i className="fas fa-weight" /> {latestGrowth.weight} kg</span>}
            {latestGrowth?.height && <span><i className="fas fa-ruler-vertical" /> {latestGrowth.height} cm</span>}
          </div>
          {child?.milestones && (
            <div className="cpv-milestone">
              🌟 {child.milestones.stage_name}
              ({child.milestones.min_age_months}–{child.milestones.max_age_months} {isAr ? "شهر" : "mo"})
            </div>
          )}
        </div>
      </div>

      {/* Today summary */}
      {healthSummary && (
        <div className="cpv-section">
          <h3><i className="fas fa-chart-pie" /> {isAr ? "ملخص اليوم" : "Today's Summary"}</h3>
          <div className="cpv-today-grid">
            <div className="cpv-today-box">
              <i className="fas fa-moon" />
              <span>{((healthSummary.total_sleep_minutes || 0) / 60).toFixed(1)}h</span>
              <small>{isAr ? "نوم" : "Sleep"}</small>
            </div>
            <div className="cpv-today-box">
              <i className="fas fa-baby-carriage" />
              <span>{healthSummary.total_feeding_sessions || 0}</span>
              <small>{isAr ? "رضاعة" : "Feedings"}</small>
            </div>
            <div className="cpv-today-box">
              <i className="fas fa-tint" />
              <span>{healthSummary.total_milk_ml || 0} ml</span>
              <small>{isAr ? "حليب" : "Milk"}</small>
            </div>
            <div className="cpv-today-box">
              <i className="fas fa-star" />
              <span style={{ color: QUALITY_COLOR[healthSummary.avg_sleep_quality] || "#aaa" }}>
                {healthSummary.avg_sleep_quality || "—"}
              </span>
              <small>{isAr ? "جودة النوم" : "Sleep Quality"}</small>
            </div>
          </div>
        </div>
      )}

      {/* Daily Summary table */}
      {dailySummary.length > 0 && (
        <div className="cpv-section">
          <h3><i className="fas fa-calendar-alt" /> {isAr ? "الملخص اليومي (30 يوم)" : "Daily Summary (30 days)"}</h3>
          <div className="cpv-table-wrap">
            <table className="cpv-table">
              <thead>
                <tr>
                  <th>{isAr ? "التاريخ" : "Date"}</th>
                  <th>{isAr ? "النوم (ساعة)" : "Sleep (h)"}</th>
                  <th>{isAr ? "الرضاعة" : "Feedings"}</th>
                  <th>{isAr ? "الحليب (مل)" : "Milk (ml)"}</th>
                  <th>{isAr ? "جودة النوم" : "Sleep Quality"}</th>
                </tr>
              </thead>
              <tbody>
                {dailySummary.map((s, i) => (
                  <tr key={i}>
                    <td>{fmt(s.date)}</td>
                    <td>{s.total_sleep_minutes ? (s.total_sleep_minutes / 60).toFixed(1) : "—"}</td>
                    <td>{s.total_feeding_sessions ?? "—"}</td>
                    <td>{s.total_milk_ml ?? "—"}</td>
                    <td>
                      <span style={{
                        color: QUALITY_COLOR[s.avg_sleep_quality] || "#aaa",
                        fontWeight: 700,
                      }}>
                        {isAr
                          ? { excellent: "ممتاز", good: "جيد", average: "متوسط", poor: "ضعيف" }[s.avg_sleep_quality] || "—"
                          : s.avg_sleep_quality || "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Growth */}
      {growth.length > 0 && (
        <div className="cpv-section">
          <h3><i className="fas fa-chart-line" /> {isAr ? "سجل النمو" : "Growth Records"}</h3>
          <div className="cpv-table-wrap">
            <table className="cpv-table">
              <thead>
                <tr>
                  <th>{isAr ? "التاريخ" : "Date"}</th>
                  <th>{isAr ? "الوزن (كغ)" : "Weight (kg)"}</th>
                  <th>{isAr ? "الطول (سم)" : "Height (cm)"}</th>
                  <th>{isAr ? "محيط الرأس" : "Head Circ."}</th>
                </tr>
              </thead>
              <tbody>
                {[...growth].reverse().map(r => (
                  <tr key={r.record_id}>
                    <td>{fmt(r.recorded_at)}</td>
                    <td>{r.weight ?? "—"}</td>
                    <td>{r.height ?? "—"}</td>
                    <td>{r.head_circumference ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Medical Events */}
      {events.length > 0 && (
        <div className="cpv-section">
          <h3><i className="fas fa-heartbeat" /> {isAr ? "السجل الطبي" : "Medical History"}</h3>
          <div className="cpv-events-list">
            {events.map(ev => (
              <div key={ev.event_id} className="cpv-event-row">
                <span className="cpv-event-icon">{EVENT_ICONS[ev.event_type] || "📋"}</span>
                <div className="cpv-event-info">
                  <h4>{ev.title}</h4>
                  {ev.description && <p>{ev.description}</p>}
                  <small>{fmt(ev.event_date)}</small>
                </div>
                <span className={`cpv-event-badge badge-${ev.event_type}`}>
                  {isAr
                    ? { vaccination: "تطعيم", disease: "مرض", allergy: "حساسية", checkup: "فحص", growth: "نمو" }[ev.event_type]
                    : ev.event_type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sleep */}
      {sleep.length > 0 && (
        <div className="cpv-section">
          <h3><i className="fas fa-moon" /> {isAr ? "سجل النوم (7 أيام)" : "Sleep Log (7 days)"}</h3>
          <div className="cpv-table-wrap">
            <table className="cpv-table">
              <thead>
                <tr>
                  <th>{isAr ? "التاريخ" : "Date"}</th>
                  <th>{isAr ? "البداية" : "Start"}</th>
                  <th>{isAr ? "النهاية" : "End"}</th>
                  <th>{isAr ? "المدة" : "Duration"}</th>
                  <th>{isAr ? "الجودة" : "Quality"}</th>
                </tr>
              </thead>
              <tbody>
                {sleep.map(s => (
                  <tr key={s.sleep_id}>
                    <td>{fmt(s.sleep_start)}</td>
                    <td>{fmtTime(s.sleep_start)}</td>
                    <td>{fmtTime(s.sleep_end)}</td>
                    <td>{Math.floor((s.sleep_duration_minutes||0)/60)}h {(s.sleep_duration_minutes||0)%60}m</td>
                    <td>
                      <span style={{ color: QUALITY_COLOR[s.sleep_quality] || "#aaa", fontWeight: 700 }}>
                        {isAr
                          ? { excellent: "ممتاز", good: "جيد", average: "متوسط", poor: "ضعيف" }[s.sleep_quality] || "—"
                          : s.sleep_quality || "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Feeding */}
      {feeding.length > 0 && (
        <div className="cpv-section">
          <h3><i className="fas fa-baby-carriage" /> {isAr ? "سجل التغذية (30 يوم)" : "Feeding Log (30 days)"}</h3>
          <div className="cpv-table-wrap">
            <table className="cpv-table">
              <thead>
                <tr>
                  <th>{isAr ? "التاريخ" : "Date"}</th>
                  <th>{isAr ? "الوقت" : "Time"}</th>
                  <th>{isAr ? "الطريقة" : "Method"}</th>
                  <th>{isAr ? "الكمية (مل)" : "Qty (ml)"}</th>
                  <th>{isAr ? "المدة (د)" : "Duration"}</th>
                </tr>
              </thead>
              <tbody>
                {feeding.map(f => (
                  <tr key={f.feeding_id}>
                    <td>{fmt(f.feeding_time)}</td>
                    <td>{fmtTime(f.feeding_time)}</td>
                    <td>{{ breastfeeding: isAr?"رضاعة":"Breastfeeding", formula: isAr?"صناعي":"Formula", solid_food: isAr?"صلب":"Solid" }[f.feeding_type] || f.feeding_type}</td>
                    <td>{f.quantity_ml ?? "—"}</td>
                    <td>{f.duration_minutes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Medical Files */}
      {files.length > 0 && (
        <div className="cpv-section">
          <h3><i className="fas fa-folder-open" /> {isAr ? "الملفات الطبية" : "Medical Files"}</h3>
          <div className="cpv-files-grid">
            {files.map(f => (
              <div key={f.file_id} className="cpv-file-card">
                <div className="cpv-file-icon">
                  {f.file_type?.startsWith("image/") ? "🖼️" : "📄"}
                </div>
                <div className="cpv-file-info">
                  <h4>{f.file_name}</h4>
                  <small>{fmt(f.uploaded_at)}</small>
                </div>
                <a href={f.file_url} target="_blank" rel="noreferrer" className="cpv-file-link">
                  <i className="fas fa-external-link-alt" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================
// CSS
// =========================================================
const CAS_CSS = `
/* ── Tabs ── */
.cas-tabs{display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap;}
.cas-tab{background:#f4f4f4;border:none;padding:9px 18px;border-radius:25px;
  font-family:inherit;font-weight:700;font-size:.82rem;color:#888;cursor:pointer;transition:.3s;
  display:flex;align-items:center;gap:7px;}
.cas-tab:hover{background:var(--primary-light);color:var(--primary);}
.cas-tab.active{background:var(--primary);color:white;}

/* ── Hint ── */
.cas-hint{font-size:.85rem;color:#888;font-weight:600;margin-bottom:18px;
  display:flex;align-items:flex-start;gap:8px;background:var(--primary-light);
  padding:10px 14px;border-radius:10px;}
.cas-hint i{color:var(--primary);margin-top:2px;}

/* ── Warn ── */
.cas-warn{background:#fff8f0;color:#f39c12;padding:9px 14px;border-radius:10px;
  font-size:.82rem;font-weight:700;display:flex;align-items:center;gap:8px;}

/* ── Children grid ── */
.cas-children-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;}
.cas-child-card{background:white;border-radius:16px;padding:16px;
  border:1px solid var(--border);box-shadow:var(--shadow);
  display:flex;align-items:center;gap:14px;transition:.3s;}
.cas-child-card:hover{box-shadow:0 6px 20px rgba(0,0,0,.08);transform:translateY(-2px);}
.cas-child-avatar{font-size:2.2rem;min-width:46px;text-align:center;}
.cas-child-info{flex:1;}
.cas-child-info h4{font-size:.92rem;font-weight:700;color:var(--text);margin-bottom:2px;}
.cas-child-info p{font-size:.78rem;color:var(--gray);font-weight:600;}
.cas-mother-name{font-size:.72rem!important;color:#bbb!important;display:flex;align-items:center;gap:4px;}
.cas-mother-name i{font-size:.65rem;}

/* ── Badges & buttons ── */
.cas-badge-pending{font-size:.75rem;font-weight:700;background:#fff8f0;
  color:#f39c12;padding:5px 12px;border-radius:20px;white-space:nowrap;
  display:flex;align-items:center;gap:5px;}
.cas-badge-rejected{font-size:.75rem;font-weight:700;background:#fef0f0;
  color:#e74c3c;padding:5px 12px;border-radius:20px;white-space:nowrap;
  display:flex;align-items:center;gap:5px;}
.cas-badge-approved{font-size:.75rem;font-weight:700;background:#f0faf4;
  color:#2ecc71;padding:5px 12px;border-radius:20px;white-space:nowrap;}
.cas-btn-request{background:var(--primary);color:white;border:none;
  padding:8px 14px;border-radius:10px;font-family:inherit;font-weight:700;
  font-size:.78rem;cursor:pointer;transition:.3s;display:flex;align-items:center;gap:6px;
  white-space:nowrap;}
.cas-btn-request:hover{background:#145e50;}
.cas-btn-request:disabled{opacity:.5;cursor:not-allowed;}
.cas-btn-view{background:var(--primary-light);color:var(--primary);border:none;
  padding:8px 14px;border-radius:10px;font-family:inherit;font-weight:700;
  font-size:.78rem;cursor:pointer;transition:.3s;display:flex;align-items:center;gap:6px;}
.cas-btn-view:hover{background:var(--primary);color:white;}

/* ── Approved grid ── */
.cas-approved-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;}
.cas-approved-card{background:white;border-radius:14px;padding:18px;
  border:1px solid var(--border);box-shadow:var(--shadow);cursor:pointer;
  display:flex;align-items:center;gap:14px;transition:.3s;}
.cas-approved-card:hover{background:var(--primary-light);border-color:var(--primary);transform:translateX(4px);}
.cas-approved-card h4{font-size:.92rem;font-weight:700;color:var(--text);}
.cas-approved-card p{font-size:.78rem;color:var(--gray);}
.cas-arrow{color:var(--primary);font-size:.85rem;margin-inline-start:auto;}

/* ── Requests list ── */
.cas-requests-list{display:flex;flex-direction:column;gap:12px;}
.cas-req-row{background:white;border-radius:14px;padding:14px 18px;
  border:1px solid var(--border);display:flex;align-items:center;gap:14px;}
.cas-req-icon{font-size:1.8rem;}
.cas-req-info{flex:1;}
.cas-req-info h4{font-size:.9rem;font-weight:700;color:var(--text);}
.cas-req-info p{font-size:.78rem;color:var(--gray);}
.cas-req-info small{font-size:.72rem;color:#bbb;}

/* ── Toast ── */
.cas-toast{position:fixed;top:20px;inset-inline-end:20px;background:#1a6b5c;
  color:white;padding:12px 20px;border-radius:12px;font-weight:700;
  font-size:.88rem;z-index:9999;box-shadow:0 6px 20px rgba(0,0,0,.15);}

/* ── Modal ── */
.cas-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);
  backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;
  z-index:3000;padding:15px;}
.cas-modal{background:white;width:100%;max-width:460px;border-radius:22px;
  padding:28px;box-shadow:0 20px 50px rgba(0,0,0,.15);}
.cas-modal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;}
.cas-modal-head h2{font-size:1.1rem;font-weight:800;color:var(--text);
  display:flex;align-items:center;gap:8px;}
.cas-modal-head h2 i{color:var(--primary);}
.cas-modal-head button{background:none;border:none;font-size:1.3rem;
  color:#bbb;cursor:pointer;transition:.3s;}
.cas-modal-head button:hover{color:#e74c3c;transform:rotate(90deg);}
.cas-modal-child-info{background:var(--primary-light);border-radius:12px;
  padding:14px;display:flex;align-items:center;gap:14px;margin-bottom:18px;}
.cas-modal-child-info h4{font-size:.95rem;font-weight:700;color:var(--text);}
.cas-modal-child-info p{font-size:.8rem;color:var(--gray);}
.cas-modal-field{margin-bottom:16px;}
.cas-modal-field label{display:block;font-size:.85rem;font-weight:700;
  color:var(--text);margin-bottom:7px;display:flex;align-items:center;gap:6px;}
.cas-modal-field label i{color:var(--primary);}
.cas-modal-input{width:100%;padding:11px 14px;border-radius:12px;
  border:1.5px solid var(--border);outline:none;font-family:inherit;
  font-size:.88rem;background:#fafafa;resize:vertical;transition:.3s;}
.cas-modal-input:focus{border-color:var(--primary);background:white;
  box-shadow:0 0 0 3px rgba(26,107,92,.1);}
.cas-modal-info{background:#f0faf4;color:#1a6b5c;padding:10px 14px;
  border-radius:10px;font-size:.82rem;font-weight:700;margin-bottom:18px;
  display:flex;align-items:center;gap:8px;}
.cas-modal-actions{display:flex;gap:10px;}
.cas-btn-cancel{flex:1;background:#f4f4f4;color:#888;border:none;
  padding:12px;border-radius:12px;font-family:inherit;font-weight:700;cursor:pointer;}
.cas-btn-cancel:hover{background:#eee;}
.cas-btn-send{flex:2;background:var(--primary);color:white;border:none;
  padding:12px;border-radius:12px;font-family:inherit;font-weight:700;cursor:pointer;
  display:flex;align-items:center;justify-content:center;gap:8px;transition:.3s;
  box-shadow:0 4px 14px rgba(26,107,92,.25);}
.cas-btn-send:hover{background:#145e50;}
.cas-btn-send:disabled{opacity:.7;cursor:not-allowed;}

/* ── Back btn ── */
.cas-back-btn{background:var(--primary-light);color:var(--primary);border:none;
  padding:9px 18px;border-radius:12px;font-family:inherit;font-weight:700;
  cursor:pointer;display:inline-flex;align-items:center;gap:8px;margin-bottom:20px;transition:.3s;}
.cas-back-btn:hover{background:var(--primary);color:white;}

/* ── Child Profile View ── */
.cpv-root{display:flex;flex-direction:column;gap:0;}
.cpv-actions{display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;}
.cpv-print-btn,.cpv-download-btn{background:var(--primary);color:white;border:none;
  padding:10px 20px;border-radius:12px;font-family:inherit;font-weight:700;
  font-size:.88rem;cursor:pointer;display:flex;align-items:center;gap:8px;transition:.3s;
  box-shadow:0 3px 12px rgba(26,107,92,.25);}
.cpv-print-btn:hover,.cpv-download-btn:hover{background:#145e50;transform:translateY(-1px);}
.cpv-download-btn{background:white;color:var(--primary);border:1.5px solid var(--primary);}
.cpv-download-btn:hover{background:var(--primary-light);}
.cpv-header{background:white;border-radius:18px;padding:22px;
  border:1px solid var(--border);margin-bottom:16px;
  display:flex;align-items:flex-start;gap:18px;box-shadow:var(--shadow);}
.cpv-avatar{font-size:3.5rem;}
.cpv-header-info h2{font-size:1.4rem;font-weight:800;color:var(--text);}
.cpv-meta-row{display:flex;flex-wrap:wrap;gap:10px;margin-top:8px;}
.cpv-meta-row span{background:#f4f4f4;padding:4px 12px;border-radius:20px;
  font-size:.78rem;font-weight:600;color:#555;display:flex;align-items:center;gap:5px;}
.cpv-meta-row span i{color:var(--primary);}
.cpv-milestone{margin-top:10px;background:var(--primary);color:white;
  display:inline-flex;padding:5px 14px;border-radius:20px;font-size:.78rem;font-weight:700;}
.cpv-section{background:white;border-radius:18px;padding:20px;
  border:1px solid var(--border);margin-bottom:16px;box-shadow:var(--shadow);}
.cpv-section h3{font-size:.95rem;font-weight:700;color:var(--text);
  margin-bottom:14px;display:flex;align-items:center;gap:8px;}
.cpv-section h3 i{color:var(--primary);}
.cpv-today-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
.cpv-today-box{background:#f8f8f8;border-radius:12px;padding:12px;text-align:center;}
.cpv-today-box i{font-size:1.1rem;color:var(--primary);display:block;margin-bottom:6px;}
.cpv-today-box span{display:block;font-size:1.1rem;font-weight:800;color:var(--text);}
.cpv-today-box small{font-size:.7rem;color:#aaa;font-weight:600;}
.cpv-table-wrap{overflow-x:auto;}
.cpv-table{width:100%;border-collapse:collapse;font-size:.82rem;}
.cpv-table th{background:var(--primary);color:white;padding:8px 12px;
  font-weight:700;text-align:start;}
.cpv-table td{padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#444;font-weight:500;}
.cpv-table tr:hover td{background:#f9f9f9;}
.cpv-events-list{display:flex;flex-direction:column;gap:10px;}
.cpv-event-row{display:flex;align-items:center;gap:12px;padding:10px;
  background:#f9f9f9;border-radius:12px;}
.cpv-event-icon{font-size:1.5rem;min-width:32px;text-align:center;}
.cpv-event-info{flex:1;}
.cpv-event-info h4{font-size:.88rem;font-weight:700;color:var(--text);}
.cpv-event-info p{font-size:.78rem;color:#888;font-weight:500;margin:2px 0;}
.cpv-event-info small{font-size:.72rem;color:#bbb;}
.cpv-event-badge{font-size:.7rem;font-weight:700;padding:3px 9px;border-radius:20px;}
.badge-vaccination{background:#f0faf4;color:#2ecc71;}
.badge-disease{background:#fef0f0;color:#e74c3c;}
.badge-allergy{background:#fff8f0;color:#f39c12;}
.badge-checkup{background:#f0f4ff;color:#3498db;}
.badge-growth{background:var(--primary-light);color:var(--primary);}
.cpv-files-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;}
.cpv-file-card{background:#f8f8f8;border-radius:12px;padding:12px;
  display:flex;align-items:center;gap:12px;border:1px solid #f0f0f0;}
.cpv-file-icon{font-size:1.8rem;}
.cpv-file-info{flex:1;min-width:0;}
.cpv-file-info h4{font-size:.82rem;font-weight:700;color:var(--text);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.cpv-file-info small{font-size:.72rem;color:#bbb;}
.cpv-file-link{background:var(--primary-light);color:var(--primary);
  width:30px;height:30px;border-radius:8px;display:flex;align-items:center;
  justify-content:center;text-decoration:none;transition:.3s;font-size:.8rem;}
.cpv-file-link:hover{background:var(--primary);color:white;}

@media(max-width:768px){
  .cas-children-grid{grid-template-columns:1fr;}
  .cpv-today-grid{grid-template-columns:repeat(2,1fr);}
  .cpv-header{flex-direction:column;}
}
`;

export default ChildAccessSection;