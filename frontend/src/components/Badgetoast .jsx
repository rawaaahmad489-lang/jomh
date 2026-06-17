// src/components/BadgeToast.jsx
// ─────────────────────────────────────────────────────────────────────
// إشعار الشارة الجديدة + إشعار زيادة النقاط
// ─────────────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";

// ── Toast الشارة الجديدة ──────────────────────────────────────────────
export function BadgeToast({ badge, isAr }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (badge) {
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 4500);
      return () => clearTimeout(t);
    }
  }, [badge]);

  if (!badge || !visible) return null;

  return (
    <div style={{
      position: "fixed", top: 95, right: 24, zIndex: 9999,
      background: "#fff",
      border: `2px solid ${badge.color || "#D6A3B0"}`,
      borderRadius: 20, padding: "14px 20px",
      display: "flex", alignItems: "center", gap: 14,
      boxShadow: "0 8px 30px rgba(0,0,0,.13)",
      maxWidth: 310, direction: "rtl",
      fontFamily: "'Cairo','Poppins',sans-serif",
      animation: "toastIn .4s cubic-bezier(.34,1.56,.64,1)",
    }}>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(60px) scale(.9); }
          to   { opacity: 1; transform: translateX(0)  scale(1);   }
        }
      `}</style>
      <span style={{ fontSize: "2.4rem" }}>{badge.icon}</span>
      <div>
        <div style={{ fontWeight: 900, fontSize: ".82rem", color: "#888", marginBottom: 2 }}>
          {isAr ? "🎉 شارة جديدة مكتسبة!" : "New Badge Earned!"}
        </div>
        <div style={{ fontWeight: 900, fontSize: ".95rem", color: badge.color }}>
          {badge.name_ar}
        </div>
        <div style={{ fontSize: ".72rem", color: "#aaa", marginTop: 2 }}>
          {badge.description_ar} • +{badge.xp_reward} XP
        </div>
      </div>
    </div>
  );
}

// ── Toast زيادة النقاط (XP Notification) ────────────────────────────
export function XPToast({ message, points, visible, onHide }) {
  useEffect(() => {
    if (visible) {
      const t = setTimeout(onHide, 3000);
      return () => clearTimeout(t);
    }
  }, [visible, onHide]);

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", bottom: 30, right: 24, zIndex: 9999,
      background: "#fff",
      border: "1.5px solid #C0DD97",
      borderRadius: 16, padding: "12px 18px",
      display: "flex", alignItems: "center", gap: 12,
      boxShadow: "0 6px 24px rgba(0,0,0,.1)",
      fontFamily: "'Cairo','Poppins',sans-serif",
      direction: "rtl", maxWidth: 280,
      animation: "xpToastIn .35s ease",
    }}>
      <style>{`
        @keyframes xpToastIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <span style={{ fontSize: "1.5rem" }}>⭐</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: ".85rem", color: "#3B6D11" }}>
          {message}
        </div>
        {points && (
          <div style={{ fontWeight: 900, fontSize: ".9rem", color: "#639922" }}>
            +{points} XP
          </div>
        )}
      </div>
    </div>
  );
}

// ── Hook مبسط لإدارة الـ Toasts ─────────────────────────────────────
export function useXPToast() {
  const [toast, setToast] = useState({ visible: false, message: "", points: 0 });

  const showXP = (message, points) => setToast({ visible: true, message, points });
  const hideXP = () => setToast(t => ({ ...t, visible: false }));

  return { toast, showXP, hideXP };
}