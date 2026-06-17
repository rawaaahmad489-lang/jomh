// src/modules/admin/pages/AdminMothers.jsx
import AdminLayout from "../components/AdminLayout";
// src/modules/admin/pages/AdminMothers.jsx
import { useState } from "react";
import { useAdminStats, useAdminUsers } from "../../../core/hooks/useAdminData";
import { supabase } from "../../../services/supabaseClient";

import Userdetailmodal from "../components/Userdetailmodal";

const COLORS = ["#f472b6","#a78bfa","#34d399","#60a5fa","#fbbf24","#fb7185"];

export default function AdminMothers() {
  const { stats }  = useAdminStats();
  const [page, setPage]         = useState(1);
  const [filter, setFilter]     = useState("all");
  const [search, setSearch]     = useState("");
  const [viewId, setViewId]     = useState(null);
  const { users, total, loading, refetch } = useAdminUsers("mother", page);

  const filtered = users.filter(u => {
    if (filter !== "all" && u.status !== filter) return false;
    if (search && !u.name?.toLowerCase().includes(search.toLowerCase()) &&
                  !u.email?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const updateStatus = async (id, status) => {
    await supabase.from("users").update({ status }).eq("user_id", id);
    refetch();
  };

  const totalPages = Math.ceil(total / 10);

  return (
    <AdminLayout stats={stats}>
      {viewId && <Userdetailmodal userId={viewId} role="mother" onClose={()=>setViewId(null)}/>}

      <div className="adm-stats-grid" style={{gridTemplateColumns:"repeat(3,1fr)",marginBottom:16}}>
        <div className="adm-stat pink">
          <div className="adm-stat-icon"><i className="fas fa-heart"/></div>
          <div className="adm-stat-val">{stats.mothers}</div>
          <div className="adm-stat-lbl">إجمالي الأمهات</div>
        </div>
        <div className="adm-stat green">
          <div className="adm-stat-icon"><i className="fas fa-check-circle"/></div>
          <div className="adm-stat-val">{users.filter(u=>u.status==="active").length}</div>
          <div className="adm-stat-lbl">نشطات</div>
        </div>
        <div className="adm-stat amber">
          <div className="adm-stat-icon"><i className="fas fa-clock"/></div>
          <div className="adm-stat-val">{users.filter(u=>u.status==="pending").length}</div>
          <div className="adm-stat-lbl">معلقات</div>
        </div>
      </div>

      <div className="adm-card">
        <div className="adm-card-header">
          <div className="adm-card-title"><i className="fas fa-heart"/> إدارة الأمهات</div>
        </div>
        <div className="adm-filters">
          {[
            {key:"all",       label:`الكل (${total})`},
            {key:"active",    label:"نشطات"},
            {key:"pending",   label:"معلقات"},
            {key:"suspended", label:"موقوفات"},
          ].map(f=>(
            <button key={f.key}
              className={`adm-filter-btn ${filter===f.key?"active":""}`}
              onClick={()=>setFilter(f.key)}>
              {f.label}
            </button>
          ))}
          <input className="adm-filter-input" placeholder="بحث بالاسم أو البريد..."
            value={search} onChange={e=>setSearch(e.target.value)} style={{marginRight:"auto"}}/>
        </div>

        {loading ? <div className="adm-loading"><div className="adm-spinner"/></div>
        : filtered.length === 0 ? <div className="adm-empty"><i className="fas fa-users"/><p>لا توجد نتائج</p></div>
        : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr><th>الأم</th><th>الحالة</th><th>تاريخ الانضمام</th><th>الإجراءات</th></tr>
              </thead>
              <tbody>
                {filtered.map((u,i)=>(
                  <tr key={u.user_id}>
                    <td>
                      <div className="adm-user-cell">
                        {u.avatar_url
                          ? <img src={u.avatar_url} alt="" style={{width:34,height:34,borderRadius:9,objectFit:"cover"}}/>
                          : <div className="adm-ava" style={{background:COLORS[i%COLORS.length]}}>{(u.name||"؟").charAt(0)}</div>
                        }
                        <div>
                          <div style={{fontWeight:600}}>{u.name||"—"}</div>
                          <div style={{fontSize:11,color:"#7c6f9f"}}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`adm-pill ${
                        u.status==="active"?"approved":
                        u.status==="pending"?"pending":
                        u.status==="suspended"?"suspended":"rejected"
                      }`}>{u.status==="active"?"✓ نشطة":u.status==="pending"?"⏳ معلقة":u.status==="suspended"?"⊘ موقوفة":"✗ مرفوضة"}</span>
                    </td>
                    <td style={{fontSize:12,color:"#7c6f9f"}}>
                      {u.created_at?new Date(u.created_at).toLocaleDateString("ar-SA"):"—"}
                    </td>
                    <td>
                      <div className="adm-actions">
                        <button className="adm-act view" title="عرض التفاصيل" onClick={()=>setViewId(u.user_id)}>
                          <i className="fas fa-eye"/>
                        </button>
                        {u.status==="active"
                          ? <button className="adm-act ban" title="إيقاف" onClick={()=>updateStatus(u.user_id,"suspended")}><i className="fas fa-ban"/></button>
                          : <button className="adm-act ok"  title="تفعيل" onClick={()=>updateStatus(u.user_id,"active")}><i className="fas fa-check"/></button>
                        }
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="adm-pagination">
            <button className="adm-page-btn" disabled={page===1} onClick={()=>setPage(p=>p-1)}><i className="fas fa-chevron-right"/></button>
            {Array.from({length:totalPages},(_,i)=>i+1).map(p=>(
              <button key={p} className={`adm-page-btn ${p===page?"active":""}`} onClick={()=>setPage(p)}>{p}</button>
            ))}
            <button className="adm-page-btn" disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}><i className="fas fa-chevron-left"/></button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}