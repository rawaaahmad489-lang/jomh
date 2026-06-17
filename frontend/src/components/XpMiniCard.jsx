// src/components/XpMiniCard.jsx
// ─────────────────────────────────────────────────────────────────────
// بطاقة مصغّرة تُضاف في الداش بورد ضمن قسم الإحصائيات السريعة
// تعرض: المستوى + XP + streak + زر الانتقال لصفحة صحتي
// ─────────────────────────────────────────────────────────────────────
/*
import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { calcLevel, getLevelTitle, progressPct } from "../core/hooks/useGamification";

const LEVEL_COLORS = [
  "#2ecc71","#3498db","#9b59b6","#e67e22",
  "#e74c3c","#f1c40f","#1abc9c","#d68b9d","#8e44ad","#c0392b",
];
const levelColor = (l) => LEVEL_COLORS[(l - 1) % LEVEL_COLORS.length];

export default function XpMiniCard({ userId, isAr, navigate }) {
  const [xp,      setXp]      = useState(0);
  const [streak,  setStreak]  = useState(0);
  const [badges,  setBadges]  = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const [{ data: gam }, { count: badgeCount }] = await Promise.all([
        supabase.from("user_gamification")
          .select("xp_total, streak_days")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase.from("user_badges")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
      ]);
      setXp(gam?.xp_total || 0);
      setStreak(gam?.streak_days || 0);
      setBadges(badgeCount || 0);
      setLoading(false);
    };
    load();

    // Realtime
    const ch = supabase
      .channel(`xpmini-${userId}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public",
        table: "user_gamification",
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setXp(payload.new.xp_total || 0);
        setStreak(payload.new.streak_days || 0);
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [userId]);

  if (loading) return (
    <div style={{ padding: "20px 0", textAlign: "center" }}>
      <div style={{
        width: 24, height: 24, borderRadius: "50%",
        border: "3px solid #fdf2f5", borderTopColor: "#d68b9d",
        animation: "spin .7s linear infinite", margin: "0 auto",
      }} />
    </div>
  );

  const level = calcLevel(xp);
  const pct   = progressPct(xp);
  const color = levelColor(level);
  const title = getLevelTitle(level);

  return (
    <div style={{ fontFamily: "'Cairo','Poppins',sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Level + progress /}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        marginBottom: 14,
      }}>
        {/* Ring mini /}
        <svg width="52" height="52" style={{ flexShrink: 0 }}>
          <circle cx="26" cy="26" r="21" fill="none" stroke="#f0f0f0" strokeWidth="5" />
          <circle cx="26" cy="26" r="21" fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={`${(pct / 100) * 131.9} 131.9`}
            strokeLinecap="round" transform="rotate(-90 26 26)"
            style={{ transition: "stroke-dasharray .8s ease" }} />
          <text x="26" y="30" textAnchor="middle"
            style={{ fill: color, fontWeight: 900, fontSize: 13, fontFamily: "'Cairo'" }}>
            {level}
          </text>
        </svg>

        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 900, fontSize: ".85rem", color, marginBottom: 3 }}>
            {title}
          </div>
          <div style={{
            background: "#f4f4f4", borderRadius: 20, height: 7, overflow: "hidden",
          }}>
            <div style={{
              width: `${pct}%`, height: "100%",
              background: `linear-gradient(90deg, ${color}, ${color}bb)`,
              borderRadius: 20, transition: "width .8s ease",
            }} />
          </div>
          <div style={{ fontSize: ".68rem", color: "#aaa", marginTop: 3 }}>
            {xp % 200} / 200 XP
          </div>
        </div>
      </div>

      {/* Stats row /}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
        gap: 8, marginBottom: 14,
      }}>
        {[
          { icon: "⭐", val: xp.toLocaleString("ar-SA"), lbl: isAr ? "XP" : "XP", c: "#f1c40f" },
          { icon: streak >= 7 ? "🔥" : "⚡", val: streak, lbl: isAr ? "يوم" : "Streak", c: streak >= 7 ? "#e67e22" : "#aaa" },
          { icon: "🏅", val: badges, lbl: isAr ? "شارة" : "Badges", c: "#d68b9d" },
        ].map((s, i) => (
          <div key={i} style={{
            background: "#fafafa", borderRadius: 12,
            padding: "8px 6px", textAlign: "center",
            border: "1px solid #f0f0f0",
          }}>
            <div style={{ fontSize: "1rem", marginBottom: 2 }}>{s.icon}</div>
            <div style={{ fontWeight: 900, fontSize: ".95rem", color: s.c }}>{s.val}</div>
            <div style={{ fontSize: ".62rem", color: "#aaa", fontWeight: 700 }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* CTA button /}
      <button
        onClick={() => navigate("/mother/health")}
        style={{
          width: "100%", padding: "9px 0",
          background: `linear-gradient(135deg, ${color}, ${color}cc)`,
          border: "none", borderRadius: 12,
          color: "white", fontWeight: 800, fontSize: ".82rem",
          fontFamily: "'Cairo','Poppins',sans-serif",
          cursor: "pointer", transition: ".2s",
          display: "flex", alignItems: "center",
          justifyContent: "center", gap: 7,
        }}
        onMouseOver={e => e.currentTarget.style.opacity = ".88"}
        onMouseOut={e => e.currentTarget.style.opacity = "1"}
      >
        🌸 {isAr ? "صفحة صحتي" : "My Health Page"}
      </button>
    </div>
  );
}*/

// src/components/XpMiniCard.jsx
// ─────────────────────────────────────────────────────────────────────
// إصلاح مشكلة Realtime: إزالة الـ channel وإستبداله بـ polling بسيط
// ─────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../services/supabaseClient";
import { calcLevel, getLevelTitle, progressPct } from "../core/hooks/useGamification";

const LEVEL_COLORS = [
  "#2ecc71","#3498db","#9b59b6","#e67e22",
  "#e74c3c","#f1c40f","#1abc9c","#d68b9d","#8e44ad","#c0392b",
];
const levelColor = (l) => LEVEL_COLORS[(l - 1) % LEVEL_COLORS.length];

export default function XpMiniCard({ userId, isAr, navigate }) {
  const [xp,      setXp]      = useState(0);
  const [streak,  setStreak]  = useState(0);
  const [badges,  setBadges]  = useState(0);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!userId || !mountedRef.current) return;
    
    try {
      const [{ data: gam }, { count: badgeCount }] = await Promise.all([
        supabase.from("user_gamification")
          .select("xp_total, streak_days")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase.from("user_badges")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
      ]);
      
      if (mountedRef.current) {
        setXp(gam?.xp_total || 0);
        setStreak(gam?.streak_days || 0);
        setBadges(badgeCount || 0);
        setLoading(false);
      }
    } catch (err) {
      console.error("XpMiniCard fetch error:", err);
    }
  }, [userId]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();

    // ✅ استخدام polling بدلاً من Realtime (كل 10 ثواني)
    const interval = setInterval(fetchData, 10000);
    
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchData]);

  if (loading) return (
    <div style={{ padding: "20px 0", textAlign: "center" }}>
      <div style={{
        width: 24, height: 24, borderRadius: "50%",
        border: "3px solid #fdf2f5", borderTopColor: "#d68b9d",
        animation: "spin .7s linear infinite", margin: "0 auto",
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const level = calcLevel(xp);
  const pct   = progressPct(xp);
  const color = levelColor(level);
  const title = getLevelTitle(level);

  return (
    <div style={{ fontFamily: "'Cairo','Poppins',sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Level + progress */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        marginBottom: 14,
      }}>
        {/* Ring mini */}
        <svg width="52" height="52" style={{ flexShrink: 0 }}>
          <circle cx="26" cy="26" r="21" fill="none" stroke="#f0f0f0" strokeWidth="5" />
          <circle cx="26" cy="26" r="21" fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={`${(pct / 100) * 131.9} 131.9`}
            strokeLinecap="round" transform="rotate(-90 26 26)"
            style={{ transition: "stroke-dasharray .8s ease" }} />
          <text x="26" y="30" textAnchor="middle"
            style={{ fill: color, fontWeight: 900, fontSize: 13, fontFamily: "'Cairo'" }}>
            {level}
          </text>
        </svg>

        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 900, fontSize: ".85rem", color, marginBottom: 3 }}>
            {title}
          </div>
          <div style={{
            background: "#f4f4f4", borderRadius: 20, height: 7, overflow: "hidden",
          }}>
            <div style={{
              width: `${pct}%`, height: "100%",
              background: `linear-gradient(90deg, ${color}, ${color}bb)`,
              borderRadius: 20, transition: "width .8s ease",
            }} />
          </div>
          <div style={{ fontSize: ".68rem", color: "#aaa", marginTop: 3 }}>
            {xp % 200} / 200 XP
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
        gap: 8, marginBottom: 14,
      }}>
        {[
          { icon: "⭐", val: xp.toLocaleString("ar-SA"), lbl: isAr ? "XP" : "XP", c: "#f1c40f" },
          { icon: streak >= 7 ? "🔥" : "⚡", val: streak, lbl: isAr ? "يوم" : "Streak", c: streak >= 7 ? "#e67e22" : "#aaa" },
          { icon: "🏅", val: badges, lbl: isAr ? "شارة" : "Badges", c: "#d68b9d" },
        ].map((s, i) => (
          <div key={i} style={{
            background: "#fafafa", borderRadius: 12,
            padding: "8px 6px", textAlign: "center",
            border: "1px solid #f0f0f0",
          }}>
            <div style={{ fontSize: "1rem", marginBottom: 2 }}>{s.icon}</div>
            <div style={{ fontWeight: 900, fontSize: ".95rem", color: s.c }}>{s.val}</div>
            <div style={{ fontSize: ".62rem", color: "#aaa", fontWeight: 700 }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* CTA button */}
      <button
        onClick={() => navigate("/mother/health")}
        style={{
          width: "100%", padding: "9px 0",
          background: `linear-gradient(135deg, ${color}, ${color}cc)`,
          border: "none", borderRadius: 12,
          color: "white", fontWeight: 800, fontSize: ".82rem",
          fontFamily: "'Cairo','Poppins',sans-serif",
          cursor: "pointer", transition: ".2s",
          display: "flex", alignItems: "center",
          justifyContent: "center", gap: 7,
        }}
        onMouseOver={e => e.currentTarget.style.opacity = ".88"}
        onMouseOut={e => e.currentTarget.style.opacity = "1"}
      >
        🌸 {isAr ? "صفحة صحتي" : "My Health Page"}
      </button>
    </div>
  );
}