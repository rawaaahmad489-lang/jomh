// frontend/src/components/MotherArticleSuggestions.jsx
/*
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "/api/chatbot";

export default function MotherArticleSuggestions({ motherId }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const navigate              = useNavigate();

  useEffect(() => {
    if (!motherId) return;
    fetchSuggestions();
  }, [motherId]);

  async function fetchSuggestions() {
    setLoading(true);
    setError("");
    setData(null);

    try {
      const response = await fetch(`${API_BASE}/mother-articles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motherId }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.summary || `خطأ HTTP ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error("fetchSuggestions error:", err.message);
      setError(err.message || "تعذّر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }

  // ── الانتقال إلى المقالة ──
  // يفترض أن كل اقتراح يحتوي على حقل id أو slug
  // عدّلي المسار ليتوافق مع routing تطبيقك
  function handleArticleClick(suggestion) {
   if (suggestion.id) {
    navigate(`/articles/${suggestion.id}`);
  } else if (suggestion.slug) {
    navigate(`/articles/${suggestion.slug}`);
  } else if (suggestion.url) {
      navigate(suggestion.url);
    }
    // إن لم يتوفر أي معرّف، لا يحدث شيء
  }

  // ── حالة التحميل ──
  if (loading) {
    return (
      <div
        dir="rtl"
        style={{
          padding: "20px",
          background: "#fdf2f5",
          borderRadius: "16px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "2rem", marginBottom: "10px" }}>🔍</div>
        <p style={{ color: "#d68b9d", fontWeight: "700", margin: 0 }}>
          جاري تحليل بياناتكِ واقتراح المقالات...
        </p>
        <p style={{ color: "#aaa", fontSize: "0.82rem", marginTop: "6px" }}>
          قد يستغرق هذا لحظات
        </p>
      </div>
    );
  }

  // ── حالة الخطأ ──
  if (error) {
    return (
      <div
        dir="rtl"
        style={{
          padding: "16px 20px",
          background: "#fef0f0",
          borderRadius: "16px",
          border: "1px solid #f5c6cb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <p style={{ color: "#e74c3c", fontWeight: "600", margin: 0, fontSize: "0.9rem" }}>
          ⚠️ {error}
        </p>
        <button
          onClick={fetchSuggestions}
          style={{
            background: "#e74c3c",
            color: "white",
            border: "none",
            padding: "7px 14px",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "700",
            fontSize: "0.82rem",
            whiteSpace: "nowrap",
          }}
        >
          حاولي مجدداً ↺
        </button>
      </div>
    );
  }

  // ── لا يوجد motherId ──
  if (!motherId) {
    return (
      <div dir="rtl" style={{ padding: "16px", color: "#aaa", textAlign: "center" }}>
        يرجى تسجيل الدخول لعرض المقالات المقترحة
      </div>
    );
  }

  // ── لا توجد بيانات بعد ──
  if (!data) return null;

  // ══════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════
  return (
    <div dir="rtl" style={{ fontFamily: "'Poppins', 'Cairo', sans-serif" }}>

    
      {data.summary && (
        <div
          style={{
            background: "linear-gradient(135deg, #fdf2f5, #fff)",
            border: "1px solid #eab8c6",
            borderRadius: "16px",
            padding: "16px 20px",
            marginBottom: "16px",
            display: "flex",
            gap: "12px",
            alignItems: "flex-start",
          }}
        >
          <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>✨</span>
        
          <p
            style={{
              margin: 0,
              color: "#555",
              lineHeight: "1.7",
              fontSize: "0.9rem",
              fontWeight: "600",
            }}
          >
            {data.summary}
          </p>
        </div>
      )}

   
      {data.suggestions?.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {data.suggestions.map((s, i) => {
            const isClickable = !!(s.id || s.slug || s.url);

            return (
              <div
                key={i}
                onClick={() => isClickable && handleArticleClick(s)}
                role={isClickable ? "link" : undefined}
                tabIndex={isClickable ? 0 : undefined}
                onKeyDown={(e) => {
                  if (isClickable && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    handleArticleClick(s);
                  }
                }}
                style={{
                  background: "white",
                  border: "1px solid #f0f0f0",
                  borderRadius: "14px",
                  padding: "16px 18px",
                  display: "flex",
                  gap: "14px",
                  alignItems: "flex-start",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                  transition: "all 0.2s",
                  cursor: isClickable ? "pointer" : "default",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#eab8c6";
                  e.currentTarget.style.boxShadow = "0 4px 15px rgba(214,139,157,0.15)";
                  if (isClickable) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#f0f0f0";
                  e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.04)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
             
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    minWidth: "30px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #d68b9d, #eab8c6)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "800",
                    fontSize: "0.85rem",
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4
                    style={{
                      margin: "0 0 5px",
                      color: "#333",
                      fontSize: "0.95rem",
                      fontWeight: "700",
                    }}
                  >
                    {s.title}
                  </h4>
                  <p
                    style={{
                      margin: 0,
                      color: "#777",
                      fontSize: "0.82rem",
                      lineHeight: "1.5",
                    }}
                  >
                    {s.reason}
                  </p>
                </div>

            
                {isClickable && (
                  <div
                    style={{
                      alignSelf: "center",
                      color: "#eab8c6",
                      fontSize: "1.1rem",
                      flexShrink: 0,
                      transition: "transform 0.2s",
                    }}
                  >
                    ←
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            background: "#f9f9f9",
            borderRadius: "14px",
            padding: "24px",
            textAlign: "center",
            color: "#aaa",
          }}
        >
          <span style={{ fontSize: "2rem", display: "block", marginBottom: "10px" }}>📚</span>
          <p style={{ fontWeight: "600", margin: 0 }}>لا توجد مقالات مقترحة حالياً</p>
        </div>
      )}

      
      <button
        onClick={fetchSuggestions}
        style={{
          marginTop: "16px",
          background: "none",
          border: "1.5px dashed #eab8c6",
          color: "#d68b9d",
          padding: "8px 20px",
          borderRadius: "10px",
          cursor: "pointer",
          fontWeight: "700",
          fontSize: "0.82rem",
          width: "100%",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "#fdf2f5"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
      >
        🔄 تحديث الاقتراحات
      </button>
    </div>
  );
}*/
// frontend/src/components/MotherArticleSuggestions.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function MotherArticleSuggestions({ motherId }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const navigate              = useNavigate();

  useEffect(() => {
    if (!motherId) return;
    fetchSuggestions();
  }, [motherId]);

  async function fetchSuggestions() {
    setLoading(true);
    setError("");
    setData(null);

    try {
   // في أعلى الدالة fetchSuggestions
const API_URL = import.meta.env.VITE_API_URL || "";
const response = await fetch(`${API_URL}/api/chatbot/mother-articles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motherId }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.summary || `خطأ ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error("fetchSuggestions error:", err.message);
      setError(err.message || "تعذّر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }

  function handleArticleClick(s) {
    if (s.id)        navigate(`/articles/${s.id}`);
    else if (s.slug) navigate(`/articles/${s.slug}`);
    else if (s.url)  navigate(s.url);
  }

  if (loading) return (
    <div dir="rtl" style={styles.loadingBox}>
      <div style={{ fontSize: "2rem", marginBottom: 10 }}>✨</div>
      <p style={{ color: "#d68b9d", fontWeight: 700, margin: 0 }}>
        جاري اختيار أفضل المقالات لكِ...
      </p>
      <p style={{ color: "#bbb", fontSize: "0.8rem", marginTop: 6 }}>
        لحظات ونكون جاهزين
      </p>
    </div>
  );

  if (error) return (
    <div dir="rtl" style={styles.errorBox}>
      <p style={{ color: "#e74c3c", fontWeight: 600, margin: 0, fontSize: "0.9rem" }}>
        ⚠️ {error}
      </p>
      <button onClick={fetchSuggestions} style={styles.retryBtn}>
        حاولي مجدداً
      </button>
    </div>
  );

  if (!motherId) return (
    <div dir="rtl" style={{ padding: 16, color: "#aaa", textAlign: "center" }}>
      يرجى تسجيل الدخول لعرض المقالات المقترحة
    </div>
  );

  if (!data) return null;

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', 'Poppins', sans-serif" }}>

      {/* summary */}
      {data.summary && (
        <div style={styles.summaryBox}>
          <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>💝</span>
          <p style={styles.summaryText}>{data.summary}</p>
        </div>
      )}

      {/* الاقتراحات */}
      {data.suggestions?.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {data.suggestions.map((s, i) => {
            const isClickable = !!(s.id || s.slug || s.url);
            return (
              <div
                key={i}
                onClick={() => isClickable && handleArticleClick(s)}
                style={{ ...styles.card, cursor: isClickable ? "pointer" : "default" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#d68b9d";
                  e.currentTarget.style.transform = isClickable ? "translateY(-2px)" : "none";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(214,139,157,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#f0e6ea";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.04)";
                }}
              >
                {/* رقم */}
                <div style={styles.badge}>{i + 1}</div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={styles.cardTitle}>{s.title}</h4>
                  {/* reason — الجملة المخصصة للأم */}
                  <p style={styles.cardReason}>{s.reason}</p>

                  {isClickable && (
                    <span style={styles.readMore}>
                      اقرئي المقالة {"←"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={styles.emptyBox}>
          <span style={{ fontSize: "2rem", display: "block", marginBottom: 10 }}>📚</span>
          <p style={{ fontWeight: 600, margin: 0 }}>لا توجد مقالات مقترحة حالياً</p>
        </div>
      )}

      {/* زر تحديث */}
      <button
        onClick={fetchSuggestions}
        style={styles.refreshBtn}
        onMouseEnter={(e) => { e.currentTarget.style.background = "#fdf2f5"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
      >
        🔄 اقتراحات جديدة لكِ
      </button>
    </div>
  );
}

// ── Styles ──
const styles = {
  loadingBox: {
    padding: 24,
    background: "linear-gradient(135deg, #fdf2f5, #fff)",
    borderRadius: 16,
    textAlign: "center",
    border: "1px solid #f0e6ea",
  },
  errorBox: {
    padding: "16px 20px",
    background: "#fef0f0",
    borderRadius: 16,
    border: "1px solid #f5c6cb",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  retryBtn: {
    background: "#e74c3c",
    color: "white",
    border: "none",
    padding: "7px 14px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "0.82rem",
    whiteSpace: "nowrap",
  },
  summaryBox: {
    background: "linear-gradient(135deg, #fdf2f5, #fff9fb)",
    border: "1px solid #eab8c6",
    borderRadius: 16,
    padding: "14px 18px",
    marginBottom: 14,
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
  },
  summaryText: {
    margin: 0,
    color: "#7a4a58",
    lineHeight: 1.8,
    fontSize: "0.9rem",
    fontWeight: 600,
  },
  card: {
    background: "white",
    border: "1px solid #f0e6ea",
    borderRadius: 14,
    padding: "16px 18px",
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
    transition: "all 0.2s ease",
  },
  badge: {
    width: 32,
    height: 32,
    minWidth: 32,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #d68b9d, #eab8c6)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: "0.85rem",
    flexShrink: 0,
    boxShadow: "0 2px 8px rgba(214,139,157,0.3)",
  },
  cardTitle: {
    margin: "0 0 6px",
    color: "#2d2d2d",
    fontSize: "0.95rem",
    fontWeight: 700,
    lineHeight: 1.4,
  },
  cardReason: {
    margin: "0 0 8px",
    color: "#7a5a62",
    fontSize: "0.84rem",
    lineHeight: 1.6,
    fontWeight: 500,
  },
  readMore: {
    color: "#d68b9d",
    fontSize: "0.8rem",
    fontWeight: 700,
    display: "inline-block",
  },
  emptyBox: {
    background: "#fdf8f9",
    borderRadius: 14,
    padding: 24,
    textAlign: "center",
    color: "#bbb",
  },
  refreshBtn: {
    marginTop: 14,
    background: "none",
    border: "1.5px dashed #eab8c6",
    color: "#d68b9d",
    padding: "9px 20px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "0.82rem",
    width: "100%",
    transition: "all 0.2s",
  },
};
