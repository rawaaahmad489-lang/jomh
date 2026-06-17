// src/components/mother/AddChildModal.jsx
import { useState } from "react";
import { supabase } from "../../../services/supabaseClient";

const AddChildModal = ({ isOpen, onClose, userId, isAr, onSuccess }) => {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    gender: "male",
    birth_date: "",
    blood_type: "",
    feeding_method: "breastfeeding",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!userId || !form.name || !form.birth_date) return;
    setSaving(true);

    try {
      const { error } = await supabase.from("children").insert({
        mother_id: userId,
        name: form.name,
        gender: form.gender,
        birth_date: form.birth_date,
        blood_type: form.blood_type || null,
        feeding_method: form.feeding_method,
      });

      if (error) throw error;

      // Reset form
      setForm({ name: "", gender: "male", birth_date: "", blood_type: "", feeding_method: "breastfeeding" });
      onSuccess();
    } catch (err) {
      console.error("Add child error:", err);
      alert(isAr ? "حدث خطأ عند إضافة الطفل" : "Error adding child");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const t = {
    title: isAr ? "إضافة طفل جديد 👶" : "Add New Child 👶",
    name: isAr ? "اسم الطفل" : "Child's Name",
    namePlaceholder: isAr ? "مثال: يوسف، سارة" : "e.g. Adam, Emma",
    gender: isAr ? "الجنس" : "Gender",
    male: isAr ? "ذكر 👦" : "Male 👦",
    female: isAr ? "أنثى 👧" : "Female 👧",
    birthDate: isAr ? "تاريخ الميلاد" : "Date of Birth",
    bloodType: isAr ? "فصيلة الدم (اختياري)" : "Blood Type (optional)",
    feedingMethod: isAr ? "طريقة الرضاعة" : "Feeding Method",
    breastfeeding: isAr ? "رضاعة طبيعية 🤱" : "Breastfeeding 🤱",
    formula: isAr ? "حليب صناعي 🍼" : "Formula 🍼",
    mixed: isAr ? "مختلطة 🔀" : "Mixed 🔀",
    save: isAr ? "إضافة الطفل" : "Add Child",
    saving: isAr ? "جارٍ الحفظ..." : "Saving...",
    required: isAr ? "* مطلوب" : "* Required",
  };

  return (
    <div className="modal-overlay active">
      <div className="add-child-modal" dir={isAr ? "rtl" : "ltr"}>
        <div className="modal-head">
          <h2>{t.title}</h2>
          <button onClick={onClose}><i className="fas fa-times" /></button>
        </div>

        <form onSubmit={handleSave}>
          {/* Name */}
          <div className="ach-field">
            <label>
              {t.name} <span className="req-star">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder={t.namePlaceholder}
              required
              className="ach-input"
            />
          </div>

          {/* Gender */}
          <div className="ach-field">
            <label>{t.gender}</label>
            <div className="gender-tabs">
              {[{ val: "male", lbl: t.male }, { val: "female", lbl: t.female }].map((g) => (
                <button
                  key={g.val}
                  type="button"
                  className={`gender-tab ${form.gender === g.val ? "active" : ""}`}
                  onClick={() => setForm((p) => ({ ...p, gender: g.val }))}
                >
                  {g.lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Birth Date */}
          <div className="ach-field">
            <label>
              {t.birthDate} <span className="req-star">*</span>
            </label>
            <input
              type="date"
              name="birth_date"
              value={form.birth_date}
              onChange={handleChange}
              required
              max={new Date().toISOString().split("T")[0]}
              className="ach-input"
            />
          </div>

          {/* Blood Type */}
          <div className="ach-field">
            <label>{t.bloodType}</label>
            <select name="blood_type" value={form.blood_type} onChange={handleChange} className="ach-input">
              <option value="">{isAr ? "—اختر—" : "—Select—"}</option>
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bt) => (
                <option key={bt} value={bt}>{bt}</option>
              ))}
            </select>
          </div>

          {/* Feeding Method */}
          <div className="ach-field">
            <label>{t.feedingMethod}</label>
            <div className="feeding-tabs">
              {[
                { val: "breastfeeding", lbl: t.breastfeeding },
                { val: "formula", lbl: t.formula },
                { val: "mixed", lbl: t.mixed },
              ].map((f) => (
                <button
                  key={f.val}
                  type="button"
                  className={`feeding-tab ${form.feeding_method === f.val ? "active" : ""}`}
                  onClick={() => setForm((p) => ({ ...p, feeding_method: f.val }))}
                >
                  {f.lbl}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary ach-save-btn"
            disabled={saving || !form.name || !form.birth_date}
          >
            {saving ? (
              <><i className="fas fa-spinner fa-spin" /> {t.saving}</>
            ) : (
              <><i className="fas fa-baby" /> {t.save}</>
            )}
          </button>
        </form>
      </div>

      <style>{`
        .add-child-modal {
          background: white; width: 100%; max-width: 430px;
          border-radius: 25px; padding: 35px;
          box-shadow: 0 20px 50px rgba(0,0,0,.15);
          max-height: 90vh; overflow-y: auto;
          font-family: 'Poppins', sans-serif;
        }
        .ach-field { margin-bottom: 18px; }
        .ach-field label {
          display: block; margin-bottom: 8px;
          font-size: .88rem; font-weight: 700; color: #333;
        }
        .req-star { color: #d68b9d; }
        .ach-input {
          width: 100%; padding: 11px 14px; border-radius: 12px;
          border: 1px solid #ddd; outline: none;
          font-family: 'Poppins'; font-size: .88rem;
          background: #fafafa; transition: .3s;
        }
        .ach-input:focus {
          border-color: #eab8c6; background: white;
          box-shadow: 0 0 0 3px #fdf2f5;
        }
        .gender-tabs { display: flex; gap: 10px; }
        .gender-tab {
          flex: 1; padding: 11px; border-radius: 12px;
          border: 2px solid #eee; background: #fafafa;
          font-family: 'Poppins'; font-weight: 700; font-size: .88rem;
          cursor: pointer; transition: .3s; color: #777;
        }
        .gender-tab.active {
          border-color: #d68b9d; background: #fdf2f5; color: #d68b9d;
        }
        .feeding-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
        .feeding-tab {
          flex: 1; padding: 10px 8px; border-radius: 12px;
          border: 2px solid #eee; background: #fafafa;
          font-family: 'Poppins'; font-weight: 700; font-size: .78rem;
          cursor: pointer; transition: .3s; color: #777; white-space: nowrap;
        }
        .feeding-tab.active {
          border-color: #eab8c6; background: #fdf2f5; color: #d68b9d;
        }
        .ach-save-btn {
          width: 100%; justify-content: center; margin-top: 5px;
          font-size: 1rem; padding: 13px;
        }
        .ach-save-btn:disabled { opacity: .65; cursor: not-allowed; transform: none !important; }
      `}</style>
    </div>
  );
};

export default AddChildModal;