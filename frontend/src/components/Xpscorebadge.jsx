// src/components/XPScoreBadge.jsx
// ─────────────────────────────────────────────────────────────────────
// النسخة القديمة التي كانت تعمل 100% + إصلاح مشكلة Realtime
// الحل: استبدال Realtime بـ polling بسيط كل 10 ثواني
// ─────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../services/supabaseClient";
import { calcLevel, getLevelTitle, progressPct } from "../core/hooks/useGamification";

const LEVEL_COLORS = [
  "#2ecc71","#3498db","#9b59b6","#e67e22",
  "#e74c3c","#f1c40f","#1abc9c","#d68b9d","#8e44ad","#c0392b",
];

export default function XPScoreBadge({ userId, isAr }) {
  const [xp,     setXp]     = useState(0);
  const [streak, setStreak] = useState(0);
  const [open,   setOpen]   = useState(false);
  const [animUp, setAnimUp] = useState(false);
  const prevXP   = useRef(0);
  const dropRef  = useRef(null);
  const mountRef = useRef(true);

  // ── جلب البيانات ──────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!userId || !mountRef.current) return;
    try {
      const { data } = await supabase
        .from("user_gamification")
        .select("xp_total, streak_days")
        .eq("user_id", userId)
        .maybeSingle();

      if (data && mountRef.current) {
        const newXP = data.xp_total || 0;
        // أنيميشن عند زيادة النقاط
        if (newXP > prevXP.current && prevXP.current > 0) {
          setAnimUp(true);
          setTimeout(() => setAnimUp(false), 800);
        }
        prevXP.current = newXP;
        setXp(newXP);
        setStreak(data.streak_days || 0);
      }
    } catch (e) {
      console.error("XPScoreBadge fetch error:", e);
    }
  }, [userId]);

  useEffect(() => {
    mountRef.current = true;
    fetchData();

    // ✅ Polling كل 10 ثواني بدلاً من Realtime
    // يحل مشكلة "cannot add postgres_changes after subscribe()"
    const interval = setInterval(fetchData, 10000);

    return () => {
      mountRef.current = false;
      clearInterval(interval);
    };
  }, [fetchData]);

  // ── expose للخارج — استدعيه بعد أي نشاط لتحديث فوري ──────────
  // مثال: XPScoreBadge.refetch?.()
  XPScoreBadge.refetch = fetchData;

  // ── إغلاق الـ dropdown عند النقر خارجه ───────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const level = calcLevel(xp);
  const pct   = progressPct(xp);
  const title = getLevelTitle(level);
  const color = LEVEL_COLORS[(level - 1) % LEVEL_COLORS.length];

  return (
    <div ref={dropRef} style={{ position: "relative" }} className="desktop-only">
      <style>{XP_CSS}</style>

      {/* ── زر الـ Navbar ── */}
      <button
        className={`xp-nav-btn ${animUp ? "xp-anim-up" : ""}`}
        style={{ "--xp-color": color }}
        onClick={() => setOpen(prev => !prev)}
        title={isAr ? "نقاطي" : "My Points"}
      >
        {/* حلقة XP صغيرة */}
        <svg width="32" height="32" style={{ flexShrink: 0 }}>
          <circle cx="16" cy="16" r="13" fill="none"
            stroke="#f0f0f0" strokeWidth="3" />
          <circle cx="16" cy="16" r="13" fill="none"
            stroke={color} strokeWidth="3"
            strokeDasharray={`${(pct / 100) * 81.7} 81.7`}
            strokeLinecap="round"
            transform="rotate(-90 16 16)"
            style={{ transition: "stroke-dasharray .6s ease" }} />
          <text x="16" y="20" textAnchor="middle"
            style={{ fill: color, fontSize: 9, fontWeight: 900, fontFamily: "'Cairo'" }}>
            {level}
          </text>
        </svg>

        <div style={{ lineHeight: 1 }}>
          <div style={{ fontWeight: 900, fontSize: ".78rem", color }}>
            {xp.toLocaleString("ar-SA")} XP
          </div>
          {streak > 0 && (
            <div style={{ fontSize: ".65rem", color: streak >= 7 ? "#e67e22" : "#aaa", fontWeight: 700 }}>
              {streak >= 7 ? "🔥" : "⚡"} {streak} {isAr ? "يوم" : "d"}
            </div>
          )}
        </div>
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div className="xp-dropdown">
          <div
            className="xp-drop-header"
            style={{ background: `${color}15`, borderBottom: `1px solid ${color}30` }}
          >
            <div style={{ fontWeight: 900, fontSize: ".9rem", color: "#2d2825" }}>{title}</div>
            <div style={{ fontSize: ".72rem", color: "#aaa", marginTop: 2 }}>
              {isAr ? `المستوى ${level}` : `Level ${level}`}
            </div>
          </div>

          <div style={{ padding: "12px 16px" }}>
            {/* شريط التقدم */}
            <div style={{
              display: "flex", justifyContent: "space-between",
              fontSize: ".7rem", color: "#aaa", marginBottom: 5,
            }}>
              <span>{isAr ? "التقدم" : "Progress"}</span>
              <span>{xp % 200} / 200 XP</span>
            </div>
            <div style={{
              background: "#f4f4f4", borderRadius: 20,
              height: 8, overflow: "hidden", marginBottom: 12,
            }}>
              <div style={{
                width: `${pct}%`, height: "100%",
                background: `linear-gradient(90deg, ${color}, ${color}bb)`,
                borderRadius: 20, transition: "width .6s ease",
              }} />
            </div>

            {/* إحصائيات */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                {
                  icon: "⭐",
                  val: xp.toLocaleString(),
                  lbl: isAr ? "إجمالي XP" : "Total XP",
                  c: "#f1c40f",
                },
                {
                  icon: streak >= 7 ? "🔥" : "⚡",
                  val: streak,
                  lbl: isAr ? "أيام متتالية" : "Streak",
                  c: streak >= 7 ? "#e67e22" : "#aaa",
                },
              ].map((s, i) => (
                <div key={i} style={{
                  background: "#fafafa", borderRadius: 10,
                  padding: "8px 10px", textAlign: "center",
                  border: "1px solid #f0f0f0",
                }}>
                  <div style={{ fontSize: "1.2rem", marginBottom: 2 }}>{s.icon}</div>
                  <div style={{ fontWeight: 900, fontSize: ".95rem", color: s.c }}>{s.val}</div>
                  <div style={{ fontSize: ".65rem", color: "#aaa", fontWeight: 700 }}>{s.lbl}</div>
                </div>
              ))}
            </div>

            {/* زر الانتقال لصفحة صحتي */}
            <a
              href="/mother/health"
              style={{
                display: "block", textAlign: "center", marginTop: 12,
                background: color, color: "#fff", borderRadius: 10,
                padding: "7px 0", fontWeight: 800, fontSize: ".78rem",
                textDecoration: "none", transition: ".2s",
              }}
              onMouseOver={e => e.currentTarget.style.opacity = ".85"}
              onMouseOut={e => e.currentTarget.style.opacity = "1"}
            >
              {isAr ? "🌸 صفحة صحتي" : "🌸 My Health Page"}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

const XP_CSS = `
.xp-nav-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fafafa;
  border: 1px solid #eee;
  border-radius: 14px;
  padding: 5px 10px 5px 7px;
  cursor: pointer;
  transition: .25s;
  font-family: 'Cairo','Poppins',sans-serif;
}
.xp-nav-btn:hover {
  background: white;
  border-color: var(--xp-color);
  box-shadow: 0 3px 12px rgba(0,0,0,.07);
}

@keyframes xpPop {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.18); }
  100% { transform: scale(1); }
}
.xp-anim-up {
  animation: xpPop .5s ease;
}

.xp-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 240px;
  background: white;
  border-radius: 18px;
  box-shadow: 0 15px 40px rgba(0,0,0,.12);
  border: 1px solid #f0f0f0;
  z-index: 2000;
  overflow: hidden;
  animation: xpSlideIn .25s ease;
  font-family: 'Cairo','Poppins',sans-serif;
  direction: rtl;
}
[dir=ltr] .xp-dropdown {
  right: 0;
  left: auto;
  direction: ltr;
}
.xp-drop-header {
  padding: 14px 16px;
}

@keyframes xpSlideIn {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}
`;