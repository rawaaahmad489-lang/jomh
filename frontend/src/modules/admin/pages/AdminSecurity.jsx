// src/modules/admin/pages/AdminSecurity.jsx
import AdminLayout from "../components/AdminLayout";

// src/modules/admin/pages/AdminSecurity.jsx
// src/modules/admin/pages/AdminSecurity.jsx
import { useState, useEffect } from "react";
import { useAdminStats } from "../../../core/hooks/useAdminData";
import { supabase } from "../../../services/supabaseClient";


export default function AdminSecurity() {
  const { stats }  = useAdminStats();
  const [logs,     setLogs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("all");
  const [search,   setSearch]   = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("audit_logs")
        .select(`
          log_id, action, target_type, target_id,
          description, created_at,
          users:user_id ( name, email, avatar_url, role )
        `)
        .order("created_at", { ascending:false })
        .limit(100);

      if (error) console.error("audit_logs error:", error);
      setLogs(data || []);
      setLoading(false);
    };
    load();
  }, []);

  // تصنيف الأحداث
  const getActionMeta = (action) => {
    if (!action) return { label:"—", color:"info", icon:"fa-circle" };
    const a = action.toLowerCase();
    if (a.includes("login")  || a.includes("signin"))  return { label:"تسجيل دخول",  color:"success", icon:"fa-sign-in-alt" };
    if (a.includes("logout") || a.includes("signout")) return { label:"تسجيل خروج",  color:"info",    icon:"fa-sign-out-alt" };
    if (a.includes("register")|| a.includes("signup")) return { label:"تسجيل جديد",  color:"success", icon:"fa-user-plus" };
    if (a.includes("approve"))                          return { label:"قبول",         color:"success", icon:"fa-check" };
    if (a.includes("reject") || a.includes("refuse"))   return { label:"رفض",          color:"danger",  icon:"fa-times" };
    if (a.includes("delete") || a.includes("remove"))   return { label:"حذف",          color:"danger",  icon:"fa-trash" };
    if (a.includes("suspend")|| a.includes("ban"))      return { label:"إيقاف",        color:"danger",  icon:"fa-ban" };
    if (a.includes("update") || a.includes("edit"))     return { label:"تعديل",        color:"warn",    icon:"fa-pen" };
    if (a.includes("create") || a.includes("insert"))   return { label:"إنشاء",        color:"success", icon:"fa-plus" };
    return { label:action, color:"info", icon:"fa-circle-dot" };
  };

  const PILL_MAP  = { success:"approved", danger:"rejected", warn:"pending", info:"active" };
  const DOT_COLOR = { success:"#34d399",  danger:"#f87171",  warn:"#fbbf24", info:"#60a5fa" };

  const actionTypes = [...new Set(logs.map(l=>l.action).filter(Boolean))];

  const filtered = logs.filter(l => {
    if (filter !== "all" && l.action !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      return l.users?.name?.toLowerCase().includes(s) ||
             l.users?.email?.toLowerCase().includes(s) ||
             l.action?.toLowerCase().includes(s) ||
             l.description?.toLowerCase().includes(s);
    }
    return true;
  });

  const successCount = logs.filter(l => {
    const a = l.action?.toLowerCase()||"";
    return a.includes("approve")||a.includes("login")||a.includes("create")||a.includes("register");
  }).length;
  const dangerCount = logs.filter(l => {
    const a = l.action?.toLowerCase()||"";
    return a.includes("delete")||a.includes("suspend")||a.includes("reject")||a.includes("ban");
  }).length;

  return (
    <AdminLayout stats={stats}>

      <div className="adm-stats-grid" style={{gridTemplateColumns:"repeat(3,1fr)",marginBottom:16}}>
        <div className="adm-stat blue">
          <div className="adm-stat-icon"><i className="fas fa-list-check"/></div>
          <div className="adm-stat-val">{logs.length}</div>
          <div className="adm-stat-lbl">إجمالي السجلات</div>
        </div>
        <div className="adm-stat green">
          <div className="adm-stat-icon"><i className="fas fa-shield-check"/></div>
          <div className="adm-stat-val">{successCount}</div>
          <div className="adm-stat-lbl">عمليات ناجحة</div>
        </div>
        <div className="adm-stat red">
          <div className="adm-stat-icon"><i className="fas fa-triangle-exclamation"/></div>
          <div className="adm-stat-val">{dangerCount}</div>
          <div className="adm-stat-lbl">إجراءات تحذيرية</div>
        </div>
      </div>

      <div className="adm-card">
        <div className="adm-card-header">
          <div className="adm-card-title"><i className="fas fa-clock-rotate-left"/> سجل النشاط</div>
          <span className="adm-pill active">{filtered.length} سجل</span>
        </div>

        <div className="adm-filters">
          <button className={`adm-filter-btn ${filter==="all"?"active":""}`} onClick={()=>setFilter("all")}>
            الكل ({logs.length})
          </button>
          {actionTypes.slice(0,6).map(t=>(
            <button key={t}
              className={`adm-filter-btn ${filter===t?"active":""}`}
              onClick={()=>setFilter(t)}>
              {t}
            </button>
          ))}
          <input className="adm-filter-input" placeholder="بحث..."
            value={search} onChange={e=>setSearch(e.target.value)}
            style={{marginRight:"auto"}}/>
        </div>

        {loading ? (
          <div className="adm-loading"><div className="adm-spinner"/></div>
        ) : filtered.length === 0 ? (
          <div className="adm-empty">
            <i className="fas fa-shield"/>
            <p>لا توجد سجلات في جدول audit_logs بعد</p>
          </div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr><th>المستخدم</th><th>الإجراء</th><th>النوع</th><th>الوصف</th><th>التاريخ</th></tr>
              </thead>
              <tbody>
                {filtered.map((log,i) => {
                  const meta = getActionMeta(log.action);
                  return (
                    <tr key={log.log_id||i}>
                      <td>
                        <div className="adm-user-cell">
                          {log.users?.avatar_url
                            ? <img src={log.users.avatar_url} alt="" style={{width:32,height:32,borderRadius:8,objectFit:"cover"}}/>
                            : <div className="adm-ava" style={{width:32,height:32,fontSize:12,background:"linear-gradient(135deg,#f472b6,#a78bfa)"}}>
                                {(log.users?.name||"؟").charAt(0)}
                              </div>
                          }
                          <div>
                            <div style={{fontWeight:600,fontSize:13}}>{log.users?.name||"—"}</div>
                            <div style={{fontSize:11,color:"#7c6f9f"}}>{log.users?.email||""}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`adm-pill ${PILL_MAP[meta.color]||"active"}`}>
                          <i className={`fas ${meta.icon}`} style={{fontSize:10,marginLeft:4}}/>
                          {meta.label}
                        </span>
                      </td>
                      <td>
                        {log.target_type && (
                          <span className="adm-pill active" style={{fontSize:11}}>{log.target_type}</span>
                        )}
                      </td>
                      <td style={{fontSize:12,color:"#7c6f9f",maxWidth:200}}>
                        {(log.description||"—").slice(0,60)}{log.description?.length>60?"…":""}
                      </td>
                      <td style={{fontSize:11,color:"#7c6f9f",whiteSpace:"nowrap"}}>
                        {log.created_at?new Date(log.created_at).toLocaleString("ar-SA"):"—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}