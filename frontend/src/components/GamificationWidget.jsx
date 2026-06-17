// src/components/GamificationWidget.jsx
// ─────────────────────────────────────────────────────────────────────
// يُضاف في MotherDashboard بسطر واحد قبل ShopSection:
//   <GamificationWidget userId={user?.user_id} isAr={isAr} />
// ─────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGamification,
  getLevelTitle,
} from "../core/hooks/useGamification";

const LEVEL_COLORS = [
  "#2ecc71","#3498db","#9b59b6","#e67e22",
  "#e74c3c","#f1c40f","#1abc9c","#d68b9d","#8e44ad","#c0392b",
];
const levelColor = (l) => LEVEL_COLORS[(l - 1) % LEVEL_COLORS.length];

// ── حلقة التقدم ──────────────────────────────────────────────────────
function ProgressRing({ pct, level, color }) {
  const r = 36, cx = 44, cy = 44, circ = 2 * Math.PI * r;
  return (
    <svg width="88" height="88" style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f0f0f0" strokeWidth="7" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={`${(pct / 100) * circ} ${circ}`}
        strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: "stroke-dasharray .8s ease" }} />
      <text x={cx} y={cy - 5} textAnchor="middle"
        style={{ fill: color, fontWeight: 900, fontSize: 18, fontFamily: "'Cairo'" }}>
        {level}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle"
        style={{ fill: "#bbb", fontSize: 9, fontFamily: "'Cairo'" }}>LVL</text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════
export default function GamificationWidget({ userId, isAr }) {
  const navigate = useNavigate();
  const {
    loading, level, xpTotal, streakDays,
    progressPct, progress, nextLevelXP,
    levelTitle, userBadges, badges, recentXP,
  } = useGamification(userId);

  const [tab, setTab] = useState("overview"); // overview | badges | history
  const color = levelColor(level);

  if (loading) return (
    <div style={{
      background: "#fff", borderRadius: 20, padding: 28,
      marginBottom: 26, textAlign: "center",
      border: "1px solid #fdf2f5",
      boxShadow: "0 5px 20px rgba(0,0,0,.04)",
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        border: "3px solid #fdf2f5", borderTopColor: "#d68b9d",
        animation: "spin .7s linear infinite", margin: "0 auto",
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const earnedIds = new Set(userBadges.map(ub => ub.badge_id));

  return (
    <section style={{
      background: "#fff", borderRadius: 20,
      border: "1px solid #fdf2f5",
      boxShadow: "0 5px 20px rgba(0,0,0,.04)",
      marginBottom: 26, overflow: "hidden",
      direction: "rtl",
      fontFamily: "'Cairo','Poppins',sans-serif",
    }}>
      <style>{GAM_CSS}</style>

      {/* ── HEADER ── */}
      <div style={{
        background: `linear-gradient(135deg, ${color}15, #fdf2f5 80%)`,
        borderBottom: `2px solid ${color}20`,
        padding: "20px 24px",
        display: "flex", alignItems: "center",
        gap: 18, flexWrap: "wrap",
      }}>
        <ProgressRing pct={progressPct} level={level} color={color} />

        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontWeight: 900, fontSize: "1.05rem", color: "#2d2825", marginBottom: 5 }}>
            {levelTitle}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between",
            fontSize: ".7rem", color: "#aaa", marginBottom: 4 }}>
            <span>{isAr ? "التقدم للمستوى التالي" : "Progress to next level"}</span>
            <span>{progress} / {nextLevelXP} XP</span>
          </div>
          <div style={{ background: "#f4f4f4", borderRadius: 20, height: 9, overflow: "hidden" }}>
            <div style={{
              width: `${progressPct}%`, height: "100%",
              background: `linear-gradient(90deg, ${color}, ${color}bb)`,
              borderRadius: 20, transition: "width .8s ease",
            }} />
          </div>
          <div style={{ fontSize: ".72rem", color: "#bbb", marginTop: 5, fontWeight: 700 }}>
            {isAr ? `إجمالي النقاط: ${xpTotal} XP` : `Total: ${xpTotal} XP`}
          </div>
        </div>

        {/* Streak pill */}
        <div style={{
          background: streakDays >= 7 ? "#fff8f0" : "#fafafa",
          border: `1.5px solid ${streakDays >= 7 ? "#f39c12" : "#eee"}`,
          borderRadius: 14, padding: "10px 16px",
          textAlign: "center", minWidth: 76,
        }}>
          <div style={{ fontSize: "1.4rem", marginBottom: 2 }}>
            {streakDays >= 30 ? "🏆" : streakDays >= 7 ? "🔥" : "⚡"}
          </div>
          <div style={{
            fontWeight: 900, fontSize: "1.1rem",
            color: streakDays >= 7 ? "#e67e22" : "#333",
          }}>
            {streakDays}
          </div>
          <div style={{ fontSize: ".65rem", color: "#aaa", fontWeight: 700 }}>
            {isAr ? "يوم متتالي" : "day streak"}
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{ display: "flex", borderBottom: "1px solid #f0f0f0" }}>
        {[
          { key: "overview", label: isAr ? "نظرة عامة" : "Overview" },
          { key: "badges",   label: isAr ? `الشارات (${userBadges.length})` : `Badges (${userBadges.length})` },
          { key: "history",  label: isAr ? "النشاطات" : "Activity" },
        ].map(t => (
          <button key={t.key}
            className={`gam-tab ${tab === t.key ? "active" : ""}`}
            style={{ "--tc": color }}
            onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div style={{ padding: "18px 22px" }}>

        {/* Overview */}
        {tab === "overview" && (
          <div>
            {/* Quick stats */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))",
              gap: 10, marginBottom: 18,
            }}>
              {[
                { icon: "⭐", val: xpTotal.toLocaleString("ar-SA"), lbl: isAr ? "إجمالي XP" : "Total XP",    c: "#f1c40f" },
                { icon: "🏅", val: userBadges.length,               lbl: isAr ? "شارات"    : "Badges",        c: "#d68b9d" },
                { icon: "🔥", val: streakDays,                      lbl: isAr ? "أيام متتالية" : "Streak",    c: "#e67e22" },
                { icon: "🎯", val: level,                           lbl: isAr ? "المستوى"  : "Level",          c: color     },
              ].map((s, i) => (
                <div key={i} style={{
                  background: "#fafafa", borderRadius: 13,
                  padding: "11px 8px", textAlign: "center",
                  border: "1px solid #f0f0f0",
                }}>
                  <div style={{ fontSize: "1.3rem", marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontWeight: 900, fontSize: "1rem", color: s.c }}>{s.val}</div>
                  <div style={{ fontSize: ".65rem", color: "#aaa", fontWeight: 700 }}>{s.lbl}</div>
                </div>
              ))}
            </div>

            {/* Next badge hint */}
            {(() => {
              const next = badges.find(b => !earnedIds.has(b.badge_id));
              if (!next) return (
                <div style={{ textAlign: "center", padding: "10px 0", fontSize: ".85rem", color: "#aaa" }}>
                  🎉 {isAr ? "جمعتِ كل الشارات المتاحة!" : "You've earned all available badges!"}
                </div>
              );
              return (
                <div style={{
                  background: `${next.color}12`,
                  border: `1px dashed ${next.color}55`,
                  borderRadius: 14, padding: "12px 16px",
                  display: "flex", alignItems: "center", gap: 12,
                  marginBottom: 14,
                }}>
                  <span style={{ fontSize: "1.8rem", filter: "grayscale(50%)" }}>{next.icon}</span>
                  <div>
                    <div style={{ fontSize: ".72rem", color: "#aaa", marginBottom: 2 }}>
                      {isAr ? "الشارة القادمة" : "Next badge"}
                    </div>
                    <div style={{ fontWeight: 800, fontSize: ".88rem", color: next.color }}>
                      {next.name_ar}
                    </div>
                    <div style={{ fontSize: ".72rem", color: "#aaa" }}>{next.description_ar}</div>
                  </div>
                </div>
              );
            })()}

            {/* Link to full health page */}
            <button
              onClick={() => navigate("/mother/health")}
              style={{
                width: "100%", padding: "10px 0",
                background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                border: "none", borderRadius: 12,
                color: "#fff", fontWeight: 800, fontSize: ".85rem",
                fontFamily: "'Cairo','Poppins',sans-serif",
                cursor: "pointer", transition: ".2s",
              }}
              onMouseOver={e => e.currentTarget.style.opacity = ".88"}
              onMouseOut={e  => e.currentTarget.style.opacity = "1"}
            >
              🌸 {isAr ? "صفحة صحتي الكاملة" : "Full Health Page"}
            </button>
          </div>
        )}

        {/* Badges */}
        {tab === "badges" && (
          <div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(88px,1fr))",
              gap: 10,
            }}>
              {badges.map(badge => {
                const earned = earnedIds.has(badge.badge_id);
                return (
                  <div key={badge.badge_id}
                    title={badge.description_ar}
                    style={{
                      background: earned ? `${badge.color}15` : "#fafafa",
                      border: `1.5px solid ${earned ? badge.color + "55" : "#eee"}`,
                      borderRadius: 14, padding: "11px 7px",
                      textAlign: "center",
                      opacity: earned ? 1 : 0.38,
                      transition: ".2s",
                    }}>
                    <div style={{
                      fontSize: "1.7rem", marginBottom: 5,
                      filter: earned ? "none" : "grayscale(100%)",
                    }}>
                      {badge.icon}
                    </div>
                    <div style={{
                      fontSize: ".65rem", fontWeight: 700, lineHeight: 1.3,
                      color: earned ? badge.color : "#bbb",
                    }}>
                      {badge.name_ar}
                    </div>
                    {earned && (
                      <div style={{
                        marginTop: 5, display: "inline-block",
                        background: badge.color, color: "#fff",
                        fontSize: ".58rem", padding: "2px 6px",
                        borderRadius: 10, fontWeight: 700,
                      }}>
                        +{badge.xp_reward} XP
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {userBadges.length === 0 && (
              <div style={{ textAlign: "center", padding: "24px 0", color: "#aaa" }}>
                <div style={{ fontSize: "2rem", marginBottom: 8 }}>🏅</div>
                <p style={{ fontWeight: 700, fontSize: ".85rem" }}>
                  {isAr
                    ? "ابدئي بتسجيل أنشطتك لكسب الشارات!"
                    : "Start logging activities to earn badges!"}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Activity History */}
        {tab === "history" && (
          <div>
            {recentXP.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: "#aaa" }}>
                <div style={{ fontSize: "2rem", marginBottom: 8 }}>📋</div>
                <p style={{ fontWeight: 700, fontSize: ".85rem" }}>
                  {isAr ? "لا توجد نشاطات بعد" : "No activities yet"}
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recentXP.map(item => (
                  <div key={item.log_id} style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between",
                    padding: "9px 12px", background: "#fafafa",
                    borderRadius: 11, border: "1px solid #f0f0f0",
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: ".84rem", color: "#2d2825" }}>
                        {item.description || item.action_type}
                      </div>
                      <div style={{ fontSize: ".68rem", color: "#bbb", marginTop: 2 }}>
                        {new Date(item.created_at).toLocaleDateString("ar-SA", {
                          month: "short", day: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <div style={{
                      background: "#e8f5f2", color: "#1a6b5c",
                      fontWeight: 800, fontSize: ".78rem",
                      padding: "3px 10px", borderRadius: 20,
                      whiteSpace: "nowrap",
                    }}>
                      +{item.xp_earned} XP
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

const GAM_CSS = `
.gam-tab {
  flex: 1; background: none; border: none;
  padding: 12px 8px; margin-bottom: -1px;
  font-family: 'Cairo','Poppins',sans-serif;
  font-size: .8rem; font-weight: 700;
  color: #bbb; cursor: pointer; transition: .2s;
  border-bottom: 2px solid transparent;
}
.gam-tab:hover { color: var(--tc, #d68b9d); }
.gam-tab.active {
  color: var(--tc, #d68b9d);
  border-bottom-color: var(--tc, #d68b9d);
}
`;