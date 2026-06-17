// src/modules/mother/pages/MotherDoctorsPage.jsx
// صفحة الأطباء الخاصة بالأم المسجّلة — مع مودال الحجز والتقييم
// تستخدم header الداشبورد وليس Navbar العامة

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../../../services/supabaseClient";
import { useMotherData } from "../../../core/hooks/useMotherData";
import UnifiedNavbar from "../../../components/UnifiedNavbar";
// ─── الكلمات المفتاحية لكل تخصص ─────────────────
import { SPECIALIZATIONS } from "../../../core/theme/roleThemes";

const FILTER_GROUPS = [
  { value: "all", ar: "الكل", en: "All" },
  ...SPECIALIZATIONS,
];

const APPOINTMENT_TYPES = {
  ar: { checkup: "فحص دوري", vaccination: "تطعيم", consultation: "استشارة طبية" },
  en: { checkup: "Checkup",  vaccination: "Vaccination", consultation: "Consultation" },
};

// ─── Stars ───────────────────────────────────────
const Stars = ({ rating = 0, interactive = false, onRate }) => (
  <span className="mdr-stars">
    {Array.from({ length: 5 }, (_, i) => {
      const filled = i < Math.floor(rating);
      const half   = !filled && i < rating;
      return (
        <i
          key={i}
          className={`fa${filled ? "s" : half ? "s fa-star-half-alt" : "r"} fa-star`}
          style={{
            color: filled || half ? "#FFD700" : "#ddd",
            cursor: interactive ? "pointer" : "default",
            fontSize: interactive ? "1.2rem" : "0.78rem",
          }}
          onClick={() => interactive && onRate && onRate(i + 1)}
        />
      );
    })}
  </span>
);

// ════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════
const MotherDoctorsPage = () => {
  const { i18n } = useTranslation();
  const navigate  = useNavigate();
  const isAr = i18n.language === "ar";
  const dir  = isAr ? "rtl" : "ltr";

  const { user, children } = useMotherData();

  const [doctors,      setDoctors]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState("all");
  const [search,       setSearch]       = useState("");
  const [bookingDoc,   setBookingDoc]   = useState(null);  // opens BookingModal
  const [ratingDoc,    setRatingDoc]    = useState(null);  // opens RatingModal
  const [myRatings,    setMyRatings]    = useState({});    // { doctor_id: rating }

  useEffect(() => { fetchDoctors(); }, []);
  useEffect(() => { if (user) fetchMyRatings(); }, [user]);

  const fetchDoctors = async () => {
    setLoading(true);
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
          user_id, name, avatar_url
        ),
        doctor_ratings ( rating, review )
      `);

    if (error) { console.error(error.message); setLoading(false); return; }

    const enriched = (data || [])
      .filter(d => d.specialization)
      .map(d => {
        const ratings = d.doctor_ratings || [];
        const avg = ratings.length
          ? ratings.reduce((s, r) => s + (r.rating || 0), 0) / ratings.length
          : 0;
        return { ...d, avgRating: Math.round(avg * 10) / 10, totalRatings: ratings.length };
      });

    setDoctors(enriched);
    setLoading(false);
  };

  const fetchMyRatings = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("doctor_ratings")
      .select("doctor_id, rating")
      .eq("user_id", user.user_id);
    const map = {};
    (data || []).forEach(r => { map[r.doctor_id] = r.rating; });
    setMyRatings(map);
  };

  // ─── Filter ───────────────────────────────────
const filtered = doctors.filter(d => {
  const spec = (d.specialization || "").toLowerCase();
  const name = (d.users?.name    || "").toLowerCase();
  const term = search.toLowerCase();
  const matchSearch = !term || spec.includes(term) || name.includes(term);

  if (filter === "all") return matchSearch;
  return spec === filter && matchSearch;
});

  return (
    <div className="mdr-root" dir={dir}>
      <style>{MDR_CSS}</style>
<UnifiedNavbar
  isAr={isAr}
  onBack={() => navigate(-1)}
  pageTitle={isAr ? "الأطباء المتخصصون" : "Medical Specialists"}
/>

      <main className="mdr-main">
        {/* Hero */}
        <div className="mdr-hero">
          <h2>{isAr ? "احجزي موعدك مع أفضل الأطباء" : "Book your appointment with top doctors"}</h2>
          <p>{isAr ? "شبكة من الأطباء المعتمدين لمرافقتك في كل مرحلة" : "A certified network ready to support every stage of your journey"}</p>

          {/* Search */}
          <div className="mdr-search-wrap">
            <i className="fas fa-search mdr-search-icon" />
            <input
              className="mdr-search"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={isAr ? "ابحثي عن طبيب أو تخصص..." : "Search by name or specialty..."}
            />
            {search && (
              <button className="mdr-search-clear" onClick={() => setSearch("")}>
                <i className="fas fa-times" />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
      <div className="mdr-filters">
  {FILTER_GROUPS.map(f => (
    <button
      key={f.value}
      className={`mdr-filter-btn ${filter === f.value ? "active" : ""}`}
      onClick={() => setFilter(f.value)}
    >
      {isAr ? f.ar : f.en}
      {f.value === "all" && (
        <span className="mdr-filter-count">{doctors.length}</span>
      )}
    </button>
  ))}
</div>

        {/* Grid */}
        {loading ? (
          <div className="mdr-loading"><div className="mdr-spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="mdr-empty">
            <i className="fas fa-user-md" />
            <p>{isAr ? "لا يوجد أطباء في هذا التخصص" : "No doctors in this specialty"}</p>
          </div>
        ) : (
          <div className="mdr-grid">
            {filtered.map(doc => (
              <DoctorCard
                key={doc.doctor_id}
                doc={doc}
                isAr={isAr}
                myRating={myRatings[doc.doctor_id] || 0}
                onBook={() => setBookingDoc(doc)}
                onRate={() => setRatingDoc(doc)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      {bookingDoc && (
        <BookingModal
          doc={bookingDoc}
          isAr={isAr}
          user={user}
          children={children}
          onClose={() => setBookingDoc(null)}
          onSuccess={() => { setBookingDoc(null); navigate("/mother"); }}
        />
      )}

      {ratingDoc && (
        <RatingModal
          doc={ratingDoc}
          isAr={isAr}
          user={user}
          existing={myRatings[ratingDoc.doctor_id] || 0}
          onClose={() => setRatingDoc(null)}
          onSuccess={(docId, rating) => {
            setMyRatings(p => ({ ...p, [docId]: rating }));
            fetchDoctors();
            setRatingDoc(null);
          }}
        />
      )}
    </div>
  );
};

// ════════════════════════════════════════════════
// DOCTOR CARD
// ════════════════════════════════════════════════
const DoctorCard = ({ doc, isAr, myRating, onBook, onRate }) => {
  const name   = doc.users?.name || (isAr ? "طبيب" : "Doctor");
  const avatar = doc.image || doc.users?.avatar_url;
  const bio    = doc.bio || "";

  return (
    <div className="mdr-card">
      {/* Top */}
      <div className="mdr-card-top">
        <div className="mdr-avatar-wrap">
          {avatar
            ? <img src={avatar} alt={name} className="mdr-avatar" />
            : <div className="mdr-avatar-init">{name.charAt(0)}</div>}
          <div className="mdr-online-dot" />
        </div>
        <div className="mdr-card-rating-col">
          <Stars rating={doc.avgRating} />
          <span className="mdr-avg">{doc.avgRating > 0 ? doc.avgRating.toFixed(1) : "—"}</span>
          <span className="mdr-total">({doc.totalRatings} {isAr ? "تقييم" : "reviews"})</span>
          {myRating > 0 && (
            <span className="mdr-my-rating">
              <i className="fas fa-check-circle" />
              {isAr ? `قيّمتِه ${myRating}★` : `You rated ${myRating}★`}
            </span>
          )}
        </div>
      </div>

      <h3 className="mdr-card-name">{name}</h3>
      <p className="mdr-card-spec">{doc.specialization}</p>

      {bio && (
        <p className="mdr-card-bio">
          {bio.length > 100 ? bio.slice(0, 100) + "…" : bio}
        </p>
      )}

      {/* Meta */}
      <div className="mdr-card-meta">
        {doc.experience_years && (
          <span className="mdr-meta-pill">
            <i className="fas fa-briefcase" />
            {doc.experience_years} {isAr ? "سنة" : "yrs"}
          </span>
        )}
        {doc.certifications && (
          <span className="mdr-meta-pill">
            <i className="fas fa-certificate" />
            {isAr ? "معتمد" : "Certified"}
          </span>
        )}
        {doc.availability_schedule && (
          <span className="mdr-meta-pill">
            <i className="fas fa-clock" />
            {doc.availability_schedule.slice(0, 20)}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="mdr-card-actions">
        <button className="mdr-btn-book" onClick={onBook}>
          <i className="fas fa-calendar-plus" />
          {isAr ? "احجزي موعداً" : "Book Appointment"}
        </button>
        <button className="mdr-btn-rate" onClick={onRate} title={isAr ? "تقييم" : "Rate"}>
          <i className="fas fa-star" />
        </button>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════
// BOOKING MODAL
// ════════════════════════════════════════════════
const BookingModal = ({ doc, isAr, user, children, onClose, onSuccess }) => {
  const docName = doc.users?.name || (isAr ? "الطبيب" : "Doctor");

  const [form, setForm] = useState({
    type:             "consultation",
    appointment_date: "",
    appointment_time: "10:00",
    child_id:         children[0]?.child_id || "",
    notes:            "",
  });
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");

  const handleSave = async () => {
    if (!form.appointment_date) {
      setError(isAr ? "يرجى اختيار التاريخ" : "Please select a date");
      return;
    }
    if (!user) {
      setError(isAr ? "يجب تسجيل الدخول أولاً" : "Please login first");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const dateTime = new Date(`${form.appointment_date}T${form.appointment_time}:00`);

      const payload = {
        mother_id:        user.user_id,
        doctor_id:        doc.doctor_id,
        appointment_date: dateTime.toISOString(),
        type:             form.type,
        status:           "pending",
        notes:            form.notes || null,
      };

      // أضيفي child_id فقط إذا كان موجوداً
      if (form.child_id) payload.child_id = form.child_id;

      const { error: dbErr } = await supabase
        .from("appointments")
        .insert(payload);

      if (dbErr) throw dbErr;

      // إشعار للطبيب
      await supabase.from("notifications").insert({
        user_id:           doc.doctor_id,
        message:           isAr
          ? `طلب موعد جديد من ${user.name || "أم"}`
          : `New appointment request from ${user.name || "a mother"}`,
        notification_type: "appointment",
        related_type:      "appointment",
      });

      setSuccess(true);
      setTimeout(() => onSuccess(), 1500);
    } catch (err) {
      setError(err.message || (isAr ? "حدث خطأ" : "An error occurred"));
    } finally {
      setSaving(false);
    }
  };

  // minimum date = today
  const today = new Date().toISOString().split("T")[0];
  const typeLabels = isAr ? APPOINTMENT_TYPES.ar : APPOINTMENT_TYPES.en;

  return (
    <div className="mdr-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mdr-modal" dir={isAr ? "rtl" : "ltr"}>

        {/* Head */}
        <div className="mdr-modal-head">
          <div className="mdr-modal-head-info">
            <div className="mdr-modal-avatar">
              {(doc.image || doc.users?.avatar_url)
                ? <img src={doc.image || doc.users?.avatar_url} alt={docName} />
                : <div className="mdr-modal-avatar-init">{docName.charAt(0)}</div>}
            </div>
            <div>
              <h2>{isAr ? "حجز موعد" : "Book Appointment"}</h2>
              <p>{docName} — {doc.specialization}</p>
            </div>
          </div>
          <button className="mdr-modal-close" onClick={onClose}>
            <i className="fas fa-times" />
          </button>
        </div>

        {success ? (
          <div className="mdr-success-state">
            <div className="mdr-success-icon"><i className="fas fa-check-circle" /></div>
            <h3>{isAr ? "تم إرسال طلب الموعد!" : "Appointment request sent!"}</h3>
            <p>{isAr ? "سيتواصل معكِ الطبيب لتأكيد الموعد." : "The doctor will confirm your appointment."}</p>
          </div>
        ) : (
          <>
            {/* Appointment Type */}
            <div className="mdr-modal-field">
              <label>{isAr ? "نوع الموعد" : "Appointment Type"}</label>
              <div className="mdr-type-tabs">
                {Object.entries(typeLabels).map(([key, lbl]) => (
                  <button
                    key={key}
                    type="button"
                    className={`mdr-type-tab ${form.type === key ? "active" : ""}`}
                    onClick={() => setForm(p => ({ ...p, type: key }))}
                  >
                    {key === "checkup"      && <i className="fas fa-stethoscope" />}
                    {key === "vaccination"  && <i className="fas fa-syringe" />}
                    {key === "consultation" && <i className="fas fa-comments" />}
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            {/* Date + Time */}
            <div className="mdr-modal-two-col">
              <div className="mdr-modal-field">
                <label><i className="fas fa-calendar" /> {isAr ? "التاريخ" : "Date"}</label>
                <input
                  type="date"
                  className="mdr-modal-input"
                  min={today}
                  value={form.appointment_date}
                  onChange={e => setForm(p => ({ ...p, appointment_date: e.target.value }))}
                />
              </div>
              <div className="mdr-modal-field">
                <label><i className="fas fa-clock" /> {isAr ? "الوقت" : "Time"}</label>
                <input
                  type="time"
                  className="mdr-modal-input"
                  value={form.appointment_time}
                  onChange={e => setForm(p => ({ ...p, appointment_time: e.target.value }))}
                />
              </div>
            </div>

            {/* Child selector — اختياري */}
            {children.length > 0 && (
              <div className="mdr-modal-field">
                <label><i className="fas fa-baby" /> {isAr ? "الطفل (اختياري)" : "Child (optional)"}</label>
                <select
                  className="mdr-modal-input"
                  value={form.child_id}
                  onChange={e => setForm(p => ({ ...p, child_id: e.target.value }))}
                >
                  <option value="">{isAr ? "— بدون طفل —" : "— No child —"}</option>
                  {children.map(c => (
                    <option key={c.child_id} value={c.child_id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Notes */}
            <div className="mdr-modal-field">
              <label><i className="fas fa-sticky-note" /> {isAr ? "ملاحظات (اختياري)" : "Notes (optional)"}</label>
              <textarea
                className="mdr-modal-input"
                rows="3"
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder={isAr ? "اكتبي أي ملاحظات للطبيب..." : "Any notes for the doctor..."}
              />
            </div>

            {error && <div className="mdr-error">{error}</div>}

            <div className="mdr-modal-actions">
              <button className="mdr-btn-cancel" onClick={onClose}>
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button className="mdr-btn-confirm" onClick={handleSave} disabled={saving}>
                {saving
                  ? <><i className="fas fa-spinner fa-spin" /> {isAr ? "جارٍ الإرسال..." : "Sending..."}</>
                  : <><i className="fas fa-paper-plane" /> {isAr ? "إرسال الطلب" : "Send Request"}</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════
// RATING MODAL
// ════════════════════════════════════════════════
const RatingModal = ({ doc, isAr, user, existing, onClose, onSuccess }) => {
  const docName = doc.users?.name || (isAr ? "الطبيب" : "Doctor");
  const [rating,  setRating]  = useState(existing || 0);
  const [hover,   setHover]   = useState(0);
  const [review,  setReview]  = useState("");
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (!rating) return;
    if (!user) return;
    setSaving(true);
const { data: { user: authUser } } = await supabase.auth.getUser();

const { error } = await supabase
  .from("doctor_ratings")
  .upsert(
    {
      doctor_id: doc.doctor_id,
      user_id: user.user_id, // هذا صحيح — user_id من جدول users
      rating,
      review: review || null,
    },
    { onConflict: "doctor_id,user_id" }
  );

    setSaving(false);
    if (!error) {
      setSuccess(true);
      setTimeout(() => onSuccess(doc.doctor_id, rating), 1200);
    }
  };

  return (
    <div className="mdr-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mdr-modal mdr-modal-sm" dir={isAr ? "rtl" : "ltr"}>

        <div className="mdr-modal-head">
          <h2>
            <i className="fas fa-star" style={{ color: "#FFD700" }} />
            {isAr ? " تقييم الطبيب" : " Rate Doctor"}
          </h2>
          <button className="mdr-modal-close" onClick={onClose}>
            <i className="fas fa-times" />
          </button>
        </div>

        {success ? (
          <div className="mdr-success-state">
            <div className="mdr-success-icon"><i className="fas fa-check-circle" /></div>
            <h3>{isAr ? "شكراً على تقييمك!" : "Thank you for your rating!"}</h3>
          </div>
        ) : (
          <>
            <p className="mdr-rate-doctor-name">{docName}</p>

            {/* Interactive Stars */}
            <div className="mdr-rate-stars">
              {[1, 2, 3, 4, 5].map(n => (
                <i
                  key={n}
                  className="fas fa-star"
                  style={{
                    fontSize: "2.2rem",
                    color: n <= (hover || rating) ? "#FFD700" : "#e0e0e0",
                    cursor: "pointer",
                    transition: "color 0.2s, transform 0.15s",
                    transform: n <= (hover || rating) ? "scale(1.15)" : "scale(1)",
                  }}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(n)}
                />
              ))}
            </div>

            {rating > 0 && (
              <p className="mdr-rate-label">
                {isAr
                  ? ["", "ضعيف 😕", "مقبول 😐", "جيد 🙂", "جيد جداً 😊", "ممتاز ⭐"][rating]
                  : ["", "Poor 😕", "Fair 😐", "Good 🙂", "Very Good 😊", "Excellent ⭐"][rating]}
              </p>
            )}

            <div className="mdr-modal-field" style={{ marginTop: 16 }}>
              <label>{isAr ? "تعليق (اختياري)" : "Review (optional)"}</label>
              <textarea
                className="mdr-modal-input"
                rows="3"
                value={review}
                onChange={e => setReview(e.target.value)}
                placeholder={isAr ? "شاركي تجربتك مع الطبيب..." : "Share your experience..."}
              />
            </div>

            <div className="mdr-modal-actions">
              <button className="mdr-btn-cancel" onClick={onClose}>
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button
                className="mdr-btn-confirm"
                onClick={handleSave}
                disabled={saving || !rating}
                style={{ background: !rating ? "#ddd" : undefined }}
              >
                {saving
                  ? <i className="fas fa-spinner fa-spin" />
                  : <><i className="fas fa-save" /> {isAr ? "حفظ التقييم" : "Save Rating"}</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════
// CSS
// ════════════════════════════════════════════════
const MDR_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Poppins:wght@400;600;700;800&display=swap');

.mdr-root {
  min-height: 100vh;
  background: #FBF9F8;
  font-family: 'Cairo', 'Poppins', sans-serif;
  color: #333;
}





/* ── MAIN ── */
.mdr-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 36px 24px 60px;
}

/* ── HERO ── */
.mdr-hero {
  text-align: center;
  margin-bottom: 40px;
}
.mdr-hero h2 {
  font-size: clamp(1.5rem, 3vw, 2.2rem);
  font-weight: 800;
  color: #1a1a2e;
  margin-bottom: 10px;
}
.mdr-hero p {
  color: #888;
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 24px;
}

/* ── SEARCH ── */
.mdr-search-wrap {
  position: relative;
  max-width: 500px;
  margin: 0 auto;
}
.mdr-search-icon {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  color: #d68b9d;
  font-size: 0.9rem;
  pointer-events: none;
}
[dir="ltr"] .mdr-search-icon { left: 16px; }
[dir="rtl"] .mdr-search-icon { right: 16px; }

.mdr-search {
  width: 100%;
  padding: 13px 44px;
  border-radius: 50px;
  border: 2px solid #fdf2f5;
  background: #fff;
  font-family: inherit;
  font-size: 0.9rem;
  outline: none;
  box-shadow: 0 4px 18px rgba(214,139,157,0.1);
  transition: 0.3s;
}
.mdr-search:focus { border-color: #eab8c6; }

.mdr-search-clear {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: #f2e1e4;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  color: #d68b9d;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  transition: 0.2s;
}
[dir="ltr"] .mdr-search-clear { right: 12px; }
[dir="rtl"] .mdr-search-clear { left: 12px; }
.mdr-search-clear:hover { background: #eab8c6; color: #fff; }

/* ── FILTERS ── */
.mdr-filters {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 36px;
}
.mdr-filter-btn {
  background: #fff;
  border: 2px solid #fdf2f5;
  padding: 8px 20px;
  border-radius: 30px;
  color: #555;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  font-family: inherit;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 7px;
}
.mdr-filter-btn:hover { border-color: #eab8c6; color: #d68b9d; }
.mdr-filter-btn.active {
  background: #eab8c6;
  color: #fff;
  border-color: #eab8c6;
  box-shadow: 0 5px 15px rgba(234,184,198,0.4);
}
.mdr-filter-count {
  background: rgba(255,255,255,0.4);
  padding: 1px 7px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 700;
}
.mdr-filter-btn:not(.active) .mdr-filter-count {
  background: #f2e1e4;
  color: #d68b9d;
}

/* ── GRID ── */
.mdr-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 22px;
}

/* ── CARD ── */
.mdr-card {
  background: #fff;
  border-radius: 22px;
  padding: 26px 20px 20px;
  border: 1px solid #fdf2f5;
  box-shadow: 0 4px 18px rgba(0,0,0,0.04);
  display: flex;
  flex-direction: column;
  transition: transform 0.35s, box-shadow 0.35s;
  animation: mdr-fadeup 0.5s ease both;
}
.mdr-card:hover {
  transform: translateY(-7px);
  box-shadow: 0 14px 36px rgba(214,139,157,0.15);
}
@keyframes mdr-fadeup {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

.mdr-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

/* Avatar */
.mdr-avatar-wrap { position: relative; width: 70px; height: 70px; }
.mdr-avatar, .mdr-avatar-init {
  width: 70px; height: 70px;
  border-radius: 50%; object-fit: cover;
  border: 3px solid #fff;
  box-shadow: 0 4px 12px rgba(214,139,157,0.2);
}
.mdr-avatar-init {
  background: linear-gradient(135deg, #eab8c6, #d68b9d);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem; font-weight: 800; color: #fff;
}
.mdr-online-dot {
  position: absolute; bottom: 2px; right: 2px;
  width: 12px; height: 12px;
  background: #2ecc71; border-radius: 50%; border: 2px solid #fff;
}

/* Rating col */
.mdr-card-rating-col {
  display: flex; flex-direction: column; align-items: flex-end; gap: 2px;
}
.mdr-stars { color: #FFD700; font-size: 0.78rem; letter-spacing: 0.5px; }
.mdr-avg   { font-size: 1rem; font-weight: 800; color: #333; }
.mdr-total { font-size: 0.7rem; color: #aaa; font-weight: 500; }
.mdr-my-rating {
  font-size: 0.68rem; font-weight: 700; color: #2ecc71;
  background: #f0faf4; padding: 2px 8px; border-radius: 10px;
  display: flex; align-items: center; gap: 4px; margin-top: 2px;
}

.mdr-card-name { font-size: 1.05rem; font-weight: 800; color: #1a1a2e; margin-bottom: 3px; }
.mdr-card-spec { color: #d68b9d; font-size: 0.82rem; font-weight: 700; margin-bottom: 10px; }
.mdr-card-bio  { color: #777; font-size: 0.82rem; line-height: 1.6; margin-bottom: 14px; flex-grow: 1; }

/* Meta pills */
.mdr-card-meta { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
.mdr-meta-pill {
  background: #fdf2f5; color: #d68b9d;
  padding: 3px 10px; border-radius: 18px;
  font-size: 0.72rem; font-weight: 700;
  display: flex; align-items: center; gap: 4px;
}

/* Actions */
.mdr-card-actions { display: flex; gap: 8px; }
.mdr-btn-book {
  flex: 1;
  background: #eab8c6; color: #fff; border: none;
  padding: 11px 14px; border-radius: 14px;
  font-family: inherit; font-weight: 700; font-size: 0.85rem;
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 7px;
  transition: 0.3s; box-shadow: 0 4px 12px rgba(234,184,198,0.3);
}
.mdr-btn-book:hover { background: #d68b9d; transform: translateY(-1px); }
.mdr-btn-rate {
  background: #fff8e1; color: #f1c40f; border: none;
  width: 42px; border-radius: 14px; cursor: pointer;
  font-size: 1rem; transition: 0.3s;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid #fce4a0;
}
.mdr-btn-rate:hover { background: #f1c40f; color: #fff; }

/* ── LOADING / EMPTY ── */
.mdr-loading { text-align: center; padding: 80px 20px; }
.mdr-spinner {
  width: 44px; height: 44px; border: 4px solid #fdf2f5;
  border-top-color: #eab8c6; border-radius: 50%;
  animation: mdr-spin 0.8s linear infinite; margin: 0 auto;
}
@keyframes mdr-spin { to { transform: rotate(360deg); } }
.mdr-empty { text-align: center; padding: 80px 20px; color: #ccc; }
.mdr-empty i { font-size: 3rem; display: block; margin-bottom: 14px; color: #eab8c6; }
.mdr-empty p { font-size: 0.9rem; font-weight: 600; color: #aaa; }

/* ── OVERLAY ── */
.mdr-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 3000; padding: 16px;
}

/* ── MODAL ── */
.mdr-modal {
  background: #fff; width: 100%; max-width: 500px;
  border-radius: 24px; padding: 28px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.15);
  max-height: 90vh; overflow-y: auto;
  animation: mdr-modalIn 0.3s ease;
}
.mdr-modal-sm { max-width: 380px; }
@keyframes mdr-modalIn {
  from { opacity: 0; transform: translateY(20px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.mdr-modal-head {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 22px;
}
.mdr-modal-head-info { display: flex; align-items: center; gap: 12px; }
.mdr-modal-head h2 { font-size: 1.15rem; font-weight: 800; color: #1a1a2e; margin: 0; }
.mdr-modal-head p  { font-size: 0.8rem; color: #d68b9d; font-weight: 600; margin: 3px 0 0; }
.mdr-modal-avatar { width: 46px; height: 46px; border-radius: 50%; overflow: hidden; }
.mdr-modal-avatar img { width: 100%; height: 100%; object-fit: cover; }
.mdr-modal-avatar-init {
  width: 46px; height: 46px; border-radius: 50%;
  background: linear-gradient(135deg, #eab8c6, #d68b9d);
  color: #fff; display: flex; align-items: center; justify-content: center;
  font-size: 1.2rem; font-weight: 800;
}
.mdr-modal-close {
  background: none; border: none; font-size: 1.3rem;
  color: #bbb; cursor: pointer; transition: 0.3s;
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}
.mdr-modal-close:hover { color: #e74c3c; background: #fef0f0; transform: rotate(90deg); }

/* Modal fields */
.mdr-modal-field { margin-bottom: 16px; }
.mdr-modal-field label {
  display: block; font-size: 0.85rem; font-weight: 700;
  color: #333; margin-bottom: 7px;
  display: flex; align-items: center; gap: 6px;
}
.mdr-modal-field label i { color: #d68b9d; font-size: 0.82rem; }
.mdr-modal-input {
  width: 100%; padding: 11px 14px; border-radius: 12px;
  border: 1.5px solid #eee; outline: none;
  font-family: inherit; font-size: 0.88rem;
  background: #fafafa; transition: 0.3s; resize: vertical;
}
.mdr-modal-input:focus {
  border-color: #eab8c6; background: #fff;
  box-shadow: 0 0 0 3px rgba(234,184,198,0.15);
}
.mdr-modal-two-col {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;
}

/* Type tabs */
.mdr-type-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
.mdr-type-tab {
  flex: 1; padding: 9px 10px; border-radius: 12px;
  border: 2px solid #eee; background: #fafafa;
  font-family: inherit; font-weight: 700; font-size: 0.8rem;
  cursor: pointer; transition: 0.3s; color: #888;
  display: flex; align-items: center; justify-content: center; gap: 6px;
}
.mdr-type-tab.active { border-color: #eab8c6; background: #fdf2f5; color: #d68b9d; }
.mdr-type-tab:hover  { border-color: #eab8c6; color: #d68b9d; }

/* Modal actions */
.mdr-modal-actions {
  display: flex; gap: 10px; margin-top: 20px;
}
.mdr-btn-cancel {
  flex: 1; background: #f4f4f4; color: #888; border: none;
  padding: 12px; border-radius: 14px; font-family: inherit;
  font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: 0.3s;
}
.mdr-btn-cancel:hover { background: #eee; }
.mdr-btn-confirm {
  flex: 2; background: #eab8c6; color: #fff; border: none;
  padding: 12px; border-radius: 14px; font-family: inherit;
  font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: 0.3s;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  box-shadow: 0 4px 14px rgba(234,184,198,0.35);
}
.mdr-btn-confirm:hover:not(:disabled) { background: #d68b9d; transform: translateY(-1px); }
.mdr-btn-confirm:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }

/* Error */
.mdr-error {
  background: #fef0f0; color: #e74c3c; padding: 10px 14px;
  border-radius: 10px; font-size: 0.82rem; font-weight: 700;
  margin-bottom: 12px; display: flex; align-items: center; gap: 7px;
}

/* Success */
.mdr-success-state {
  text-align: center; padding: 32px 16px;
}
.mdr-success-icon {
  font-size: 3.5rem; color: #2ecc71;
  margin-bottom: 16px; animation: mdr-popIn 0.4s ease;
}
@keyframes mdr-popIn {
  from { transform: scale(0); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}
.mdr-success-state h3 { font-size: 1.1rem; font-weight: 800; color: #1a1a2e; margin-bottom: 8px; }
.mdr-success-state p  { color: #888; font-size: 0.88rem; font-weight: 600; }

/* Rating modal */
.mdr-rate-doctor-name {
  text-align: center; font-size: 1rem; font-weight: 800;
  color: #d68b9d; margin-bottom: 16px;
}
.mdr-rate-stars {
  display: flex; justify-content: center; gap: 10px;
  margin-bottom: 10px;
}
.mdr-rate-label {
  text-align: center; font-size: 0.95rem; font-weight: 700;
  color: #f39c12; margin-bottom: 8px;
}

/* ── RESPONSIVE ── */
@media (max-width: 768px) {
  .mdr-main { padding: 24px 16px 40px; }
  .mdr-grid { grid-template-columns: 1fr 1fr; gap: 14px; }
  .mdr-card { padding: 18px 14px 16px; }
  .mdr-modal-two-col { grid-template-columns: 1fr; }
  .mdr-header { padding: 0 16px; }
  .mdr-header-spacer { width: 60px; }
}
@media (max-width: 480px) {
  .mdr-grid { grid-template-columns: 1fr; }
}
`;

export default MotherDoctorsPage;