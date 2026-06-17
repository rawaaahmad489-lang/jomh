// src/modules/mother/components/ChildAccessManager.jsx
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../services/supabaseClient";

const ChildAccessManager = ({ motherUserId, isAr }) => {
  const [accessList, setAccessList]   = useState([]);
  const [pending,    setPending]      = useState([]);
  const [loading,    setLoading]      = useState(true);
  const [revoking,   setRevoking]     = useState(null);
  const [responding, setResponding]   = useState(null);
  const [blocking,   setBlocking]   = useState(null);
const [blockedDoctors, setBlockedDoctors] = useState([]);
  const [activeTab,  setActiveTab]    = useState("active"); // active | pending | history

  const fetchAccess = useCallback(async () => {
    if (!motherUserId) return;
    setLoading(true);
    // جلب الأطباء المحظورين
const { data: blocks } = await supabase
  .from("mother_doctor_blocks")
  .select("doctor_id")
  .eq("mother_id", motherUserId);
setBlockedDoctors((blocks || []).map(b => b.doctor_id));
    const { data } = await supabase
      .from("doctor_child_access")
      .select(`
        id, status, request_message, requested_at, responded_at,
        doctor_id, child_id,
        children ( child_id, name, birth_date, gender ),
        users!doctor_child_access_doctor_id_fkey (
          user_id, name, avatar_url
        )
      `)
      .eq("mother_id", motherUserId)
      .order("requested_at", { ascending: false });

    const all = data || [];
    setAccessList(all.filter(r => r.status === "approved"));
    setPending(all.filter(r => r.status === "pending"));
    setLoading(false);
  }, [motherUserId]);

  useEffect(() => { fetchAccess(); }, [fetchAccess]);

  // إلغاء الوصول
  const revokeAccess = async (requestId) => {
    if (!window.confirm(
      isAr ? "هل تريدين إلغاء وصول هذا الطبيب لملف طفلك؟"
           : "Revoke this doctor's access to your child's file?"
    )) return;
    setRevoking(requestId);
    await supabase
      .from("doctor_child_access")
      .update({ status: "rejected", responded_at: new Date().toISOString() })
      .eq("id", requestId);
    fetchAccess();
    setRevoking(null);
  };

  // الرد على طلب pending
  const respond = async (requestId, approved) => {
    setResponding(requestId);
    await supabase
      .from("doctor_child_access")
      .update({
        status: approved ? "approved" : "rejected",
        responded_at: new Date().toISOString(),
      })
      .eq("id", requestId);
    fetchAccess();
    setResponding(null);
  };
const blockDoctor = async (doctorId, requestId) => {
    if (!window.confirm(
      isAr
        ? "هل تريدين حظر هذا الطبيب؟ لن يتمكن من إرسال طلبات مستقبلاً."
        : "Block this doctor? They won't be able to send future requests."
    )) return;
    setBlocking(doctorId);

    // أضيفي إلى البلوك
    await supabase.from("mother_doctor_blocks").insert({
      mother_id: motherUserId,
      doctor_id: doctorId,
    });

    // ارفضي الطلب الحالي
    await supabase.from("doctor_child_access")
      .update({ status: "rejected", responded_at: new Date().toISOString() })
      .eq("id", requestId);

    fetchAccess();
    setBlocking(null);
  };

  const unblockDoctor = async (doctorId) => {
    await supabase.from("mother_doctor_blocks").delete()
      .eq("mother_id", motherUserId).eq("doctor_id", doctorId);
    fetchAccess();
  };
  const calcAge = (b) => {
    if (!b) return "—";
    const m = (new Date().getFullYear() - new Date(b).getFullYear()) * 12
            + new Date().getMonth() - new Date(b).getMonth();
    const y = Math.floor(m / 12);
    const r = m % 12;
    if (isAr) return y > 0 ? `${y}س ${r > 0 ? `${r}ش` : ""}` : `${m}ش`;
    return y > 0 ? `${y}y ${r > 0 ? r + "mo" : ""}`.trim() : `${m}mo`;
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString(
    isAr ? "ar-SA" : "en-US",
    { year: "numeric", month: "short", day: "numeric" }
  ) : "—";

  const GENDER = { male: "👦", female: "👧" };

  if (loading) return null;
  if (accessList.length === 0 && pending.length === 0) return null;

  return (
    <div className="cam-root" dir={isAr ? "rtl" : "ltr"}>
      <style>{CAM_CSS}</style>

      <div className="cam-header">
        <div className="cam-header-title">
          <i className="fas fa-shield-alt" />
          <h3>{isAr ? "من يطّلع على ملفات أطفالك" : "Who Can View Your Children's Files"}</h3>
        </div>
        {pending.length > 0 && (
          <span className="cam-pending-badge">
            {pending.length} {isAr ? "طلب جديد" : "new request"}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="cam-tabs">
        <button
          className={`cam-tab ${activeTab === "active" ? "active" : ""}`}
          onClick={() => setActiveTab("active")}
        >
          <i className="fas fa-eye" />
          {isAr ? `وصول نشط (${accessList.length})` : `Active Access (${accessList.length})`}
        </button>
        <button
          className={`cam-tab ${activeTab === "pending" ? "active" : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          <i className="fas fa-clock" />
          {isAr ? `طلبات معلّقة (${pending.length})` : `Pending (${pending.length})`}
          {pending.length > 0 && <span className="cam-dot" />}
        </button>
        <button
          className={`cam-tab ${activeTab === "blocked" ? "active" : ""}`}
          onClick={() => setActiveTab("blocked")}
        >
          <i className="fas fa-ban" />
          {isAr ? `محظورون (${blockedDoctors.length})` : `Blocked (${blockedDoctors.length})`}
        </button>
      </div>

      {/* ═══ ACTIVE ACCESS ═══ */}
      {activeTab === "active" && (
        <div>
          {accessList.length === 0 ? (
            <div className="cam-empty">
              <i className="fas fa-lock" />
              <p>{isAr ? "لا يوجد أطباء لديهم وصول حالياً" : "No doctors currently have access"}</p>
            </div>
          ) : (
            <div className="cam-list">
              {accessList.map(req => (
                <div key={req.id} className="cam-card">
                  <div className="cam-card-doctor">
                    <div className="cam-doc-avatar">
                      {req.users?.avatar_url
                        ? <img src={req.users.avatar_url} alt="" />
                        : <div className="cam-doc-init">
                            {(req.users?.name || "D").charAt(0)}
                          </div>}
                    </div>
                    <div className="cam-doc-info">
                      <h4>{isAr ? "د. " : "Dr. "}{req.users?.name || "—"}</h4>
                      <p>
                        <i className="fas fa-calendar-check" />
                        {isAr ? "منذ " : "Since "}{fmt(req.responded_at)}
                      </p>
                    </div>
                  </div>

                  <div className="cam-card-child">
                    <span className="cam-child-emoji">
                      {GENDER[req.children?.gender] || "👶"}
                    </span>
                    <div>
                      <span className="cam-child-name">{req.children?.name || "—"}</span>
                      <span className="cam-child-age">
                        {calcAge(req.children?.birth_date)}
                      </span>
                    </div>
                  </div>

                  <div className="cam-card-status">
                    <span className="cam-badge-active">
                      <i className="fas fa-check-circle" />
                      {isAr ? "وصول نشط" : "Active Access"}
                    </span>
                    <button
                      className="cam-revoke-btn"
                      disabled={revoking === req.id}
                      onClick={() => revokeAccess(req.id)}
                    >
                      {revoking === req.id
                        ? <i className="fas fa-spinner fa-spin" />
                        : <><i className="fas fa-ban" />
                          {isAr ? "إلغاء الوصول" : "Revoke Access"}</>}
                    </button>
                    <button
                      className="cam-block-btn"
                      style={{ fontSize: ".72rem" }}
                      disabled={blocking === req.doctor_id}
                      onClick={() => blockDoctor(req.doctor_id, req.id)}
                    >
                      <i className="fas fa-ban" />
                      {isAr ? "حظر" : "Block"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ PENDING REQUESTS ═══ */}
      {activeTab === "pending" && (
        <div>
          {pending.length === 0 ? (
            <div className="cam-empty">
              <i className="fas fa-inbox" />
              <p>{isAr ? "لا توجد طلبات معلّقة" : "No pending requests"}</p>
            </div>
          ) : (
            <div className="cam-list">
              {pending.map(req => (
                <div key={req.id} className="cam-card cam-card-pending">
                  <div className="cam-card-doctor">
                    <div className="cam-doc-avatar">
                      {req.users?.avatar_url
                        ? <img src={req.users.avatar_url} alt="" />
                        : <div className="cam-doc-init">
                            {(req.users?.name || "D").charAt(0)}
                          </div>}
                    </div>
                    <div className="cam-doc-info">
                      <h4>{isAr ? "د. " : "Dr. "}{req.users?.name || "—"}</h4>
                      <p>
                        <i className="fas fa-clock" />
                        {fmt(req.requested_at)}
                      </p>
                    </div>
                  </div>

                  <div className="cam-card-child">
                    <span className="cam-child-emoji">
                      {GENDER[req.children?.gender] || "👶"}
                    </span>
                    <div>
                      <span className="cam-child-name">{req.children?.name || "—"}</span>
                      <span className="cam-child-age">
                        {calcAge(req.children?.birth_date)}
                      </span>
                    </div>
                  </div>

                  {req.request_message && (
                    <div className="cam-request-msg">
                      <i className="fas fa-comment-alt" />
                      {req.request_message}
                    </div>
                  )}

               <div className="cam-respond-btns">
                    <button
                      className="cam-approve-btn"
                      disabled={responding === req.id}
                      onClick={() => respond(req.id, true)}
                    >
                      {responding === req.id
                        ? <i className="fas fa-spinner fa-spin" />
                        : <><i className="fas fa-check" />
                          {isAr ? "موافقة" : "Approve"}</>}
                    </button>
                    <button
                      className="cam-reject-btn"
                      disabled={responding === req.id}
                      onClick={() => respond(req.id, false)}
                    >
                      <i className="fas fa-times" />
                      {isAr ? "رفض" : "Reject"}
                    </button>
                    <button
                      className="cam-block-btn"
                      disabled={blocking === req.doctor_id}
                      onClick={() => blockDoctor(req.doctor_id, req.id)}
                      title={isAr ? "حظر الطبيب نهائياً" : "Block doctor permanently"}
                    >
                      {blocking === req.doctor_id
                        ? <i className="fas fa-spinner fa-spin" />
                        : <i className="fas fa-ban" />}
                      {isAr ? "حظر" : "Block"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
{/* ═══ BLOCKED ═══ */}
      {activeTab === "blocked" && (
        <div>
          {blockedDoctors.length === 0 ? (
            <div className="cam-empty">
              <i className="fas fa-shield-alt" />
              <p>{isAr ? "لا يوجد أطباء محظورون" : "No blocked doctors"}</p>
            </div>
          ) : (
            <div className="cam-list">
              {blockedDoctors.map(doctorId => {
                const req = [...accessList, ...pending].find(r => r.doctor_id === doctorId);
                return (
                  <div key={doctorId} className="cam-card" style={{ borderColor: "#fef0f0", background: "#fffafa" }}>
                    <div className="cam-card-doctor">
                      <div className="cam-doc-avatar">
                        <div className="cam-doc-init" style={{ background: "#fef0f0", color: "#e74c3c" }}>
                          <i className="fas fa-ban" style={{ fontSize: ".8rem" }} />
                        </div>
                      </div>
                      <div className="cam-doc-info">
                        <h4>{isAr ? "د. " : "Dr. "}{req?.users?.name || doctorId}</h4>
                        <p style={{ color: "#e74c3c" }}>
                          <i className="fas fa-ban" />
                          {isAr ? " محظور" : " Blocked"}
                        </p>
                      </div>
                    </div>
                    <button
                      className="cam-revoke-btn"
                      style={{ background: "#f0faf4", color: "#2ecc71" }}
                      onClick={() => unblockDoctor(doctorId)}
                    >
                      <i className="fas fa-unlock" />
                      {isAr ? "إلغاء الحظر" : "Unblock"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

const CAM_CSS = `
.cam-root{
  background: white;
  border-radius: 20px;
  padding: 20px;
  border: 1.5px solid #eab8c6;
  margin-bottom: 20px;
  box-shadow: 0 4px 18px rgba(214,139,157,.1);
}
.cam-header{
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.cam-header-title{
  display: flex;
  align-items: center;
  gap: 10px;
}
.cam-header-title i{
  color: #d68b9d;
  font-size: 1.1rem;
}
.cam-header-title h3{
  font-size: .95rem;
  font-weight: 800;
  color: #333;
}
.cam-pending-badge{
  background: #e74c3c;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: .75rem;
  font-weight: 700;
  animation: cam-pulse 1.5s infinite;
}
@keyframes cam-pulse{
  0%,100%{ transform: scale(1); }
  50%{ transform: scale(1.05); }
}
.cam-tabs{
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.cam-tab{
  background: #f4f4f4;
  border: none;
  padding: 8px 16px;
  border-radius: 25px;
  font-family: inherit;
  font-weight: 700;
  font-size: .8rem;
  color: #888;
  cursor: pointer;
  transition: .3s;
  display: flex;
  align-items: center;
  gap: 6px;
  position: relative;
}
.cam-tab:hover{ background: #fdf2f5; color: #d68b9d; }
.cam-tab.active{ background: #d68b9d; color: white; }
.cam-dot{
  width: 8px;
  height: 8px;
  background: #e74c3c;
  border-radius: 50%;
  position: absolute;
  top: 4px;
  inset-inline-end: 4px;
}
.cam-empty{
  text-align: center;
  padding: 30px;
  color: #ccc;
}
.cam-empty i{ font-size: 2rem; display: block; margin-bottom: 10px; }
.cam-empty p{ font-size: .85rem; font-weight: 600; }
.cam-list{
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.cam-card{
  background: #fafafa;
  border-radius: 14px;
  padding: 14px 16px;
  border: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  transition: .3s;
}
.cam-card:hover{ box-shadow: 0 4px 14px rgba(0,0,0,.06); }
.cam-card-pending{ border-color: #f39c12; background: #fffdf8; }
.cam-card-doctor{
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 160px;
}
.cam-doc-avatar{
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}
.cam-doc-avatar img{ width: 100%; height: 100%; object-fit: cover; }
.cam-doc-init{
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #eab8c6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}
.cam-doc-info h4{
  font-size: .88rem;
  font-weight: 700;
  color: #333;
}
.cam-doc-info p{
  font-size: .72rem;
  color: #aaa;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
}
.cam-doc-info p i{ font-size: .65rem; color: #d68b9d; }
.cam-card-child{
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fdf2f5;
  padding: 7px 12px;
  border-radius: 12px;
  flex: 1;
}
.cam-child-emoji{ font-size: 1.4rem; }
.cam-child-name{
  display: block;
  font-size: .85rem;
  font-weight: 700;
  color: #333;
}
.cam-child-age{
  display: block;
  font-size: .72rem;
  color: #aaa;
  font-weight: 600;
}
.cam-card-status{
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}
.cam-badge-active{
  background: #f0faf4;
  color: #2ecc71;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: .72rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 4px;
}
.cam-revoke-btn{
  background: #fef0f0;
  color: #e74c3c;
  border: none;
  padding: 7px 14px;
  border-radius: 10px;
  font-family: inherit;
  font-weight: 700;
  font-size: .78rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: .3s;
}
.cam-revoke-btn:hover{ background: #e74c3c; color: white; }
.cam-revoke-btn:disabled{ opacity: .6; cursor: not-allowed; }
.cam-request-msg{
  width: 100%;
  background: #fff8f0;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: .8rem;
  color: #888;
  font-style: italic;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-weight: 600;
}
.cam-request-msg i{ color: #f39c12; margin-top: 2px; flex-shrink: 0; }
.cam-respond-btns{
  display: flex;
  gap: 8px;
  margin-inline-start: auto;
}
.cam-approve-btn{
  background: #2ecc71;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 10px;
  font-family: inherit;
  font-weight: 700;
  font-size: .82rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: .3s;
}
.cam-approve-btn:hover{ background: #27ae60; }
.cam-approve-btn:disabled{ opacity: .7; cursor: not-allowed; }
.cam-reject-btn{
  background: #fef0f0;
  color: #e74c3c;
  border: none;
  padding: 8px 14px;
  border-radius: 10px;
  font-family: inherit;
  font-weight: 700;
  font-size: .82rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: .3s;
}
.cam-reject-btn:hover{ background: #e74c3c; color: white; }
.cam-reject-btn:disabled{ opacity: .7; cursor: not-allowed; }

@media(max-width: 600px){
  .cam-card{ flex-direction: column; align-items: flex-start; }
  .cam-card-status{ align-items: flex-start; }
  .cam-respond-btns{ width: 100%; }
  .cam-approve-btn, .cam-reject-btn{ flex: 1; justify-content: center; }
}

.cam-block-btn{
  background: #fef0f0;
  color: #e74c3c;
  border: none;
  padding: 8px 14px;
  border-radius: 10px;
  font-family: inherit;
  font-weight: 700;
  font-size: .82rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: .3s;
}
.cam-block-btn:hover{ background: #e74c3c; color: white; }
.cam-block-btn:disabled{ opacity: .7; cursor: not-allowed; }


`;

export default ChildAccessManager;