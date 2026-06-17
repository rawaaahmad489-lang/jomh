// src/components/HealthProgressCharts.jsx
// ═══════════════════════════════════════════════════════════════════
// رسوم بيانية شاملة لتقدم جميع النشاطات الصحية اليومية
// يُضاف داخل التاب "progress" في MotherHealthPage
// ═══════════════════════════════════════════════════════════════════
import { useEffect, useRef, useState } from "react";
import { ACTIVITY_CONFIG } from "../core/hooks/useHealthTracking";

// ألوان ثابتة لكل نشاط (لا تتغير بالثيم)
const ACTIVITY_COLORS = {
  health_sleep:     { line: "#8b5cf6", bg: "rgba(139,92,246,.08)" },
  health_exercise:  { line: "#ef4444", bg: "rgba(239,68,68,.08)"  },
  health_mental:    { line: "#06b6d4", bg: "rgba(6,182,212,.08)"  },
  health_hydration: { line: "#3b82f6", bg: "rgba(59,130,246,.08)" },
  health_self_care: { line: "#ec4899", bg: "rgba(236,72,153,.08)" },
  health_nutrition: { line: "#22c55e", bg: "rgba(34,197,94,.08)"  },
};

/**
 * HealthProgressCharts
 * @param {Object} tracker - useHealthTracking hook result
 * @param {boolean} isAr
 */
const HealthProgressCharts = ({ tracker, isAr }) => {
  const [period,       setPeriod]       = useState("weekly");   // weekly | monthly
  const [activeType,   setActiveType]   = useState("overview"); // overview | specific activity type
  const overviewRef   = useRef(null);
  const detailRef     = useRef(null);
  const overviewChart = useRef(null);
  const detailChart   = useRef(null);

  // ── بيانات المحاور ────────────────────────────────────────────
  const buildLabels = () => {
    const now = new Date();
    if (period === "weekly") {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (6 - i));
        return d.toLocaleDateString(isAr ? "ar-SA" : "en-US", { weekday: "short" });
      });
    }
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (29 - i));
      return d.toLocaleDateString(isAr ? "ar-SA" : "en-US", { month: "short", day: "numeric" });
    });
  };

  // ── بيانات نشاط واحد (هل سُجّل في ذلك اليوم؟) ──────────────
  const buildActivityData = (activityType) => {
    const days = period === "weekly" ? 7 : 30;
    const now = new Date();
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (days - 1 - i));
      const dateStr = d.toISOString().split("T")[0];
      // البحث في سجلات الـ tracker
      const logsForDay = (tracker.allLogs || []).filter(
        l => l.activity_type === activityType && l.logged_date === dateStr
      );
      return logsForDay.length > 0 ? (parseFloat(logsForDay[0].value) || 1) : 0;
    });
  };

  // ── نسبة الالتزام الإجمالية ───────────────────────────────────
  const buildComplianceData = () => {
    const days = period === "weekly" ? 7 : 30;
    const now = new Date();
    const totalActivities = Object.keys(ACTIVITY_CONFIG).length;

    return Array.from({ length: days }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (days - 1 - i));
      const dateStr = d.toISOString().split("T")[0];
      const loggedCount = (tracker.allLogs || []).filter(l => l.logged_date === dateStr).length;
      const uniqueTypes = new Set(
        (tracker.allLogs || []).filter(l => l.logged_date === dateStr).map(l => l.activity_type)
      ).size;
      return Math.round((uniqueTypes / totalActivities) * 100);
    });
  };

useEffect(() => {
  if (typeof window.Chart === "undefined") return;

  // دمّري القديم دائماً
  if (overviewChart.current) {
    overviewChart.current.destroy();
    overviewChart.current = null;
  }
  if (detailChart.current) {
    detailChart.current.destroy();
    detailChart.current = null;
  }

  const labels = buildLabels();

  if (activeType === "overview") {
    if (!overviewRef.current) return;
    const compliance = buildComplianceData();
    overviewChart.current = new window.Chart(overviewRef.current, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: isAr ? "نسبة الالتزام" : "Compliance %",
            data: compliance,
            backgroundColor: compliance.map(v =>
              v >= 80 ? "#27ae60" : v >= 50 ? "#f39c12" : "#e74c3c"
            ),
            borderRadius: 8,
            barThickness: period === "weekly" ? 28 : 10,
          },
          {
            type: "line",
            label: isAr ? "الهدف 80%" : "80% Goal",
            data: Array(labels.length).fill(80),
            borderColor: "#d68b9d",
            borderWidth: 1.5,
            borderDash: [5, 4],
            pointRadius: 0,
            fill: false,
            tension: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#aaa", font: { size: 10 }, maxRotation: 0, autoSkip: true, maxTicksLimit: period === "weekly" ? 7 : 12 },
          },
          y: {
            min: 0, max: 100,
            grid: { color: "rgba(0,0,0,.04)" },
            ticks: { color: "#aaa", font: { size: 10 }, callback: v => `${v}%`, maxTicksLimit: 5 },
          },
        },
      },
    });
  } else {
    if (!detailRef.current) return;
    const cfg = ACTIVITY_CONFIG[activeType];
    if (!cfg) return;
    const values = buildActivityData(activeType);
    const colorPair = ACTIVITY_COLORS[activeType] || { line: "#d68b9d", bg: "rgba(214,139,157,.08)" };

    detailChart.current = new window.Chart(detailRef.current, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: cfg.label_ar,
            data: values,
            borderColor: colorPair.line,
            backgroundColor: colorPair.bg,
            pointBackgroundColor: values.map(v => v > 0 ? colorPair.line : "transparent"),
            pointBorderColor:     values.map(v => v > 0 ? colorPair.line : "transparent"),
            pointRadius:          values.map(v => v > 0 ? 5 : 0),
            fill: true,
            tension: 0.4,
            spanGaps: false,
          },
          ...(cfg.daily_goal ? [{
            type: "line",
            label: isAr ? "الهدف" : "Goal",
            data: Array(labels.length).fill(cfg.daily_goal),
            borderColor: "#eab8c6",
            borderWidth: 1.5,
            borderDash: [5, 4],
            pointRadius: 0,
            fill: false,
            tension: 0,
          }] : []),
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#aaa", font: { size: 10 }, maxRotation: 0, autoSkip: true, maxTicksLimit: period === "weekly" ? 7 : 12 },
          },
          y: {
            min: 0,
            grid: { color: "rgba(0,0,0,.04)" },
            ticks: { color: "#aaa", font: { size: 10 }, maxTicksLimit: 5 },
          },
        },
      },
    });
  }

  // cleanup عند الخروج
  return () => {
    if (overviewChart.current) { overviewChart.current.destroy(); overviewChart.current = null; }
    if (detailChart.current)   { detailChart.current.destroy();   detailChart.current   = null; }
  };

}, [activeType, period, isAr, tracker]);

  // ── حساب إحصائيات كل نشاط ──────────────────────────────────
  const getActivityStats = (type) => {
    const days = period === "weekly" ? 7 : 30;
    const now = new Date();
    let logged = 0;
    let total = 0;

    for (let i = 0; i < days; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const hasLog = (tracker.allLogs || []).some(
        l => l.activity_type === type && l.logged_date === dateStr
      );
      if (hasLog) logged++;
      total++;
    }
    return { logged, total, pct: Math.round((logged / total) * 100) };
  };

  return (
    <div style={{ marginTop: 20 }}>
      {/* ── عنوان وأزرار التحكم ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <h3 style={{ fontWeight: 800, fontSize: "1rem" }}>
          {isAr ? "📊 رسوم بيانية — التقدم اليومي" : "📊 Charts — Daily Progress"}
        </h3>
        <div style={{ display: "flex", gap: 8 }}>
          {["weekly", "monthly"].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: "5px 14px", borderRadius: 20,
                border: "1px solid #eee",
                background: period === p ? "#d68b9d" : "#f4f4f4",
                color: period === p ? "white" : "#aaa",
                fontFamily: "inherit", fontWeight: 700, fontSize: ".78rem",
                cursor: "pointer", transition: ".2s",
              }}
            >
              {p === "weekly" ? (isAr ? "أسبوع" : "Week") : (isAr ? "شهر" : "Month")}
            </button>
          ))}
        </div>
      </div>

      {/* ── بطاقات النشاطات (اضغطي لعرض تفصيل) ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
        gap: 10,
        marginBottom: 16,
      }}>
        {/* بطاقة النظرة العامة */}
        <div
          onClick={() => setActiveType("overview")}
          style={{
            background: activeType === "overview" ? "#d68b9d" : "#fafafa",
            border: `1.5px solid ${activeType === "overview" ? "#d68b9d" : "#f0f0f0"}`,
            borderRadius: 14, padding: "10px 8px",
            textAlign: "center", cursor: "pointer", transition: ".2s",
          }}
        >
          <div style={{ fontSize: "1.2rem", marginBottom: 4 }}>📈</div>
          <div style={{
            fontWeight: 800, fontSize: ".72rem",
            color: activeType === "overview" ? "white" : "#555",
          }}>
            {isAr ? "الكل" : "Overview"}
          </div>
        </div>

        {/* بطاقة لكل نشاط */}
        {Object.entries(ACTIVITY_CONFIG).map(([type, cfg]) => {
          const stats = getActivityStats(type);
          const colorPair = ACTIVITY_COLORS[type] || { line: "#d68b9d" };
          const isActive = activeType === type;
          return (
            <div
              key={type}
              onClick={() => setActiveType(type)}
              style={{
                background: isActive ? colorPair.line : "#fafafa",
                border: `1.5px solid ${isActive ? colorPair.line : "#f0f0f0"}`,
                borderRadius: 14, padding: "10px 8px",
                textAlign: "center", cursor: "pointer", transition: ".2s",
              }}
            >
              <div style={{ fontSize: "1.2rem", marginBottom: 4 }}>{cfg.icon}</div>
              <div style={{
                fontWeight: 800, fontSize: ".68rem",
                color: isActive ? "white" : "#555",
                marginBottom: 4,
                lineHeight: 1.3,
              }}>
                {cfg.label_ar}
              </div>
              {/* شريط التقدم صغير */}
              <div style={{ background: isActive ? "rgba(255,255,255,.3)" : "#eee", borderRadius: 4, height: 4, overflow: "hidden" }}>
                <div style={{
                  width: `${stats.pct}%`,
                  height: "100%",
                  background: isActive ? "white" : colorPair.line,
                  borderRadius: 4,
                  transition: "width .8s ease",
                }} />
              </div>
              <div style={{
                fontSize: ".62rem",
                color: isActive ? "rgba(255,255,255,.8)" : "#aaa",
                marginTop: 3,
              }}>
                {stats.pct}%
              </div>
            </div>
          );
        })}
      </div>

      {/* ── الرسم البياني ── */}
      <div style={{
        background: "#fafafa", border: "1px solid #f0f0f0",
        borderRadius: 16, padding: 16,
        animation: "fadeUp .3s ease",
      }}>
        {/* Legend ديناميكي */}
        <div style={{ display: "flex", gap: 12, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
          {activeType === "overview" ? (
            <>
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: ".7rem", color: "#aaa" }}>
                <span style={{ width: 10, height: 10, background: "#27ae60", borderRadius: 2, display: "inline-block" }} />
                {isAr ? "≥80% ممتاز" : "≥80% Great"}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: ".7rem", color: "#aaa" }}>
                <span style={{ width: 10, height: 10, background: "#f39c12", borderRadius: 2, display: "inline-block" }} />
                {isAr ? "50-79% جيد" : "50-79% Good"}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: ".7rem", color: "#aaa" }}>
                <span style={{ width: 10, height: 10, background: "#e74c3c", borderRadius: 2, display: "inline-block" }} />
                {isAr ? "<50% يحتاج تحسين" : "<50% Needs work"}
              </span>
            </>
          ) : (
            <>
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: ".7rem", color: "#aaa" }}>
                <span style={{ width: 10, height: 10, background: ACTIVITY_COLORS[activeType]?.line || "#d68b9d", borderRadius: "50%", display: "inline-block" }} />
                {ACTIVITY_CONFIG[activeType]?.label_ar}
                {ACTIVITY_CONFIG[activeType]?.unit && ` (${ACTIVITY_CONFIG[activeType].unit})`}
              </span>
              {ACTIVITY_CONFIG[activeType]?.daily_goal && (
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: ".7rem", color: "#aaa" }}>
                  <span style={{ width: 16, height: 2, background: "#eab8c6", display: "inline-block", borderTop: "1px dashed #eab8c6" }} />
                  {isAr ? `الهدف: ${ACTIVITY_CONFIG[activeType].daily_goal} ${ACTIVITY_CONFIG[activeType].unit}` : `Goal: ${ACTIVITY_CONFIG[activeType].daily_goal} ${ACTIVITY_CONFIG[activeType].unit}`}
                </span>
              )}
            </>
          )}
        </div>

        {/* Canvas */}
        <div style={{ position: "relative", height: 200 }}>
          {activeType === "overview"
            ? <canvas ref={overviewRef} role="img" aria-label={isAr ? "رسم بياني للالتزام اليومي" : "Daily compliance chart"} />
            : <canvas ref={detailRef}   role="img" aria-label={`${ACTIVITY_CONFIG[activeType]?.label_ar || activeType} chart`} />
          }
        </div>

        {/* رسالة إذا لا يوجد بيانات */}
        {!(tracker.allLogs?.length > 0) && (
          <p style={{ textAlign: "center", color: "#ccc", fontSize: ".8rem", fontWeight: 700, marginTop: 12 }}>
            {isAr ? "سجّلي نشاطاتكِ اليومية لترسمي منحنيات تقدمكِ 🌱" : "Log daily activities to see your progress curves 🌱"}
          </p>
        )}
      </div>

      {/* ── جدول ملخص نسب الالتزام ── */}
      <div style={{ marginTop: 16, background: "white", borderRadius: 16, border: "1px solid #f0f0f0", overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0", fontWeight: 800, fontSize: ".88rem" }}>
          {isAr ? `ملخص الالتزام — ${period === "weekly" ? "آخر 7 أيام" : "آخر 30 يوم"}` : `Compliance summary — last ${period === "weekly" ? "7 days" : "30 days"}`}
        </div>
        {Object.entries(ACTIVITY_CONFIG).map(([type, cfg], i) => {
          const { logged, total, pct } = getActivityStats(type);
          const colorPair = ACTIVITY_COLORS[type] || { line: "#d68b9d" };
          return (
            <div
              key={type}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "11px 16px",
                borderBottom: i < Object.keys(ACTIVITY_CONFIG).length - 1 ? "1px solid #f9f9f9" : "none",
                cursor: "pointer", transition: ".2s",
              }}
              onClick={() => setActiveType(type)}
            >
              <span style={{ fontSize: "1.2rem", minWidth: 28 }}>{cfg.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: ".82rem", marginBottom: 3 }}>{cfg.label_ar}</div>
                <div style={{ background: "#f4f4f4", borderRadius: 6, height: 6, overflow: "hidden" }}>
                  <div style={{
                    width: `${pct}%`, height: "100%",
                    background: pct >= 80 ? "#27ae60" : pct >= 50 ? "#f39c12" : "#e74c3c",
                    borderRadius: 6, transition: "width 1s ease",
                  }} />
                </div>
              </div>
              <div style={{ textAlign: "right", minWidth: 52 }}>
                <div style={{ fontWeight: 900, fontSize: ".88rem", color: pct >= 80 ? "#27ae60" : pct >= 50 ? "#f39c12" : "#e74c3c" }}>
                  {pct}%
                </div>
                <div style={{ fontSize: ".65rem", color: "#aaa" }}>
                  {logged}/{total} {isAr ? "يوم" : "d"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HealthProgressCharts;