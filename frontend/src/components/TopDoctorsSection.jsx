// src/components/TopDoctorsSection.jsx
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { SPECIALIZATIONS } from "../core/theme/roleThemes";

// نبني فئات الفلتر من SPECIALIZATIONS مباشرة
const FILTER_GROUPS = [
  { value: "all", ar: "الكل", en: "All" },
  ...SPECIALIZATIONS,
];

const TopDoctorsSection = () => {
  const { i18n } = useTranslation();
  const navigate  = useNavigate();
  const isAr = i18n.language === "ar";

  const [doctors,  setDoctors]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("all");

  useEffect(() => { fetchTopDoctors(); }, []);

  const fetchTopDoctors = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("doctor_profiles")
      .select(`
        doctor_id, specialization, certifications,
        license_number, experience_years, bio, image,
        users!doctor_profiles_doctor_id_fkey (
          user_id, name, avatar_url
        ),
        doctor_ratings (rating)
      `)
      .not("specialization", "is", null);

   // ✅ الكود الجديد — أعلى 3 من كل تخصص
const enriched = (data || []).map(d => {
  const ratings = d.doctor_ratings || [];
  const avg = ratings.length
    ? ratings.reduce((s, r) => s + (r.rating || 0), 0) / ratings.length : 0;
  return { ...d, avgRating: Math.round(avg * 10) / 10, totalRatings: ratings.length };
});

// نجمع أعلى 3 من كل تخصص
const bySpec = {};
enriched.forEach(doc => {
  const spec = (doc.specialization || "other").toLowerCase().trim();
  if (!bySpec[spec]) bySpec[spec] = [];
  bySpec[spec].push(doc);
});

const top3PerSpec = Object.values(bySpec).flatMap(group =>
  group.sort((a, b) => b.avgRating - a.avgRating).slice(0, 3)
);

setDoctors(top3PerSpec);
    setLoading(false);
  };

  // ← تطابق قيمة التخصص المخزنة في DB
  const filtered = filter === "all"
    ? doctors
    : doctors.filter(d => {
        const spec = (d.specialization || "").toLowerCase();
        // تطابق مباشر مع الـ value المخزّنة
        if (spec === filter) return true;
        // أو تطابق جزئي للقيم القديمة المخزنة بالنص
        const specObj = SPECIALIZATIONS.find(s => s.value === filter);
        if (!specObj) return false;
        return spec.includes(specObj.ar.toLowerCase()) ||
               spec.includes(specObj.en.toLowerCase());
      });

  // دالة تحويل قيمة التخصص → نص عرض
// ✅ الكود الجديد — بسيط وموثوق
const getSpecLabel = (value) => {
  if (!value) return isAr ? "طبيب" : "Doctor";
  const found = SPECIALIZATIONS.find(s => s.value === value);
  if (found) return isAr ? found.ar : found.en;
  // قيمة قديمة غير معروفة — اعرضها كما هي
  return value;
};

  const STARS = (n) => Array.from({ length: 5 }, (_, i) => (
    <i key={i} className={`fa${i < Math.floor(n) ? "s" : i < n ? "s fa-star-half-alt" : "r"} fa-star`}
       style={{ color: i < n ? "#FFD700" : "#e0e0e0", fontSize: ".75rem" }} />
  ));

  return (
    <section className="top-docs-section">
      <style>{TOP_CSS}</style>

      <div className="top-docs-header">
        <h2>{isAr ? "أبرز الأطباء المتخصصين" : "Top Medical Specialists"}</h2>
        <p>{isAr ? "نخبة من الأطباء المعتمدين على منصتنا" : "Our certified medical experts"}</p>
      </div>

      {/* Filter tabs — scrollable */}
      <div className="top-docs-filters">
        <div className="top-docs-filters-inner">
          {FILTER_GROUPS.map(f => (
            <button
              key={f.value}
              className={`tdf-btn ${filter === f.value ? "active" : ""}`}
              onClick={() => setFilter(f.value)}
            >
              {isAr ? f.ar : f.en}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="top-docs-loading"><div className="top-docs-spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="top-docs-empty">
          <i className="fas fa-user-md" />
          <p>{isAr ? "لا يوجد أطباء في هذا التخصص حالياً" : "No doctors in this specialty yet"}</p>
        </div>
      ) : (
        /* Horizontal scroll on mobile, grid on desktop */
        <div className="top-docs-scroll-outer">
          <div className="top-docs-grid">
            {filtered.map(doc => {
              const name   = doc.users?.name || (isAr ? "طبيب" : "Doctor");
              const avatar = doc.image || doc.users?.avatar_url;
              const spec   = getSpecLabel(doc.specialization);

              return (
                <div key={doc.doctor_id} className="tdc-card">
                  {/* Avatar */}
                  <div className="tdc-avatar-wrap">
                    {avatar
                      ? <img src={avatar} alt={name} className="tdc-avatar" />
                      : <div className="tdc-avatar-init">{name.charAt(0)}</div>}
                    <div className="tdc-online" />
                  </div>

                  {/* Info */}
                  <div className="tdc-info">
                    <h3 className="tdc-name">{name}</h3>
                    <p className="tdc-spec">{spec}</p>

                    {/* Rating */}
                    <div className="tdc-rating">
                      <span className="tdc-stars">{STARS(doc.avgRating)}</span>
                      <span className="tdc-avg">
                        {doc.avgRating > 0 ? doc.avgRating.toFixed(1) : "—"}
                      </span>
                      <span className="tdc-count">
                        ({doc.totalRatings} {isAr ? "تقييم" : "reviews"})
                      </span>
                    </div>

                    {/* Bio */}
                    {doc.bio && (
                      <p className="tdc-bio">
                        {doc.bio.length > 80 ? doc.bio.slice(0, 80) + "…" : doc.bio}
                      </p>
                    )}

                    {/* Meta pills */}
                    <div className="tdc-pills">
                      {doc.experience_years && (
                        <span className="tdc-pill">
                          <i className="fas fa-briefcase" />
                          {doc.experience_years} {isAr ? "سنة" : "yrs"}
                        </span>
                      )}
                      {doc.certifications && (
                        <span className="tdc-pill">
                          <i className="fas fa-certificate" />
                          {doc.certifications.length > 25
                            ? doc.certifications.slice(0, 25) + "…"
                            : doc.certifications}
                        </span>
                      )}
                      {doc.license_number && (
                        <span className="tdc-pill tdc-pill-license">
                          <i className="fas fa-id-badge" />
                          {isAr ? "ترخيص: " : "Lic: "}{doc.license_number}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  <button
                    className="tdc-btn"
                    onClick={() => navigate("/mother/doctors")}
                  >
                    <i className="fas fa-calendar-plus" />
                    {isAr ? "احجز موعداً" : "Book Now"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="top-docs-footer">
        <button className="top-docs-more-btn" onClick={() => navigate("/doctors")}>
          {isAr ? "عرض جميع الأطباء ←" : "View All Doctors →"}
        </button>
      </div>
    </section>
  );
};

const TOP_CSS = `
.top-docs-section {
  padding: 60px 0 40px;
  background: #fdf9f7;
  overflow: hidden;
}

.top-docs-header {
  text-align: center;
  margin-bottom: 28px;
  padding: 0 20px;
}
.top-docs-header h2 {
  font-size: clamp(1.5rem, 3vw, 2.2rem);
  font-weight: 800;
  color: #1a1a2e;
  margin-bottom: 8px;
}
.top-docs-header p {
  color: #888;
  font-size: .92rem;
  font-weight: 600;
}

/* ── Filters ── */
.top-docs-filters {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  margin-bottom: 28px;
  padding: 0 20px;
}
.top-docs-filters::-webkit-scrollbar { display: none; }

.top-docs-filters-inner {
  display: flex;
  gap: 10px;
  width: max-content;
  min-width: 100%;
  padding-bottom: 4px;
}

.tdf-btn {
  background: #fff;
  border: 2px solid #fdf2f5;
  padding: 8px 20px;
  border-radius: 30px;
  color: #555;
  font-weight: 700;
  cursor: pointer;
  transition: all .3s;
  font-family: inherit;
  font-size: .85rem;
  white-space: nowrap;
  flex-shrink: 0;
}
.tdf-btn:hover { border-color: #eab8c6; color: #d68b9d; }
.tdf-btn.active {
  background: #eab8c6;
  color: #fff;
  border-color: #eab8c6;
  box-shadow: 0 4px 14px rgba(234,184,198,.4);
}

/* ── Scroll outer — KEY FIX for mobile ── */
.top-docs-scroll-outer {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding: 8px 20px 16px;
}
.top-docs-scroll-outer::-webkit-scrollbar { display: none; }

/* Grid: always a single row of cards that scrolls on mobile */
.top-docs-grid {
  display: flex;
  gap: 18px;
  width: max-content;  /* ← هذا هو المفتاح — لا تكسر الصفوف */
}

/* ── Card ── */
.tdc-card {
  background: #fff;
  border-radius: 20px;
  padding: 22px 18px 18px;
  border: 1px solid #fdf2f5;
  box-shadow: 0 4px 18px rgba(0,0,0,.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 230px;      /* عرض ثابت لكل بطاقة */
  flex-shrink: 0;
  transition: transform .3s, box-shadow .3s;
  animation: tdc-up .5s ease both;
}
.tdc-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 32px rgba(214,139,157,.18);
}
@keyframes tdc-up {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Avatar */
.tdc-avatar-wrap {
  position: relative;
  width: 72px; height: 72px;
  margin-bottom: 14px;
}
.tdc-avatar, .tdc-avatar-init {
  width: 72px; height: 72px;
  border-radius: 50%; object-fit: cover;
  border: 3px solid #fff;
  box-shadow: 0 4px 14px rgba(214,139,157,.22);
}
.tdc-avatar-init {
  background: linear-gradient(135deg, #eab8c6, #d68b9d);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem; font-weight: 800; color: #fff;
}
.tdc-online {
  position: absolute; bottom: 2px; right: 2px;
  width: 12px; height: 12px;
  background: #2ecc71; border-radius: 50%; border: 2px solid #fff;
}

/* Info */
.tdc-info { width: 100%; }
.tdc-name { font-size: .95rem; font-weight: 800; color: #1a1a2e; margin-bottom: 3px; }
.tdc-spec { color: #d68b9d; font-size: .78rem; font-weight: 700; margin-bottom: 8px; }

.tdc-rating {
  display: flex; align-items: center; justify-content: center;
  gap: 5px; margin-bottom: 8px;
}
.tdc-avg { font-size: .85rem; font-weight: 800; color: #333; }
.tdc-count { font-size: .68rem; color: #aaa; }

.tdc-bio {
  font-size: .75rem; color: #777; line-height: 1.5;
  margin-bottom: 10px;
}

/* Pills */
.tdc-pills {
  display: flex; flex-wrap: wrap; gap: 5px;
  justify-content: center; margin-bottom: 14px;
}
.tdc-pill {
  background: #fdf2f5; color: #d68b9d;
  padding: 3px 9px; border-radius: 16px;
  font-size: .68rem; font-weight: 700;
  display: flex; align-items: center; gap: 4px;
}
.tdc-pill-license {
  background: #f0f4ff; color: #3498db;
}

/* Button */
.tdc-btn {
  width: 100%;
  background: #eab8c6; color: #fff; border: none;
  padding: 10px; border-radius: 12px;
  font-family: inherit; font-weight: 700; font-size: .82rem;
  cursor: pointer; display: flex; align-items: center;
  justify-content: center; gap: 7px;
  transition: .3s;
  box-shadow: 0 4px 12px rgba(234,184,198,.3);
  margin-top: auto;
}
.tdc-btn:hover { background: #d68b9d; transform: translateY(-1px); }

/* Loading / Empty */
.top-docs-loading {
  text-align: center; padding: 50px;
}
.top-docs-spinner {
  width: 40px; height: 40px;
  border: 4px solid #fdf2f5; border-top-color: #eab8c6;
  border-radius: 50%; animation: tdc-spin .8s linear infinite;
  margin: 0 auto;
}
@keyframes tdc-spin { to { transform: rotate(360deg); } }
.top-docs-empty {
  text-align: center; padding: 40px; color: #ccc;
}
.top-docs-empty i { font-size: 2.5rem; display: block; margin-bottom: 10px; color: #eab8c6; }
.top-docs-empty p { font-size: .88rem; font-weight: 600; color: #aaa; }

/* Footer */
.top-docs-footer {
  text-align: center; padding: 20px;
}
.top-docs-more-btn {
  background: #fdf2f5; color: #d68b9d;
  border: 2px solid #eab8c6; padding: 11px 30px;
  border-radius: 30px; font-family: inherit;
  font-weight: 700; font-size: .88rem; cursor: pointer;
  transition: .3s;
}
.top-docs-more-btn:hover {
  background: #eab8c6; color: #fff;
}

/* ── DESKTOP: عرض شبكة ── */
@media (min-width: 768px) {
  .top-docs-scroll-outer {
    overflow-x: visible;
    padding: 8px 40px 16px;
  }
  .top-docs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    width: auto;
    max-width: 1200px;
    margin: 0 auto;
  }
  .tdc-card { width: auto; }
}
`;

export default TopDoctorsSection;