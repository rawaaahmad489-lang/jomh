/// frontend/src/components/ChatbotWidget.jsx
import { useState, useRef, useEffect } from "react";

// ── ثوابت ──────────────────────────────────────────────
const API_BASE = "/api/chatbot"; // يمر عبر Vite proxy

// ══════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════
export default function ChatbotWidget({ motherId, childId }) {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [streaming, setStreaming] = useState(""); // النص الجاري الآن
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [connected, setConnected] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const abortRef       = useRef(null); // للإلغاء عند الإغلاق

  // Scroll تلقائي لآخر رسالة
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  // فحص اتصال الخادم عند الفتح
  useEffect(() => {
    if (open) {
      fetch(`${API_BASE}/health`)
        .then((r) => r.json())
        .then((d) => {
          setConnected(d.status === "ok");
          setError(d.status === "ok" ? "" : "الخادم غير متصل حالياً");
        })
        .catch(() => {
          setConnected(false);
          setError("تعذّر الاتصال بالخادم");
        });
      // Focus على الـ input
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // إلغاء الـ request عند إغلاق النافذة
  useEffect(() => {
    if (!open && abortRef.current) {
      abortRef.current.abort();
    }
  }, [open]);

  // ── إرسال الرسالة ──────────────────────────────────
  async function sendMessage() {
    const text = input.trim();
    if (!text || loading || !connected) return;

    const userMsg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];

    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setStreaming("");
    setError("");

    // إنشاء AbortController لإمكانية الإلغاء
    abortRef.current = new AbortController();

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          motherId: motherId || null,
          childId:  childId  || null,
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `خطأ HTTP ${response.status}`);
      }

      // ── قراءة الـ SSE stream ──────────────────────
      const reader  = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullText  = "";
      let buffer    = ""; // buffer للبيانات الجزئية

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // معالجة كل سطر كامل
        const lines = buffer.split("\n");
        // الاحتفاظ بآخر سطر (قد يكون غير مكتمل)
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          const jsonStr = trimmed.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const data = JSON.parse(jsonStr);

            if (data.error) {
              setError(data.error);
              setLoading(false);
              return;
            }

            if (data.content) {
              fullText += data.content;
              setStreaming(fullText);
            }

            if (data.done) {
              // حفظ الرد الكامل في المحادثة
              setMessages((prev) => [
                ...prev,
                { role: "assistant", content: fullText },
              ]);
              setStreaming("");
              setLoading(false);
              return;
            }
          } catch (parseError) {
            // تجاهل أخطاء الـ parsing الجزئية
            console.warn("SSE parse warning:", parseError.message, "| line:", jsonStr.slice(0, 50));
          }
        }
      }

      // إذا انتهى الـ stream بدون done event
      if (fullText) {
        setMessages((prev) => [...prev, { role: "assistant", content: fullText }]);
        setStreaming("");
      }
      setLoading(false);
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("تم إلغاء الطلب");
      } else {
        console.error("sendMessage error:", err.message);
        setError(err.message || "حدث خطأ. يرجى المحاولة مجدداً.");
      }
      setLoading(false);
      setStreaming("");
    }
  }

  // ── مسح المحادثة ──────────────────────────────────
  function clearChat() {
    setMessages([]);
    setStreaming("");
    setError("");
    inputRef.current?.focus();
  }

  // ══════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════
  return (
    <>
    {/* ── زر FAB ── */}
<button
  onClick={() => setOpen(!open)}
  aria-label="فتح المساعد الذكي"
  style={{
    position: "fixed",
    bottom: "24px",
    left: "24px",
    width: "68px",
    height: "68px",
    borderRadius: "22px",
    background: open
      ? "linear-gradient(135deg, #c0392b, #e74c3c)"
      : "linear-gradient(135deg, #d68b9d, #c27a8c)",
    color: "white",
    border: "none",
    cursor: "pointer",
    boxShadow: open
      ? "0 10px 30px rgba(192,57,43,0.35)"
      : "0 10px 30px rgba(214,139,157,0.35)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    overflow: "visible",
  }}
>
  {/* ── دوائر متحركة ── */}
  {!open && (
    <>
      <span
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          borderRadius: "24px",
          border: "2px solid rgba(214,139,157,0.45)",
          animation: "pulseRing 2s infinite",
        }}
      />

      <span
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          borderRadius: "24px",
          border: "2px solid rgba(214,139,157,0.25)",
          animation: "pulseRing 2s infinite 0.8s",
        }}
      />
    </>
  )}

  {/* Glow */}
  <div
    style={{
      position: "absolute",
      inset: 0,
      borderRadius: "22px",
      background:
        "radial-gradient(circle at top left, rgba(255,255,255,0.35), transparent 60%)",
      pointerEvents: "none",
    }}
  />

  {/* الأيقونة */}
  <div
    style={{
      position: "relative",
      zIndex: 2,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "2px",
    }}
  >
    <span
      style={{
        fontSize: open ? "1.4rem" : "1.6rem",
        transition: "all 0.25s ease",
      }}
    >
      {open ? "✕" : "🤖"}
    </span>

    {!open && (
      <span
        style={{
          fontSize: "0.62rem",
          fontWeight: "700",
          opacity: 0.92,
        }}
      >
        نور
      </span>
    )}
  </div>

  {/* Animation */}
  <style>{`
    @keyframes pulseRing {
      0% {
        transform: scale(1);
        opacity: 0.8;
      }
      70% {
        transform: scale(1.45);
        opacity: 0;
      }
      100% {
        transform: scale(1.45);
        opacity: 0;
      }
    }
  `}</style>
</button>
     
      {/* ── نافذة الدردشة ── */}
      {open && (
        <div
          dir="rtl"
          style={{
            position: "fixed",
            bottom: "96px",
            left: "24px",
            width: "360px",
            maxWidth: "calc(100vw - 48px)",
            height: "500px",
            background: "white",
            borderRadius: "20px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.18)",
            display: "flex",
            flexDirection: "column",
            zIndex: 1000,
            overflow: "hidden",
            animation: "chatSlideUp 0.3s ease",
          }}
        >
          <style>{`
            @keyframes chatSlideUp {
              from { opacity: 0; transform: translateY(20px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            .chat-msg { animation: chatSlideUp 0.2s ease; }
            .typing-dot {
              display: inline-block;
              width: 7px; height: 7px;
              border-radius: 50%;
              background: #d68b9d;
              margin: 0 2px;
              animation: typingBounce 1.2s infinite;
            }
            .typing-dot:nth-child(2) { animation-delay: 0.2s; }
            .typing-dot:nth-child(3) { animation-delay: 0.4s; }
            @keyframes typingBounce {
              0%, 60%, 100% { transform: translateY(0); }
              30% { transform: translateY(-6px); }
            }
          `}</style>

          {/* ── Header ── */}
          <div
            style={{
              background: "linear-gradient(135deg, #d68b9d, #c27a8c)",
              color: "white",
              padding: "14px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "1.4rem" }}>🤖</span>
              <div>
                <div style={{ fontWeight: "800", fontSize: "1rem" }}>نور</div>
                <div style={{ fontSize: "0.72rem", opacity: 0.85 }}>
                  {loading ? "يكتب..." : connected ? "متصل ✓" : "غير متصل ✗"}
                </div>
              </div>
            </div>
            <button
              onClick={clearChat}
              title="مسح المحادثة"
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                color: "white",
                padding: "5px 10px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "0.75rem",
                fontWeight: "600",
              }}
            >
              مسح ↺
            </button>
          </div>

          {/* ── رسالة خطأ ── */}
          {error && (
            <div
              style={{
                background: "#fef0f0",
                color: "#e74c3c",
                padding: "8px 14px",
                fontSize: "0.8rem",
                fontWeight: "600",
                textAlign: "center",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>⚠️ {error}</span>
              <button
                onClick={() => setError("")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#e74c3c", fontWeight: "800" }}
              >
                ✕
              </button>
            </div>
          )}

          {/* ── منطقة الرسائل ── */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              background: "#fafafa",
            }}
          >
            {/* رسالة الترحيب */}
            {messages.length === 0 && !streaming && (
              <div
                style={{
                  background: "linear-gradient(135deg, #fdf2f5, #fff)",
                  border: "1px solid #fdf2f5",
                  borderRadius: "16px",
                  padding: "20px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "2.5rem", marginBottom: "10px" }}>🌸</div>
                <h4 style={{ color: "#d68b9d", margin: "0 0 8px", fontSize: "1rem" }}>
                  مرحباً! أنا نور
                </h4>
                <p style={{ color: "#777", fontSize: "0.85rem", lineHeight: "1.6", margin: 0 }}>
                  مساعدتك الذكية المتخصصة في دعم الأمومة وصحة الأطفال.
                  <br />
                  اسأليني عن أي شيء يخص طفلكِ أو صحتكِ.
                </p>
                <div style={{ marginTop: "14px", display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center" }}>
                  {[
                    "طفلي لا ينام جيداً",
                    "متى أبدأ الطعام الصلب؟",
                    "كيف أزيد حليب الرضاعة؟",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); inputRef.current?.focus(); }}
                      style={{
                        background: "#fdf2f5",
                        border: "1px solid #eab8c6",
                        color: "#d68b9d",
                        padding: "5px 10px",
                        borderRadius: "20px",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                        fontWeight: "600",
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* الرسائل */}
            {messages.map((m, i) => (
              <div
                key={i}
                className="chat-msg"
                style={{
                  alignSelf: m.role === "user" ? "flex-start" : "flex-end",
                  maxWidth: "85%",
                }}
              >
                <div
                  style={{
                    background: m.role === "user" ? "#f0f0f0" : "linear-gradient(135deg, #fdf2f5, #fff)",
                    border: m.role === "assistant" ? "1px solid #fdf2f5" : "none",
                    padding: "10px 14px",
                    borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    fontSize: "0.88rem",
                    lineHeight: "1.6",
                    color: "#333",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {/* الرد الجاري (streaming) */}
            {streaming && (
              <div style={{ alignSelf: "flex-end", maxWidth: "85%" }}>
                <div
                  style={{
                    background: "linear-gradient(135deg, #fdf2f5, #fff)",
                    border: "1px solid #fdf2f5",
                    padding: "10px 14px",
                    borderRadius: "16px 16px 16px 4px",
                    fontSize: "0.88rem",
                    lineHeight: "1.6",
                    color: "#333",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {streaming}
                  <span
                    style={{
                      display: "inline-block",
                      width: "2px",
                      height: "14px",
                      background: "#d68b9d",
                      marginRight: "2px",
                      animation: "typingBounce 0.8s infinite",
                      verticalAlign: "middle",
                    }}
                  />
                </div>
              </div>
            )}

            {/* مؤشر "يكتب" (loading بدون streaming بعد) */}
            {loading && !streaming && (
              <div style={{ alignSelf: "flex-end" }}>
                <div
                  style={{
                    background: "#fdf2f5",
                    border: "1px solid #eab8c6",
                    padding: "10px 14px",
                    borderRadius: "16px",
                    display: "flex",
                    gap: "4px",
                    alignItems: "center",
                  }}
                >
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── حقل الإدخال ── */}
          <div
            style={{
              padding: "12px",
              borderTop: "1px solid #f0f0f0",
              display: "flex",
              gap: "8px",
              background: "white",
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={
                !connected
                  ? "الخادم غير متصل..."
                  : loading
                  ? "يرجى الانتظار..."
                  : "اكتبي سؤالك هنا..."
              }
              disabled={loading || !connected}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: "20px",
                border: "1.5px solid #eee",
                outline: "none",
                fontSize: "0.88rem",
                fontFamily: "inherit",
                textAlign: "right",
                background: loading ? "#fafafa" : "white",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#eab8c6")}
              onBlur={(e) => (e.target.style.borderColor = "#eee")}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim() || !connected}
              style={{
                background:
                  loading || !input.trim() || !connected
                    ? "#ddd"
                    : "linear-gradient(135deg, #d68b9d, #c27a8c)",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: "42px",
                height: "42px",
                cursor: loading || !connected ? "not-allowed" : "pointer",
                fontSize: "1.1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
                flexShrink: 0,
              }}
            >
              {loading ? (
                <span style={{ fontSize: "0.7rem", animation: "typingBounce 0.8s infinite" }}>⏳</span>
              ) : (
                "←"
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}