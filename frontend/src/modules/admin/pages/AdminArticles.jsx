import AdminLayout from "../components/AdminLayout";
// src/modules/admin/pages/AdminArticles.jsx
// src/modules/admin/pages/AdminArticles.jsx
import { useState, useEffect, useCallback } from "react";
import { useAdminStats } from "../../../core/hooks/useAdminData";
import { supabase } from "../../../services/supabaseClient";


function useArticles(status, page) {
  const [articles, setArticles] = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const pageSize = 10;

  const fetch = useCallback(async () => {
    setLoading(true);

    // جلب المقالات بدون join معقد لتجنب مشاكل RLS
    let q = supabase
      .from("articles")
      .select("article_id, title, status, created_at, reading_time_minutes, views_count, cover_image_url, doctor_id", { count:"exact" })
      .order("created_at", { ascending:false })
      .range((page-1)*pageSize, page*pageSize-1);

    if (status !== "all") q = q.eq("status", status);

    const { data, count, error } = await q;
    if (error) { console.error(error); setArticles([]); setTotal(0); setLoading(false); return; }

    // جلب أسماء الأطباء منفصلاً
    if (data?.length) {
      const ids = [...new Set(data.map(a=>a.doctor_id).filter(Boolean))];
      const { data: docs } = await supabase
        .from("users").select("user_id, name, email").in("user_id", ids);
      const map = {};
      (docs||[]).forEach(d=>{ map[d.user_id]={ name:d.name, email:d.email }; });
      setArticles(data.map(a=>({ ...a, doctor: map[a.doctor_id]||null })));
    } else {
      setArticles(data||[]);
    }

    setTotal(count||0);
    setLoading(false);
  }, [status, page]);

  useEffect(() => { fetch(); }, [fetch]);
  return { articles, total, loading, refetch: fetch };
}

// Modal رفض المقال مع إرسال إشعار للطبيب
function RejectModal({ article, onClose, onDone }) {
  const [reason,  setReason]  = useState("");
  const [sending, setSending] = useState(false);

  const handleReject = async () => {
    if (!reason.trim()) return;
    setSending(true);

    // 1. رفض المقال وحفظ السبب
    const { error: artErr } = await supabase
      .from("articles")
      .update({ status:"rejected", rejection_reason:reason })
      .eq("article_id", article.article_id);

    if (artErr) { alert("خطأ: " + artErr.message); setSending(false); return; }

    // 2. إرسال إشعار للطبيب
    if (article.doctor_id) {
      await supabase.from("notifications").insert({
        user_id:           article.doctor_id,
        message:           `تم رفض مقالتك "${article.title}" — السبب: ${reason}`,
        notification_type: "system",
        is_read:           false,
      });

      // 3. تسجيل في audit_logs
      await supabase.from("audit_logs").insert({
        action:      "reject_article",
        target_type: "article",
        target_id:   article.article_id,
        description: `رفض المقال "${article.title}" — السبب: ${reason}`,
      });
    }

    onDone();
    onClose();
  };

  return (
    <div style={{
      position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",
      zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",
      padding:16,direction:"rtl",
    }} onClick={onClose}>
      <div style={{
        background:"#fff",borderRadius:16,padding:28,
        width:"100%",maxWidth:460,position:"relative",
      }} onClick={e=>e.stopPropagation()}>
        <button onClick={onClose} style={{
          position:"absolute",top:16,left:16,background:"#fee2e2",
          border:"none",borderRadius:8,width:32,height:32,cursor:"pointer",
          color:"#b91c1c",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",
        }}><i className="fas fa-times"/></button>

        <div style={{marginBottom:20}}>
          <h3 style={{fontSize:16,fontWeight:700,color:"#1e1b4b",marginBottom:6}}>
            <i className="fas fa-times-circle" style={{color:"#f87171",marginLeft:8}}/>
            رفض المقال
          </h3>
          <p style={{fontSize:13,color:"#7c6f9f"}}>
            المقال: <strong>{article.title}</strong>
          </p>
          {article.doctor && (
            <p style={{fontSize:12,color:"#7c6f9f",marginTop:4}}>
              الطبيب: {article.doctor.name} — سيتلقى إشعاراً بسبب الرفض
            </p>
          )}
        </div>

        <div className="adm-form-group" style={{marginBottom:16}}>
          <label className="adm-form-label">سبب الرفض * (سيُرسل للطبيب)</label>
          <textarea className="adm-form-input" value={reason}
            onChange={e=>setReason(e.target.value)}
            placeholder="مثال: المقال يحتوي معلومات طبية غير دقيقة..."
            rows={4} autoFocus/>
        </div>

        <div style={{display:"flex",gap:10}}>
          <button className="adm-btn-primary"
            style={{background:"linear-gradient(135deg,#f87171,#fb7185)"}}
            onClick={handleReject}
            disabled={sending||!reason.trim()}>
            {sending
              ? <><i className="fas fa-spinner fa-spin"/> جارٍ الإرسال...</>
              : <><i className="fas fa-times"/> رفض وإشعار الطبيب</>
            }
          </button>
          <button className="adm-btn-secondary" onClick={onClose}>إلغاء</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminArticles() {
  const { stats, refetch: refetchStats } = useAdminStats();
  const [tab,         setTab]         = useState("all");
  const [page,        setPage]        = useState(1);
  const [rejectArticle, setRejectArticle] = useState(null);
  const { articles, total, loading, refetch } = useArticles(tab, page);

  const approve = async (id) => {
    await supabase.from("articles").update({ status:"approved", rejection_reason:null }).eq("article_id", id);
    // إشعار للطبيب بالقبول
    const art = articles.find(a=>a.article_id===id);
    if (art?.doctor_id) {
      await supabase.from("notifications").insert({
        user_id:           art.doctor_id,
        message:           `تم قبول ونشر مقالتك "${art.title}" 🎉`,
        notification_type: "system",
        is_read:           false,
      });
      await supabase.from("audit_logs").insert({
        action:"approve_article", target_type:"article",
        target_id:id, description:`قبول المقال "${art.title}"`,
      });
    }
    refetch(); refetchStats();
  };

  const deleteArticle = async (id) => {
    if (!confirm("حذف المقال نهائياً؟")) return;
    await supabase.from("articles").delete().eq("article_id", id);
    refetch(); refetchStats();
  };

  const totalPages = Math.ceil(total/10);

  const TABS = [
    { key:"all",      label:`الكل (${total})` },
    { key:"pending",  label:`معلقة (${stats.pendingArticles})` },
    { key:"approved", label:"مقبولة" },
    { key:"rejected", label:"مرفوضة" },
  ];

  return (
    <AdminLayout stats={stats}>
      {rejectArticle && (
        <RejectModal
          article={rejectArticle}
          onClose={()=>setRejectArticle(null)}
          onDone={()=>{ refetch(); refetchStats(); }}
        />
      )}

      {stats.pendingArticles > 0 && (
        <div className="adm-alert warn">
          <i className="fas fa-newspaper"/>
          يوجد <strong>{stats.pendingArticles} مقال</strong> ينتظر مراجعتك.
        </div>
      )}

      <div className="adm-card">
        <div className="adm-card-header">
          <div className="adm-card-title"><i className="fas fa-newspaper"/> إدارة المقالات</div>
        </div>

        <div className="adm-tabs">
          {TABS.map(t=>(
            <button key={t.key}
              className={`adm-tab ${tab===t.key?"active":""}`}
              onClick={()=>{ setTab(t.key); setPage(1); }}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="adm-loading"><div className="adm-spinner"/></div>
        ) : articles.length === 0 ? (
          <div className="adm-empty">
            <i className="fas fa-newspaper"/>
            <p>لا توجد مقالات في هذا القسم</p>
          </div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>المقال</th>
                  <th>الطبيب</th>
                  <th>القراءة</th>
                  <th>المشاهدات</th>
                  <th>الحالة</th>
                  <th>التاريخ</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {articles.map(a=>(
                  <tr key={a.article_id}>
                    <td style={{maxWidth:200}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        {a.cover_image_url
                          ? <img src={a.cover_image_url} alt="" style={{width:36,height:36,borderRadius:8,objectFit:"cover",flexShrink:0}}/>
                          : <div style={{width:36,height:36,borderRadius:8,background:"#fdf2f8",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                              <i className="fas fa-newspaper" style={{color:"#f472b6",fontSize:14}}/>
                            </div>
                        }
                        <div style={{fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                          {a.title||"بدون عنوان"}
                        </div>
                      </div>
                    </td>
                    <td style={{fontSize:12}}>
                      <div style={{fontWeight:500}}>{a.doctor?.name||"—"}</div>
                      {a.doctor?.email && <div style={{fontSize:11,color:"#7c6f9f"}}>{a.doctor.email}</div>}
                    </td>
                    <td style={{fontSize:12,color:"#7c6f9f"}}>
                      {a.reading_time_minutes?`${a.reading_time_minutes} د`:"—"}
                    </td>
                    <td style={{fontSize:12}}>{a.views_count||0}</td>
                    <td>
                      {a.status==="pending"  && <span className="adm-pill pending">⏳ معلق</span>}
                      {a.status==="approved" && <span className="adm-pill approved">✓ مقبول</span>}
                      {a.status==="rejected" && (
                        <div>
                          <span className="adm-pill rejected">✗ مرفوض</span>
                          {a.rejection_reason && (
                            <div style={{fontSize:10,color:"#7c6f9f",marginTop:3,maxWidth:120}}>
                              {a.rejection_reason.slice(0,40)}...
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{fontSize:12,color:"#7c6f9f",whiteSpace:"nowrap"}}>
                      {a.created_at?new Date(a.created_at).toLocaleDateString("ar-SA"):"—"}
                    </td>
                    <td>
                      <div className="adm-actions">
                        {a.status!=="approved" && (
                          <button className="adm-act ok" title="قبول ونشر"
                            onClick={()=>approve(a.article_id)}>
                            <i className="fas fa-check"/>
                          </button>
                        )}
                        {a.status!=="rejected" && (
                          <button className="adm-act ban" title="رفض مع إشعار الطبيب"
                            onClick={()=>setRejectArticle(a)}>
                            <i className="fas fa-times"/>
                          </button>
                        )}
                        <button className="adm-act view" title="عرض المقال"
                          onClick={()=>window.open(`/articles/${a.article_id}`,"_blank")}>
                          <i className="fas fa-eye"/>
                        </button>
                        <button className="adm-act del" title="حذف نهائي"
                          onClick={()=>deleteArticle(a.article_id)}>
                          <i className="fas fa-trash-alt"/>
                        </button>
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
            <button className="adm-page-btn" disabled={page===1} onClick={()=>setPage(p=>p-1)}>
              <i className="fas fa-chevron-right"/>
            </button>
            {Array.from({length:totalPages},(_,i)=>i+1).map(p=>(
              <button key={p} className={`adm-page-btn ${p===page?"active":""}`} onClick={()=>setPage(p)}>{p}</button>
            ))}
            <button className="adm-page-btn" disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}>
              <i className="fas fa-chevron-left"/>
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}