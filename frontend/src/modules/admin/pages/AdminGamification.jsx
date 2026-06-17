// src/modules/admin/pages/AdminGamification.jsx
import AdminLayout from "../components/AdminLayout";
// src/modules/admin/pages/AdminGamification.jsx
// src/modules/admin/pages/AdminGamification.jsx
import { useState, useEffect } from "react";
import { useAdminStats } from "../../../core/hooks/useAdminData";
import { supabase } from "../../../services/supabaseClient";


export default function AdminGamification() {
  const { stats } = useAdminStats();
  const [badges,     setBadges]     = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [topUsers,   setTopUsers]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showBadgeForm,     setShowBadgeForm]     = useState(false);
  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newBadge, setNewBadge] = useState({
    name:"", name_ar:"", description:"", description_ar:"",
    icon:"🏆", color:"#f472b6",
    xp_reward:50, condition_type:"xp",
    condition_value:100, condition_table:"user_gamification"
  });

  const [newChallenge, setNewChallenge] = useState({
    title_ar:"", description_ar:"",
    activity_type:"habit", target_days:7,
    xp_reward:50, icon:"🎯", color:"#f472b6", is_active:true
  });

  const load = async () => {
    setLoading(true);
    const [
      { data: b  },
      { data: c  },
      { data: top },
    ] = await Promise.all([
      supabase.from("badges").select("*").order("created_at", { ascending:false }),
      supabase.from("health_challenges").select("*").order("is_active",{ascending:false}),
      supabase.from("user_gamification")
        .select(`
  user_id,
  xp_total,
  level,
  streak_days,
  users!inner(name, avatar_url)
`)
        .order("xp_total", { ascending:false })
        .limit(10),
    ]);
    setBadges(b     || []);
    setChallenges(c || []);
    setTopUsers(top || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // ── BADGE ──────────────────────────────────────────────
  const saveBadge = async () => {
    if (!newBadge.name_ar.trim()) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("badges")
      .insert([{
        name:            newBadge.name || newBadge.name_ar,
        name_ar:         newBadge.name_ar,
        description:     newBadge.description,
        description_ar:  newBadge.description_ar,
        icon:            newBadge.icon,
        color:           newBadge.color,
        xp_reward:       Number(newBadge.xp_reward),
        condition_type:  newBadge.condition_type,
        condition_value: Number(newBadge.condition_value),
        condition_table: newBadge.condition_table,
      }])
      .select()
      .single();

    if (error) { alert("خطأ: " + error.message); }
    else       { setBadges(p => [data, ...p]); }
    setShowBadgeForm(false);
    setNewBadge({ name:"", name_ar:"", description:"", description_ar:"", icon:"🏆", color:"#f472b6", xp_reward:50, condition_type:"xp", condition_value:100, condition_table:"user_gamification" });
    setSaving(false);
  };

  const deleteBadge = async (id) => {
    if (!confirm("حذف الشارة نهائياً؟")) return;
    const { error } = await supabase.from("badges").delete().eq("badge_id", id);
    if (error) alert("خطأ في الحذف: " + error.message);
    else       setBadges(p => p.filter(b => b.badge_id !== id));
  };

  // ── CHALLENGE ──────────────────────────────────────────
  const saveChallenge = async () => {
    if (!newChallenge.title_ar.trim()) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("health_challenges")
      .insert([{
        title_ar:      newChallenge.title_ar,
        description_ar:newChallenge.description_ar,
        activity_type: newChallenge.activity_type,
        target_days:   Number(newChallenge.target_days),
        xp_reward:     Number(newChallenge.xp_reward),
        icon:          newChallenge.icon,
        color:         newChallenge.color,
        is_active:     true,
      }])
      .select()
      .single();

    if (error) { alert("خطأ: " + error.message); }
    else       { setChallenges(p => [data, ...p]); }
    setShowChallengeForm(false);
    setNewChallenge({ title_ar:"", description_ar:"", activity_type:"habit", target_days:7, xp_reward:50, icon:"🎯", color:"#f472b6", is_active:true });
    setSaving(false);
  };

  const toggleChallenge = async (id, cur) => {
    const { error } = await supabase
      .from("health_challenges")
      .update({ is_active: !cur })
      .eq("id", id);
    if (error) alert("خطأ: " + error.message);
    else       setChallenges(p => p.map(c => c.id===id ? {...c, is_active:!cur} : c));
  };

  const deleteChallenge = async (id) => {
    if (!confirm("حذف التحدي نهائياً؟")) return;
    const { error } = await supabase.from("health_challenges").delete().eq("id", id);
    if (error) alert("خطأ: " + error.message);
    else       setChallenges(p => p.filter(c => c.id !== id));
  };

  if (loading) return (
    <AdminLayout stats={stats}>
      <div className="adm-loading"><div className="adm-spinner"/></div>
    </AdminLayout>
  );

  return (
    <AdminLayout stats={stats}>

      {/* Stats */}
      <div className="adm-stats-grid" style={{gridTemplateColumns:"repeat(3,1fr)",marginBottom:16}}>
        <div className="adm-stat pink">
          <div className="adm-stat-icon"><i className="fas fa-medal"/></div>
          <div className="adm-stat-val">{badges.length}</div>
          <div className="adm-stat-lbl">الشارات</div>
        </div>
        <div className="adm-stat purple">
          <div className="adm-stat-icon"><i className="fas fa-bolt"/></div>
          <div className="adm-stat-val">{challenges.filter(c=>c.is_active).length}</div>
          <div className="adm-stat-lbl">تحديات نشطة</div>
        </div>
        <div className="adm-stat green">
          <div className="adm-stat-icon"><i className="fas fa-trophy"/></div>
          <div className="adm-stat-val">{topUsers.length}</div>
          <div className="adm-stat-lbl">متصدرو النشاط</div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="adm-card">
        <div className="adm-card-header">
          <div className="adm-card-title"><i className="fas fa-ranking-star"/> لوحة المتصدرين</div>
        </div>
        {topUsers.length === 0 ? (
          <div className="adm-empty"><i className="fas fa-trophy"/><p>لا توجد بيانات بعد</p></div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr><th>#</th><th>المستخدم</th><th>XP</th><th>المستوى</th><th>Streak</th></tr>
              </thead>
              <tbody>
                {topUsers.map((u,i) => (
                  <tr key={u.user_id}>
                    <td style={{fontWeight:700,fontSize:16}}>
                      {i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}
                    </td>
                    <td>
                      <div className="adm-user-cell">
                        {u.users?.avatar_url
                          ? <img src={u.users.avatar_url} alt="" style={{width:32,height:32,borderRadius:8,objectFit:"cover"}}/>
                          : <div className="adm-ava" style={{width:32,height:32,fontSize:12,background:"linear-gradient(135deg,#f472b6,#a78bfa)"}}>
                              {(u.users?.name||"؟").charAt(0)}
                            </div>
                        }
                        <span style={{fontWeight:600}}>{u.users?.name||"—"}</span>
                      </div>
                    </td>
                    <td><strong style={{color:"#7c3aed"}}>{u.xp_total||0}</strong> XP</td>
                    <td><span className="adm-pill active">Level {u.level||1}</span></td>
                    <td>🔥 {u.streak_days||0} يوم</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="adm-card">
        <div className="adm-card-header">
          <div className="adm-card-title"><i className="fas fa-medal"/> الشارات</div>
          <button className="adm-btn-primary" onClick={()=>setShowBadgeForm(v=>!v)}>
            <i className="fas fa-plus"/> إضافة شارة
          </button>
        </div>

        {showBadgeForm && (
          <div style={{background:"#fdf2f8",borderRadius:10,padding:16,marginBottom:16,border:"1px solid #fbcfe8"}}>
            <div className="adm-form-grid">
              <div className="adm-form-group">
                <label className="adm-form-label">الاسم بالعربي *</label>
                <input className="adm-form-input" value={newBadge.name_ar}
                  onChange={e=>setNewBadge(p=>({...p,name_ar:e.target.value}))}
                  placeholder="مثال: نجمة الأمومة"/>
              </div>
              <div className="adm-form-group">
                <label className="adm-form-label">الاسم بالإنجليزي</label>
                <input className="adm-form-input" value={newBadge.name}
                  onChange={e=>setNewBadge(p=>({...p,name:e.target.value}))}
                  placeholder="Motherhood Star"/>
              </div>
              <div className="adm-form-group">
                <label className="adm-form-label">الأيقونة (emoji)</label>
                <input className="adm-form-input" value={newBadge.icon}
                  onChange={e=>setNewBadge(p=>({...p,icon:e.target.value}))}
                  placeholder="🏆"/>
              </div>
              <div className="adm-form-group">
                <label className="adm-form-label">اللون</label>
                <input type="color" className="adm-form-input" value={newBadge.color}
                  onChange={e=>setNewBadge(p=>({...p,color:e.target.value}))}
                  style={{height:40,padding:4,cursor:"pointer"}}/>
              </div>
              <div className="adm-form-group">
                <label className="adm-form-label">مكافأة XP</label>
                <input className="adm-form-input" type="number" min="0" value={newBadge.xp_reward}
                  onChange={e=>setNewBadge(p=>({...p,xp_reward:e.target.value}))}/>
              </div>
              <div className="adm-form-group">
                <label className="adm-form-label">نوع الشرط</label>
                <select className="adm-form-input" value={newBadge.condition_type}
                  onChange={e=>setNewBadge(p=>({...p,condition_type:e.target.value}))}>
                  <option value="xp">نقاط XP</option>
                  <option value="streak">أيام متتالية</option>
                  <option value="articles_read">مقالات مقروءة</option>
                  <option value="habits_done">عادات مكتملة</option>
                </select>
              </div>
              <div className="adm-form-group">
                <label className="adm-form-label">قيمة الشرط</label>
                <input className="adm-form-input" type="number" min="1" value={newBadge.condition_value}
                  onChange={e=>setNewBadge(p=>({...p,condition_value:e.target.value}))}/>
              </div>
              <div className="adm-form-group">
                <label className="adm-form-label">وصف بالعربي</label>
                <input className="adm-form-input" value={newBadge.description_ar}
                  onChange={e=>setNewBadge(p=>({...p,description_ar:e.target.value}))}
                  placeholder="وصف قصير..."/>
              </div>
            </div>
            <div style={{display:"flex",gap:8,marginTop:4}}>
              <button className="adm-btn-primary" onClick={saveBadge} disabled={saving||!newBadge.name_ar}>
                {saving?<><i className="fas fa-spinner fa-spin"/> جارٍ الحفظ...</>:<><i className="fas fa-save"/> حفظ الشارة</>}
              </button>
              <button className="adm-btn-secondary" onClick={()=>setShowBadgeForm(false)}>إلغاء</button>
            </div>
          </div>
        )}

        {badges.length === 0 ? (
          <div className="adm-empty"><i className="fas fa-medal"/><p>لا توجد شارات — أضف أول شارة</p></div>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:12}}>
            {badges.map(b => (
              <div key={b.badge_id} style={{
                background:"#fdf2f8",borderRadius:12,padding:14,
                textAlign:"center",border:"1px solid #fbcfe8",
                position:"relative",
              }}>
                <button onClick={()=>deleteBadge(b.badge_id)} style={{
                  position:"absolute",top:7,left:7,
                  background:"rgba(248,113,113,0.15)",border:"none",
                  borderRadius:6,width:24,height:24,cursor:"pointer",
                  color:"#b91c1c",fontSize:11,display:"flex",
                  alignItems:"center",justifyContent:"center",
                }}><i className="fas fa-times"/></button>
                <div style={{fontSize:30,marginBottom:8}}>{b.icon||"🏆"}</div>
                <div style={{fontWeight:700,fontSize:13,color:"#1e1b4b"}}>{b.name_ar||b.name}</div>
                <div style={{fontSize:11,color:"#7c3aed",fontWeight:600,marginTop:4}}>{b.xp_reward||0} XP</div>
                {b.description_ar && (
                  <div style={{fontSize:10,color:"#9ca3af",marginTop:4,lineHeight:1.5}}>{b.description_ar}</div>
                )}
                <div style={{
                  marginTop:6,fontSize:10,background:b.color||"#f472b6",
                  color:"#fff",borderRadius:20,padding:"2px 8px",display:"inline-block"
                }}>{b.condition_type}: {b.condition_value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Challenges */}
      <div className="adm-card">
        <div className="adm-card-header">
          <div className="adm-card-title"><i className="fas fa-bolt"/> التحديات الصحية</div>
          <button className="adm-btn-primary" onClick={()=>setShowChallengeForm(v=>!v)}>
            <i className="fas fa-plus"/> تحدي جديد
          </button>
        </div>

        {showChallengeForm && (
          <div style={{background:"#f5f3ff",borderRadius:10,padding:16,marginBottom:16,border:"1px solid #ddd6fe"}}>
            <div className="adm-form-grid">
              <div className="adm-form-group full">
                <label className="adm-form-label">عنوان التحدي بالعربي *</label>
                <input className="adm-form-input" value={newChallenge.title_ar}
                  onChange={e=>setNewChallenge(p=>({...p,title_ar:e.target.value}))}
                  placeholder="مثال: اشربي 8 أكواب ماء يومياً"/>
              </div>
              <div className="adm-form-group full">
                <label className="adm-form-label">الوصف</label>
                <input className="adm-form-input" value={newChallenge.description_ar}
                  onChange={e=>setNewChallenge(p=>({...p,description_ar:e.target.value}))}
                  placeholder="وصف التحدي..."/>
              </div>
              <div className="adm-form-group">
                <label className="adm-form-label">نوع النشاط</label>
                <select className="adm-form-input" value={newChallenge.activity_type}
                  onChange={e=>setNewChallenge(p=>({...p,activity_type:e.target.value}))}>
                  <option value="habit">عادة</option>
                  <option value="water">شرب الماء</option>
                  <option value="sleep">النوم</option>
                  <option value="exercise">رياضة</option>
                  <option value="reading">قراءة</option>
                  <option value="meditation">تأمل</option>
                </select>
              </div>
              <div className="adm-form-group">
                <label className="adm-form-label">عدد الأيام المستهدفة</label>
                <input className="adm-form-input" type="number" min="1" value={newChallenge.target_days}
                  onChange={e=>setNewChallenge(p=>({...p,target_days:e.target.value}))}/>
              </div>
              <div className="adm-form-group">
                <label className="adm-form-label">مكافأة XP</label>
                <input className="adm-form-input" type="number" min="0" value={newChallenge.xp_reward}
                  onChange={e=>setNewChallenge(p=>({...p,xp_reward:e.target.value}))}/>
              </div>
              <div className="adm-form-group">
                <label className="adm-form-label">الأيقونة</label>
                <input className="adm-form-input" value={newChallenge.icon}
                  onChange={e=>setNewChallenge(p=>({...p,icon:e.target.value}))}
                  placeholder="🎯"/>
              </div>
            </div>
            <div style={{display:"flex",gap:8,marginTop:4}}>
              <button className="adm-btn-primary" onClick={saveChallenge} disabled={saving||!newChallenge.title_ar}>
                {saving?<><i className="fas fa-spinner fa-spin"/> جارٍ الحفظ...</>:<><i className="fas fa-save"/> حفظ التحدي</>}
              </button>
              <button className="adm-btn-secondary" onClick={()=>setShowChallengeForm(false)}>إلغاء</button>
            </div>
          </div>
        )}

        {challenges.length === 0 ? (
          <div className="adm-empty"><i className="fas fa-bolt"/><p>لا توجد تحديات — أضف أول تحدي</p></div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr><th>التحدي</th><th>النوع</th><th>الأيام</th><th>XP</th><th>الحالة</th><th>إجراءات</th></tr>
              </thead>
              <tbody>
                {challenges.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:18}}>{c.icon||"🎯"}</span>
                        <div>
                          <div style={{fontWeight:600}}>{c.title_ar||"—"}</div>
                          {c.description_ar && (
                            <div style={{fontSize:11,color:"#7c6f9f"}}>{c.description_ar.slice(0,50)}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td><span className="adm-pill active" style={{fontSize:11}}>{c.activity_type||"—"}</span></td>
                    <td style={{fontSize:13}}>{c.target_days||0} يوم</td>
                    <td><strong style={{color:"#7c3aed"}}>{c.xp_reward||0}</strong> XP</td>
                    <td>
                      <span className={`adm-pill ${c.is_active?"approved":"suspended"}`}>
                        {c.is_active?"✓ نشط":"⊘ متوقف"}
                      </span>
                    </td>
                    <td>
                      <div className="adm-actions">
                        <button className={`adm-act ${c.is_active?"ban":"ok"}`}
                          title={c.is_active?"إيقاف":"تشغيل"}
                          onClick={()=>toggleChallenge(c.id, c.is_active)}>
                          <i className={`fas fa-${c.is_active?"pause":"play"}`}/>
                        </button>
                        <button className="adm-act del" title="حذف"
                          onClick={()=>deleteChallenge(c.id)}>
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
      </div>
    </AdminLayout>
  );
}