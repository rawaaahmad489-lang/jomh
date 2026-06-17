// src/pages/mother/AppointmentsPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMotherData } from "../../hooks/useMotherData";
import { useAppointments } from "../../hooks/useAppointments";

const STATUS_COLORS = {
  pending:   { bg: "#fff8f0", color: "#f39c12" },
  confirmed: { bg: "#f0faf4", color: "#2ecc71" },
  cancelled: { bg: "#fef0f0", color: "#e74c3c" },
  completed: { bg: "#f0f0f0", color: "#888"    },
};

const AppointmentsPage = () => {
  const { i18n } = useTranslation();
  const navigate  = useNavigate();
  const isAr = i18n.language === "ar";
  const dir  = isAr ? "rtl" : "ltr";

  const { user, children } = useMotherData();
  const { appointments, doctors, loading, bookAppointment, cancelAppointment } = useAppointments(user?.user_id);

  const [tab, setTab]         = useState("upcoming"); // upcoming | past
  const [bookOpen, setBookOpen] = useState(false);
  const [form, setForm] = useState({
    doctor_id: "", child_id: "", date: "", time: "10:00", type: "checkup", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const now = new Date();
  const upcoming = appointments.filter(a => new Date(a.appointment_date) >= now && a.status !== "cancelled");
  const past     = appointments.filter(a => new Date(a.appointment_date) < now  || a.status === "cancelled");

  const handleBook = async (e) => {
    e.preventDefault();
    if (!form.doctor_id || !form.date) return;
    setSaving(true);
    const datetime = `${form.date}T${form.time}:00`;
    const { error } = await bookAppointment({
      doctorId: form.doctor_id,
      childId:  form.child_id || null,
      date:     datetime,
      type:     form.type,
      notes:    form.notes,
    });
    setSaving(false);
    if (!error) {
      setMsg(isAr ? "تم حجز الموعد بنجاح ✅" : "Appointment booked successfully ✅");
      setBookOpen(false);
      setForm({ doctor_id: "", child_id: "", date: "", time: "10:00", type: "checkup", notes: "" });
      setTimeout(() => setMsg(""), 3000);
    } else {
      alert(isAr ? "حدث خطأ" : "Error booking");
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm(isAr ? "هل تريدين إلغاء هذا الموعد؟" : "Cancel this appointment?")) return;
    await cancelAppointment(id);
  };

  const T = {
    title:       isAr ? "مواعيدي" : "My Appointments",
    book:        isAr ? "حجز موعد جديد" : "Book New Appointment",
    upcoming:    isAr ? "القادمة" : "Upcoming",
    past:        isAr ? "السابقة" : "Past",
    noUpcoming:  isAr ? "لا توجد مواعيد قادمة" : "No upcoming appointments",
    noPast:      isAr ? "لا توجد مواعيد سابقة" : "No past appointments",
    cancel:      isAr ? "إلغاء" : "Cancel",
    doctor:      isAr ? "اختاري الطبيب *" : "Select Doctor *",
    child:       isAr ? "الطفل المعني (اختياري)" : "Child (optional)",
    date:        isAr ? "تاريخ الموعد *" : "Appointment Date *",
    time:        isAr ? "الوقت" : "Time",
    type:        isAr ? "نوع الموعد" : "Appointment Type",
    notes:       isAr ? "ملاحظات" : "Notes",
    save:        isAr ? "تأكيد الحجز" : "Confirm Booking",
    saving:      isAr ? "جارٍ الحجز..." : "Booking...",
    checkup:     isAr ? "فحص دوري" : "Checkup",
    vaccination: isAr ? "تطعيم" : "Vaccination",
    consultation:isAr ? "استشارة" : "Consultation",
    statusMap: {
      pending:   isAr ? "قيد الانتظار" : "Pending",
      confirmed: isAr ? "مؤكد" : "Confirmed",
      cancelled: isAr ? "ملغى" : "Cancelled",
      completed: isAr ? "مكتمل" : "Completed",
    },
  };

  const display = tab === "upcoming" ? upcoming : past;

  if (loading) return <div className="apt-loading"><div className="apt-spinner" /></div>;

  return (
    <div className="apt-root" dir={dir}>
      <style>{APT_CSS}</style>

      {/* Header */}
      <div className="apt-header">
        <button className="back-btn" onClick={() => navigate("/mother/dashboard")}>
          <i className={`fas fa-arrow-${isAr ? "right" : "left"}`} />
          {isAr ? "العودة" : "Back"}
        </button>
        <h1>{T.title}</h1>
        <button className="book-btn" onClick={() => setBookOpen(true)}>
          <i className="fas fa-calendar-plus" /> {T.book}
        </button>
      </div>

      {msg && <div className="apt-msg">{msg}</div>}

      {/* Tabs */}
      <div className="apt-tabs">
        <button className={`apt-tab ${tab === "upcoming" ? "active" : ""}`} onClick={() => setTab("upcoming")}>
          <i className="fas fa-clock" /> {T.upcoming}
          {upcoming.length > 0 && <span className="tab-badge">{upcoming.length}</span>}
        </button>
        <button className={`apt-tab ${tab === "past" ? "active" : ""}`} onClick={() => setTab("past")}>
          <i className="fas fa-history" /> {T.past}
        </button>
      </div>

      {/* Appointment cards */}
      <div className="apt-list">
        {display.length === 0 ? (
          <div className="apt-empty">
            <span>📅</span>
            <p>{tab === "upcoming" ? T.noUpcoming : T.noPast}</p>
            {tab === "upcoming" && (
              <button className="book-btn" onClick={() => setBookOpen(true)}>
                <i className="fas fa-plus" /> {T.book}
              </button>
            )}
          </div>
        ) : display.map(appt => {
          const d = new Date(appt.appointment_date);
          const sc = STATUS_COLORS[appt.status] || STATUS_COLORS.pending;
          const docName = appt.doctor_profiles?.users?.name || "—";
          const spec    = appt.doctor_profiles?.specialization || "";
          const typeLabel = T[appt.type] || appt.type;
          return (
            <div key={appt.appointment_id} className="apt-card">
              <div className="apt-card-date">
                <span className="apt-day">{d.getDate()}</span>
                <span className="apt-month">{d.toLocaleString(isAr ? "ar-SA" : "en-US", { month: "short" })}</span>
                <span className="apt-year">{d.getFullYear()}</span>
              </div>
              <div className="apt-card-main">
                <div className="apt-card-top">
                  <div>
                    <h3>{typeLabel}</h3>
                    <p className="apt-doc-name"><i className="fas fa-user-md" /> {docName}</p>
                    {spec && <p className="apt-doc-spec">{spec}</p>}
                  </div>
                  <span className="apt-status-badge" style={{ background: sc.bg, color: sc.color }}>
                    {T.statusMap[appt.status]}
                  </span>
                </div>
                <div className="apt-card-meta">
                  <span><i className="fas fa-clock" /> {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  {appt.children?.name && <span><i className="fas fa-baby" /> {appt.children.name}</span>}
                  {appt.notes && <span><i className="fas fa-sticky-note" /> {appt.notes}</span>}
                </div>
                {appt.status === "pending" && tab === "upcoming" && (
                  <button className="apt-cancel-btn" onClick={() => handleCancel(appt.appointment_id)}>
                    <i className="fas fa-times" /> {T.cancel}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Book Modal */}
      {bookOpen && (
        <div className="apt-modal-overlay" onClick={e => e.target === e.currentTarget && setBookOpen(false)}>
          <div className="apt-modal">
            <div className="apt-modal-head">
              <h2>{T.book} 📅</h2>
              <button onClick={() => setBookOpen(false)}><i className="fas fa-times" /></button>
            </div>
            <form onSubmit={handleBook}>
              {/* Doctor */}
              <div className="apt-field">
                <label>{T.doctor}</label>
                <select value={form.doctor_id} onChange={e => setForm(p => ({ ...p, doctor_id: e.target.value }))} required className="apt-input">
                  <option value="">{isAr ? "— اختاري —" : "— Select —"}</option>
                  {doctors.map(doc => (
                    <option key={doc.doctor_id} value={doc.doctor_id}>
                      {doc.users?.name} — {doc.specialization || ""}
                    </option>
                  ))}
                </select>
              </div>
              {/* Child */}
              {children.length > 0 && (
                <div className="apt-field">
                  <label>{T.child}</label>
                  <select value={form.child_id} onChange={e => setForm(p => ({ ...p, child_id: e.target.value }))} className="apt-input">
                    <option value="">{isAr ? "— بدون —" : "— None —"}</option>
                    {children.map(c => <option key={c.child_id} value={c.child_id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              {/* Type */}
              <div className="apt-field">
                <label>{T.type}</label>
                <div className="apt-type-tabs">
                  {["checkup", "vaccination", "consultation"].map(t => (
                    <button key={t} type="button"
                      className={`apt-type-tab ${form.type === t ? "active" : ""}`}
                      onClick={() => setForm(p => ({ ...p, type: t }))}>
                      {T[t]}
                    </button>
                  ))}
                </div>
              </div>
              {/* Date + Time */}
              <div className="apt-row-two">
                <div className="apt-field">
                  <label>{T.date}</label>
                  <input type="date" value={form.date} min={new Date().toISOString().split("T")[0]}
                    onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required className="apt-input" />
                </div>
                <div className="apt-field">
                  <label>{T.time}</label>
                  <input type="time" value={form.time}
                    onChange={e => setForm(p => ({ ...p, time: e.target.value }))} className="apt-input" />
                </div>
              </div>
              {/* Notes */}
              <div className="apt-field">
                <label>{T.notes}</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  className="apt-input" rows="3"
                  placeholder={isAr ? "أي ملاحظات إضافية..." : "Any additional notes..."} />
              </div>
              <button type="submit" className="apt-save-btn" disabled={saving}>
                {saving ? <><i className="fas fa-spinner fa-spin" /> {T.saving}</> : <><i className="fas fa-check" /> {T.save}</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const APT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap');
:root{--primary:#d68b9d;--primary-light:#fdf2f5;--secondary:#eab8c6;--bg:#FBF9F8;--text:#333;--gray:#777;--white:#fff;--shadow:0 4px 18px rgba(0,0,0,.04);}
*{margin:0;padding:0;box-sizing:border-box;font-family:'Poppins',sans-serif;}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.apt-root{min-height:100vh;background:var(--bg);padding:0 0 60px;}
.apt-loading{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);}
.apt-spinner{width:40px;height:40px;border:4px solid #fdf2f5;border-top-color:var(--primary);border-radius:50%;animation:spin .8s linear infinite;}

.apt-header{background:white;padding:18px 30px;display:flex;align-items:center;justify-content:space-between;box-shadow:var(--shadow);border-bottom:1px solid #f0f0f0;flex-wrap:wrap;gap:12px;}
.apt-header h1{font-size:1.5rem;font-weight:800;color:var(--text);}
.back-btn{background:var(--primary-light);color:var(--primary);border:none;padding:9px 16px;border-radius:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;font-family:'Poppins';font-size:.88rem;transition:.3s;}
.back-btn:hover{background:var(--primary);color:white;}
.book-btn{background:var(--primary);color:white;border:none;padding:10px 20px;border-radius:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;font-family:'Poppins';font-size:.88rem;box-shadow:0 4px 15px rgba(214,139,157,.3);transition:.3s;}
.book-btn:hover{background:#c27a8c;transform:translateY(-2px);}
.apt-msg{background:#f0faf4;color:#2ecc71;text-align:center;padding:12px;font-weight:700;font-size:.92rem;}

.apt-tabs{display:flex;background:white;padding:0 30px;border-bottom:1px solid #f0f0f0;gap:0;}
.apt-tab{background:none;border:none;padding:14px 20px;font-family:'Poppins';font-weight:700;font-size:.88rem;color:var(--gray);cursor:pointer;display:flex;align-items:center;gap:8px;border-bottom:3px solid transparent;margin-bottom:-1px;transition:.3s;}
.apt-tab:hover{color:var(--primary);}
.apt-tab.active{color:var(--primary);border-bottom-color:var(--primary);}
.tab-badge{background:var(--primary);color:white;width:20px;height:20px;border-radius:50%;font-size:.7rem;display:inline-flex;align-items:center;justify-content:center;}

.apt-list{max-width:800px;margin:25px auto;padding:0 20px;display:flex;flex-direction:column;gap:16px;}
.apt-empty{text-align:center;padding:60px 20px;color:var(--gray);}
.apt-empty span{font-size:3.5rem;display:block;margin-bottom:14px;}
.apt-empty p{font-size:.95rem;font-weight:600;margin-bottom:20px;}

.apt-card{background:white;border-radius:20px;padding:20px;display:flex;gap:18px;box-shadow:var(--shadow);border:1px solid #f0f0f0;animation:fadeUp .4s ease;transition:.3s;}
.apt-card:hover{box-shadow:0 8px 25px rgba(214,139,157,.12);border-color:var(--secondary);}
.apt-card-date{background:var(--primary-light);border-radius:14px;padding:14px 16px;display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:65px;text-align:center;}
.apt-day{font-size:1.8rem;font-weight:800;color:var(--primary);line-height:1;}
.apt-month{font-size:.75rem;font-weight:700;color:var(--primary);text-transform:uppercase;}
.apt-year{font-size:.7rem;color:#bbb;font-weight:600;}
.apt-card-main{flex:1;}
.apt-card-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;}
.apt-card-top h3{font-size:1rem;font-weight:800;color:var(--text);margin-bottom:4px;}
.apt-doc-name{font-size:.85rem;font-weight:700;color:var(--gray);display:flex;align-items:center;gap:6px;}
.apt-doc-name i{color:var(--primary);}
.apt-doc-spec{font-size:.75rem;color:#bbb;font-weight:600;margin-top:2px;}
.apt-status-badge{font-size:.75rem;font-weight:700;padding:4px 12px;border-radius:20px;white-space:nowrap;}
.apt-card-meta{display:flex;flex-wrap:wrap;gap:12px;margin-top:8px;}
.apt-card-meta span{font-size:.78rem;color:var(--gray);font-weight:600;display:flex;align-items:center;gap:5px;}
.apt-card-meta span i{color:var(--primary);}
.apt-cancel-btn{margin-top:12px;background:#fef0f0;color:#e74c3c;border:none;padding:7px 14px;border-radius:10px;font-weight:700;cursor:pointer;font-family:'Poppins';font-size:.78rem;display:inline-flex;align-items:center;gap:6px;transition:.3s;}
.apt-cancel-btn:hover{background:#e74c3c;color:white;}

/* Modal */
.apt-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:3000;padding:15px;}
.apt-modal{background:white;width:100%;max-width:500px;border-radius:25px;padding:35px;box-shadow:0 20px 50px rgba(0,0,0,.15);max-height:90vh;overflow-y:auto;}
.apt-modal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;}
.apt-modal-head h2{font-size:1.3rem;font-weight:800;color:var(--text);}
.apt-modal-head button{background:none;border:none;font-size:1.4rem;color:var(--gray);cursor:pointer;transition:.3s;}
.apt-modal-head button:hover{color:#e74c3c;transform:rotate(90deg);}
.apt-field{margin-bottom:16px;}
.apt-field label{display:block;font-size:.88rem;font-weight:700;color:var(--text);margin-bottom:7px;}
.apt-input{width:100%;padding:11px 14px;border-radius:12px;border:1px solid #ddd;outline:none;font-family:'Poppins';font-size:.88rem;background:#fafafa;transition:.3s;}
.apt-input:focus{border-color:var(--secondary);background:white;box-shadow:0 0 0 3px var(--primary-light);}
.apt-type-tabs{display:flex;gap:8px;}
.apt-type-tab{flex:1;padding:9px 6px;border-radius:10px;border:2px solid #eee;background:#fafafa;font-family:'Poppins';font-weight:700;font-size:.82rem;cursor:pointer;transition:.3s;color:var(--gray);}
.apt-type-tab.active{border-color:var(--primary);background:var(--primary-light);color:var(--primary);}
.apt-row-two{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.apt-save-btn{width:100%;padding:13px;background:var(--primary);color:white;border:none;border-radius:14px;font-weight:700;font-size:.95rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;font-family:'Poppins';box-shadow:0 4px 15px rgba(214,139,157,.3);transition:.3s;margin-top:8px;}
.apt-save-btn:hover{background:#c27a8c;}
.apt-save-btn:disabled{opacity:.7;cursor:not-allowed;}
@media(max-width:600px){.apt-header{padding:14px 16px;}.apt-list{padding:0 12px;}.apt-card{flex-direction:column;}.apt-card-date{flex-direction:row;gap:8px;justify-content:flex-start;}.apt-type-tabs{flex-wrap:wrap;}.apt-row-two{grid-template-columns:1fr;}}
`;

export default AppointmentsPage;