// src/modules/public/DoctorsPage.jsx
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import Navbar from "../../shared/layout/Navbar";
import { SPECIALIZATIONS } from "../../core/theme/roleThemes";

const STAR_COMPONENT = ({ rating = 0 }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars.push(<i key={i} className="fas fa-star" />);
    } else if (i - rating < 1 && i - rating > 0) {
      stars.push(<i key={i} className="fas fa-star-half-alt" />);
    } else {
      stars.push(<i key={i} className="far fa-star" style={{ opacity: 0.3 }} />);
    }
  }
  return <span className="dm-stars">{stars}</span>;
};

const DoctorsPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isAr = i18n.language === "ar";
  const dir = isAr ? "rtl" : "ltr";

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
 // ✅ الجديد
const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchDoctors();
  }, []);

 const fetchDoctors = async () => {
  setLoading(true);
  try {
    const { data, error } = await supabase
      .from("doctor_profiles")
      .select(`
        doctor_id,
        specialization,
        certifications,
        experience_years,
        bio,
        image,
        availability_schedule,
        users!doctor_profiles_doctor_id_fkey (
          user_id,
          name,
          avatar_url
        ),
        doctor_ratings (
          rating,
          review
        )
      `);

    if (error) throw error;

    const enriched = (data || []).map((d) => {
      const ratings = d.doctor_ratings || [];
      const avg = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length
        : 0;
      return {
        ...d,
        avgRating: Math.round(avg * 10) / 10,
        totalRatings: ratings.length,
      };
    });

    setDoctors(enriched);
  } catch (err) {
    console.error("DoctorsPage fetch error:", err.message);
  } finally {
    setLoading(false);
  }
};
const FILTER_GROUPS = [
  { value: "all", ar: "الكل", en: "All" },
  ...SPECIALIZATIONS,
];

const filtered = doctors.filter((d) => {
  const spec = (d.specialization || "").toLowerCase();
  const name = (d.users?.name || "").toLowerCase();
  const term = search.toLowerCase();

  const matchSearch = !term || spec.includes(term) || name.includes(term);

  if (activeFilter === "all") return matchSearch;

  return spec === activeFilter && matchSearch;
});

  return (
    <div dir={dir} className="dm-root">
      <style>{DM_CSS}</style>
      <Navbar />

      <main className="dm-main">
        {/* ── Header ── */}
        <div className="dm-hero">
          <h1 className="dm-hero-title">
            {isAr ? "نخبة من الأطباء المتخصصين" : "Our Elite Medical Experts"}
          </h1>
          <p className="dm-hero-sub">
            {isAr
              ? "نوفر لكِ شبكة من أفضل الأطباء والاختصاصيين المعتمدين لمرافقتكِ في كل مرحلة من رحلة أمومتك."
              : "A certified network of top-tier specialists ready to support every stage of your motherhood journey."}
          </p>

          {/* Search */}
          <div className="dm-search-wrap">
            <i className="fas fa-search dm-search-icon" />
            <input
              className="dm-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isAr ? "ابحثي عن طبيب أو تخصص..." : "Search by name or specialty..."}
            />
            {search && (
              <button className="dm-search-clear" onClick={() => setSearch("")}>
                <i className="fas fa-times" />
              </button>
            )}
          </div>
        </div>
<div className="dm-filters">
  {FILTER_GROUPS.map((f) => (
    <button
      key={f.value}
      className={`dm-filter-btn ${activeFilter === f.value ? "active" : ""}`}
      onClick={() => setActiveFilter(f.value)}
    >
      {isAr ? f.ar : f.en}
      {f.value === "all" && (
        <span className="dm-filter-count">{doctors.length}</span>
      )}
    </button>
  ))}
</div>

        {/* ── Grid ── */}
        {loading ? (
          <div className="dm-loading">
            <div className="dm-spinner" />
            <p>{isAr ? "جارٍ التحميل..." : "Loading..."}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="dm-empty">
            <i className="fas fa-user-md" />
            <p>{isAr ? "لا يوجد أطباء في هذا التخصص حالياً" : "No doctors found in this specialty"}</p>
          </div>
        ) : (
          <div className="dm-grid">
            {filtered.map((doc) => (
              <DoctorCard key={doc.doctor_id} doc={doc} isAr={isAr} />
            ))}
          </div>
        )}
      </main>

      <footer className="dm-footer">
        <p>© 2026 Journey of Motherhood. {isAr ? "جميع الحقوق محفوظة." : "All Rights Reserved."}</p>
      </footer>
    </div>
  );
};

// ── Doctor Card ──
const DoctorCard = ({ doc, isAr }) => {
const avatar = doc.image || doc.users?.avatar_url;
const name = doc.users?.name || "Doctor";
  const spec = doc.specialization || (isAr ? "طبيب" : "Doctor");
  const bio = doc.bio || "";
  const exp = doc.experience_years;
  const certs = doc.certifications;

  return (
    <div className="dm-card">
      <div className="dm-card-top">
        <div className="dm-avatar-wrap">
          {avatar ? (
            <img src={avatar} alt={name} className="dm-avatar" />
          ) : (
            <div className="dm-avatar-init">{name.charAt(0)}</div>
          )}
          <div className="dm-online-dot" title={isAr ? "متاح" : "Available"} />
        </div>

        <div className="dm-card-rating">
          <STAR_COMPONENT rating={doc.avgRating} />
          <span className="dm-rating-num">
            {doc.avgRating > 0 ? doc.avgRating.toFixed(1) : "—"}
          </span>
          <span className="dm-rating-count">
            ({doc.totalRatings} {isAr ? "تقييم" : "reviews"})
          </span>
        </div>
      </div>

      <h3 className="dm-card-name">{name}</h3>
      <p className="dm-card-spec">{spec}</p>

      {bio && (
        <p className="dm-card-bio">
          {bio.length > 100 ? bio.slice(0, 100) + "…" : bio}
        </p>
      )}

      <div className="dm-card-meta">
        {exp && (
          <span className="dm-meta-pill">
            <i className="fas fa-briefcase" />
            {exp} {isAr ? "سنة خبرة" : "yrs exp"}
          </span>
        )}
        {certs && (
          <span className="dm-meta-pill">
            <i className="fas fa-certificate" />
            {isAr ? "معتمد" : "Certified"}
          </span>
        )}
      </div>

      <div className="dm-card-actions">
        <button className="dm-btn-book">
          <i className="fas fa-calendar-plus" />
          {isAr ? "احجزي موعداً" : "Book Appointment"}
        </button>
        <button className="dm-btn-profile">
          <i className="fas fa-user" />
        </button>
      </div>
    </div>
  );
};

// ── CSS ──
const DM_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Cairo:wght@400;600;700;800&display=swap');

.dm-root {
  min-height: 100vh;
  background: #FBF9F8;
  font-family: 'Poppins', 'Cairo', sans-serif;
  color: #2d2d2d;
}

.dm-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 100px 24px 60px;
}

/* ── HERO ── */
.dm-hero {
  text-align: center;
  margin-bottom: 48px;
  padding: 48px 20px 0;
}

.dm-hero-title {
  font-size: clamp(2rem, 5vw, 3.2rem);
  font-weight: 800;
  color: #1a1a2e;
  margin-bottom: 14px;
  font-family: 'Georgia', serif;
  position: relative;
  display: inline-block;
}

.dm-hero-title::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 4px;
  background: linear-gradient(90deg, #eab8c6, #d68b9d);
  border-radius: 2px;
}

.dm-hero-sub {
  margin-top: 22px;
  font-size: 1.05rem;
  color: #666;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.8;
  font-weight: 500;
}

/* ── SEARCH ── */
.dm-search-wrap {
  position: relative;
  max-width: 520px;
  margin: 32px auto 0;
}

.dm-search-icon {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  color: #d68b9d;
  font-size: 0.95rem;
  pointer-events: none;
}

[dir="ltr"] .dm-search-icon { left: 16px; }
[dir="rtl"] .dm-search-icon { right: 16px; }

.dm-search {
  width: 100%;
  padding: 14px 44px;
  border-radius: 50px;
  border: 2px solid #fdf2f5;
  background: #fff;
  font-family: inherit;
  font-size: 0.95rem;
  color: #333;
  outline: none;
  box-shadow: 0 4px 20px rgba(214, 139, 157, 0.1);
  transition: 0.3s;
}

.dm-search:focus {
  border-color: #eab8c6;
  box-shadow: 0 4px 20px rgba(214, 139, 157, 0.2);
}

.dm-search-clear {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: #f2e1e4;
  border: none;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  cursor: pointer;
  color: #d68b9d;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  transition: 0.2s;
}

[dir="ltr"] .dm-search-clear { right: 12px; }
[dir="rtl"] .dm-search-clear { left: 12px; }

.dm-search-clear:hover { background: #eab8c6; color: #fff; }

/* ── FILTERS ── */
.dm-filters {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 44px;
}

.dm-filter-btn {
  background: #fff;
  border: 2px solid #fdf2f5;
  padding: 9px 22px;
  border-radius: 30px;
  color: #555;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  font-family: inherit;
  font-size: 0.88rem;
  display: flex;
  align-items: center;
  gap: 7px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
}

.dm-filter-btn:hover {
  border-color: #eab8c6;
  color: #d68b9d;
  transform: translateY(-2px);
}

.dm-filter-btn.active {
  background: #eab8c6;
  color: #fff;
  border-color: #eab8c6;
  box-shadow: 0 6px 18px rgba(234, 184, 198, 0.4);
}

.dm-filter-count {
  background: rgba(255,255,255,0.35);
  padding: 1px 7px;
  border-radius: 10px;
  font-size: 0.72rem;
  font-weight: 700;
}

.dm-filter-btn:not(.active) .dm-filter-count {
  background: #f2e1e4;
  color: #d68b9d;
}

/* ── GRID ── */
.dm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 26px;
}

/* ── CARD ── */
.dm-card {
  background: #fff;
  border-radius: 22px;
  padding: 28px 22px 22px;
  border: 1px solid #fdf2f5;
  box-shadow: 0 4px 20px rgba(0,0,0,0.04);
  display: flex;
  flex-direction: column;
  transition: transform 0.35s ease, box-shadow 0.35s ease;
  animation: dm-fadeup 0.5s ease both;
}

.dm-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 40px rgba(214, 139, 157, 0.15);
}

@keyframes dm-fadeup {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

.dm-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 18px;
}

/* ── AVATAR ── */
.dm-avatar-wrap {
  position: relative;
  width: 72px;
  height: 72px;
}

.dm-avatar,
.dm-avatar-init {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #fff;
  box-shadow: 0 4px 14px rgba(214, 139, 157, 0.25);
}

.dm-avatar-init {
  background: linear-gradient(135deg, #eab8c6, #d68b9d);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  font-weight: 800;
  color: #fff;
}

.dm-online-dot {
  position: absolute;
  bottom: 3px;
  right: 3px;
  width: 13px;
  height: 13px;
  background: #2ecc71;
  border-radius: 50%;
  border: 2px solid #fff;
}

/* ── RATING ── */
.dm-card-rating {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.dm-stars { color: #FFD700; font-size: 0.8rem; letter-spacing: 1px; }
.dm-rating-num { font-size: 1rem; font-weight: 800; color: #333; }
.dm-rating-count { font-size: 0.72rem; color: #aaa; font-weight: 500; }

/* ── CARD CONTENT ── */
.dm-card-name {
  font-size: 1.1rem;
  font-weight: 800;
  color: #1a1a2e;
  margin-bottom: 4px;
}

.dm-card-spec {
  color: #d68b9d;
  font-size: 0.85rem;
  font-weight: 700;
  margin-bottom: 12px;
}

.dm-card-bio {
  color: #777;
  font-size: 0.85rem;
  line-height: 1.65;
  margin-bottom: 16px;
  flex-grow: 1;
  font-weight: 400;
}

/* ── META PILLS ── */
.dm-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-bottom: 18px;
}

.dm-meta-pill {
  background: #fdf2f5;
  color: #d68b9d;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 5px;
}

/* ── ACTIONS ── */
.dm-card-actions {
  display: flex;
  gap: 8px;
}

.dm-btn-book {
  flex: 1;
  background: #eab8c6;
  color: #fff;
  border: none;
  padding: 11px 14px;
  border-radius: 14px;
  font-family: inherit;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  transition: 0.3s;
  box-shadow: 0 4px 12px rgba(234, 184, 198, 0.3);
}

.dm-btn-book:hover {
  background: #d68b9d;
  transform: translateY(-1px);
}

.dm-btn-profile {
  background: #fdf2f5;
  color: #d68b9d;
  border: none;
  width: 42px;
  border-radius: 14px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dm-btn-profile:hover {
  background: #eab8c6;
  color: #fff;
}

/* ── LOADING / EMPTY ── */
.dm-loading {
  text-align: center;
  padding: 80px 20px;
  color: #ccc;
}

.dm-spinner {
  width: 46px;
  height: 46px;
  border: 4px solid #fdf2f5;
  border-top-color: #eab8c6;
  border-radius: 50%;
  animation: dm-spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

@keyframes dm-spin { to { transform: rotate(360deg); } }

.dm-loading p { font-size: 0.9rem; font-weight: 600; }

.dm-empty {
  text-align: center;
  padding: 80px 20px;
  color: #ccc;
}

.dm-empty i {
  font-size: 3rem;
  display: block;
  margin-bottom: 14px;
  color: #eab8c6;
}

.dm-empty p { font-size: 0.95rem; font-weight: 600; color: #aaa; }

/* ── FOOTER ── */
.dm-footer {
  text-align: center;
  padding: 28px;
  color: #aaa;
  font-size: 0.88rem;
  font-weight: 500;
}

/* ── RESPONSIVE ── */
@media (max-width: 768px) {
  .dm-main { padding: 90px 16px 40px; }
  .dm-hero { padding-top: 24px; }
  .dm-grid { grid-template-columns: 1fr 1fr; gap: 14px; }
  .dm-card { padding: 18px 14px 16px; }
}

@media (max-width: 480px) {
  .dm-grid { grid-template-columns: 1fr; }
}
`;

export default DoctorsPage;