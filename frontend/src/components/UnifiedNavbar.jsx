// src/components/UnifiedNavbar.jsx
// ═══════════════════════════════════════════════════════════════
// Navbar موحّدة تُستخدم في: صفحة المقالات، صحة الأم، تفاصيل الطفل، الأطباء
// Props:
//   isAr        — boolean
//   onBack      — function (navigate(-1) أو مسار محدد)
//   pageTitle   — string (اسم الصفحة بالعربي أو الإنجليزي)
//   actions     — array of { label, icon, onClick } — اختياري (أزرار إضافية كطباعة)
// ═══════════════════════════════════════════════════════════════

import { useTranslation } from "react-i18next";

export default function UnifiedNavbar({ isAr, onBack, pageTitle, actions = [] }) {
  const { i18n } = useTranslation();

  const switchLang = () => {
    i18n.changeLanguage(isAr ? "en" : "ar");
    document.documentElement.dir = isAr ? "ltr" : "rtl";
  };

  return (
    <>
      <style>{NAV_CSS}</style>
      <header className="unav-root" dir={isAr ? "rtl" : "ltr"}>

        {/* ── يسار: زر الرجوع ── */}
        <button className="unav-back" onClick={onBack}>
          <i className={`fas fa-arrow-${isAr ? "right" : "left"}`} />
          <span>{isAr ? "رجوع" : "Back"}</span>
        </button>

        {/* ── وسط: لوجو + اسم الصفحة ── */}
        <div className="unav-center">
          <span className="unav-logo">Journey of Motherhood</span>
          {pageTitle && (
            <>
              <span className="unav-sep">·</span>
              <span className="unav-title">{pageTitle}</span>
            </>
          )}
        </div>

        {/* ── يمين: أزرار إضافية + تبديل اللغة ── */}
        <div className="unav-right">
          {actions.map((action, i) => (
            <button key={i} className="unav-action-btn" onClick={action.onClick} title={action.label}>
              {action.icon && <i className={action.icon} />}
              <span className="unav-action-label">{action.label}</span>
            </button>
          ))}
          <button className="unav-lang" onClick={switchLang}>
            {isAr ? "EN" : "عربي"}
          </button>
        </div>

      </header>
    </>
  );
}

const NAV_CSS = `
.unav-root {
  position: sticky;
  top: 0;
  z-index: 200;
  background: #fff;
  border-bottom: 1px solid #f0e8ec;
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 2px 12px rgba(214,139,157,.08);
  gap: 12px;
}

/* ── زر الرجوع ── */
.unav-back {
  display: flex;
  align-items: center;
  gap: 7px;
  background: #fdf2f5;
  color: #d68b9d;
  border: none;
  padding: 8px 16px;
  border-radius: 12px;
  font-family: 'Cairo','Poppins',sans-serif;
  font-weight: 700;
  font-size: .85rem;
  cursor: pointer;
  transition: .25s;
  white-space: nowrap;
  flex-shrink: 0;
}
.unav-back:hover { background: #eab8c6; color: #fff; }

/* ── وسط ── */
.unav-center {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: center;
  overflow: hidden;
}
.unav-logo {
  font-family: 'Georgia', serif;
  font-style: italic;
  font-weight: bold;
  font-size: 1rem;
  color: #d68b9d;
  white-space: nowrap;
}
.unav-sep {
  color: #eab8c6;
  font-size: 1.1rem;
}
.unav-title {
  font-family: 'Cairo','Poppins',sans-serif;
  font-weight: 800;
  font-size: .95rem;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

/* ── يمين ── */
.unav-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* زر الإجراء (مثل الطباعة) */
.unav-action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #d68b9d, #eab8c6);
  color: #fff;
  border: none;
  padding: 8px 14px;
  border-radius: 12px;
  font-family: 'Cairo','Poppins',sans-serif;
  font-weight: 700;
  font-size: .82rem;
  cursor: pointer;
  transition: .25s;
  box-shadow: 0 3px 10px rgba(214,139,157,.25);
}
.unav-action-btn:hover { opacity: .88; transform: translateY(-1px); }

/* تبديل اللغة */
.unav-lang {
  background: #f4f4f4;
  border: 1px solid #eee;
  padding: 7px 14px;
  border-radius: 20px;
  font-family: 'Cairo','Poppins',sans-serif;
  font-weight: 700;
  font-size: .78rem;
  cursor: pointer;
  color: #777;
  transition: .25s;
}
.unav-lang:hover { background: #fdf2f5; color: #d68b9d; }

/* ── Responsive ── */
@media (max-width: 600px) {
  .unav-root { padding: 0 14px; }
  .unav-logo { font-size: .82rem; }
  .unav-title { font-size: .82rem; max-width: 110px; }
  .unav-action-label { display: none; }
  .unav-action-btn { padding: 8px 10px; }
  .unav-back span { display: none; }
  .unav-back { padding: 8px 10px; }
}
`;