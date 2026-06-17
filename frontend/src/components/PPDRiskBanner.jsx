// src/components/PPDRiskBanner.jsx
// ⚠️ لا يستخدم كلمة "اكتئاب" أبداً في الواجهة
import { useNavigate } from "react-router-dom";

const RISK_CONFIG = {
  low: {
    bg:     "#f0faf4",
    border: "#2ecc71",
    icon:   "🌿",
    titleAr: "نصائح للعناية بنفسكِ",
    titleEn: "Some self-care tips for you",
    msgAr:  "لاحظنا أن أسبوعكِ كان متعِباً بعض الشيء. هذا طبيعي تماماً. إليكِ بعض المقترحات.",
    msgEn:  "We noticed this week felt a bit heavy. That's completely normal. Here are some suggestions.",
    cta:    null,
  },
  moderate: {
    bg:     "#fff8f0",
    border: "#f39c12",
    icon:   "💛",
    titleAr: "كيف حالكِ هذا الأسبوع؟",
    titleEn: "How are you feeling this week?",
    msgAr:  "نهتم بصحتكِ. يُنصح بملء استبيان الصحة النفسية القصير للمتابعة.",
    msgEn:  "We care about your wellbeing. Consider completing a quick wellness check-in.",
    cta:    "epds",
  },
  high: {
    bg:     "#fef0f0",
    border: "#e74c3c",
    icon:   "💙",
    titleAr: "أنتِ لستِ وحدكِ",
    titleEn: "You are not alone",
    msgAr:  "مررتِ بأيام صعبة. التحدث مع متخصص قد يساعدكِ كثيراً. نحن هنا معكِ.",
    msgEn:  "You've been going through a tough time. Speaking with a professional can make a real difference.",
    cta:    "doctors",
  },
};

const PPDRiskBanner = ({ riskLevel, isAr, onDismiss }) => {
  const navigate = useNavigate();
  if (!riskLevel || riskLevel === "none") return null;

  const cfg = RISK_CONFIG[riskLevel];
  if (!cfg) return null;

 return (
    <div style={{
      background:   cfg.bg,
      border:       `1px solid ${cfg.border}`,
      borderRadius: 16,
      padding:      "16px 20px",
      marginBottom: 20,
      display:      "flex",
      gap:          14,
      alignItems:   "flex-start",
    }}>
      <span style={{ fontSize: "1.8rem", lineHeight: 1 }}>{cfg.icon}</span>
      <div style={{ flex: 1 }}>
        <h4 style={{ fontWeight: 800, fontSize: ".92rem", marginBottom: 5 }}>
          {isAr ? cfg.titleAr : cfg.titleEn}
        </h4>
        <p style={{ fontSize: ".82rem", color: "#555", lineHeight: 1.6, marginBottom: cfg.cta ? 12 : 0 }}>
          {isAr ? cfg.msgAr : cfg.msgEn}
        </p>

        {cfg.cta === "epds" && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/mother/epds")}
              style={{
                background: "#f39c12", color: "white", border: "none",
                padding: "7px 16px", borderRadius: 10,
                fontWeight: 800, fontSize: ".8rem", cursor: "pointer",
              }}
            >
              {isAr ? "ابدئي الاستبيان ←" : "Start check-in →"}
            </button>
            {/* زر إضافي للمقالات الداعمة */}
            <button
              onClick={() => navigate("/articles")}
              style={{
                background: "white", color: "#f39c12",
                border: "1px solid #f39c12",
                padding: "7px 16px", borderRadius: 10,
                fontWeight: 800, fontSize: ".8rem", cursor: "pointer",
              }}
            >
              {isAr ? "مقالات داعمة 📖" : "Supportive articles 📖"}
            </button>
          </div>
        )}

    {cfg.cta === "doctors" && (
  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
    <button
      onClick={() => navigate("/mother/doctors")}
      style={{
        background: "#e74c3c", color: "white", border: "none",
        padding: "7px 16px", borderRadius: 10,
        fontWeight: 800, fontSize: ".8rem", cursor: "pointer",
      }}
    >
      {isAr ? "تواصلي مع طبيب 💙" : "Talk to a doctor 💙"}
    </button>

    <button
      onClick={() => navigate("/mother/epds")}
      style={{
        background: "white", color: "#e74c3c",
        border: "1px solid #e74c3c",
        padding: "7px 16px", borderRadius: 10,
        fontWeight: 800, fontSize: ".8rem", cursor: "pointer",
      }}
    >
      {isAr ? "اختبار الصحة النفسية" : "Mental health test"}
    </button>

    <button
      onClick={() => window.location.href = "tel:1800500600"}
      style={{
        background: "white", color: "#e74c3c",
        border: "1px solid #e74c3c",
        padding: "7px 16px", borderRadius: 10,
        fontWeight: 800, fontSize: ".8rem", cursor: "pointer",
      }}
    >
      {isAr ? "📞 خط الدعم النفسي" : "📞 Mental health helpline"}
    </button>
  </div>
)}
       
      </div>

      <button
        onClick={onDismiss}
        style={{
          background: "none", border: "none",
          color: "#bbb", cursor: "pointer", fontSize: "1rem", padding: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
};


export default PPDRiskBanner;