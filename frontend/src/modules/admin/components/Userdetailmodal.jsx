// src/modules/admin/components/UserDetailModal.jsx
import { useState, useEffect } from "react";
import { supabase } from "../../../services/supabaseClient";

export default function UserDetailModal({ userId, role, onClose }) {
  const [user,    setUser]    = useState(null);
  const [extra,   setExtra]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setLoading(true);
      const { data: u } = await supabase
        .from("users").select("*").eq("user_id", userId).single();
      setUser(u);

      if (role === "mother") {
        const [{ data: mp }, { data: children }, { data: gami }] = await Promise.all([
          supabase.from("mother_profiles").select("*").eq("user_id", userId).single(),
          supabase.from("children").select("name, birth_date, gender").eq("mother_id", userId),
          supabase.from("user_gamification").select("xp_total, level, streak_days").eq("user_id", userId).single(),
        ]);
        setExtra({ profile: mp, children: children||[], gami });
      } else if (role === "doctor") {
        const { data: dp } = await supabase.from("doctor_profiles").select("*").eq("user_id", userId).single();
        setExtra({ profile: dp });
      } else if (role === "vendor") {
        const { data: store } = await supabase.from("stores").select("store_name, logo, is_verified").eq("user_id", userId).single();
        setExtra({ store });
      }
      setLoading(false);
    };
    load();
  }, [userId, role]);

  if (!userId) return null;

  return (
    <div style={{
      position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",
      zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",
      padding:16,direction:"rtl"
    }} onClick={onClose}>
      <div style={{
        background:"#fff",borderRadius:16,padding:28,
        width:"100%",maxWidth:480,maxHeight:"85vh",
        overflowY:"auto",position:"relative",
      }} onClick={e=>e.stopPropagation()}>

        <button onClick={onClose} style={{
          position:"absolute",top:16,left:16,
          background:"#fee2e2",border:"none",borderRadius:8,
          width:32,height:32,cursor:"pointer",
          display:"flex",alignItems:"center",justifyContent:"center",
          color:"#b91c1c",fontSize:14,
        }}><i className="fas fa-times"/></button>

        {loading ? (
          <div style={{textAlign:"center",padding:40}}>
            <div className="adm-spinner" style={{margin:"0 auto"}}/>
          </div>
        ) : !user ? (
          <p style={{textAlign:"center",color:"#7c6f9f"}}>لم يتم العثور على البيانات</p>
        ) : (
          <>
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:22}}>
              {user.avatar_url
                ? <img src={user.avatar_url} alt="" style={{width:60,height:60,borderRadius:14,objectFit:"cover"}}/>
                : <div style={{
                    width:60,height:60,borderRadius:14,
                    background:"linear-gradient(135deg,#f472b6,#a78bfa)",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:22,fontWeight:700,color:"#fff",
                  }}>{(user.name||"؟").charAt(0)}</div>
              }
              <div>
                <div style={{fontSize:17,fontWeight:700,color:"#1e1b4b"}}>{user.name}</div>
                <div style={{fontSize:13,color:"#7c6f9f",marginBottom:5}}>{user.email}</div>
                <span className={`adm-pill ${
                  user.status==="active"?"approved":
                  user.status==="pending"?"pending":
                  user.status==="suspended"?"suspended":"rejected"
                }`}>{user.status}</span>
              </div>
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {[
                {label:"الدور",            val:user.role},
                {label:"تاريخ الانضمام",   val:user.created_at?new Date(user.created_at).toLocaleDateString("ar-SA"):"—"},
                {label:"آخر تسجيل دخول",  val:user.last_login?new Date(user.last_login).toLocaleString("ar-SA"):"—"},
              ].map(r=>(
                <div key={r.label} style={{
                  display:"flex",justifyContent:"space-between",
                  padding:"9px 12px",background:"#fdf2f8",borderRadius:9,fontSize:13,
                }}>
                  <span style={{color:"#7c6f9f"}}>{r.label}</span>
                  <span style={{fontWeight:600,color:"#1e1b4b"}}>{r.val||"—"}</span>
                </div>
              ))}

              {role==="mother" && extra?.gami && (
                <>
                  <div style={{fontWeight:700,fontSize:13,color:"#1e1b4b",marginTop:6,paddingRight:4}}>
                    <i className="fas fa-trophy" style={{color:"#f472b6",marginLeft:6}}/>نظام التحفيز
                  </div>
                  {[
                    {label:"XP الكلي", val:extra.gami.xp_total||0},
                    {label:"المستوى",  val:`Level ${extra.gami.level||1}`},
                    {label:"Streak",   val:`${extra.gami.streak_days||0} يوم`},
                  ].map(r=>(
                    <div key={r.label} style={{
                      display:"flex",justifyContent:"space-between",
                      padding:"9px 12px",background:"#f5f3ff",borderRadius:9,fontSize:13,
                    }}>
                      <span style={{color:"#7c6f9f"}}>{r.label}</span>
                      <span style={{fontWeight:700,color:"#7c3aed"}}>{r.val}</span>
                    </div>
                  ))}
                </>
              )}

              {role==="mother" && extra?.children?.length > 0 && (
                <>
                  <div style={{fontWeight:700,fontSize:13,color:"#1e1b4b",marginTop:6,paddingRight:4}}>
                    <i className="fas fa-baby" style={{color:"#f472b6",marginLeft:6}}/>
                    الأطفال ({extra.children.length})
                  </div>
                  {extra.children.map((c,i)=>(
                    <div key={i} style={{
                      display:"flex",justifyContent:"space-between",
                      padding:"9px 12px",background:"#fdf2f8",borderRadius:9,fontSize:13,
                    }}>
                      <span style={{fontWeight:600}}>{c.name} {c.gender==="male"?"👦":"👧"}</span>
                      <span style={{color:"#7c6f9f"}}>
                        {c.birth_date?new Date(c.birth_date).toLocaleDateString("ar-SA"):""}
                      </span>
                    </div>
                  ))}
                </>
              )}

              {role==="doctor" && extra?.profile && (
                [
                  {label:"التخصص",       val:extra.profile.specialty||extra.profile.specialization},
                  {label:"سنوات الخبرة", val:extra.profile.years_of_experience},
                  {label:"رقم الترخيص", val:extra.profile.license_number},
                ].filter(r=>r.val).map(r=>(
                  <div key={r.label} style={{
                    display:"flex",justifyContent:"space-between",
                    padding:"9px 12px",background:"#eff6ff",borderRadius:9,fontSize:13,
                  }}>
                    <span style={{color:"#7c6f9f"}}>{r.label}</span>
                    <span style={{fontWeight:600,color:"#1e1b4b"}}>{r.val}</span>
                  </div>
                ))
              )}

              {role==="vendor" && extra?.store && (
                <div style={{
                  display:"flex",alignItems:"center",gap:12,
                  padding:12,background:"#f0fdf4",borderRadius:10,marginTop:6,
                }}>
                  {extra.store.logo && (
                    <img src={extra.store.logo} alt="" style={{width:44,height:44,borderRadius:9,objectFit:"cover"}}/>
                  )}
                  <div>
                    <div style={{fontWeight:700,fontSize:14,color:"#1e1b4b"}}>{extra.store.store_name}</div>
                    <span className={`adm-pill ${extra.store.is_verified?"approved":"pending"}`} style={{marginTop:4,display:"inline-flex"}}>
                      {extra.store.is_verified?"✓ موثق":"⏳ غير موثق"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}