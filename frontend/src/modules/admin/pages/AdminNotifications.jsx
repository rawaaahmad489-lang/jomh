// src/modules/admin/pages/AdminNotifications.jsx
import AdminLayout from "../components/AdminLayout";

// src/modules/admin/pages/AdminNotifications.jsx
// src/modules/admin/pages/AdminNotifications.jsx
import { useState, useEffect } from "react";
import { useAdminStats } from "../../../core/hooks/useAdminData";
import { supabase } from "../../../services/supabaseClient";


// notification_type المتاحة — عدّلها حسب الـ enum عندك
const NOTIF_TYPES = [
  { value:"system",        label:"نظام" },
  { value:"appointment",   label:"موعد" },
  { value:"article",       label:"مقال" },
  { value:"badge",         label:"شارة" },
  { value:"challenge",     label:"تحدي" },
  { value:"recommendation",label:"توصية" },
];

export default function AdminNotifications() {
  const { stats } = useAdminStats();
  const [form, setForm]     = useState({ message:"", role:"all", type:"system" });
  const [sending, setSending] = useState(false);
  const [result,  setResult]  = useState(null); // { ok, text }
  const [history, setHistory] = useState([]);
  const [loadingH, setLoadingH] = useState(true);

  const loadHistory = async () => {
    setLoadingH(true);
    const { data } = await supabase
      .from("notifications")
      .select(`
        notification_id, message, notification_type,
        is_read, created_at,
        users:user_id ( name, email )
      `)
      .order("created_at", { ascending:false })
      .limit(40);
    setHistory(data || []);
    setLoadingH(false);
  };

  useEffect(() => { loadHistory(); }, []);

  const sendNotification = async () => {
    if (!form.message.trim()) return;
    setSending(true);
    setResult(null);

    // جلب المستخدمين المستهدفين
    let query = supabase.from("users").select("user_id").eq("status","active");
    if (form.role !== "all") query = query.eq("role", form.role);
    const { data: users, error: uErr } = await query;

    if (uErr || !users?.length) {
      setResult({ ok:false, text:"لا يوجد مستخدمون نشطون في هذه الفئة" });
      setSending(false);
      return;
    }

    // إدراج الإشعارات
    const rows = users.map(u => ({
      user_id:           u.user_id,
      message:           form.message,
      notification_type: form.type,
      is_read:           false,
    }));

    const { error } = await supabase.from("notifications").insert(rows);

    if (error) {
      setResult({ ok:false, text:"خطأ: " + error.message });
    } else {
      setResult({ ok:true, text:`✓ تم الإرسال لـ ${users.length} مستخدم بنجاح` });
      setForm({ message:"", role:"all", type:"system" });
      loadHistory();
    }
    setSending(false);
    setTimeout(() => setResult(null), 5000);
  };

  return (
    <AdminLayout stats={stats}>

      {/* إرسال */}
      <div className="adm-card">
        <div className="adm-card-header">
          <div className="adm-card-title"><i className="fas fa-paper-plane"/> إرسال إشعار جماعي</div>
        </div>

        {result && (
          <div className={`adm-alert ${result.ok?"success":"danger"}`} style={{marginBottom:14}}>
            <i className={`fas fa-${result.ok?"check-circle":"exclamation-circle"}`}/>
            {result.text}
          </div>
        )}

        <div className="adm-form-grid">
          <div className="adm-form-group">
            <label className="adm-form-label">الفئة المستهدفة</label>
            <select className="adm-form-input" value={form.role}
              onChange={e=>setForm(p=>({...p,role:e.target.value}))}>
              <option value="all">كل المستخدمين النشطين</option>
              <option value="mother">الأمهات فقط</option>
              <option value="doctor">الأطباء فقط</option>
              <option value="vendor">المتاجر فقط</option>
            </select>
          </div>
          <div className="adm-form-group">
            <label className="adm-form-label">نوع الإشعار</label>
            <select className="adm-form-input" value={form.type}
              onChange={e=>setForm(p=>({...p,type:e.target.value}))}>
              {NOTIF_TYPES.map(t=>(
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="adm-form-group full">
            <label className="adm-form-label">نص الرسالة *</label>
            <textarea className="adm-form-input" value={form.message}
              onChange={e=>setForm(p=>({...p,message:e.target.value}))}
              placeholder="اكتب رسالتك هنا..." rows={3}/>
          </div>
        </div>

        <button className="adm-btn-primary"
          onClick={sendNotification}
          disabled={sending || !form.message.trim()}>
          {sending
            ? <><i className="fas fa-spinner fa-spin"/> جارٍ الإرسال...</>
            : <><i className="fas fa-paper-plane"/> إرسال</>
          }
        </button>
      </div>

      {/* السجل */}
      <div className="adm-card">
        <div className="adm-card-header">
          <div className="adm-card-title"><i className="fas fa-history"/> آخر الإشعارات المرسلة</div>
          <span className="adm-pill active">{history.length}</span>
        </div>
        {loadingH ? (
          <div className="adm-loading"><div className="adm-spinner"/></div>
        ) : history.length === 0 ? (
          <div className="adm-empty"><i className="fas fa-bell-slash"/><p>لا توجد إشعارات بعد</p></div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr><th>المستخدم</th><th>الرسالة</th><th>النوع</th><th>تمت القراءة</th><th>التاريخ</th></tr>
              </thead>
              <tbody>
                {history.map(n=>(
                  <tr key={n.notification_id}>
                    <td>
                      <div style={{fontSize:13,fontWeight:600}}>{n.users?.name||"—"}</div>
                      <div style={{fontSize:11,color:"#7c6f9f"}}>{n.users?.email||""}</div>
                    </td>
                    <td style={{fontSize:12,color:"#1e1b4b",maxWidth:220}}>
                      {(n.message||"").slice(0,70)}{n.message?.length>70?"…":""}
                    </td>
                    <td>
                      <span className="adm-pill active" style={{fontSize:11}}>
                        {n.notification_type||"—"}
                      </span>
                    </td>
                    <td>
                      <span className={`adm-pill ${n.is_read?"approved":"pending"}`}>
                        {n.is_read?"✓ مقروء":"⏳ غير مقروء"}
                      </span>
                    </td>
                    <td style={{fontSize:11,color:"#7c6f9f",whiteSpace:"nowrap"}}>
                      {n.created_at?new Date(n.created_at).toLocaleString("ar-SA"):"—"}
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