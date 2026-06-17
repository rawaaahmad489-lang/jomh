
// ملف: src/modules/mother/components/AccessRequestsNotifications.jsx

import { useState } from "react";
import { useMotherAccessRequests } from "../../../core/hooks/useChildAccess";

const AccessRequestsNotifications = ({ motherUserId, isAr }) => {
  const { requests, loading, respond } = useMotherAccessRequests(motherUserId);
  const [responding, setResponding] = useState(null); // request id

  const pendingRequests = requests.filter(r => r.status === "pending");

  if (loading || pendingRequests.length === 0) return null;

  const handleRespond = async (requestId, approved) => {
    setResponding(requestId);
    await respond(requestId, approved);
    setResponding(null);
  };

  const calcAge = (birthDate) => {
    if (!birthDate) return "—";
    const months =
      (new Date().getFullYear() - new Date(birthDate).getFullYear()) * 12 +
      new Date().getMonth() - new Date(birthDate).getMonth();
    const years = Math.floor(months / 12);
    const rem   = months % 12;
    if (isAr) return years > 0 ? `${years}س ${rem>0?`${rem}ش`:""}` : `${months}ش`;
    return years > 0 ? `${years}y ${rem>0?rem+"mo":""}`.trim() : `${months}mo`;
  };

  return (
    <div className="arn-root" dir={isAr ? "rtl" : "ltr"}>
      <style>{ARN_CSS}</style>
      <div className="arn-header">
        <i className="fas fa-user-md" />
        <h3>
          {isAr
            ? `طلبات متابعة من الأطباء (${pendingRequests.length})`
            : `Doctor Follow-up Requests (${pendingRequests.length})`}
        </h3>
      </div>
      <div className="arn-list">
        {pendingRequests.map(req => (
          <div key={req.id} className="arn-card">
            <div className="arn-card-left">
              <div className="arn-doc-avatar">
                {req.users?.avatar_url
                  ? <img src={req.users.avatar_url} alt="" />
                  : <div className="arn-doc-init">{(req.users?.name || "D").charAt(0)}</div>}
              </div>
              <div className="arn-card-info">
                <h4>
                  {isAr ? "د. " : "Dr. "}{req.users?.name || "—"}
                  {isAr ? " يطلب الاطلاع على ملف" : " requests access to"}
                  {" "}
                  <span className="arn-child-name">
                    {req.children?.name || "—"} ({calcAge(req.children?.birth_date)})
                  </span>
                </h4>
                {req.request_message && (
                  <p className="arn-message">
                    <i className="fas fa-quote-right" /> {req.request_message}
                  </p>
                )}
              </div>
            </div>
            <div className="arn-card-actions">
              <button
                className="arn-btn-approve"
                disabled={responding === req.id}
                onClick={() => handleRespond(req.id, true)}
              >
                {responding === req.id
                  ? <i className="fas fa-spinner fa-spin" />
                  : <><i className="fas fa-check" /> {isAr ? "موافقة" : "Approve"}</>}
              </button>
              <button
                className="arn-btn-reject"
                disabled={responding === req.id}
                onClick={() => handleRespond(req.id, false)}
              >
                <i className="fas fa-times" /> {isAr ? "رفض" : "Reject"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ARN_CSS = `
.arn-root{
  background: white;
  border-radius: 18px;
  padding: 18px;
  border: 1.5px solid #eab8c6;
  margin-bottom: 20px;
  box-shadow: 0 4px 18px rgba(214,139,157,.12);
}
.arn-header{
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
.arn-header i{
  color: #d68b9d;
  font-size: 1.1rem;
}
.arn-header h3{
  font-size: .95rem;
  font-weight: 800;
  color: #333;
}
.arn-list{
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.arn-card{
  background: #fdf2f5;
  border-radius: 14px;
  padding: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}
.arn-card-left{
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
}
.arn-doc-avatar{
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}
.arn-doc-avatar img{ width:100%;height:100%;object-fit:cover; }
.arn-doc-init{
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #eab8c6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.1rem;
}
.arn-card-info h4{
  font-size: .88rem;
  font-weight: 700;
  color: #333;
  line-height: 1.4;
}
.arn-child-name{
  color: #d68b9d;
  font-weight: 800;
}
.arn-message{
  font-size: .78rem;
  color: #888;
  font-weight: 600;
  margin-top: 5px;
  font-style: italic;
  display: flex;
  align-items: flex-start;
  gap: 5px;
}
.arn-message i{ font-size:.7rem; color:#d68b9d; margin-top:2px; }
.arn-card-actions{
  display: flex;
  gap: 8px;
}
.arn-btn-approve{
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
.arn-btn-approve:hover{ background: #27ae60; }
.arn-btn-approve:disabled{ opacity: .7; cursor: not-allowed; }
.arn-btn-reject{
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
.arn-btn-reject:hover{ background: #e74c3c; color: white; }
.arn-btn-reject:disabled{ opacity: .7; cursor: not-allowed; }

@media(max-width:600px){
  .arn-card{ flex-direction: column; }
  .arn-card-actions{ width: 100%; }
  .arn-btn-approve, .arn-btn-reject{ flex: 1; justify-content: center; }
}
`;

export default AccessRequestsNotifications;