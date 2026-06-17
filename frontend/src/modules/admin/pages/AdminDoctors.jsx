// src/modules/admin/pages/AdminDoctors.jsx
// src/modules/admin/pages/AdminDoctors.jsx
 import AdminLayout from "../components/AdminLayout";
// src/modules/admin/pages/AdminDoctors.jsx
import { useState } from "react";
import { useAdminStats, useAdminUsers } from "../../../core/hooks/useAdminData";
import { supabase } from "../../../services/supabaseClient";

import Userdetailmodal from "../components/Userdetailmodal";

export default function AdminDoctors() {
  const { stats } = useAdminStats();
  const [tab,    setTab]    = useState("all");
  const [search, setSearch] = useState("");
  const [viewId, setViewId] = useState(null);
  const { users, total, loading, refetch } = useAdminUsers("doctor");

  const filtered = users.filter(u => {
    if (tab !== "all" && u.status !== tab) return false;
    if (search && !u.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const updateStatus = async (id, status) => {
    await supabase.from("users").update({ status }).eq("user_id", id);
    refetch();
  };

  const pendingCount = users.filter(u=>u.status==="pending").length;
  const activeCount  = users.filter(u=>u.status==="active").length;

  return (
    <AdminLayout stats={stats}>
      {viewId && <Userdetailmodal userId={viewId} role="doctor" onClose={()=>setViewId(null)}/>}

      <div className="adm-stats-grid" style={{gridTemplateColumns:"repeat(3,1fr)",marginBottom:16}}>
        <div className="adm-stat purple">
          <div className="adm-stat-icon"><i className="fas fa-stethoscope"/></div>
          <div className="adm-stat-val">{total}</div>
          <div className="adm-stat-lbl">إجمالي الأطباء</div>
        </div>
        <div className="adm-stat green">
          <div className="adm-stat-icon"><i className="fas fa-check-circle"/></div>
          <div className="adm-stat-val">{activeCount}</div>
          <div className="adm-stat-lbl">نشطون</div>
        </div>
        <div className="adm-stat amber">
          <div className="adm-stat-icon"><i className="fas fa-clock"/></div>
          <div className="adm-stat-val">{pendingCount}</div>
          <div className="adm-stat-lbl">طلبات معلقة</div>
        </div>
      </div>

      {pendingCount > 0 && (
        <div className="adm-alert warn">
          <i className="fas fa-exclamation-triangle"/>
          يوجد <strong>{pendingCount} طلب توثيق طبيب</strong> ينتظر مراجعتك.
        </div>
      )}

      <div className="adm-card">
        <div className="adm-card-header">
          <div className="adm-card-title"><i className="fas fa-stethoscope"/> إدارة الأطباء</div>
          <input className="adm-filter-input" placeholder="بحث..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div className="adm-tabs">
          {[
            {key:"all",       label:`الكل (${total})`},
            {key:"pending",   label:`طلبات (${pendingCount})`},
            {key:"active",    label:`نشطون (${activeCount})`},
            {key:"suspended", label:"موقوفون"},
          ].map(t=>(
            <button key={t.key} className={`adm-tab ${tab===t.key?"active":""}`} onClick={()=>setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? <div className="adm-loading"><div className="adm-spinner"/></div> : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>الطبيب</th><th>الحالة</th><th>تاريخ الطلب</th><th>الإجراءات</th></tr></thead>
              <tbody>
                {filtered.map(u=>(
                  <tr key={u.user_id}>
                    <td>
                      <div className="adm-user-cell">
                        <div className="adm-ava" style={{background:"linear-gradient(135deg,#60a5fa,#a78bfa)"}}>
                          {(u.name||"د").charAt(0)}
                        </div>
                        <div>
                          <div style={{fontWeight:600}}>د. {u.name}</div>
                          <div style={{fontSize:11,color:"#7c6f9f"}}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {u.status==="pending"   && <span className="adm-pill pending">⏳ معلق</span>}
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
                          <button className="adm-act ok"  title="قبول"  onClick={()=>updateStatus(u.user_id,"active")}><i className="fas fa-check"/></button>
                          <button className="adm-act ban" title="رفض"   onClick={()=>updateStatus(u.user_id,"rejected")}><i className="fas fa-times"/></button>
                        </>) : u.status==="active" ? (
                          <button className="adm-act ban" title="إيقاف" onClick={()=>updateStatus(u.user_id,"suspended")}><i className="fas fa-ban"/></button>
                        ) : (
                          <button className="adm-act ok"  title="تفعيل" onClick={()=>updateStatus(u.user_id,"active")}><i className="fas fa-check"/></button>
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