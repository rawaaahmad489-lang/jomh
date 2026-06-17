// src/modules/admin/pages/AdminVendors.jsx
// src/modules/admin/pages/AdminVendors.jsx
import AdminLayout from "../components/AdminLayout";
// src/modules/admin/pages/AdminVendors.jsx
import { useState } from "react";
import { useAdminStats, useAdminUsers } from "../../../core/hooks/useAdminData";
import { supabase } from "../../../services/supabaseClient";

import UserDetailModal from "../components/Userdetailmodal";

export default function AdminVendors() {
  const { stats } = useAdminStats();
  const [tab,    setTab]    = useState("all");
  const [viewId, setViewId] = useState(null);
  const { users, total, loading, refetch } = useAdminUsers("vendor");

  const updateStatus = async (id, status) => {
    await supabase.from("users").update({ status }).eq("user_id", id);
    refetch();
  };

  const pending = users.filter(u=>u.status==="pending");
  const active  = users.filter(u=>u.status==="active");
  const shown   = tab==="pending"?pending:tab==="active"?active:users;

  return (
    <AdminLayout stats={stats}>
      {viewId && <UserDetailModal userId={viewId} role="vendor" onClose={()=>setViewId(null)}/>}

      {pending.length > 0 && (
        <div className="adm-alert warn">
          <i className="fas fa-store"/>
          يوجد <strong>{pending.length} متجر جديد</strong> ينتظر الموافقة.
        </div>
      )}

      <div className="adm-card">
        <div className="adm-card-header">
          <div className="adm-card-title"><i className="fas fa-store"/> إدارة المتاجر والبائعين</div>
        </div>
        <div className="adm-tabs">
          {[
            {key:"all",     label:`الكل (${total})`},
            {key:"pending", label:`طلبات (${pending.length})`},
            {key:"active",  label:`نشطة (${active.length})`},
          ].map(t=>(
            <button key={t.key} className={`adm-tab ${tab===t.key?"active":""}`} onClick={()=>setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? <div className="adm-loading"><div className="adm-spinner"/></div> : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>البائع</th><th>الحالة</th><th>تاريخ الطلب</th><th>الإجراءات</th></tr></thead>
              <tbody>
                {shown.map(u=>(
                  <tr key={u.user_id}>
                    <td>
                      <div className="adm-user-cell">
                        <div className="adm-ava" style={{background:"linear-gradient(135deg,#34d399,#60a5fa)"}}>
                          {(u.name||"م").charAt(0)}
                        </div>
                        <div>
                          <div style={{fontWeight:600}}>{u.name||"—"}</div>
                          <div style={{fontSize:11,color:"#7c6f9f"}}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {u.status==="pending"   && <span className="adm-pill pending">⏳ طلب جديد</span>}
                      {u.status==="active"    && <span className="adm-pill approved">✓ نشط</span>}
                      {u.status==="suspended" && <span className="adm-pill suspended">⊘ موقوف</span>}
                      {u.status==="rejected"  && <span className="adm-pill rejected">✗ مرفوض</span>}
                    </td>
                    <td style={{fontSize:12,color:"#7c6f9f"}}>
                      {u.created_at?new Date(u.created_at).toLocaleDateString("ar-SA"):"—"}
                    </td>
                    <td>
                      <div className="adm-actions">
                        <button className="adm-act view" title="عرض التفاصيل" onClick={()=>setViewId(u.user_id)}>
                          <i className="fas fa-eye"/>
                        </button>
                        {u.status==="pending" ? (<>
                          <button className="adm-act ok"  title="قبول" onClick={()=>updateStatus(u.user_id,"active")}><i className="fas fa-check"/></button>
                          <button className="adm-act ban" title="رفض"  onClick={()=>updateStatus(u.user_id,"rejected")}><i className="fas fa-times"/></button>
                        </>) : u.status==="active" ? (
                          <button className="adm-act ban" title="إيقاف" onClick={()=>updateStatus(u.user_id,"suspended")}><i className="fas fa-ban"/></button>
                        ) : (
                          <button className="adm-act ok" title="تفعيل" onClick={()=>updateStatus(u.user_id,"active")}><i className="fas fa-check"/></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}