// src/pages/mother/ChildDetailPage.jsx
import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../../../services/supabaseClient";
import { useChildData } from "../../../core/hooks/useChildData";
import { printChildReport } from "../../../utils/printChildReport";
import UnifiedNavbar from "../../../components/UnifiedNavbar";
// ─── Helpers ───────────────────────────────
function ageInMonths(birthDate) {
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  const now = new Date();
  return (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth();
}
function ageFull(birthDate, isAr) {
  if (!birthDate) return "—";
  const months = ageInMonths(birthDate);
  const years = Math.floor(months / 12);
  const rem = months % 12;
  const b = new Date(birthDate);
  const days = Math.floor((new Date() - b) % (1000 * 60 * 60 * 24 * 30.44) / (1000 * 60 * 60 * 24));
  if (isAr) {
    if (years > 0) return `${years} سنة ${rem > 0 ? `و ${rem} شهر` : ""}`;
    return `${months} شهر${days > 0 ? ` و${days} يوم` : ""}`;
  }
  if (years > 0) return `${years} yr${years > 1 ? "s" : ""} ${rem > 0 ? `${rem} mo` : ""}`.trim();
  return `${months} month${months !== 1 ? "s" : ""}${days > 0 ? ` ${days}d` : ""}`;
}
function fmt(dateStr, isAr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(isAr ? "ar-SA" : "en-US", { year: "numeric", month: "short", day: "numeric" });
}

const GENDER_EMOJI = { male: "👦", female: "👧" };
const EVENT_ICONS = {
  vaccination: "💉", disease: "🤒", allergy: "⚠️", checkup: "🔍", growth: "📏",
};

// ─── Mini Line Chart (SVG) ──────────────────
const MiniLineChart = ({ data, label, color = "#d68b9d", unit = "" }) => {
  if (!data || data.length === 0) return (
    <div style={{ textAlign: "center", padding: "30px 0", color: "#ccc", fontSize: ".85rem" }}>
      No data yet
    </div>
  );

  const values = data.map((d) => d.value).filter((v) => v != null);
  if (values.length === 0) return null;

  const min = Math.min(...values) * 0.95;
  const max = Math.max(...values) * 1.05;
  const W = 300, H = 120, PAD = 15;

  const toX = (i) => PAD + (i / (data.length - 1 || 1)) * (W - PAD * 2);
  const toY = (v) => H - PAD - ((v - min) / (max - min || 1)) * (H - PAD * 2);

  const points = data.map((d, i) => `${toX(i)},${toY(d.value)}`).join(" ");
  const areaPoints = `${PAD},${H - PAD} ${points} ${toX(data.length - 1)},${H - PAD}`;

  const latest = data[data.length - 1];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <span style={{ fontSize: ".8rem", fontWeight: 700, color: "#777" }}>{label}</span>
        <span style={{ fontSize: "1.3rem", fontWeight: 800, color }}>
          {latest?.value} <span style={{ fontSize: ".75rem", fontWeight: 600, color: "#aaa" }}>{unit}</span>
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 100 }}>
        <defs>
          <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill={`url(#grad-${label})`} />
        <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => (
          <circle key={i} cx={toX(i)} cy={toY(d.value)} r={i === data.length - 1 ? 5 : 3} fill="white" stroke={color} strokeWidth="2" />
        ))}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        {data.map((d, i) => (
          <span key={i} style={{ fontSize: ".65rem", color: "#aaa", fontWeight: 600 }}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ─────────────────────────
const ChildDetailPage = () => {
  const { childId } = useParams();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isAr = i18n.language === "ar";
  const dir = isAr ? "rtl" : "ltr";

const {
    loading, child, growthRecords, medicalEvents, medicalFiles,
    sleepRecords, feedingRecords, appointments, healthSummary,
    dailySummary,
    refetch,
  } = useChildData(childId);

  const [activeTab, setActiveTab] = useState("overview");
  const [addGrowthOpen, setAddGrowthOpen] = useState(false);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const fileRef = useRef(null);

  // ── Growth chart data
  const weightData = growthRecords
    .filter((r) => r.weight)
    .slice(-6)
    .map((r) => ({ value: parseFloat(r.weight), label: fmt(r.recorded_at, isAr).slice(0, 6) }));

  const heightData = growthRecords
    .filter((r) => r.height)
    .slice(-6)
    .map((r) => ({ value: parseFloat(r.height), label: fmt(r.recorded_at, isAr).slice(0, 6) }));

  // ── Upload medical file
 const ALLOWED_TYPES = {
  // صور
  'image/jpeg': { icon: '🖼️', label: 'صورة' },
  'image/jpg':  { icon: '🖼️', label: 'صورة' },
  'image/png':  { icon: '🖼️', label: 'صورة' },
  'image/gif':  { icon: '🖼️', label: 'صورة' },
  'image/webp': { icon: '🖼️', label: 'صورة' },
  'image/tiff': { icon: '🖼️', label: 'صورة' },
  'image/bmp':  { icon: '🖼️', label: 'صورة' },
  // فيديو
  'video/mp4':       { icon: '🎥', label: 'فيديو' },
  'video/quicktime': { icon: '🎥', label: 'فيديو' },
  'video/mpeg':      { icon: '🎥', label: 'فيديو' },
  'video/webm':      { icon: '🎥', label: 'فيديو' },
  'video/3gpp':      { icon: '🎥', label: 'فيديو' },
  'video/x-msvideo': { icon: '🎥', label: 'فيديو' },
  // PDF
  'application/pdf': { icon: '📄', label: 'PDF' },
  // Word
  'application/msword': { icon: '📝', label: 'Word' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: '📝', label: 'Word' },
  // Excel
  'application/vnd.ms-excel': { icon: '📊', label: 'Excel' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: '📊', label: 'Excel' },
  // DICOM (أشعة طبية)
  'application/dicom': { icon: '🩻', label: 'أشعة' },
  // صوت
  'audio/mpeg': { icon: '🎵', label: 'صوت' },
  'audio/wav':  { icon: '🎵', label: 'صوت' },
  // نصي
  'text/plain': { icon: '📃', label: 'نص' },
  // ZIP
  'application/zip': { icon: '🗜️', label: 'مضغوط' },
};
 
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
 
// ── handleFileUpload المحسّنة ──────────────────────────────────
const handleFileUpload = async (e) => {
  const files = Array.from(e.target.files);
  if (!files.length || !child) return;
  setFileUploading(true);
  const errors = [];

  try {
    const { data: { user } } = await supabase.auth.getUser();

    for (const file of files) {
      if (file.size > 100 * 1024 * 1024) {
        errors.push(`${file.name}: ${isAr ? "الحجم أكبر من 100MB" : "Exceeds 100MB"}`);
        continue;
      }

      const fileExt  = file.name.split(".").pop();
      const storagePath = `${user.id}/${childId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;

      const { error: upErr } = await supabase.storage
        .from("medical-files")
        .upload(storagePath, file, { cacheControl: "3600", upsert: false });

      if (upErr) {
        errors.push(`${file.name}: ${upErr.message}`);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("medical-files")
        .getPublicUrl(storagePath);

      // ✅ الأعمدة مطابقة تماماً لجدول child_medical_files
      const { error: dbErr } = await supabase
        .from("child_medical_files")
        .insert({
          child_id:     childId,
          file_name:    file.name,
          file_type:    file.type,
          file_url:     urlData.publicUrl,
          storage_path: storagePath,
          file_size:    file.size,
          description:  null,
        });

      if (dbErr) {
        errors.push(`${file.name}: ${dbErr.message}`);
      }
    }

    if (errors.length > 0) {
      alert((isAr ? "بعض الملفات لم ترفع:\n" : "Some files failed:\n") + errors.join("\n"));
    }
    refetch();
  } catch (err) {
    alert(isAr ? "خطأ: " + err.message : "Error: " + err.message);
  } finally {
    setFileUploading(false);
    e.target.value = "";
  }
};

  if (loading) return (
    <div className="dash-loading"><div className="dash-spinner" /><p style={{ color: "#d68b9d", marginTop: 14, fontWeight: 700 }}>{isAr ? "جارٍ التحميل..." : "Loading..."}</p></div>
  );

  if (!child) return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <p>{isAr ? "لم يتم العثور على الطفل" : "Child not found"}</p>
      <button className="btn-primary" style={{ marginTop: 15 }} onClick={() => navigate("/mother/dashboard")}>
        {isAr ? "العودة" : "Go Back"}
      </button>
    </div>
  );

  const months = ageInMonths(child.birth_date);

  const TABS = [
    { key: "overview", label: isAr ? "نظرة عامة" : "Overview", icon: "fas fa-th-large" },
    { key: "growth", label: isAr ? "النمو" : "Growth", icon: "fas fa-chart-line" },
    { key: "feeding", label: isAr ? "الرضاعة" : "Feeding", icon: "fas fa-baby-carriage" },
    { key: "sleep", label: isAr ? "النوم" : "Sleep", icon: "fas fa-moon" },
    { key: "medical", label: isAr ? "الصحة" : "Medical", icon: "fas fa-heartbeat" },
    { key: "files", label: isAr ? "الملفات" : "Files", icon: "fas fa-folder-open" },
    { key: "appointments", label: isAr ? "المواعيد" : "Appointments", icon: "fas fa-calendar-alt" },
  ];

  return (
    <div className="child-detail-root" dir={dir}>
      <style>{CHILD_CSS}</style>

<UnifiedNavbar
  isAr={isAr}
  onBack={() => navigate("/mother/dashboard")}
  pageTitle={child?.name || (isAr ? "تفاصيل الطفل" : "Child Detail")}
  actions={[{
    label: isAr ? "طباعة التقرير" : "Print Report",
    icon: "fas fa-print",
    onClick: () => printChildReport({
      child,
      growthRecords,
      medicalEvents,
      medicalFiles,
      sleepRecords,
      feedingRecords,
      appointments,
      dailySummary,
      healthSummary,
      isAr,
    })
  }]}
/>

      {/* Child Hero */}
      <div className="child-hero">
        <div className="child-hero-avatar">
          {GENDER_EMOJI[child.gender] || "👶"}
        </div>
        <div className="child-hero-info">
          <h1>{child.name}</h1>
          <div className="child-hero-meta">
            <span><i className="fas fa-birthday-cake" /> {fmt(child.birth_date, isAr)}</span>
            <span><i className="fas fa-clock" /> {ageFull(child.birth_date, isAr)}</span>
            {child.blood_type && <span><i className="fas fa-tint" /> {child.blood_type}</span>}
            {child.feeding_method && (
              <span>
                <i className="fas fa-baby-carriage" />
                {isAr
                  ? { breastfeeding: "رضاعة طبيعية", formula: "حليب صناعي", mixed: "مختلطة" }[child.feeding_method]
                  : child.feeding_method.replace("_", " ")}
              </span>
            )}
          </div>
          {child.milestones && (
            <div className="child-milestone-badge">
              <i className="fas fa-star" />
              {isAr ? "المرحلة الحالية: " : "Current Stage: "}{child.milestones.stage_name}
            </div>
          )}
        </div>
        <div className="child-hero-stats">
          {growthRecords.length > 0 && (() => {
            const latest = growthRecords[growthRecords.length - 1];
            return (
              <>
                {latest.weight && (
                  <div className="hero-stat">
                    <span className="hero-stat-val">{latest.weight}</span>
                    <span className="hero-stat-unit">kg</span>
                    <span className="hero-stat-lbl">{isAr ? "الوزن" : "Weight"}</span>
                  </div>
                )}
                {latest.height && (
                  <div className="hero-stat">
                    <span className="hero-stat-val">{latest.height}</span>
                    <span className="hero-stat-unit">cm</span>
                    <span className="hero-stat-lbl">{isAr ? "الطول" : "Height"}</span>
                  </div>
                )}
              </>
            );
          })()}
          <div className="hero-stat">
            <span className="hero-stat-val">{months}</span>
            <span className="hero-stat-unit">{isAr ? "ش" : "mo"}</span>
            <span className="hero-stat-lbl">{isAr ? "العمر" : "Age"}</span>
          </div>
        </div>
      </div>

      {/* Daily Health Summary */}
      {healthSummary && (
        <div className="daily-summary-bar">
          <div className="ds-item">
            <i className="fas fa-moon" />
            <div>
              <span className="ds-val">{Math.round((healthSummary.total_sleep_minutes || 0) / 60)}h</span>
              <span className="ds-lbl">{isAr ? "نوم اليوم" : "Today's Sleep"}</span>
            </div>
          </div>
          <div className="ds-item">
            <i className="fas fa-baby-carriage" />
            <div>
              <span className="ds-val">{healthSummary.total_feeding_sessions || 0}</span>
              <span className="ds-lbl">{isAr ? "جلسات رضاعة" : "Feedings"}</span>
            </div>
          </div>
          <div className="ds-item">
            <i className="fas fa-tint" />
            <div>
              <span className="ds-val">{healthSummary.total_milk_ml || 0}</span>
              <span className="ds-lbl">{isAr ? "مل حليب" : "ml Milk"}</span>
            </div>
          </div>
          <div className="ds-item">
            <i className="fas fa-star" />
            <div>
              <span className="ds-val">{healthSummary.avg_sleep_quality || "—"}</span>
              <span className="ds-lbl">{isAr ? "جودة النوم" : "Sleep Quality"}</span>
            </div>
          </div>
        </div>
      )}



<DailySummarySection dailySummary={dailySummary} isAr={isAr} />
      {/* Tabs */}
      <div className="child-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`child-tab ${activeTab === t.key ? "active" : ""}`}
            onClick={() => setActiveTab(t.key)}
          >
            <i className={t.icon} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>



      {/* Tab Content */}
      <div className="child-content">


        {/* ═══ OVERVIEW TAB ═══ */}
        {activeTab === "overview" && (
          <div className="tab-grid">
            {/* Growth Charts */}
            <div className="detail-card">
              <div className="detail-card-header">
                <h3><i className="fas fa-chart-line" /> {isAr ? "منحنى النمو" : "Growth Chart"}</h3>
                <button className="card-action-btn" onClick={() => setActiveTab("growth")}>
                  {isAr ? "عرض الكل" : "View All"} →
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <MiniLineChart
                  data={weightData}
                  label={isAr ? "الوزن" : "Weight"}
                  color="#d68b9d"
                  unit="kg"
                />
                <MiniLineChart
                  data={heightData}
                  label={isAr ? "الطول" : "Height"}
                  color="#eab8c6"
                  unit="cm"
                />
              </div>
            </div>

            {/* Recent Medical Events */}
            <div className="detail-card">
              <div className="detail-card-header">
                <h3><i className="fas fa-heartbeat" /> {isAr ? "آخر الأحداث الطبية" : "Recent Medical Events"}</h3>
                <button className="card-action-btn" onClick={() => { setAddEventOpen(true); }}>
                  <i className="fas fa-plus" />
                </button>
              </div>
              {medicalEvents.length === 0 ? (
                <div className="empty-state-sm">{isAr ? "لا توجد أحداث طبية مسجلة" : "No medical events recorded"}</div>
              ) : (
                <ul className="event-list">
                  {medicalEvents.slice(0, 4).map((ev) => (
                    <li key={ev.event_id} className="event-item">
                      <span className="event-icon">{EVENT_ICONS[ev.event_type] || "📋"}</span>
                      <div className="event-info">
                        <h4>{ev.title}</h4>
                        <p>{fmt(ev.event_date, isAr)}</p>
                      </div>
                      <span className={`event-badge badge-${ev.event_type}`}>
                        {isAr
                          ? { vaccination: "تطعيم", disease: "مرض", allergy: "حساسية", checkup: "فحص", growth: "نمو" }[ev.event_type]
                          : ev.event_type}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Today's Feeding */}
            <div className="detail-card">
              <div className="detail-card-header">
                <h3><i className="fas fa-baby-carriage" /> {isAr ? "رضاعة اليوم" : "Today's Feedings"}</h3>
                <button className="card-action-btn" onClick={() => setActiveTab("feeding")}>
                  {isAr ? "عرض الكل" : "View All"} →
                </button>
              </div>
              {feedingRecords.filter((f) => {
                const today = new Date().toDateString();
                return new Date(f.feeding_time).toDateString() === today;
              }).length === 0 ? (
                <div className="empty-state-sm">{isAr ? "لا توجد سجلات رضاعة اليوم" : "No feeding records today"}</div>
              ) : (
                <ul className="feeding-list">
                  {feedingRecords
                    .filter((f) => new Date(f.feeding_time).toDateString() === new Date().toDateString())
                    .slice(0, 4)
                    .map((f) => (
                      <li key={f.feeding_id} className="feeding-item">
                        <span className="feeding-time-badge">
                          {new Date(f.feeding_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className={`feeding-type-badge ftype-${f.feeding_type}`}>
                          {isAr
                            ? { breastfeeding: "🤱 طبيعية", formula: "🍼 صناعي", solid_food: "🥣 صلب" }[f.feeding_type]
                            : f.feeding_type.replace("_", " ")}
                        </span>
                        {f.duration_minutes && (
                          <span className="feeding-meta">{f.duration_minutes} {isAr ? "د" : "min"}</span>
                        )}
                        {f.quantity_ml && (
                          <span className="feeding-meta">{f.quantity_ml} {isAr ? "مل" : "ml"}</span>
                        )}
                      </li>
                    ))}
                </ul>
              )}
            </div>

            {/* Sleep Summary */}
            <div className="detail-card">
              <div className="detail-card-header">
                <h3><i className="fas fa-moon" /> {isAr ? "نوم الأسبوع" : "This Week's Sleep"}</h3>
                <button className="card-action-btn" onClick={() => setActiveTab("sleep")}>
                  {isAr ? "عرض الكل" : "View All"} →
                </button>
              </div>
              {sleepRecords.length === 0 ? (
                <div className="empty-state-sm">{isAr ? "لا توجد سجلات نوم" : "No sleep records"}</div>
              ) : (
                <ul className="sleep-list">
                  {sleepRecords.slice(0, 4).map((s) => {
                    const hrs = Math.floor(s.sleep_duration_minutes / 60);
                    const mins = s.sleep_duration_minutes % 60;
                    return (
                      <li key={s.sleep_id} className="sleep-item">
                        <div className="sleep-duration">
                          <span>{hrs}h {mins}m</span>
                          <span className={`sleep-quality sq-${s.sleep_quality}`}>{s.sleep_quality}</span>
                        </div>
                        <div className="sleep-times">
                          <span>
                            {new Date(s.sleep_start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            {" → "}
                            {new Date(s.sleep_end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span>{fmt(s.sleep_start, isAr)}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Milestones */}
            {child.milestones && (
              <div className="detail-card card-full">
                <div className="detail-card-header">
                  <h3><i className="fas fa-route" /> {isAr ? "المرحلة العمرية الحالية" : "Current Developmental Stage"}</h3>
                </div>
                <div className="milestone-detail-box">
                  <div className="milestone-detail-header">
                    <span className="milestone-stage-icon">🌟</span>
                    <div>
                      <h4>{child.milestones.stage_name}</h4>
                      <p>
                        {isAr ? "من " : "From "}
                        {child.milestones.min_age_months}
                        {isAr ? " إلى " : " to "}
                        {child.milestones.max_age_months}
                        {isAr ? " شهر" : " months"}
                      </p>
                    </div>
                  </div>
                  {child.milestones.description && (
                    <p className="milestone-desc">{child.milestones.description}</p>
                  )}
                  <div className="milestone-progress">
                    <div className="progress-bar-wrapper">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${Math.min(100, ((months - child.milestones.min_age_months) / (child.milestones.max_age_months - child.milestones.min_age_months)) * 100)}%`
                        }}
                      />
                    </div>
                    <span className="progress-label">
                      {Math.round(Math.min(100, ((months - child.milestones.min_age_months) / (child.milestones.max_age_months - child.milestones.min_age_months)) * 100))}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ GROWTH TAB ═══ */}
        {activeTab === "growth" && (
          <div>
            <div className="tab-toolbar">
              <button className="btn-primary" onClick={() => setAddGrowthOpen(true)}>
                <i className="fas fa-plus" /> {isAr ? "تسجيل قياس جديد" : "Add Growth Record"}
              </button>
            </div>
            {growthRecords.length === 0 ? (
              <div className="empty-full">
                <span>📏</span>
                <p>{isAr ? "لا توجد قياسات مسجلة بعد" : "No growth records yet"}</p>
              </div>
            ) : (
              <>
                <div className="growth-charts-grid">
                  <div className="detail-card">
                    <h3 className="chart-title"><i className="fas fa-weight" /> {isAr ? "منحنى الوزن" : "Weight Curve"}</h3>
                    <MiniLineChart data={weightData} label="Weight (kg)" color="#d68b9d" unit="kg" />
                  </div>
                  <div className="detail-card">
                    <h3 className="chart-title"><i className="fas fa-ruler-vertical" /> {isAr ? "منحنى الطول" : "Height Curve"}</h3>
                    <MiniLineChart data={heightData} label="Height (cm)" color="#eab8c6" unit="cm" />
                  </div>
                </div>
                <div className="detail-card" style={{ marginTop: 20 }}>
                  <div className="detail-card-header">
                    <h3><i className="fas fa-table" /> {isAr ? "سجل القياسات" : "All Records"}</h3>
                  </div>
                  <div className="growth-table-wrap">
                    <table className="growth-table">
                      <thead>
                        <tr>
                          <th>{isAr ? "التاريخ" : "Date"}</th>
                          <th>{isAr ? "الوزن" : "Weight"}</th>
                          <th>{isAr ? "الطول" : "Height"}</th>
                          <th>{isAr ? "محيط الرأس" : "Head"}</th>
                          <th>{isAr ? "ملاحظات" : "Notes"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...growthRecords].reverse().map((r) => (
                          <tr key={r.record_id}>
                            <td>{fmt(r.recorded_at, isAr)}</td>
                            <td>{r.weight ? `${r.weight} kg` : "—"}</td>
                            <td>{r.height ? `${r.height} cm` : "—"}</td>
                            <td>{r.head_circumference ? `${r.head_circumference} cm` : "—"}</td>
                            <td>{r.notes || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══ FEEDING TAB ═══ */}
        {activeTab === "feeding" && (
          <div>
            <div className="detail-card">
              <div className="detail-card-header">
                <h3><i className="fas fa-baby-carriage" /> {isAr ? "سجل الرضاعة (3 أيام)" : "Feeding Records (3 days)"}</h3>
              </div>
              {feedingRecords.length === 0 ? (
                <div className="empty-state-sm">{isAr ? "لا توجد سجلات رضاعة" : "No feeding records"}</div>
              ) : (
                <ul>
                  {feedingRecords.map((f) => (
                    <li key={f.feeding_id} className="feeding-detail-item">
                      <div className="feeding-time-col">
                        <span>{new Date(f.feeding_time).toLocaleDateString(isAr ? "ar-SA" : "en-US", { weekday: "short" })}</span>
                        <strong>{new Date(f.feeding_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</strong>
                      </div>
                      <div className="feeding-detail-info">
                        <span className={`feeding-type-badge ftype-${f.feeding_type}`}>
                          {isAr
                            ? { breastfeeding: "🤱 رضاعة طبيعية", formula: "🍼 حليب صناعي", solid_food: "🥣 طعام صلب" }[f.feeding_type]
                            : f.feeding_type.replace("_", " ")}
                        </span>
                        {f.duration_minutes && (
                          <span className="feeding-meta">{f.duration_minutes} {isAr ? "دقيقة" : "min"}</span>
                        )}
                        {f.quantity_ml && (
                          <span className="feeding-meta">{f.quantity_ml} {isAr ? "مل" : "ml"}</span>
                        )}
                        {f.baby_response && (
                          <span className={`response-badge resp-${f.baby_response}`}>
                            {isAr
                              ? { hungry: "جائع", satisfied: "مكتفٍ", refused: "رفض" }[f.baby_response]
                              : f.baby_response}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* ═══ SLEEP TAB ═══ */}
        {activeTab === "sleep" && (
          <div>
            <div className="detail-card">
              <div className="detail-card-header">
                <h3><i className="fas fa-moon" /> {isAr ? "سجل النوم (7 أيام)" : "Sleep Records (7 days)"}</h3>
              </div>
              {sleepRecords.length === 0 ? (
                <div className="empty-state-sm">{isAr ? "لا توجد سجلات نوم" : "No sleep records"}</div>
              ) : (
                <ul className="sleep-detail-list">
                  {sleepRecords.map((s) => {
                    const hrs = Math.floor(s.sleep_duration_minutes / 60);
                    const mins = s.sleep_duration_minutes % 60;
                    const qualityColors = { excellent: "#2ecc71", good: "#27ae60", average: "#f39c12", poor: "#e74c3c" };
                    return (
                      <li key={s.sleep_id} className="sleep-detail-item">
                        <div className="sleep-date-col">
                          {new Date(s.sleep_start).toLocaleDateString(isAr ? "ar-SA" : "en-US", { weekday: "short", day: "numeric", month: "short" })}
                        </div>
                        <div className="sleep-detail-info">
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span className="sleep-dur-big">{hrs}h {mins}m</span>
                            <span
                              style={{
                                background: qualityColors[s.sleep_quality] + "22",
                                color: qualityColors[s.sleep_quality],
                                padding: "3px 10px", borderRadius: 20, fontSize: ".75rem", fontWeight: 700,
                              }}
                            >
                              {isAr
                                ? { excellent: "ممتاز", good: "جيد", average: "متوسط", poor: "ضعيف" }[s.sleep_quality]
                                : s.sleep_quality}
                            </span>
                          </div>
                          <div className="sleep-time-range">
                            {new Date(s.sleep_start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            {" — "}
                            {new Date(s.sleep_end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            {s.sleep_type === "nap" && (
                              <span style={{ marginInlineStart: 8, fontSize: ".72rem", color: "#9b59b6", fontWeight: 700 }}>
                                {isAr ? "قيلولة" : "Nap"}
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* ═══ MEDICAL TAB ═══ */}
        {activeTab === "medical" && (
          <div>
            <div className="tab-toolbar">
              <button className="btn-primary" onClick={() => setAddEventOpen(true)}>
                <i className="fas fa-plus" /> {isAr ? "إضافة حدث طبي" : "Add Medical Event"}
              </button>
            </div>
            {medicalEvents.length === 0 ? (
              <div className="empty-full">
                <span>💉</span>
                <p>{isAr ? "لا توجد أحداث طبية مسجلة" : "No medical events recorded"}</p>
              </div>
            ) : (
              <div className="medical-timeline">
                {medicalEvents.map((ev) => (
                  <div key={ev.event_id} className="medical-event-card">
                    <div className="me-icon">{EVENT_ICONS[ev.event_type] || "📋"}</div>
                    <div className="me-content">
                      <div className="me-header">
                        <h4>{ev.title}</h4>
                        <span className={`event-badge badge-${ev.event_type}`}>
                          {isAr
                            ? { vaccination: "تطعيم", disease: "مرض", allergy: "حساسية", checkup: "فحص", growth: "نمو" }[ev.event_type]
                            : ev.event_type}
                        </span>
                      </div>
                      {ev.description && <p className="me-desc">{ev.description}</p>}
                      <span className="me-date">{fmt(ev.event_date, isAr)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ FILES TAB ═══ */}
{activeTab === "files" && (
  <div>
    {/* ── Toolbar ── */}
    <div className="tab-toolbar" style={{ flexWrap: "wrap", gap: 10 }}>
      <input
        type="file"
        ref={fileRef}
        style={{ display: "none" }}
        multiple
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.dcm,.zip,.txt,application/dicom"
        onChange={handleFileUpload}
      />
      <button
        className="btn-primary"
        onClick={() => fileRef.current?.click()}
        disabled={fileUploading}
      >
        {fileUploading
          ? <><i className="fas fa-spinner fa-spin" /> {isAr ? "جارٍ الرفع..." : "Uploading..."}</>
          : <><i className="fas fa-upload" /> {isAr ? "رفع ملفات طبية" : "Upload Medical Files"}</>}
      </button>
      <div style={{
        background: "#f0faf4", borderRadius: 10, padding: "8px 14px",
        fontSize: ".75rem", color: "#2ecc71", fontWeight: 700,
        display: "flex", alignItems: "center", gap: 6,
      }}>
        <i className="fas fa-info-circle" />
        {isAr
          ? "يُقبل: صور، فيديو، PDF، Word، Excel، أشعة DICOM (حتى 100MB)"
          : "Accepted: Images, Video, PDF, Word, Excel, DICOM (up to 100MB)"}
      </div>
    </div>

    {medicalFiles.length === 0 ? (
      <div className="empty-full">
        <span>📁</span>
        <p style={{ marginBottom: 8 }}>
          {isAr ? "لا توجد ملفات طبية بعد" : "No medical files yet"}
        </p>
        <p style={{ fontSize: ".82rem", color: "#bbb" }}>
          {isAr
            ? "ارفعي صور الأشعة، التقارير الطبية، فيديوهات المتابعة، وأي ملفات طبية أخرى"
            : "Upload X-rays, medical reports, follow-up videos, and any other medical files"}
        </p>
      </div>
    ) : (
      <>
        {/* إحصاء سريع */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {[
            { key: "image",    icon: "🖼️", arLabel: "صور",      enLabel: "Images",    check: t => t?.startsWith("image/") },
            { key: "video",    icon: "🎥", arLabel: "فيديو",    enLabel: "Videos",    check: t => t?.startsWith("video/") },
            { key: "audio",    icon: "🎵", arLabel: "صوت",      enLabel: "Audio",     check: t => t?.startsWith("audio/") },
            { key: "pdf",      icon: "📄", arLabel: "PDF",      enLabel: "PDF",       check: t => t === "application/pdf" },
            { key: "document", icon: "📝", arLabel: "مستندات",  enLabel: "Documents", check: t => t?.includes("word") || t?.includes("excel") || t?.includes("sheet") },
            { key: "dicom",    icon: "🩻", arLabel: "أشعة",    enLabel: "DICOM",     check: t => t === "application/dicom" },
          ].map(cat => {
            const count = medicalFiles.filter(f => cat.check(f.file_type)).length;
            if (!count) return null;
            return (
              <span key={cat.key} style={{
                background: "#f4f4f4", borderRadius: 20, padding: "4px 12px",
                fontSize: ".75rem", fontWeight: 700, color: "#666",
              }}>
                {cat.icon} {isAr ? cat.arLabel : cat.enLabel} ({count})
              </span>
            );
          })}
        </div>

        {/* شبكة الملفات */}
        <div className="files-grid">
          {medicalFiles.map((f) => {
            const getIcon = (type) => {
              if (!type) return "📎";
              if (type.startsWith("image/")) return "🖼️";
              if (type.startsWith("video/")) return "🎥";
              if (type.startsWith("audio/")) return "🎵";
              if (type === "application/pdf") return "📄";
              if (type.includes("word")) return "📝";
              if (type.includes("excel") || type.includes("sheet")) return "📊";
              if (type === "application/dicom") return "🩻";
              if (type === "application/zip") return "🗜️";
              return "📎";
            };

            const getCatLabel = (type) => {
              if (!type) return "";
              if (type.startsWith("image/")) return isAr ? "صورة" : "Image";
              if (type.startsWith("video/")) return isAr ? "فيديو" : "Video";
              if (type.startsWith("audio/")) return isAr ? "صوت" : "Audio";
              if (type === "application/pdf") return "PDF";
              if (type.includes("word")) return isAr ? "مستند" : "Document";
              if (type.includes("excel") || type.includes("sheet")) return isAr ? "جدول" : "Sheet";
              if (type === "application/dicom") return isAr ? "أشعة" : "DICOM";
              return isAr ? "ملف" : "File";
            };

            const formatSize = (bytes) => {
              if (!bytes) return "";
              if (bytes < 1024) return `${bytes} B`;
              if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
              return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
            };

            const isImage = f.file_type?.startsWith("image/");
            const isVideo = f.file_type?.startsWith("video/");
            const shortName = f.file_name?.length > 22
              ? f.file_name.slice(0, 19) + "..."
              : f.file_name;

            return (
              <div key={f.file_id} className="file-card">
                {/* معاينة مصغّرة للصور */}
                {isImage ? (
                  <div style={{
                    width: 48, height: 48, borderRadius: 10,
                    overflow: "hidden", flexShrink: 0, background: "#f4f4f4",
                  }}>
                    <img
                      src={f.file_url}
                      alt={f.file_name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={e => { e.target.parentElement.innerHTML = "🖼️"; }}
                    />
                  </div>
                ) : (
                  <div className="file-icon" style={{ fontSize: "2rem", minWidth: 40 }}>
                    {getIcon(f.file_type)}
                  </div>
                )}

                <div className="file-info">
                  <h4 title={f.file_name}>{shortName}</h4>
                  <p style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{
                      background: "#f0f4ff", color: "#3498db",
                      padding: "1px 7px", borderRadius: 8,
                      fontSize: ".65rem", fontWeight: 700,
                    }}>
                      {getCatLabel(f.file_type)}
                    </span>
                    {f.file_size && (
                      <span style={{ fontSize: ".65rem", color: "#bbb" }}>
                        {formatSize(f.file_size)}
                      </span>
                    )}
                  </p>
                  <small>{fmt(f.uploaded_at, isAr)}</small>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {/* زر عرض للصور والفيديو */}
                  {(isImage || isVideo) && (
                    <button
                      style={{
                        background: "#f0faf4", color: "#2ecc71", border: "none",
                        width: 32, height: 32, borderRadius: 8, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: ".78rem", transition: ".3s",
                      }}
                      onClick={() => window.open(f.file_url, "_blank")}
                      title={isAr ? "عرض" : "View"}
                    >
                      <i className="fas fa-eye" />
                    </button>
                  )}
                  {/* زر تحميل */}
                  <a
                    href={f.file_url}
                    download={f.file_name}
                    target="_blank"
                    rel="noreferrer"
                    className="file-download-btn"
                    title={isAr ? "تحميل" : "Download"}
                  >
                    <i className="fas fa-download" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </>
    )}
  </div>
)}
        {/* ═══ APPOINTMENTS TAB ═══ */}
        {activeTab === "appointments" && (
          <div>
            {appointments.length === 0 ? (
              <div className="empty-full">
                <span>📅</span>
                <p>{isAr ? "لا توجد مواعيد مسجلة لهذا الطفل" : "No appointments for this child"}</p>
              </div>
            ) : (
              <div className="appointments-list-full">
                {appointments.map((appt) => {
                  const d = new Date(appt.appointment_date);
                  const isPast = d < new Date();
                  return (
                    <div key={appt.appointment_id} className={`appt-full-card ${isPast ? "appt-past" : ""}`}>
                      <div className="appt-full-date">
                        <span>{d.getDate()}</span>
                        <small>{d.toLocaleString(isAr ? "ar-SA" : "en-US", { month: "short" })}</small>
                        <small>{d.getFullYear()}</small>
                      </div>
                      <div className="appt-full-info">
                        <h4>
                          {isAr
                            ? { checkup: "فحص", vaccination: "تطعيم", consultation: "استشارة" }[appt.type] || appt.type
                            : appt.type}
                          {appt.doctor_profiles?.users?.name && ` — ${appt.doctor_profiles.users.name}`}
                        </h4>
                        <p>{appt.notes || (isAr ? "لا توجد ملاحظات" : "No notes")}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
                          <span className={`appt-status status-${appt.status}`}>
                            {isAr
                              ? { pending: "قيد الانتظار", confirmed: "مؤكد", cancelled: "ملغى", completed: "مكتمل" }[appt.status]
                              : appt.status}
                          </span>
                          <span style={{ fontSize: ".75rem", color: "#aaa" }}>
                            {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── ADD GROWTH RECORD MODAL ─── */}
      {addGrowthOpen && (
        <AddGrowthModal
          childId={childId}
          isAr={isAr}
          onClose={() => setAddGrowthOpen(false)}
          onSuccess={() => { setAddGrowthOpen(false); refetch(); }}
        />
      )}

      {/* ─── ADD MEDICAL EVENT MODAL ─── */}
      {addEventOpen && (
        <AddMedicalEventModal
          childId={childId}
          isAr={isAr}
          onClose={() => setAddEventOpen(false)}
          onSuccess={() => { setAddEventOpen(false); refetch(); }}
        />
      )}
    </div>
  );
};

// ─── Add Growth Modal ────────────────────────
const AddGrowthModal = ({ childId, isAr, onClose, onSuccess }) => {
  const [form, setForm] = useState({ weight: "", height: "", head_circumference: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await supabase.from("child_growth").insert({
        child_id: childId,
        weight: form.weight ? parseFloat(form.weight) : null,
        height: form.height ? parseFloat(form.height) : null,
        head_circumference: form.head_circumference ? parseFloat(form.head_circumference) : null,
        notes: form.notes || null,
        recorded_at: new Date().toISOString().split("T")[0],
      });
      onSuccess();
    } catch (err) {
      alert(isAr ? "خطأ" : "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay active" dir={isAr ? "rtl" : "ltr"}>
      <div className="modal-box">
        <div className="modal-head">
          <h2>{isAr ? "تسجيل قياس جديد 📏" : "Add Growth Record 📏"}</h2>
          <button onClick={onClose}><i className="fas fa-times" /></button>
        </div>
        <form onSubmit={handleSave}>
          <div className="modal-fields">
            {[
              { key: "weight", label: isAr ? "الوزن (كغ)" : "Weight (kg)", placeholder: "6.2" },
              { key: "height", label: isAr ? "الطول (سم)" : "Height (cm)", placeholder: "62" },
              { key: "head_circumference", label: isAr ? "محيط الرأس (سم)" : "Head Circumference (cm)", placeholder: "40" },
            ].map((f) => (
              <div className="modal-field" key={f.key}>
                <label>{f.label}</label>
                <input type="number" step="0.1" value={form[f.key]} onChange={(e) => setForm(p => ({ ...p, [f.key]: e.target.value }))} className="modal-input" placeholder={f.placeholder} />
              </div>
            ))}
            <div className="modal-field">
              <label>{isAr ? "ملاحظات" : "Notes"}</label>
              <textarea value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} className="modal-input" rows="2" />
            </div>
          </div>
          <button type="submit" className="btn-primary modal-save-btn" disabled={saving}>
            {saving ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-save" />}
            {isAr ? " حفظ" : " Save"}
          </button>
        </form>
      </div>
    </div>
  );
};

// ─── Add Medical Event Modal ─────────────────
const AddMedicalEventModal = ({ childId, isAr, onClose, onSuccess }) => {
  const [form, setForm] = useState({ event_type: "vaccination", title: "", description: "", event_date: new Date().toISOString().split("T")[0] });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title) return;
    setSaving(true);
    try {
      await supabase.from("child_medical_events").insert({
        child_id: childId,
        event_type: form.event_type,
        title: form.title,
        description: form.description || null,
        event_date: form.event_date,
      });
      onSuccess();
    } catch (err) {
      alert(isAr ? "خطأ" : "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay active" dir={isAr ? "rtl" : "ltr"}>
      <div className="modal-box">
        <div className="modal-head">
          <h2>{isAr ? "إضافة حدث طبي 💉" : "Add Medical Event 💉"}</h2>
          <button onClick={onClose}><i className="fas fa-times" /></button>
        </div>
        <form onSubmit={handleSave}>
          <div className="modal-fields">
            <div className="modal-field">
              <label>{isAr ? "نوع الحدث" : "Event Type"}</label>
              <select value={form.event_type} onChange={(e) => setForm(p => ({ ...p, event_type: e.target.value }))} className="modal-input">
                <option value="vaccination">{isAr ? "تطعيم" : "Vaccination"}</option>
                <option value="disease">{isAr ? "مرض" : "Disease"}</option>
                <option value="allergy">{isAr ? "حساسية" : "Allergy"}</option>
                <option value="checkup">{isAr ? "فحص" : "Checkup"}</option>
                <option value="growth">{isAr ? "نمو" : "Growth"}</option>
              </select>
            </div>
            <div className="modal-field">
              <label>{isAr ? "العنوان *" : "Title *"}</label>
              <input type="text" value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} required className="modal-input" placeholder={isAr ? "مثال: تطعيم الحصبة" : "e.g. MMR Vaccine"} />
            </div>
            <div className="modal-field">
              <label>{isAr ? "التاريخ" : "Date"}</label>
              <input type="date" value={form.event_date} onChange={(e) => setForm(p => ({ ...p, event_date: e.target.value }))} className="modal-input" />
            </div>
            <div className="modal-field">
              <label>{isAr ? "وصف (اختياري)" : "Description (optional)"}</label>
              <textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} className="modal-input" rows="2" />
            </div>
          </div>
          <button type="submit" className="btn-primary modal-save-btn" disabled={saving}>
            {saving ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-save" />}
            {isAr ? " حفظ" : " Save"}
          </button>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────
const CHILD_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800;900&display=swap');
:root{--primary:#d68b9d;--primary-light:#fdf2f5;--secondary:#eab8c6;--bg:#FBF9F8;--text:#333;--gray:#777;--white:#fff;--shadow:0 5px 20px rgba(0,0,0,.04);--radius:20px;}
*{margin:0;padding:0;box-sizing:border-box;font-family:'Poppins',sans-serif;}
.child-detail-root{min-height:100vh;background:var(--bg);color:var(--text);}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}



/* Child Hero */
.child-hero{background:linear-gradient(135deg,white 0%,#fdf2f5 100%);padding:35px 40px;display:flex;align-items:center;gap:30px;flex-wrap:wrap;border-bottom:1px solid #fdf2f5;}
.child-hero-avatar{font-size:5rem;min-width:80px;text-align:center;filter:drop-shadow(0 5px 15px rgba(0,0,0,.1));}
.child-hero-info{flex:1;}
.child-hero-info h1{font-size:2.2rem;font-weight:800;color:var(--text);margin-bottom:10px;}
.child-hero-meta{display:flex;flex-wrap:wrap;gap:14px;}
.child-hero-meta span{display:flex;align-items:center;gap:6px;font-size:.85rem;font-weight:600;color:var(--gray);background:#f4f4f4;padding:5px 12px;border-radius:20px;}
.child-hero-meta span i{color:var(--primary);}
.child-milestone-badge{background:var(--primary);color:white;padding:7px 16px;border-radius:20px;font-weight:700;font-size:.82rem;display:inline-flex;align-items:center;gap:7px;margin-top:12px;}
.child-hero-stats{display:flex;gap:20px;}
.hero-stat{text-align:center;background:white;padding:15px 20px;border-radius:16px;border:1px solid #fdf2f5;box-shadow:var(--shadow);}
.hero-stat-val{display:block;font-size:1.8rem;font-weight:800;color:var(--primary);line-height:1;}
.hero-stat-unit{font-size:.75rem;font-weight:600;color:var(--gray);}
.hero-stat-lbl{display:block;font-size:.72rem;font-weight:700;color:var(--gray);margin-top:3px;}

/* Daily Summary Bar */
.daily-summary-bar{background:var(--primary);padding:15px 40px;display:flex;gap:0;justify-content:space-around;}
.ds-item{display:flex;align-items:center;gap:12px;color:white;}
.ds-item i{font-size:1.3rem;opacity:.85;}
.ds-val{display:block;font-size:1.1rem;font-weight:800;line-height:1;}
.ds-lbl{display:block;font-size:.72rem;font-weight:600;opacity:.8;}

/* Tabs */
.child-tabs{background:white;padding:0 30px;display:flex;gap:0;border-bottom:1px solid #f0f0f0;overflow-x:auto;}
.child-tab{background:none;border:none;padding:16px 18px;font-family:'Poppins';font-weight:700;font-size:.85rem;color:var(--gray);cursor:pointer;display:flex;align-items:center;gap:7px;white-space:nowrap;border-bottom:3px solid transparent;margin-bottom:-1px;transition:.3s;}
.child-tab i{font-size:.9rem;}
.child-tab:hover{color:var(--primary);}
.child-tab.active{color:var(--primary);border-bottom-color:var(--primary);}

/* Content */
.child-content{max-width:1100px;margin:0 auto;padding:28px 25px 50px;}
.tab-toolbar{display:flex;gap:12px;margin-bottom:20px;}
.tab-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
.card-full{grid-column:span 2;}

/* Detail cards */
.detail-card{background:white;border-radius:var(--radius);padding:22px;border:1px solid #fdf2f5;box-shadow:var(--shadow);animation:fadeUp .4s ease;}
.detail-card-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;}
.detail-card-header h3{font-size:1rem;font-weight:700;color:var(--text);display:flex;align-items:center;gap:9px;}
.detail-card-header h3 i{color:var(--primary);}
.card-action-btn{background:var(--primary-light);color:var(--primary);border:none;padding:6px 14px;border-radius:10px;font-weight:700;cursor:pointer;font-size:.8rem;font-family:'Poppins';transition:.3s;}
.card-action-btn:hover{background:var(--primary);color:white;}
.chart-title{font-size:1rem;font-weight:700;color:var(--text);margin-bottom:15px;display:flex;align-items:center;gap:8px;}
.chart-title i{color:var(--primary);}
.empty-state-sm{text-align:center;padding:20px;color:#bbb;font-size:.85rem;font-weight:600;}
.empty-full{text-align:center;padding:60px 20px;color:var(--gray);}
.empty-full span{font-size:3.5rem;display:block;margin-bottom:14px;}
.empty-full p{font-size:.95rem;font-weight:600;}

/* Event list */
.event-list{list-style:none;}
.event-item{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid #f9f9f9;}
.event-item:last-child{border-bottom:none;}
.event-icon{font-size:1.4rem;min-width:30px;text-align:center;}
.event-info{flex:1;}
.event-info h4{font-size:.88rem;font-weight:700;color:var(--text);}
.event-info p{font-size:.75rem;color:var(--gray);font-weight:600;}
.event-badge{font-size:.7rem;font-weight:700;padding:3px 9px;border-radius:20px;}
.badge-vaccination{background:#f0faf4;color:#2ecc71;}
.badge-disease{background:#fef0f0;color:#e74c3c;}
.badge-allergy{background:#fff8f0;color:#f39c12;}
.badge-checkup{background:#f0f4ff;color:#3498db;}
.badge-growth{background:var(--primary-light);color:var(--primary);}

/* Feeding */
.feeding-list{list-style:none;display:flex;flex-direction:column;gap:8px;}
.feeding-item{display:flex;align-items:center;gap:9px;flex-wrap:wrap;}
.feeding-time-badge{background:#f4f4f4;color:var(--gray);padding:3px 10px;border-radius:8px;font-size:.75rem;font-weight:700;}
.feeding-type-badge{padding:3px 10px;border-radius:10px;font-size:.75rem;font-weight:700;}
.ftype-breastfeeding{background:#fdf2f5;color:var(--primary);}
.ftype-formula{background:#f0f4ff;color:#3498db;}
.ftype-solid_food{background:#f0faf4;color:#2ecc71;}
.feeding-meta{font-size:.75rem;color:var(--gray);font-weight:600;}
.feeding-detail-item{display:flex;align-items:center;gap:15px;padding:12px 0;border-bottom:1px solid #f5f5f5;}
.feeding-time-col{text-align:center;min-width:60px;}
.feeding-time-col span{display:block;font-size:.72rem;color:var(--gray);font-weight:600;}
.feeding-time-col strong{font-size:.88rem;color:var(--text);font-weight:700;}
.feeding-detail-info{display:flex;flex-wrap:wrap;gap:8px;align-items:center;}
.response-badge{font-size:.72rem;font-weight:700;padding:2px 8px;border-radius:10px;}
.resp-satisfied{background:#f0faf4;color:#2ecc71;}
.resp-hungry{background:#fff8f0;color:#f39c12;}
.resp-refused{background:#fef0f0;color:#e74c3c;}

/* Sleep */
.sleep-list{list-style:none;display:flex;flex-direction:column;gap:8px;}
.sleep-item{display:flex;flex-direction:column;gap:3px;padding:10px;background:#fafafa;border-radius:12px;}
.sleep-duration{display:flex;justify-content:space-between;align-items:center;}
.sleep-duration span:first-child{font-weight:700;color:var(--text);}
.sleep-quality{font-size:.7rem;font-weight:700;padding:2px 8px;border-radius:10px;}
.sq-excellent{background:#f0faf4;color:#2ecc71;}
.sq-good{background:#f0faf4;color:#27ae60;}
.sq-average{background:#fff8f0;color:#f39c12;}
.sq-poor{background:#fef0f0;color:#e74c3c;}
.sleep-times{font-size:.75rem;color:var(--gray);font-weight:600;}
.sleep-detail-list{list-style:none;display:flex;flex-direction:column;gap:12px;}
.sleep-detail-item{display:flex;align-items:flex-start;gap:16px;padding:14px;background:#fafafa;border-radius:14px;border:1px solid #f0f0f0;}
.sleep-date-col{font-size:.78rem;font-weight:700;color:var(--gray);min-width:90px;padding-top:2px;}
.sleep-detail-info{flex:1;}
.sleep-dur-big{font-size:1.1rem;font-weight:800;color:var(--text);}
.sleep-time-range{font-size:.78rem;color:var(--gray);font-weight:600;margin-top:5px;}

/* Growth */
.growth-charts-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
.growth-table-wrap{overflow-x:auto;}
.growth-table{width:100%;border-collapse:collapse;font-size:.85rem;}
.growth-table th{background:var(--primary-light);color:var(--primary);padding:10px 14px;font-weight:700;text-align:start;}
.growth-table td{padding:10px 14px;border-bottom:1px solid #f5f5f5;color:var(--text);font-weight:600;}
.growth-table tr:hover td{background:#fafafa;}

/* Medical timeline */
.medical-timeline{display:flex;flex-direction:column;gap:15px;}
.medical-event-card{background:white;border-radius:18px;padding:18px;border:1px solid #f0f0f0;display:flex;align-items:flex-start;gap:15px;box-shadow:var(--shadow);transition:.3s;}
.medical-event-card:hover{box-shadow:var(--shadow-hover);border-color:var(--secondary);}
.me-icon{font-size:2rem;min-width:45px;text-align:center;}
.me-content{flex:1;}
.me-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;}
.me-header h4{font-size:.95rem;font-weight:700;color:var(--text);}
.me-desc{font-size:.82rem;color:var(--gray);font-weight:600;line-height:1.5;margin-bottom:6px;}
.me-date{font-size:.75rem;color:var(--gray);font-weight:600;}

/* Files */
.files-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:15px;}
.file-card{background:white;border-radius:16px;padding:16px;border:1px solid #f0f0f0;display:flex;align-items:center;gap:14px;box-shadow:var(--shadow);transition:.3s;}
.file-card:hover{box-shadow:var(--shadow-hover);}
.file-icon{font-size:2rem;min-width:40px;}
.file-info{flex:1;min-width:0;}
.file-info h4{font-size:.88rem;font-weight:700;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.file-info p{font-size:.75rem;color:var(--gray);font-weight:600;}
.file-info small{font-size:.7rem;color:#bbb;font-weight:600;}
.file-download-btn{background:var(--primary-light);color:var(--primary);width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;text-decoration:none;transition:.3s;min-width:34px;}
.file-download-btn:hover{background:var(--primary);color:white;}

/* Appointments */
.appointments-list-full{display:flex;flex-direction:column;gap:14px;}
.appt-full-card{background:white;border-radius:18px;padding:18px;border:1px solid #f0f0f0;display:flex;align-items:flex-start;gap:18px;box-shadow:var(--shadow);}
.appt-past{opacity:.7;border-style:dashed;}
.appt-full-date{background:var(--primary-light);padding:12px;border-radius:12px;text-align:center;color:var(--primary);min-width:60px;}
.appt-full-date span{display:block;font-weight:800;font-size:1.3rem;line-height:1;}
.appt-full-date small{font-size:.72rem;font-weight:700;display:block;}
.appt-full-info{flex:1;}
.appt-full-info h4{font-size:.95rem;font-weight:700;color:var(--text);margin-bottom:4px;}
.appt-full-info p{font-size:.82rem;color:var(--gray);font-weight:600;}

/* Milestone detail */
.milestone-detail-box{background:var(--primary-light);border-radius:16px;padding:20px;}
.milestone-detail-header{display:flex;align-items:center;gap:15px;margin-bottom:12px;}
.milestone-stage-icon{font-size:2.5rem;}
.milestone-detail-header h4{font-size:1.1rem;font-weight:800;color:var(--text);}
.milestone-detail-header p{font-size:.82rem;color:var(--gray);font-weight:600;}
.milestone-desc{font-size:.88rem;color:var(--gray);line-height:1.6;font-weight:600;margin-bottom:15px;}
.progress-bar-wrapper{height:8px;background:white;border-radius:10px;overflow:hidden;flex:1;margin-inline-end:10px;}
.progress-bar-fill{height:100%;background:var(--primary);border-radius:10px;transition:1s;}
.milestone-progress{display:flex;align-items:center;}
.progress-label{font-size:.82rem;font-weight:800;color:var(--primary);white-space:nowrap;}

/* Shared */
.btn-primary{background:var(--primary);color:white;border:none;padding:11px 22px;border-radius:12px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:8px;transition:.3s;box-shadow:0 4px 15px rgba(214,139,157,.3);font-family:'Poppins';font-size:.9rem;}
.btn-primary:hover{background:#c27a8c;transform:translateY(-2px);}
.btn-primary:disabled{opacity:.7;cursor:not-allowed;transform:none;}
.appt-status{font-size:.72rem;font-weight:700;padding:3px 9px;border-radius:20px;}
.status-pending{background:#fff8f0;color:#f39c12;}
.status-confirmed{background:#f0faf4;color:#2ecc71;}
.status-cancelled{background:#fef0f0;color:#e74c3c;}
.status-completed{background:#f0f0f0;color:#888;}
.dash-loading{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg);}
.dash-spinner{width:40px;height:40px;border-radius:50%;border:4px solid #fdf2f5;border-top-color:var(--primary);animation:spin .8s linear infinite;margin-bottom:14px;}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(4px);display:flex;justify-content:center;align-items:center;z-index:3000;padding:15px;}
.modal-box{background:white;width:100%;max-width:440px;border-radius:25px;padding:35px;box-shadow:0 20px 50px rgba(0,0,0,.15);max-height:90vh;overflow-y:auto;}
.modal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;}
.modal-head h2{font-size:1.3rem;font-weight:800;color:var(--text);}
.modal-head button{background:none;border:none;font-size:1.4rem;color:var(--gray);cursor:pointer;transition:.3s;}
.modal-head button:hover{color:#e74c3c;transform:rotate(90deg);}
.modal-fields{display:flex;flex-direction:column;gap:14px;margin-bottom:18px;}
.modal-field{display:flex;flex-direction:column;gap:7px;}
.modal-field label{font-size:.88rem;font-weight:700;color:var(--text);}
.modal-input{width:100%;padding:11px 14px;border-radius:12px;border:1px solid #ddd;outline:none;font-family:'Poppins';font-size:.88rem;background:#fafafa;transition:.3s;}
.modal-input:focus{border-color:var(--secondary);background:white;box-shadow:0 0 0 3px var(--primary-light);}
.modal-save-btn{width:100%;justify-content:center;margin-top:5px;}

@media(max-width:900px){
  .child-hero{flex-direction:column;align-items:flex-start;padding:25px 20px;}
  .child-hero-stats{flex-wrap:wrap;}
  .tab-grid{grid-template-columns:1fr;}
  .card-full,.growth-charts-grid{grid-column:span 1;grid-template-columns:1fr;}
  .daily-summary-bar{padding:12px 20px;flex-wrap:wrap;gap:12px;}
  .child-tabs{padding:0 15px;}
  .child-content{padding:20px 15px 40px;}
}
@media(max-width:600px){
  .back-bar{padding:12px 16px;}
  .child-hero-info h1{font-size:1.7rem;}
  .hero-stat{padding:12px 14px;}
  .hero-stat-val{font-size:1.5rem;}
}
 /* ── Print Button ── */
.print-report-btn {
  background: linear-gradient(135deg, #d68b9d, #eab8c6);
  color: white;
  border: none;
  padding: 9px 18px;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Poppins', sans-serif;
  font-size: .85rem;
  transition: .3s;
  box-shadow: 0 3px 12px rgba(214,139,157,.3);
}
.print-report-btn:hover {
  background: linear-gradient(135deg, #c27a8c, #d68b9d);
  transform: translateY(-2px);
}
 
/* ── Daily Summary Section ── */
.daily-section {
  background: white;
  border-bottom: 1px solid #f0f0f0;
  padding: 20px 30px;
}
.daily-section-header {
  margin-bottom: 14px;
}
.daily-section-header h3 {
  font-size: .95rem;
  font-weight: 700;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 8px;
}
.daily-section-header h3 i {
  color: var(--primary);
}
.daily-cards-row {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 6px;
}
.daily-card {
  min-width: 140px;
  background: #fdf2f5;
  border-radius: 16px;
  padding: 14px;
  flex-shrink: 0;
  border: 1px solid #f0e0e5;
  transition: .3s;
}
.daily-card:hover {
  box-shadow: 0 4px 14px rgba(214,139,157,.15);
  transform: translateY(-3px);
}
.daily-card-date {
  font-size: .72rem;
  font-weight: 700;
  color: #d68b9d;
  margin-bottom: 10px;
  text-align: center;
}
.daily-card-stats {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.dc-stat {
  display: flex;
  align-items: center;
  gap: 7px;
}
.dc-stat i {
  color: var(--primary);
  width: 14px;
  font-size: .78rem;
}
.dc-stat span {
  font-size: .85rem;
  font-weight: 700;
  color: var(--text);
  flex: 1;
}
.dc-stat small {
  font-size: .65rem;
  color: #aaa;
  font-weight: 600;
}
 
@media (max-width: 768px) {
  .daily-section { padding: 16px; }
  .daily-card { min-width: 120px; }
} 

.print-report-btn{background:linear-gradient(135deg,#d68b9d,#eab8c6);color:white;border:none;padding:9px 18px;border-radius:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;font-family:'Poppins',sans-serif;font-size:.85rem;transition:.3s;box-shadow:0 3px 12px rgba(214,139,157,.3);}
.print-report-btn:hover{background:linear-gradient(135deg,#c27a8c,#d68b9d);transform:translateY(-2px);}
.daily-section{background:white;border-bottom:1px solid #f0f0f0;padding:20px 30px;}
.daily-section-header{margin-bottom:14px;}
.daily-section-header h3{font-size:.95rem;font-weight:700;color:var(--text);display:flex;align-items:center;gap:8px;}
.daily-section-header h3 i{color:var(--primary);}
.daily-cards-row{display:flex;gap:12px;overflow-x:auto;padding-bottom:6px;}
.daily-card{min-width:140px;background:#fdf2f5;border-radius:16px;padding:14px;flex-shrink:0;border:1px solid #f0e0e5;transition:.3s;}
.daily-card:hover{box-shadow:0 4px 14px rgba(214,139,157,.15);transform:translateY(-3px);}
.daily-card-date{font-size:.72rem;font-weight:700;color:#d68b9d;margin-bottom:10px;text-align:center;}
.daily-card-stats{display:flex;flex-direction:column;gap:7px;}
.dc-stat{display:flex;align-items:center;gap:7px;}
.dc-stat i{color:var(--primary);width:14px;font-size:.78rem;}
.dc-stat span{font-size:.85rem;font-weight:700;color:var(--text);flex:1;}
.dc-stat small{font-size:.65rem;color:#aaa;font-weight:600;}

`;
const DailySummarySection = ({ dailySummary = [], isAr }) => {
  if (!dailySummary || dailySummary.length === 0) return null;
  const last7 = dailySummary.slice(0, 7);
  const fmt = (d) => d ? new Date(d).toLocaleDateString(
    isAr ? "ar-SA" : "en-US", { weekday: "short", month: "short", day: "numeric" }
  ) : "—";
  const qualityColor = { excellent: "#2ecc71", good: "#27ae60", average: "#f39c12", poor: "#e74c3c" };
  const qualityLabel = (q) => isAr
    ? { excellent: "ممتاز", good: "جيد", average: "متوسط", poor: "ضعيف" }[q] || q : q;

  return (
    <div className="daily-section">
      <div className="daily-section-header">
        <h3>
          <i className="fas fa-calendar-day" />
          {isAr ? " الملخص اليومي — آخر 7 أيام" : " Daily Summary — Last 7 Days"}
        </h3>
      </div>
      <div className="daily-cards-row">
        {last7.map((s, i) => (
          <div key={i} className="daily-card">
            <div className="daily-card-date">{fmt(s.date)}</div>
            <div className="daily-card-stats">
              <div className="dc-stat">
                <i className="fas fa-moon" />
                <span>{s.total_sleep_minutes ? `${(s.total_sleep_minutes/60).toFixed(1)}h` : "—"}</span>
                <small>{isAr ? "نوم" : "Sleep"}</small>
              </div>
              <div className="dc-stat">
                <i className="fas fa-baby-carriage" />
                <span>{s.total_feeding_sessions ?? "—"}</span>
                <small>{isAr ? "رضاعة" : "Feedings"}</small>
              </div>
              <div className="dc-stat">
                <i className="fas fa-tint" />
                <span>{s.total_milk_ml ? `${s.total_milk_ml}ml` : "—"}</span>
                <small>{isAr ? "حليب" : "Milk"}</small>
              </div>
              {s.avg_sleep_quality && (
                <div className="dc-stat">
                  <i className="fas fa-star" style={{ color: qualityColor[s.avg_sleep_quality] || "#aaa" }} />
                  <span style={{ color: qualityColor[s.avg_sleep_quality] || "#aaa" }}>
                    {qualityLabel(s.avg_sleep_quality)}
                  </span>
                  <small>{isAr ? "جودة النوم" : "Quality"}</small>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default ChildDetailPage;