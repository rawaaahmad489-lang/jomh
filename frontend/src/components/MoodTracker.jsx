// src/components/MoodTracker.jsx
// ═══════════════════════════════════════════════════════════════════
// مكوّن تتبع المزاج الكامل — تسجيل + رسم بياني + إشعار ذكي
// ═══════════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from "react";
import { useMoodTracking } from "../core/hooks/useMoodTracking";

// ── تعريفات المزاج ────────────────────────────────────────────────
const MOOD_EN = [
  { key: "happy",   emoji: "😊", label: "Happy",   msg: "Your positive energy is beautiful! 🌟",           color: "#27ae60" },
  { key: "tired",   emoji: "😴", label: "Tired",   msg: "Take some time to rest ☕",                       color: "#f39c12" },
  { key: "anxious", emoji: "😔", label: "Anxious", msg: "We are always by your side ❤️",                   color: "#e67e22" },
  { key: "sad",     emoji: "😢", label: "Sad",     msg: "It's okay to have hard days. You're not alone 💛", color: "#e74c3c" },
];
const MOOD_AR = [
  { key: "سعيدة",  emoji: "😊", label: "سعيدة",  msg: "طاقتكِ الإيجابية تسعدنا! 🌟",              color: "#27ae60" },
  { key: "متعبة",  emoji: "😴", label: "متعبة",  msg: "خذي وقتاً للراحة ☕",                       color: "#f39c12" },
  { key: "قلقة",   emoji: "😔", label: "قلقة",   msg: "نحن بجانبكِ دوماً ❤️",                     color: "#e67e22" },
  { key: "حزينة",  emoji: "😢", label: "حزينة",  msg: "لا بأس بأيام صعبة. لستِ وحدك 💛",          color: "#e74c3c" },
];

// تحويل درجة المزاج إلى لون
const SCORE_COLORS = ["#e74c3c", "#e67e22", "#f39c12", "#27ae60"];
const scoreColor = (s) => SCORE_COLORS[Math.min(3, Math.max(0, Math.round(s)))];

// ══════════════════════════════════════════════════════════════════
// المكوّن الرئيسي
// ══════════════════════════════════════════════════════════════════
const MoodTracker = ({ userId, isAr, navigate }) => {
  const MOODS = isAr ? MOOD_AR : MOOD_EN;

  const {
    loading,
    moodHistory,
    todayMood,
    alertNeeded,
    alertDismissed,
    psychiatristDocs,
    logMood,
    sendMoodAlert,
    dismissAlert,
    buildMoodChartData,
    getMoodStats,
  } = useMoodTracking(userId);

  const [selectedIdx, setSelectedIdx] = useState(null);
  const [moodMsg,     setMoodMsg]     = useState("");
  const [showChart,   setShowChart]   = useState(false);
  const [saving,      setSaving]      = useState(false);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // مزامنة اختيار المزاج مع ما هو محفوظ اليوم
  useEffect(() => {
    if (todayMood) {
      const idx = MOODS.findIndex(m => m.key === todayMood.mood);
      if (idx !== -1) {
        setSelectedIdx(idx);
        setMoodMsg(MOODS[idx].msg);
      }
    }
  }, [todayMood]);

  // ── رسم الشارت ─────────────────────────────────────────────
  useEffect(() => {
    if (!showChart || !chartRef.current) return;
    if (typeof window.Chart === "undefined") return;

    if (chartInstance.current) chartInstance.current.destroy();

    const chartData = buildMoodChartData();
    const labels = chartData.map(d => d.label);
    const scores = chartData.map(d => d.score);
    const pointColors = scores.map(s => s === null ? "transparent" : scoreColor(s));
    const displayScores = scores.map(s => s === null ? NaN : s);

    chartInstance.current = new window.Chart(chartRef.current, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: isAr ? "المزاج اليومي" : "Daily Mood",
          data: displayScores,
          borderColor: "#d68b9d",
          backgroundColor: "rgba(214,139,157,0.08)",
          pointBackgroundColor: pointColors,
          pointBorderColor: pointColors,
          pointRadius: scores.map(s => s === null ? 0 : 5),
          pointHoverRadius: 7,
          fill: true,
          tension: 0.4,
          spanGaps: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const entry = chartData[ctx.dataIndex];
                if (!entry.emoji) return isAr ? "لم تُسجَّل" : "Not logged";
                const scoreLabels = isAr
                  ? ["حزينة 😢", "قلقة 😔", "متعبة 😴", "سعيدة 😊"]
                  : ["Sad 😢", "Anxious 😔", "Tired 😴", "Happy 😊"];
                return `${entry.emoji} ${scoreLabels[Math.round(ctx.parsed.y)] || ""}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: "#aaa",
              maxTicksLimit: 8,
              font: { size: 10 },
              maxRotation: 0,
            },
          },
          y: {
            min: -0.5,
            max: 3.5,
            grid: { color: "rgba(0,0,0,.04)" },
            ticks: {
              color: "#aaa",
              stepSize: 1,
              callback: (v) => {
                const labels = isAr
                  ? ["حزينة", "قلقة", "متعبة", "سعيدة"]
                  : ["Sad", "Anxious", "Tired", "Happy"];
                return labels[v] ?? "";
              },
              font: { size: 10 },
            },
          },
        },
      },
    });
  }, [showChart, moodHistory, isAr]);

  // ── تسجيل مزاج ─────────────────────────────────────────────
  const handleSelectMood = async (idx) => {
    const mood = MOODS[idx];
    setSelectedIdx(idx);
    setMoodMsg(mood.msg);
    setSaving(true);
    await logMood(mood.key, mood.emoji, mood.label);
    setSaving(false);
  };

  const stats = getMoodStats();

  // ── إشعار الطبيب النفسي ─────────────────────────────────────
  const handleAlertAction = async () => {
    const msg = isAr
      ? "لاحظنا أنكِ مررتِ بأوقات صعبة مؤخراً — قد يساعدكِ التحدث مع متخصص 💙"
      : "We noticed you've been going through tough times — talking to a specialist may help 💙";
    await sendMoodAlert(msg);
    if (navigate) navigate("/mother/doctors?specialization=نفس");
  };

  if (loading) return (
    <div className="card card-mood" style={{ minHeight: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 24, height: 24, borderRadius: "50%", border: "3px solid #fdf2f5", borderTopColor: "#d68b9d", animation: "spin .7s linear infinite" }} />
    </div>
  );

  return (
    <>
      {/* ── تحميل Chart.js ─────────────────────────────────── */}
      {showChart && (
        <script
          ref={el => {
            if (el && !window.Chart) {
              const s = document.createElement("script");
              s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
              s.onload = () => {
                // إعادة تشغيل useEffect
                const evt = new Event("chartjs-ready");
                window.dispatchEvent(evt);
              };
              document.head.appendChild(s);
            }
          }}
        />
      )}

      {/* ── تنبيه المزاج السيء ─────────────────────────────── */}
      {alertNeeded && !alertDismissed && (
        <div style={{
          background: "linear-gradient(135deg, #fff5f0, #fff0f5)",
          border: "1.5px solid #ffb8b8",
          borderRadius: 18,
          padding: "16px 20px",
          marginBottom: 16,
          position: "relative",
          animation: "fadeUp .5s ease",
        }}>
          <button
            onClick={dismissAlert}
            style={{ position: "absolute", top: 12, right: 14, background: "none", border: "none", fontSize: "1rem", color: "#ccc", cursor: "pointer" }}
          >
            ✕
          </button>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <span style={{ fontSize: "1.8rem" }}>💙</span>
            <div>
              <p style={{ fontWeight: 800, fontSize: ".92rem", color: "#c0392b", marginBottom: 6 }}>
                {isAr
                  ? "نحن نهتم بكِ — لاحظنا بعض الأيام الصعبة"
                  : "We care about you — we noticed some tough days"}
              </p>
              <p style={{ fontSize: ".82rem", color: "#888", lineHeight: 1.6, marginBottom: 12 }}>
                {isAr
                  ? "المزاج السيء لأيام متتالية قد يكون إشارة تستحق الاهتمام. التحدث مع متخصص يمكن أن يُحدث فرقاً كبيراً."
                  : "Persistent low moods may be worth addressing. Speaking with a specialist can make a real difference."}
              </p>

              {/* أطباء نفسيون */}
              {psychiatristDocs.length > 0 && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                  {psychiatristDocs.slice(0, 3).map(doc => (
                    <div
                      key={doc.doctor_id}
                      onClick={() => navigate && navigate(`/mother/doctors`)}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        background: "white", border: "1px solid #fde8e8",
                        borderRadius: 12, padding: "7px 12px", cursor: "pointer",
                        transition: ".2s",
                      }}
                    >
                      {doc.users?.avatar_url
                        ? <img src={doc.users.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
                        : <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#fdf2f5", color: "#d68b9d", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: ".75rem" }}>
                            {(doc.users?.name || "D").charAt(0)}
                          </div>}
                      <div>
                        <div style={{ fontWeight: 800, fontSize: ".75rem", color: "#2d2825" }}>{doc.users?.name}</div>
                        <div style={{ fontSize: ".65rem", color: "#d68b9d" }}>{doc.specialization}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={handleAlertAction}
                  style={{
                    background: "#d68b9d", color: "white", border: "none",
                    padding: "8px 16px", borderRadius: 12,
                    fontFamily: "inherit", fontWeight: 800, fontSize: ".8rem",
                    cursor: "pointer",
                  }}
                >
                  {isAr ? "التواصل مع طبيب ←" : "Contact a Doctor →"}
                </button>
                <button
                  onClick={dismissAlert}
                  style={{
                    background: "#f4f4f4", color: "#888", border: "none",
                    padding: "8px 16px", borderRadius: 12,
                    fontFamily: "inherit", fontWeight: 700, fontSize: ".8rem",
                    cursor: "pointer",
                  }}
                >
                  {isAr ? "شكراً، أنا بخير" : "I'm okay, thanks"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── كارد المزاج الرئيسي ────────────────────────────── */}
      <div className="card card-mood">
        <div className="card-header">
          <h3>
            <div className="card-icon"><i className="fas fa-spa" /></div>
            {isAr ? "كيف تشعرين الآن؟" : "How are you feeling?"}
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {saving && (
              <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #fdf2f5", borderTopColor: "#d68b9d", animation: "spin .7s linear infinite" }} />
            )}
            {/* زر عرض الرسم البياني */}
            <button
              className="card-action-btn"
              onClick={() => setShowChart(s => !s)}
              title={isAr ? "عرض السجل" : "Show history"}
            >
              <i className={`fas fa-${showChart ? "times" : "chart-line"}`} />
            </button>
          </div>
        </div>

        {/* اختيار المزاج */}
        <div className="mood-selector">
          {MOODS.map((mood, i) => (
            <div
              key={i}
              className={`mood-item ${selectedIdx === i ? "active" : ""}`}
              onClick={() => handleSelectMood(i)}
            >
              <span>{mood.emoji}</span>
              <p>{mood.label}</p>
              {selectedIdx === i && todayMood && (
                <div style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: mood.color, margin: "4px auto 0",
                }} />
              )}
            </div>
          ))}
        </div>

        {moodMsg && <div className="mood-message">{moodMsg}</div>}

        {/* تاريخ آخر تسجيل */}
        {todayMood && (
          <div style={{ textAlign: "center", fontSize: ".7rem", color: "#bbb", marginTop: 8, fontWeight: 600 }}>
            {isAr ? "✓ سُجّل اليوم" : "✓ Logged today"}
            {" • "}
            {new Date(todayMood.created_at).toLocaleTimeString(isAr ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}
          </div>
        )}

        {/* ── الرسم البياني ──────────────────────────────────── */}
        {showChart && (
          <div style={{ marginTop: 16, animation: "fadeUp .4s ease" }}>
            {/* إحصائيات سريعة */}
            {stats && (
              <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                <div style={{
                  flex: 1, background: "#fafafa", borderRadius: 12,
                  padding: "10px 12px", border: "1px solid #f0f0f0",
                  textAlign: "center", minWidth: 80,
                }}>
                  <div style={{ fontWeight: 900, fontSize: "1.1rem", color: "#d68b9d" }}>
                    {moodHistory.length}
                  </div>
                  <div style={{ fontSize: ".65rem", color: "#aaa" }}>
                    {isAr ? "يوم مسجّل" : "Days logged"}
                  </div>
                </div>
                <div style={{
                  flex: 1, background: "#fafafa", borderRadius: 12,
                  padding: "10px 12px", border: "1px solid #f0f0f0",
                  textAlign: "center", minWidth: 80,
                }}>
                  <div style={{ fontWeight: 900, fontSize: "1.1rem", color: scoreColor(stats.avgScore) }}>
                    {(parseFloat(stats.avgScore) / 3 * 100).toFixed(0)}%
                  </div>
                  <div style={{ fontSize: ".65rem", color: "#aaa" }}>
                    {isAr ? "متوسط المزاج" : "Avg mood"}
                  </div>
                </div>
                <div style={{
                  flex: 1, background: "#fafafa", borderRadius: 12,
                  padding: "10px 12px", border: "1px solid #f0f0f0",
                  textAlign: "center", minWidth: 80,
                }}>
                  <div style={{ fontWeight: 900, fontSize: "1.1rem", color: "#2d2825" }}>
                    {stats.counts["happy"] || stats.counts["سعيدة"] || 0}
                  </div>
                  <div style={{ fontSize: ".65rem", color: "#aaa" }}>
                    {isAr ? "يوم سعيد 😊" : "Happy days 😊"}
                  </div>
                </div>
              </div>
            )}

            {/* Chart */}
            <div style={{ background: "#fafafa", borderRadius: 14, padding: "14px", border: "1px solid #f0f0f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <p style={{ fontWeight: 800, fontSize: ".82rem", color: "#555" }}>
                  {isAr ? "مزاجكِ خلال آخر 30 يوم" : "Your mood over the last 30 days"}
                </p>
                {/* Legend */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[
                    { color: "#27ae60", label: isAr ? "سعيدة" : "Happy" },
                    { color: "#f39c12", label: isAr ? "متعبة" : "Tired" },
                    { color: "#e67e22", label: isAr ? "قلقة" : "Anxious" },
                    { color: "#e74c3c", label: isAr ? "حزينة" : "Sad" },
                  ].map(item => (
                    <span key={item.label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: ".65rem", color: "#aaa" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: item.color, display: "inline-block" }} />
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ position: "relative", height: 160 }}>
                <canvas
                  ref={chartRef}
                  role="img"
                  aria-label={isAr ? "رسم بياني لمزاج الأم خلال 30 يوماً" : "Mood chart over 30 days"}
                />
              </div>
              {moodHistory.length === 0 && (
                <p style={{ textAlign: "center", color: "#ccc", fontSize: ".8rem", fontWeight: 700, marginTop: 12 }}>
                  {isAr ? "سجّلي مزاجكِ يومياً لترسمي رحلتكِ 🌱" : "Log your mood daily to build your journey 🌱"}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MoodTracker;