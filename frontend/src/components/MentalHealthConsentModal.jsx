// src/components/MentalHealthConsentModal.jsx
import { useState } from "react";
import { supabase } from "../services/supabaseClient";

const MentalHealthConsentModal = ({ userId, isAr, onClose, onConsented }) => {
  const [monitoring, setMonitoring] = useState(false);
  const [docAlert,   setDocAlert]   = useState(false);
  const [saving,     setSaving]     = useState(false);

const handleSave = async () => {
  setSaving(true);
  const { data, error } = await supabase
    .from("mother_profiles")
    .update({
      mental_health_monitoring_consent: monitoring,
      doctor_alert_consent:             docAlert,
      consent_updated_at:               new Date().toISOString(),
    })
    .eq("mother_id", userId)
    .select(); // ← أضيفي select لترجعي البيانات

  console.log("✅ Consent saved:", data, "Error:", error); // ← أضيفي هذا
  setSaving(false);
  onConsented({ monitoring, docAlert });
  onClose();
};

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, padding: 16,
    }}>
      <div style={{
        background: "white", borderRadius: 20, padding: 28,
        maxWidth: 440, width: "100%",
        boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
      }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: 8 }}>
          {isAr ? "🌸 خصوصيتكِ تهمّنا" : "🌸 Your Privacy Matters"}
        </h2>
        <p style={{ fontSize: ".85rem", color: "#666", lineHeight: 1.7, marginBottom: 20 }}>
          {isAr
            ? "نظام المتابعة النفسية يُحلّل مزاجكِ ونومكِ فقط لتقديم دعم مناسب. لا يُشخّص هذا النظام أي حالة طبية."
            : "Our wellness monitoring analyses your mood and sleep only to offer timely support. It never diagnoses any condition."}
        </p>

        {/* الموافقة على المراقبة */}
        <label style={{
          display: "flex", gap: 12, alignItems: "flex-start",
          background: "#fdf2f5", borderRadius: 12, padding: "12px 14px",
          marginBottom: 12, cursor: "pointer",
        }}>
          <input
            type="checkbox"
            checked={monitoring}
            onChange={e => setMonitoring(e.target.checked)}
            style={{ marginTop: 3 }}
          />
          <div>
            <div style={{ fontWeight: 800, fontSize: ".9rem" }}>
              {isAr ? "أوافق على متابعة مزاجي وتحليله" : "I agree to mood monitoring and analysis"}
            </div>
            <div style={{ fontSize: ".78rem", color: "#999", marginTop: 3 }}>
              {isAr
                ? "يُحلَّل مزاجكِ محلياً لتقديم محتوى داعم. لا تُشارَك بياناتكِ."
                : "Your mood is analysed to show you supportive content. Data stays private."}
            </div>
          </div>
        </label>

        {/* موافقة تنبيه الطبيب — تظهر فقط عند تفعيل الأولى */}
        {monitoring && (
          <label style={{
            display: "flex", gap: 12, alignItems: "flex-start",
            background: "#f0f8ff", borderRadius: 12, padding: "12px 14px",
            marginBottom: 20, cursor: "pointer",
          }}>
            <input
              type="checkbox"
              checked={docAlert}
              onChange={e => setDocAlert(e.target.checked)}
              style={{ marginTop: 3 }}
            />
            <div>
              <div style={{ fontWeight: 800, fontSize: ".9rem" }}>
                {isAr
                  ? "أوافق على إشعار الطاقم الطبي عند ارتفاع الخطر"
                  : "Alert healthcare staff if risk becomes high"}
              </div>
              <div style={{ fontSize: ".78rem", color: "#999", marginTop: 3 }}>
                {isAr
                  ? "يتلقى طبيبكِ إشعاراً مجهول الهوية يدعوه للتواصل معكِ."
                  : "Your doctor receives an anonymous prompt to follow up with you."}
              </div>
            </div>
          </label>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 12,
              border: "1px solid #eee", background: "white",
              fontWeight: 800, cursor: "pointer",
            }}
          >
            {isAr ? "لاحقاً" : "Later"}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 2, padding: "10px 0", borderRadius: 12,
              background: "#d68b9d", color: "white",
              border: "none", fontWeight: 800, cursor: "pointer",
            }}
          >
            {saving
              ? (isAr ? "جارٍ الحفظ..." : "Saving...")
              : (isAr ? "حفظ تفضيلاتي" : "Save preferences")}
          </button>
        </div>

        <p style={{ fontSize: ".72rem", color: "#bbb", textAlign: "center", marginTop: 12 }}>
          {isAr
            ? "يمكنكِ تغيير هذه الإعدادات في أي وقت من صفحة الملف الشخصي."
            : "You can change these settings anytime from your profile page."}
        </p>
      </div>
    </div>
  );
};

export default MentalHealthConsentModal;