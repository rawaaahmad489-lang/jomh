// src/pages/mother/MotherHealthPage.jsx
// ═══════════════════════════════════════════════════════════════════
// صفحة "صحتي" الكاملة — تتبع النشاطات + غيميفيكيشن + جراف + تحديات
// ═══════════════════════════════════════════════════════════════════
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate }      from "react-router-dom";
import { useTranslation }   from "react-i18next";
import { supabase }         from "../../../services/supabaseClient";
import { useGamification }  from "../../../core/hooks/useGamification";
import { useHealthTracking, ACTIVITY_CONFIG } from "../../../core/hooks/useHealthTracking";
import { BadgeToast, XPToast, useXPToast } from "../../../components/Badgetoast ";
import UnifiedNavbar from "../../../components/UnifiedNavbar";
import HealthProgressCharts from "../../../components/HealthProgressCharts";
// ── ألوان المستويات ─────────────────────────────────────────────────
const LEVEL_COLORS = [
  "#2ecc71","#3498db","#9b59b6","#e67e22",
  "#e74c3c","#f1c40f","#1abc9c","#d68b9d","#8e44ad","#c0392b",
];
const levelColor = (l) => LEVEL_COLORS[(l - 1) % LEVEL_COLORS.length];

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════
export default function MotherHealthPage() {
  const { i18n } = useTranslation();
  const navigate  = useNavigate();
  const isAr      = i18n.language === "ar";
  const dir       = isAr ? "rtl" : "ltr";

  const [userId,  setUserId]  = useState(null);
  const [loading, setLoading] = useState(true);

  // جلب userId
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: au } }) => {
      if (!au) { navigate("/login"); return; }
      const { data: u } = await supabase.from("users")
        .select("user_id").eq("auth_id", au.id).single();
      if (u) setUserId(u.user_id);
      setLoading(false);
    });
  }, [navigate]);

  const gam     = useGamification(userId);
  const tracker = useHealthTracking(userId);
  const { toast, showXP, hideXP } = useXPToast();

  const [activeTab,    setActiveTab]    = useState("today");     // today | progress | badges | challenges
  const [logModal,     setLogModal]     = useState(null);        // activity type أو null
  const [chartPeriod,  setChartPeriod]  = useState("weekly");
  const [chartType,    setChartType]    = useState("xp");        // xp | activity
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // ── بناء الجراف ────────────────────────────────────────────────
  useEffect(() => {
    if (!chartRef.current || activeTab !== "progress") return;
    if (typeof window.Chart === "undefined") return;

    if (chartInstance.current) chartInstance.current.destroy();

    const { labels, values } = tracker.buildChartData(chartPeriod);
    const target = Array(labels.length).fill(
      chartPeriod === "weekly" ? 50 : 30
    );

    chartInstance.current = new window.Chart(chartRef.current, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: isAr ? "نقاط XP المكتسبة" : "XP Earned",
            data: values,
            backgroundColor: "#d68b9d",
            borderRadius: 8,
            barThickness: chartPeriod === "weekly" ? 28 : 14,
          },
          {
            type: "line",
            label: isAr ? "الهدف اليومي" : "Daily Goal",
            data: target,
            borderColor: "#eab8c6",
            backgroundColor: "transparent",
            borderWidth: 1.5,
            borderDash: [5, 4],
            pointRadius: 0,
            tension: 0,
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false },
          tooltip: { rtl: true, bodyFont: { family: "'Cairo'" } } },
        scales: {
          x: { grid: { display: false }, ticks: { color: "#aaa", font: { size: 11 } } },
          y: { grid: { color: "rgba(0,0,0,.04)" },
            ticks: { color: "#aaa", maxTicksLimit: 5, font: { size: 11 } } },
        },
      },
    });
  }, [activeTab, chartPeriod, chartType, tracker, isAr]);

  // ── تسجيل نشاط ─────────────────────────────────────────────────
  const handleLogActivity = useCallback(async (activityType, formData) => {
    const result = await tracker.logActivity(activityType, formData);
    if (!result) return;

    const cfg = ACTIVITY_CONFIG[activityType];
    await gam.recordActivity(cfg.xp_action, result.id);
    await tracker.updateChallengeProgress(activityType);

    showXP(
      `${cfg.icon} ${cfg.label_ar} مسجّل!`,
      cfg.xp_action ? 15 : 0
    );
    setLogModal(null);
  }, [tracker, gam, showXP]);

  if (loading || gam.loading || tracker.loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#FBF9F8" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%",
          border: "4px solid #fdf2f5", borderTopColor: "#d68b9d",
          animation: "spin .7s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const color = levelColor(gam.level);

  return (
    <div className="hp-root" dir={dir}>
      <style>{HEALTH_CSS}</style>
<UnifiedNavbar
  isAr={isAr}
  onBack={() => navigate("/mother/dashboard")}
  pageTitle={isAr ? "رحلتي الصحية" : "My Health Journey"}
/>
      {/* Toasts */}
      <BadgeToast badge={gam.newBadge} isAr={isAr} />
      <XPToast message={toast.message} points={toast.points}
        visible={toast.visible} onHide={hideXP} />

      {/* ── Log Modal ────────────────────────────────────────── */}
      {logModal && (
        <LogModal
          activityType={logModal}
          isAr={isAr}
          onClose={() => setLogModal(null)}
          onSave={handleLogActivity}
          alreadyLogged={tracker.isLoggedToday(logModal)}
        />
      )}

      {/* ── HERO BANNER ─────────────────────────────────────── */}
      <section className="hp-hero" style={{ background: `linear-gradient(135deg, ${color}15, #fdf2f5 80%)` }}>
        <div className="hp-hero-text">
          <h1>{isAr ? "رحلتك الصحية 🌸" : "Your Health Journey 🌸"}</h1>
          <p style={{ color: "#888", fontSize: ".9rem", marginTop: 6 }}>
            {isAr
              ? "كل يوم تسجّلين فيه نشاطاً هو انجاز حقيقي — رحلتك مع نفسكِ فقط"
              : "Every day you log an activity is a real achievement — your journey is yours alone"}
          </p>
        </div>

        {/* Level ring */}
        <div className="hp-level-ring">
          <svg width="100" height="100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#f0f0f0" strokeWidth="8" />
            <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="8"
              strokeDasharray={`${(gam.progressPct / 100) * 263.9} 263.9`}
              strokeLinecap="round" transform="rotate(-90 50 50)"
              style={{ transition: "stroke-dasharray 1s ease" }} />
            <text x="50" y="44" textAnchor="middle"
              style={{ fill: color, fontWeight: 900, fontSize: 20, fontFamily: "'Cairo'" }}>
              {gam.level}
            </text>
            <text x="50" y="60" textAnchor="middle"
              style={{ fill: "#aaa", fontSize: 10, fontFamily: "'Cairo'" }}>
              {isAr ? "مستوى" : "LEVEL"}
            </text>
          </svg>
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <div style={{ fontWeight: 900, fontSize: ".82rem", color }}>{gam.levelTitle}</div>
            <div style={{ fontSize: ".7rem", color: "#aaa" }}>{gam.xpTotal} XP</div>
          </div>
        </div>

        {/* Streak */}
        <div className="hp-streak-pill" style={{ borderColor: gam.streakDays >= 7 ? "#e67e22" : "#eee" }}>
          <span style={{ fontSize: "1.6rem" }}>
            {gam.streakDays >= 30 ? "🏆" : gam.streakDays >= 7 ? "🔥" : "⚡"}
          </span>
          <div>
            <div style={{ fontWeight: 900, fontSize: "1.1rem",
              color: gam.streakDays >= 7 ? "#e67e22" : "#333" }}>
              {gam.streakDays}
            </div>
            <div style={{ fontSize: ".68rem", color: "#aaa" }}>
              {isAr ? "يوم متتالي" : "day streak"}
            </div>
          </div>
        </div>
      </section>

      {/* XP Progress bar */}
      <div className="hp-xp-bar-wrap">
        <div style={{ display: "flex", justifyContent: "space-between",
          fontSize: ".72rem", color: "#aaa", marginBottom: 5 }}>
          <span>{isAr ? `تقدم للمستوى ${gam.level + 1}` : `Progress to Level ${gam.level + 1}`}</span>
          <span>{gam.progress} / {gam.nextLevelXP} XP</span>
        </div>
        <div className="hp-xp-track">
          <div className="hp-xp-fill"
            style={{ width: `${gam.progressPct}%`, background: color }} />
        </div>
      </div>

      {/* ── TABS ─────────────────────────────────────────────── */}
      <div className="hp-tabs">
        {[
          { key: "today",       label: isAr ? "اليوم"      : "Today"      },
          { key: "progress",    label: isAr ? "تقدمي"      : "Progress"   },
          { key: "badges",      label: isAr ? `الشارات (${gam.userBadges.length})` : `Badges (${gam.userBadges.length})` },
          { key: "challenges",  label: isAr ? "التحديات"   : "Challenges" },
        ].map(t => (
          <button key={t.key}
            className={`hp-tab ${activeTab === t.key ? "active" : ""}`}
            style={{ "--tc": color }}
            onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══ TAB: TODAY ════════════════════════════════════════ */}
      {activeTab === "today" && (
        <section className="hp-section">
          <p style={{ color: "#888", fontSize: ".82rem", marginBottom: 18, fontWeight: 600 }}>
            {isAr
              ? "سجّلي نشاطاتك اليومية — كل نشاط يكسبكِ نقاطاً ويقرّبكِ من مستوى أعلى 🌱"
              : "Log your daily activities — each one earns XP and brings you closer to your next level 🌱"}
          </p>

          <div className="hp-trackers-grid">
            {Object.entries(ACTIVITY_CONFIG).map(([type, cfg]) => {
              const log     = tracker.todayLogs[type];
              const streak  = tracker.getStreak(type);
              const longest = tracker.getLongest(type);
              const done    = !!log;
              const pct     = log && cfg.daily_goal
                ? Math.min(100, Math.round((parseFloat(log.value) / cfg.daily_goal) * 100))
                : 0;

              return (
                <div key={type}
                  className={`hp-tracker-card ${done ? "done" : ""}`}
                  style={{ "--tc": cfg.color, "--tb": cfg.bg }}>
                  <div className="hp-tc-header">
                    <div className="hp-tc-icon" style={{ background: cfg.bg }}>
                      {cfg.icon}
                    </div>
                    <div className="hp-tc-xp" style={{ background: cfg.bg, color: cfg.color }}>
                      +{XP_ACTIONS_POINTS[cfg.xp_action] || 10} XP
                    </div>
                  </div>

                  <div className="hp-tc-name">{cfg.label_ar}</div>

                  {done ? (
                    <div className="hp-tc-value" style={{ color: cfg.color }}>
                      {log.value} <span className="hp-tc-unit">{cfg.unit}</span>
                    </div>
                  ) : (
                    <div className="hp-tc-value" style={{ color: "#ccc" }}>
                      {isAr ? "لم تُسجَّل بعد" : "Not logged"}
                    </div>
                  )}

                  {done && cfg.daily_goal && (
                    <div className="hp-tc-bar-wrap">
                      <div className="hp-tc-bar">
                        <div className="hp-tc-bar-fill"
                          style={{ width: `${pct}%`, background: cfg.color }} />
                      </div>
                      <span style={{ fontSize: ".68rem", color: "#aaa" }}>{pct}%</span>
                    </div>
                  )}

                  {streak > 0 && (
                    <div className="hp-tc-streak">
                      {streak >= 7 ? "🔥" : "⚡"} {streak} {isAr ? "يوم" : "d"}
                      {longest > streak && (
                        <span style={{ color: "#ccc", marginRight: 4 }}>
                          • {isAr ? `أفضل: ${longest}` : `Best: ${longest}`}
                        </span>
                      )}
                    </div>
                  )}

                  {done && (
                    <div className="hp-tc-done-badge">
                      ✓ {isAr ? "مكتمل" : "Done"}
                    </div>
                  )}

                  <button
                    className="hp-tc-btn"
                    style={{ background: done ? "#f4f4f4" : cfg.color,
                      color: done ? "#aaa" : "#fff" }}
                    onClick={() => setLogModal(type)}>
                    {done
                      ? (isAr ? "تعديل" : "Edit")
                      : (isAr ? "تسجيل الآن" : "Log Now")}
                  </button>
                </div>
              );
            })}
          </div>

          {/* ملخص اليوم */}
          <div className="hp-daily-summary">
            <div className="hp-summary-title">
              {isAr ? "ملخص اليوم" : "Today's Summary"}
            </div>
            <div className="hp-summary-stats">
              <div className="hp-sum-item">
                <span style={{ fontSize: "1.4rem" }}>✅</span>
                <div style={{ fontWeight: 900, fontSize: "1.1rem", color: "#27ae60" }}>
                  {Object.keys(tracker.todayLogs).length}
                </div>
                <div style={{ fontSize: ".68rem", color: "#aaa" }}>
                  {isAr ? "نشاط مسجّل" : "Logged"}
                </div>
              </div>
              <div className="hp-sum-item">
                <span style={{ fontSize: "1.4rem" }}>⭐</span>
                <div style={{ fontWeight: 900, fontSize: "1.1rem", color: "#f1c40f" }}>
                  {Object.values(tracker.todayLogs).reduce((s, l) => s + (l.xp_earned || 0), 0)}
                </div>
                <div style={{ fontSize: ".68rem", color: "#aaa" }}>XP {isAr ? "اليوم" : "today"}</div>
              </div>
              <div className="hp-sum-item">
                <span style={{ fontSize: "1.4rem" }}>🎯</span>
                <div style={{ fontWeight: 900, fontSize: "1.1rem", color: "#d68b9d" }}>
                  {Object.keys(ACTIVITY_CONFIG).length - Object.keys(tracker.todayLogs).length}
                </div>
                <div style={{ fontSize: ".68rem", color: "#aaa" }}>
                  {isAr ? "متبقي" : "Remaining"}
                </div>
              </div>
            </div>
            {Object.keys(tracker.todayLogs).length === Object.keys(ACTIVITY_CONFIG).length && (
              <div className="hp-all-done-banner">
                🎉 {isAr ? "أحسنتِ! سجّلتِ جميع نشاطاتك اليوم!" : "Amazing! You logged all activities today!"}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ══ TAB: PROGRESS ════════════════════════════════════ */}
      {activeTab === "progress" && (
        <section className="hp-section">
          {/* Chart controls */}
          <div style={{ display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <h3 style={{ fontWeight: 800, fontSize: "1rem" }}>
              {isAr ? "تقدم النقاط والنشاطات" : "XP & Activity Progress"}
            </h3>
            <div style={{ display: "flex", gap: 8 }}>
              {["weekly", "monthly"].map(p => (
                <button key={p}
                  className={`hp-chip ${chartPeriod === p ? "active" : ""}`}
                  style={{ "--tc": color }}
                  onClick={() => setChartPeriod(p)}>
                  {p === "weekly" ? (isAr ? "أسبوع" : "Week") : (isAr ? "شهر" : "Month")}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="hp-chart-card">
            <div style={{ position: "relative", height: 230 }}>
              <canvas ref={chartRef}
                aria-label={isAr ? "رسم بياني لتقدم النقاط" : "XP progress chart"} />
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: ".72rem", color: "#aaa" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 10, height: 10, background: "#d68b9d", borderRadius: 3, display: "inline-block" }} />
                {isAr ? "نقاط مكتسبة" : "XP Earned"}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 20, height: 2, background: "#eab8c6", display: "inline-block", borderTop: "1px dashed #eab8c6" }} />
                {isAr ? "الهدف" : "Goal"}
              </span>
            </div>
          </div>

          {/* Streaks summary */}
          <h3 style={{ fontWeight: 800, fontSize: "1rem", margin: "20px 0 12px" }}>
            {isAr ? "سلاسلك اليومية" : "Your Daily Streaks"}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 10 }}>
            {Object.entries(ACTIVITY_CONFIG).map(([type, cfg]) => {
              const curr = tracker.getStreak(type);
              const best = tracker.getLongest(type);
              return (
                <div key={type} style={{
                  background: curr > 0 ? cfg.bg : "#fafafa",
                  border: `1.5px solid ${curr > 0 ? cfg.color + "55" : "#eee"}`,
                  borderRadius: 14, padding: "12px 14px", textAlign: "center",
                }}>
                  <div style={{ fontSize: "1.4rem", marginBottom: 4 }}>{cfg.icon}</div>
                  <div style={{ fontWeight: 800, fontSize: ".82rem", color: cfg.color }}>
                    {cfg.label_ar}
                  </div>
                  <div style={{ fontWeight: 900, fontSize: "1.3rem",
                    color: curr >= 7 ? "#e67e22" : curr > 0 ? cfg.color : "#ddd" }}>
                    {curr}
                  </div>
                  <div style={{ fontSize: ".65rem", color: "#aaa" }}>
                    {isAr ? "حالي" : "current"} • {isAr ? `أفضل: ${best}` : `best: ${best}`}
                  </div>
                </div>
              );
            })}
          </div>
<HealthProgressCharts tracker={tracker} isAr={isAr} />
          {/* Recent activity */}
          <h3 style={{ fontWeight: 800, fontSize: "1rem", margin: "20px 0 12px" }}>
            {isAr ? "آخر النشاطات" : "Recent Activity"}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {gam.recentXP.slice(0, 8).map(item => (
              <div key={item.log_id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px", background: "#fafafa",
                borderRadius: 12, border: "1px solid #f0f0f0",
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: ".85rem", color: "#2d2825" }}>
                    {item.description || item.action_type}
                  </div>
                  <div style={{ fontSize: ".7rem", color: "#bbb", marginTop: 2 }}>
                    {new Date(item.created_at).toLocaleDateString("ar-SA", {
                      month: "short", day: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </div>
                </div>
                <div style={{
                  background: "#eaf5ee", color: "#1a6b5c",
                  fontWeight: 800, fontSize: ".78rem",
                  padding: "3px 10px", borderRadius: 20,
                }}>
                  +{item.xp_earned} XP
                </div>
              </div>
            ))}
            {gam.recentXP.length === 0 && (
              <div style={{ textAlign: "center", padding: "30px 0", color: "#aaa" }}>
                <div style={{ fontSize: "2rem", marginBottom: 10 }}>📋</div>
                <p style={{ fontWeight: 700 }}>{isAr ? "ابدئي بتسجيل نشاطاتك لترى تقدمكِ!" : "Start logging to see your progress!"}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ══ TAB: BADGES ══════════════════════════════════════ */}
      {activeTab === "badges" && (
        <section className="hp-section">
          <p style={{ color: "#888", fontSize: ".82rem", marginBottom: 18, fontWeight: 600 }}>
            {isAr
              ? "الشارات هي علامات على رحلتكِ — كل شارة تعكس إنجازاً حقيقياً قمتِ به 🏅"
              : "Badges mark milestones on your personal journey 🏅"}
          </p>

          {/* مكتسبة */}
          {gam.userBadges.length > 0 && (
            <>
              <h3 style={{ fontWeight: 800, fontSize: ".95rem", marginBottom: 12, color: "#555" }}>
                {isAr ? `✅ مكتسبة (${gam.userBadges.length})` : `Earned (${gam.userBadges.length})`}
              </h3>
              <div className="hp-badges-grid" style={{ marginBottom: 24 }}>
                {gam.userBadges.map(ub => {
                  const b = ub.badges;
                  return (
                    <div key={ub.id} className="hp-badge-card earned"
                      style={{ "--bc": b.color, "--bb": b.color + "18" }}>
                      <div className="hp-badge-icon">{b.icon}</div>
                      <div className="hp-badge-name" style={{ color: b.color }}>{b.name_ar}</div>
                      <div className="hp-badge-desc">{b.description_ar}</div>
                      <div style={{ marginTop: 6, fontSize: ".62rem",
                        background: b.color, color: "#fff",
                        padding: "2px 7px", borderRadius: 10,
                        display: "inline-block", fontWeight: 700 }}>
                        +{b.xp_reward} XP
                      </div>
                      <div style={{ fontSize: ".6rem", color: "#bbb", marginTop: 4 }}>
                        {new Date(ub.earned_at).toLocaleDateString("ar-SA", { month: "short", day: "numeric" })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* مقفلة */}
          {(() => {
            const earnedIds = new Set(gam.userBadges.map(ub => ub.badge_id));
            const locked = gam.badges.filter(b => !earnedIds.has(b.badge_id));
            return locked.length > 0 ? (
              <>
                <h3 style={{ fontWeight: 800, fontSize: ".95rem", marginBottom: 12, color: "#bbb" }}>
                  {isAr ? `🔒 قيد التحقيق (${locked.length})` : `Locked (${locked.length})`}
                </h3>
                <div className="hp-badges-grid">
                  {locked.map(b => (
                    <div key={b.badge_id} className="hp-badge-card locked">
                      <div className="hp-badge-icon" style={{ filter: "grayscale(100%)", opacity: .35 }}>
                        {b.icon}
                      </div>
                      <div className="hp-badge-name" style={{ color: "#ccc" }}>{b.name_ar}</div>
                      <div className="hp-badge-desc">{b.description_ar}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : null;
          })()}

          {gam.badges.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#aaa" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🏅</div>
              <p style={{ fontWeight: 700 }}>
                {isAr ? "سجّلي نشاطاتك لتكسبي الشارات!" : "Log activities to earn badges!"}
              </p>
            </div>
          )}
        </section>
      )}

      {/* ══ TAB: CHALLENGES ══════════════════════════════════ */}
      {activeTab === "challenges" && (
        <section className="hp-section">
          <p style={{ color: "#888", fontSize: ".82rem", marginBottom: 18, fontWeight: 600 }}>
            {isAr
              ? "التحديات طريقة ممتعة لبناء عادات صحية — انضمي لأي تحدٍ وابدئي رحلتكِ 🎯"
              : "Challenges help you build healthy habits — join any challenge and start your journey 🎯"}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
            {tracker.challenges.map(ch => {
              const userCh = tracker.userChallenges.find(uc => uc.challenge_id === ch.id);
              const pct    = userCh ? Math.min(100, Math.round((userCh.progress_days / ch.target_days) * 100)) : 0;
              const joined = !!userCh;

              return (
                <div key={ch.id} className="hp-challenge-card"
                  style={{ "--cc": ch.color }}>
                  <div className="hp-ch-header">
                    <span style={{ fontSize: "1.5rem" }}>{ch.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: ".9rem" }}>{ch.title_ar}</div>
                      <div style={{ fontSize: ".75rem", color: "#888", marginTop: 2 }}>
                        {ch.description_ar}
                      </div>
                    </div>
                    <div style={{
                      background: ch.color + "20", color: ch.color,
                      padding: "3px 10px", borderRadius: 20,
                      fontWeight: 800, fontSize: ".72rem", whiteSpace: "nowrap",
                    }}>
                      +{ch.xp_reward} XP
                    </div>
                  </div>

                  {joined && (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between",
                        fontSize: ".7rem", color: "#aaa", marginBottom: 5, marginTop: 10 }}>
                        <span>{isAr ? "التقدم" : "Progress"}</span>
                        <span>{userCh.progress_days} / {ch.target_days} {isAr ? "يوم" : "days"}</span>
                      </div>
                      <div style={{ background: "#f4f4f4", borderRadius: 10, height: 7, overflow: "hidden" }}>
                        <div style={{
                          width: `${pct}%`, height: "100%",
                          background: userCh.is_completed
                            ? `linear-gradient(90deg, #27ae60, #2ecc71)`
                            : `linear-gradient(90deg, ${ch.color}, ${ch.color}bb)`,
                          borderRadius: 10,
                          transition: "width .8s ease",
                        }} />
                      </div>
                    </>
                  )}

                  {userCh?.is_completed ? (
                    <div style={{
                      marginTop: 10, textAlign: "center",
                      background: "#eaf5ee", color: "#27ae60",
                      padding: "7px", borderRadius: 10,
                      fontWeight: 800, fontSize: ".82rem",
                    }}>
                      🎉 {isAr ? "مكتمل! أحسنتِ" : "Completed!"}
                    </div>
                  ) : !joined ? (
                    <button className="hp-ch-btn"
                      style={{ background: ch.color }}
                      onClick={() => tracker.joinChallenge(ch.id)}>
                      {isAr ? "انضمي للتحدي" : "Join Challenge"}
                    </button>
                  ) : (
                    <div style={{ marginTop: 10, fontSize: ".72rem", color: "#aaa", textAlign: "center" }}>
                      {isAr ? `باقي ${ch.target_days - userCh.progress_days} يوم` : `${ch.target_days - userCh.progress_days} days left`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Chart.js script ──────────────────────────────────── */}
      <script
        ref={el => {
          if (el && !window.Chart) {
            const s = document.createElement("script");
            s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
            document.head.appendChild(s);
          }
        }}
      />
    </div>
  );
}

// ── نقاط كل نشاط (للعرض) ──────────────────────────────────────────
const XP_ACTIONS_POINTS = {
  health_sleep:     15, health_exercise:  15, health_mental:    12,
  health_hydration: 8,  health_self_care: 10, health_nutrition: 8,
};

// ═══════════════════════════════════════════════════════════════════
// LOG MODAL
// ═══════════════════════════════════════════════════════════════════
function LogModal({ activityType, isAr, onClose, onSave, alreadyLogged }) {
  const cfg = ACTIVITY_CONFIG[activityType];
  const [form, setForm] = useState({ value: "", mood: "good", notes: "" });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(activityType, form);
    setSaving(false);
  };

  return (
    <div className="hp-modal-overlay" onClick={onClose}>
      <div className="hp-modal-box" dir={isAr ? "rtl" : "ltr"}
        onClick={e => e.stopPropagation()}>
        <div className="hp-modal-head" style={{ borderBottom: `3px solid ${cfg.color}33` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "1.8rem" }}>{cfg.icon}</span>
            <div>
              <div style={{ fontWeight: 900, fontSize: "1rem" }}>{cfg.label_ar}</div>
              {alreadyLogged && (
                <div style={{ fontSize: ".72rem", color: "#e67e22", fontWeight: 700 }}>
                  {isAr ? "⚡ تعديل سجل اليوم" : "Editing today's log"}
                </div>
              )}
            </div>
          </div>
          <button className="hp-modal-close" onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: "20px" }}>
          {cfg.questions.map(q => (
            <div key={q.key} style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontWeight: 700,
                fontSize: ".85rem", marginBottom: 7, color: "#555" }}>
                {q.label}
              </label>
              {q.type === "number" && (
                <input type="number" step="0.5"
                  value={form[q.key] || ""}
                  placeholder={q.placeholder || ""}
                  onChange={e => setForm(f => ({ ...f, [q.key]: e.target.value }))}
                  className="hp-modal-input" />
              )}
              {q.type === "text" && (
                <input type="text"
                  value={form[q.key] || ""}
                  placeholder={q.placeholder || ""}
                  onChange={e => setForm(f => ({ ...f, [q.key]: e.target.value }))}
                  className="hp-modal-input" />
              )}
              {q.type === "textarea" && (
                <textarea rows="2"
                  value={form[q.key] || ""}
                  onChange={e => setForm(f => ({ ...f, [q.key]: e.target.value }))}
                  className="hp-modal-input" style={{ resize: "vertical" }} />
              )}
              {q.type === "select" && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {q.options.map(opt => (
                    <button key={opt.v}
                      type="button"
                      className={`hp-mood-btn ${form[q.key] === opt.v ? "active" : ""}`}
                      style={{ "--mc": cfg.color }}
                      onClick={() => setForm(f => ({ ...f, [q.key]: opt.v }))}>
                      {opt.l}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          <button
            style={{
              width: "100%", padding: "11px 0",
              background: cfg.color, color: "#fff",
              border: "none", borderRadius: 14,
              fontWeight: 800, fontSize: ".9rem",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? .7 : 1,
              fontFamily: "'Cairo','Poppins',sans-serif",
              display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8,
              transition: ".2s",
            }}
            onClick={handleSave}
            disabled={saving}>
            {saving
              ? <span style={{ width: 18, height: 18, borderRadius: "50%",
                  border: "3px solid rgba(255,255,255,.4)",
                  borderTopColor: "#fff", animation: "spin .7s linear infinite",
                  display: "inline-block" }} />
              : `${cfg.icon} ${isAr ? "حفظ النشاط" : "Save Activity"}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CSS
// ═══════════════════════════════════════════════════════════════════
const HEALTH_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Poppins:wght@400;600;700&display=swap');

:root {
  --primary: #d68b9d; --primary-light: #fdf2f5;
  --secondary: #eab8c6; --bg: #FBF9F8;
  --text: #2d2825; --gray: #777;
  --shadow: 0 5px 20px rgba(0,0,0,.04);
  --radius: 20px;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
.hp-root {
  background: var(--bg); min-height: 100vh;
  font-family: 'Cairo','Poppins',sans-serif;
  color: var(--text); padding-top: 0px;
  /*max-width: 1100px; margin: 0 auto;
  padding-left: 22px; padding-right: 22px; padding-bottom: 60px;*/
}
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeUp { from { opacity:0;transform:translateY(16px); } to { opacity:1;transform:translateY(0); } }

/* Hero */
.hp-hero {
  border-radius: var(--radius); padding: 24px 28px;
  display: flex; align-items: center; gap: 20px;
  flex-wrap: wrap; margin-bottom: 0;
  border: 1px solid #fdf2f5;
  box-shadow: var(--shadow);
}
.hp-hero-text { flex: 1; min-width: 200px; }
.hp-hero-text h1 { font-size: 1.5rem; font-weight: 900; }
.hp-level-ring { display: flex; flex-direction: column; align-items: center; }
.hp-streak-pill {
  display: flex; align-items: center; gap: 10px;
  background: white; border: 1.5px solid;
  border-radius: 16px; padding: 10px 16px;
}

/* XP bar */
.hp-xp-bar-wrap {
  background: white; border: 1px solid #fdf2f5;
  border-radius: 0 0 16px 16px; padding: 12px 24px 14px;
  margin-bottom: 20px; box-shadow: var(--shadow);
}
.hp-xp-track {
  background: #f4f4f4; border-radius: 20px;
  height: 10px; overflow: hidden;
}
.hp-xp-fill {
  height: 100%; border-radius: 20px;
  transition: width 1s ease;
}

/* Tabs */
.hp-tabs {
  display: flex; border-bottom: 1px solid #f0f0f0;
  background: white; border-radius: 16px 16px 0 0;
  overflow: hidden; margin-bottom: 0;
  box-shadow: var(--shadow);
}
.hp-tab {
  flex: 1; background: none; border: none; border-bottom: 2px solid transparent;
  padding: 13px 8px; font-family: 'Cairo','Poppins',sans-serif;
  font-size: .83rem; font-weight: 700; color: #aaa;
  cursor: pointer; transition: .2s; margin-bottom: -1px;
}
.hp-tab:hover { color: var(--tc, #d68b9d); }
.hp-tab.active { color: var(--tc, #d68b9d); border-bottom-color: var(--tc, #d68b9d); }

/* Section */
.hp-section {
  background: white; border: 1px solid #fdf2f5;
  border-radius: 0 0 var(--radius) var(--radius);
  padding: 22px 22px 28px;
  box-shadow: var(--shadow);
  animation: fadeUp .4s ease;
}

/* Trackers grid */
.hp-trackers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px; margin-bottom: 20px;
}
.hp-tracker-card {
  background: white; border: 1.5px solid #f0f0f0;
  border-radius: 18px; padding: 16px;
  transition: .25s; position: relative;
  overflow: hidden;
}
.hp-tracker-card:hover {
  border-color: var(--tc, #d68b9d);
  box-shadow: 0 6px 20px rgba(0,0,0,.06);
  transform: translateY(-2px);
}
.hp-tracker-card.done { border-color: var(--tc, #d68b9d); background: var(--tb, #fdf2f5); }
.hp-tc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
.hp-tc-icon { width: 38px; height: 38px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
.hp-tc-xp { font-size: .65rem; font-weight: 800; border-radius: 20px; padding: 3px 8px; }
.hp-tc-name { font-weight: 700; font-size: .82rem; margin-bottom: 5px; }
.hp-tc-value { font-size: 1.2rem; font-weight: 900; }
.hp-tc-unit { font-size: .72rem; font-weight: 600; }
.hp-tc-bar-wrap { display: flex; align-items: center; gap: 6px; margin-top: 8px; }
.hp-tc-bar { flex: 1; background: rgba(0,0,0,.06); border-radius: 6px; height: 5px; }
.hp-tc-bar-fill { height: 5px; border-radius: 6px; transition: width .8s ease; }
.hp-tc-streak { font-size: .68rem; color: #aaa; margin-top: 6px; font-weight: 700; }
.hp-tc-done-badge {
  position: absolute; top: 8px; left: 8px;
  background: #eaf5ee; color: #27ae60;
  font-size: .6rem; font-weight: 800;
  padding: 2px 7px; border-radius: 10px;
}
[dir=rtl] .hp-tc-done-badge { left: auto; right: 8px; }
.hp-tc-btn {
  display: block; width: 100%; margin-top: 10px;
  padding: 7px 0; border: none; border-radius: 10px;
  font-family: 'Cairo','Poppins',sans-serif;
  font-size: .78rem; font-weight: 800; cursor: pointer;
  transition: .2s; opacity: .92;
}
.hp-tc-btn:hover { opacity: 1; transform: translateY(-1px); }

/* Daily summary */
.hp-daily-summary {
  background: #fafafa; border: 1px solid #f0f0f0;
  border-radius: 16px; padding: 16px;
}
.hp-summary-title { font-weight: 800; font-size: .9rem; margin-bottom: 12px; }
.hp-summary-stats { display: flex; gap: 12px; flex-wrap: wrap; }
.hp-sum-item { flex: 1; min-width: 80px; text-align: center; background: white;
  border-radius: 12px; padding: 10px; border: 1px solid #f0f0f0; }
.hp-all-done-banner {
  margin-top: 12px; background: linear-gradient(135deg, #d68b9d22, #eab8c622);
  border: 1px solid #eab8c6; border-radius: 12px;
  padding: 10px 16px; text-align: center;
  font-weight: 800; font-size: .88rem; color: #d68b9d;
}

/* Chart */
.hp-chart-card {
  background: #fafafa; border: 1px solid #f0f0f0;
  border-radius: 16px; padding: 16px;
}
.hp-chip {
  padding: 5px 14px; border-radius: 20px; border: 1px solid #eee;
  background: #f4f4f4; font-family: 'Cairo','Poppins',sans-serif;
  font-size: .78rem; font-weight: 700; color: #aaa;
  cursor: pointer; transition: .2s;
}
.hp-chip.active { background: var(--tc, #d68b9d); color: white; border-color: var(--tc, #d68b9d); }

/* Badges */
.hp-badges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 12px;
}
.hp-badge-card {
  border-radius: 16px; padding: 14px 10px;
  text-align: center; transition: .2s;
}
.hp-badge-card.earned {
  background: var(--bb, #fdf2f5);
  border: 1.5px solid var(--bc, #d68b9d);
}
.hp-badge-card.locked {
  background: #fafafa; border: 1.5px solid #eee; opacity: .5;
}
.hp-badge-icon { font-size: 2rem; margin-bottom: 7px; }
.hp-badge-name { font-size: .75rem; font-weight: 800; line-height: 1.3; margin-bottom: 4px; }
.hp-badge-desc { font-size: .65rem; color: #aaa; line-height: 1.4; }

/* Challenges */
.hp-challenge-card {
  background: white; border: 1.5px solid #f0f0f0;
  border-radius: 18px; padding: 18px;
  border-top: 4px solid var(--cc, #d68b9d);
  transition: .25s; box-shadow: var(--shadow);
}
.hp-challenge-card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,.07); }
.hp-ch-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 4px; }
.hp-ch-btn {
  display: block; width: 100%; margin-top: 14px;
  padding: 9px 0; border: none; border-radius: 12px;
  color: white; font-family: 'Cairo','Poppins',sans-serif;
  font-size: .85rem; font-weight: 800; cursor: pointer; transition: .2s;
}
.hp-ch-btn:hover { opacity: .9; transform: translateY(-1px); }

/* Modal */
.hp-modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.5);
  backdrop-filter: blur(5px); display: flex;
  align-items: center; justify-content: center;
  z-index: 4000; padding: 16px;
  animation: fadeUp .25s ease;
}
.hp-modal-box {
  background: white; border-radius: 24px;
  width: 100%; max-width: 440px; max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,.18);
}
.hp-modal-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 20px 14px;
}
.hp-modal-close {
  background: #f4f4f4; border: none; border-radius: 50%;
  width: 30px; height: 30px; font-size: 1rem;
  cursor: pointer; color: #888; transition: .2s;
  display: flex; align-items: center; justify-content: center;
}
.hp-modal-close:hover { background: #fef0f0; color: #e74c3c; }
.hp-modal-input {
  width: 100%; padding: 10px 13px;
  border: 1px solid #ddd; border-radius: 12px;
  outline: none; font-family: 'Cairo','Poppins',sans-serif;
  font-size: .88rem; background: #fafafa; transition: .2s;
}
.hp-modal-input:focus { border-color: #eab8c6; background: white; box-shadow: 0 0 0 3px #fdf2f5; }
.hp-mood-btn {
  padding: 7px 14px; border-radius: 20px;
  border: 1.5px solid #eee; background: #fafafa;
  font-family: 'Cairo','Poppins',sans-serif;
  font-size: .8rem; font-weight: 700; color: #888;
  cursor: pointer; transition: .2s;
}
.hp-mood-btn.active {
  background: var(--mc, #d68b9d); color: white;
  border-color: var(--mc, #d68b9d);
}
.hp-mood-btn:hover { border-color: var(--mc, #d68b9d); }

/* Responsive */
@media (max-width: 600px) {
  .hp-root { padding-left: 14px; padding-right: 14px; }
  .hp-hero { padding: 16px; }
  .hp-hero-text h1 { font-size: 1.2rem; }
  .hp-trackers-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .hp-badges-grid { grid-template-columns: repeat(3, 1fr); }
}
`;