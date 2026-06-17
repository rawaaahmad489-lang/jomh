// src/modules/admin/pages/AdminReports.jsx

import AdminLayout from "../components/AdminLayout";
// src/modules/admin/pages/AdminReports.jsx
import { useState, useEffect } from "react";
import { useAdminStats } from "../../../core/hooks/useAdminData";
import { supabase } from "../../../services/supabaseClient";


export default function AdminReports() {
  const { stats } = useAdminStats();
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("all");

  useEffect(()=>{
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("audit_logs")
        .select(`
          log_id, action, target_type, target_id,
          description, created_at,
          users:user_id ( name, email, avatar_url )
        `)
        .order("created_at", { ascending: false })
        .limit(100);
      setLogs(data || []);
      setLoading(false);
    };
    load();
  },[]);

  const filtered = filter === "all"
    ? logs
    : logs.filter(l => l.target_type === filter);

  const targetTypes = [...new Set(logs.map(l=>l.target_type).filter(Boolean))];

  const actionColor = (action) => {
    if (!action) return "active";
    const a = action.toLowerCase();
    if (a.includes("delete") || a.includes("حذف"))   return "rejected";
    if (a.includes("suspend") || a.includes("ban"))   return "suspended";
    if (a.includes("approve") || a.includes("create"))return "approved";
    return "active";
  };

  const actionIcon = (action) => {
    if (!action) return "fa-circle";
    const a = action.toLowerCase();
    if (a.includes("delete"))  return "fa-trash";
    if (a.includes("suspend")) return "fa-ban";
    if (a.includes("approve")) return "fa-check";
    if (a.includes("create"))  return "fa-plus";
    if (a.includes("login"))   return "fa-sign-in-alt";
    return "fa-circle-dot";
  };

  return (
    <AdminLayout stats={stats}>
      <div className="adm-stats-grid" style={{gridTemplateColumns:"repeat(3,1fr)",marginBottom:16}}>
        <div className="adm-stat blue">
          <div className="adm-stat-icon"><i className="fas fa-list-check"/></div>
          <div className="adm-stat-val">{logs.length}</div>
          <div className="adm-stat-lbl">إجمالي السجلات</div>
        </div>
        <div className="adm-stat red">
          <div className="adm-stat-icon"><i className="fas fa-trash"/></div>
          <div className="adm-stat-val">{logs.filter(l=>l.action?.toLowerCase().includes("delete")).length}</div>
          <div className="adm-stat-lbl">عمليات حذف</div>
        </div>
        <div className="adm-stat green">
          <div className="adm-stat-icon"><i className="fas fa-check"/></div>
          <div className="adm-stat-val">{logs.filter(l=>l.action?.toLowerCase().includes("approve")).length}</div>
          <div className="adm-stat-lbl">عمليات قبول</div>
        </div>
      </div>

      <div className="adm-card">
        <div className="adm-card-header">
          <div className="adm-card-title"><i className="fas fa-clock-rotate-left"/> سجل النشاط (Audit Log)</div>
          <span className="adm-pill active">{logs.length} سجل</span>
        </div>

        <div className="adm-filters">
          <button className={`adm-filter-btn ${filter==="all"?"active":""}`} onClick={()=>setFilter("all")}>
            الكل ({logs.length})
          </button>
          {targetTypes.map(t=>(
            <button key={t}
              className={`adm-filter-btn ${filter===t?"active":""}`}
              onClick={()=>setFilter(t)}>
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="adm-loading"><div className="adm-spinner"/></div>
        ) : filtered.length === 0 ? (
          <div className="adm-empty"><i className="fas fa-flag"/><p>لا توجد سجلات</p></div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>المستخدم</th>
                  <th>الإجراء</th>
                  <th>النوع</th>
                  <th>الوصف</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l=>(
                  <tr key={l.log_id}>
                    <td>
                      <div className="adm-user-cell">
                        <div className="adm-ava" style={{background:"linear-gradient(135deg,#f472b6,#a78bfa)",fontSize:12}}>
                          {(l.users?.name||"؟").charAt(0)}
                        </div>
                        <div>
                          <div style={{fontWeight:600,fontSize:13}}>{l.users?.name||"—"}</div>
                          <div style={{fontSize:11,color:"#7c6f9f"}}>{l.users?.email||"—"}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`adm-pill ${actionColor(l.action)}`}>
                        <i className={`fas ${actionIcon(l.action)}`} style={{fontSize:10}}/>
                        {" "}{l.action||"—"}
                      </span>
                    </td>
                    <td>
                      {l.target_type && (
                        <span className="adm-pill active" style={{fontSize:11}}>{l.target_type}</span>
                      )}
                    </td>
                    <td style={{fontSize:12,color:"#7c6f9f",maxWidth:200}}>
                      {(l.description||"—").slice(0,60)}{l.description?.length>60?"…":""}
                    </td>
                    <td style={{fontSize:12,color:"#7c6f9f",whiteSpace:"nowrap"}}>
                      {l.created_at ? new Date(l.created_at).toLocaleString("ar-SA") : "—"}
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