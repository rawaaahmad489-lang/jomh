// src/modules/admin/pages/AdminDashboard.jsx
import { useAdminStats } from "../../../core/hooks/useAdminData";
import AdminLayout from "../components/AdminLayout";

const STAT_CARDS = (s) => [
  { key: "mothers",        label: "الأمهات",          icon: "fa-heart",       color: "pink",   change: { type: "up",   text: "+12 هذا الأسبوع" } },
  { key: "doctors",        label: "الأطباء الموثقون", icon: "fa-stethoscope", color: "purple", change: { type: "up",   text: "+2 جدد" } },
  { key: "vendors",        label: "المتاجر النشطة",   icon: "fa-store",       color: "green",  change: { type: "up",   text: "+1 هذا الأسبوع" } },
  { key: "articles",       label: "المقالات",         icon: "fa-newspaper",   color: "amber",  change: { type: "up",   text: `${s.pendingArticles} معلقة` } },
  { key: "reports",        label: "البلاغات المعلقة", icon: "fa-flag",        color: "red",    change: { type: "warn", text: "تحتاج مراجعة" } },
];

const BAR_DATA = [
  { label: "يناير",  val: 45 },
  { label: "فبراير", val: 62 },
  { label: "مارس",   val: 55 },
  { label: "أبريل",  val: 78 },
  { label: "مايو",   val: 92 },
  { label: "يونيو",  val: 70 },
];
const MAX_BAR = 100;

export default function AdminDashboard() {
  const { stats, loading } = useAdminStats();

  return (
    <AdminLayout stats={stats}>
      {loading ? (
        <div className="adm-loading">
          <div className="adm-spinner" />
          <p>جارٍ تحميل البيانات...</p>
        </div>
      ) : (
        <>
          {/* ── STATS ── */}
          <div className="adm-stats-grid">
            {STAT_CARDS(stats).map((s) => (
              <div key={s.key} className={`adm-stat ${s.color}`}>
                <div className="adm-stat-icon"><i className={`fas ${s.icon}`} /></div>
                <div className="adm-stat-val">{stats[s.key] ?? 0}</div>
                <div className="adm-stat-lbl">{s.label}</div>
                <div className={`adm-stat-change ${s.change.type}`}>
                  <i className={`fas fa-${s.change.type === "up" ? "arrow-up" : "exclamation-circle"}`} />
                  {s.change.text}
                </div>
              </div>
            ))}
          </div>

          {/* ── CHARTS ROW ── */}
          <div className="adm-two-col" style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr", gap:14, marginBottom:16 }}>

            {/* Bar chart */}
            <div className="adm-card">
              <div className="adm-card-header">
                <div className="adm-card-title">
                  <i className="fas fa-chart-bar" /> التسجيلات الشهرية
                </div>
                <span className="adm-pill active">آخر 6 أشهر</span>
              </div>
              <div style={{ display:"flex", alignItems:"flex-end", gap:10, height:110 }}>
                {BAR_DATA.map((b) => (
                  <div key={b.label} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
                    <div style={{
                      width:"100%",
                      height: `${(b.val/MAX_BAR)*100}px`,
                      background:"linear-gradient(180deg,#f472b6,#a78bfa)",
                      borderRadius:"5px 5px 0 0", cursor:"default",
                      transition:"opacity .2s",
                    }}
                    onMouseEnter={e=>e.target.style.opacity=".75"}
                    onMouseLeave={e=>e.target.style.opacity="1"}
                    title={`${b.val} مستخدم`}
                    />
                    <span style={{ fontSize:11, color:"#7c6f9f" }}>{b.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Donut */}
            <div className="adm-card">
              <div className="adm-card-header">
                <div className="adm-card-title"><i className="fas fa-chart-pie" /> توزيع المستخدمين</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:18 }}>
                <svg width="90" height="90" viewBox="0 0 90 90">
                  <circle cx="45" cy="45" r="35" fill="none" stroke="#fdf2f8" strokeWidth="14"/>
                  <circle cx="45" cy="45" r="35" fill="none" stroke="#f472b6" strokeWidth="14"
                    strokeDasharray="138 82" strokeDashoffset="25" transform="rotate(-90 45 45)"/>
                  <circle cx="45" cy="45" r="35" fill="none" stroke="#a78bfa" strokeWidth="14"
                    strokeDasharray="52 168" strokeDashoffset="-113" transform="rotate(-90 45 45)"/>
                  <circle cx="45" cy="45" r="35" fill="none" stroke="#34d399" strokeWidth="14"
                    strokeDasharray="30 190" strokeDashoffset="-165" transform="rotate(-90 45 45)"/>
                </svg>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {[
                    { color:"#f472b6", label:`أمهات (${stats.mothers})` },
                    { color:"#a78bfa", label:`أطباء (${stats.doctors})` },
                    { color:"#34d399", label:`متاجر (${stats.vendors})` },
                  ].map(d=>(
                    <div key={d.label} style={{ display:"flex", alignItems:"center", gap:7, fontSize:12 }}>
                      <span style={{ width:10, height:10, borderRadius:"50%", background:d.color, display:"inline-block" }} />
                      {d.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── BOTTOM ROW ── */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>

            {/* Quick links */}
            <div className="adm-card">
              <div className="adm-card-header">
                <div className="adm-card-title"><i className="fas fa-bolt" /> إجراءات سريعة</div>
              </div>
              {[
                { label:`مراجعة ${stats.pendingArticles} مقال معلق`, icon:"fa-newspaper",   path:"/admin/articles",  color:"amber" },
                { label:`معالجة ${stats.reports} بلاغ`,              icon:"fa-flag",         path:"/admin/reports",   color:"red"   },
                { label:`توثيق طلبات الأطباء`,                        icon:"fa-stethoscope", path:"/admin/doctors",   color:"purple"},
                { label:`مراجعة المتاجر الجديدة`,                    icon:"fa-store",        path:"/admin/vendors",   color:"green" },
              ].map((item) => (
                <a key={item.label} href={item.path}
                  style={{
                    display:"flex", alignItems:"center", gap:12,
                    padding:"11px 0", borderBottom:"1px solid #fdf4ff",
                    textDecoration:"none", color:"inherit",
                  }}>
                  <div className={`adm-stat-icon adm-stat ${item.color}`} style={{ width:34,height:34,borderRadius:9,marginBottom:0 }}>
                    <i className={`fas ${item.icon}`} />
                  </div>
                  <span style={{ fontSize:13, color:"#1e1b4b", fontWeight:500 }}>{item.label}</span>
                  <i className="fas fa-chevron-left" style={{ marginRight:"auto", color:"#ddd6fe", fontSize:12 }} />
                </a>
              ))}
            </div>

            {/* System status */}
            <div className="adm-card">
              <div className="adm-card-header">
                <div className="adm-card-title"><i className="fas fa-server" /> حالة النظام</div>
              </div>
              {[
                { label:"Supabase Auth",      status:"يعمل",       ok:true  },
                { label:"قاعدة البيانات",    status:"يعمل",       ok:true  },
                { label:"نظام الإشعارات",   status:"يعمل",       ok:true  },
                { label:"نظام Gamification", status:"يعمل",       ok:true  },
                { label:"Chatbot AI",         status:"قيد التطوير", ok:false },
              ].map((s) => (
                <div key={s.label} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #fdf4ff" }}>
                  <span style={{ fontSize:13, color:"#1e1b4b" }}>{s.label}</span>
                  <span className={`adm-pill ${s.ok ? "approved" : "pending"}`}>
                    {s.ok ? "✓" : "⏳"} {s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}