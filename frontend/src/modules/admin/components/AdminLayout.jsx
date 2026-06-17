// src/modules/admin/AdminLayout.jsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../../services/supabaseClient";
import "../../../styles/AdminLayout.css";

const NAV_ITEMS = [
  { group: "رئيسي", items: [
    { path: "/admin/dashboard",       icon: "fa-chart-pie",       label: "نظرة عامة" },
  ]},
  { group: "المستخدمون", items: [
    { path: "/admin/mothers",         icon: "fa-heart",           label: "الأمهات",   badge: "mothers" },
    { path: "/admin/doctors",         icon: "fa-stethoscope",     label: "الأطباء",   badge: "doctors" },
    { path: "/admin/vendors",         icon: "fa-store",           label: "المتاجر",   badge: "vendors" },
  ]},
  { group: "المحتوى", items: [
    { path: "/admin/articles",        icon: "fa-newspaper",       label: "المقالات",  badge: "pendingArticles" },
    { path: "/admin/reports",         icon: "fa-flag",            label: "البلاغات",  badge: "reports", badgeColor: "red" },
  ]},
  { group: "النظام", items: [
    { path: "/admin/gamification",    icon: "fa-trophy",          label: "التحفيز" },
    { path: "/admin/notifications",   icon: "fa-bell",            label: "الإشعارات" },
    { path: "/admin/security",        icon: "fa-shield-halved",   label: "الأمان" },
  ]},
];

export default function AdminLayout({ children, stats = {} }) {
  const navigate  = useNavigate();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const pageTitles = {
    "/admin/dashboard":     { title: "نظرة عامة",    sub: "إحصائيات وتحليلات المنصة" },
    "/admin/mothers":       { title: "الأمهات",      sub: "إدارة حسابات الأمهات" },
    "/admin/doctors":       { title: "الأطباء",      sub: "توثيق وإدارة الأطباء" },
    "/admin/vendors":       { title: "المتاجر",      sub: "إدارة المتاجر والمنتجات" },
    "/admin/articles":      { title: "المقالات",     sub: "مراجعة وإدارة المقالات" },
    "/admin/reports":       { title: "البلاغات",     sub: "مراجعة المحتوى المخالف" },
    "/admin/gamification":  { title: "التحفيز",      sub: "إدارة نظام الـ XP والشارات" },
    "/admin/notifications": { title: "الإشعارات",    sub: "إرسال إشعارات للمستخدمين" },
    "/admin/security":      { title: "الأمان",       sub: "سجلات النشاط والمصادقة" },
  };
  const current = pageTitles[pathname] || { title: "لوحة التحكم", sub: "" };

  return (
    <div className={`adm-layout ${collapsed ? "adm-collapsed" : ""}`} dir="rtl">

      {/* ── OVERLAY MOBILE ── */}
      {mobileOpen && (
        <div className="adm-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`adm-sidebar ${mobileOpen ? "adm-sidebar-open" : ""}`}>
        <div className="adm-sidebar-top">
          <div className="adm-logo">
            <span className="adm-logo-icon">👑</span>
            {!collapsed && (
              <div>
                <div className="adm-logo-name">لوحة الأدمن</div>
                <div className="adm-logo-sub">منصة الأمومة</div>
              </div>
            )}
          </div>
          <button className="adm-collapse-btn" onClick={() => setCollapsed(!collapsed)}>
            <i className={`fas fa-chevron-${collapsed ? "left" : "right"}`} />
          </button>
        </div>

        <nav className="adm-nav">
          {NAV_ITEMS.map((group) => (
            <div key={group.group} className="adm-nav-group">
              {!collapsed && <div className="adm-nav-label">{group.group}</div>}
              {group.items.map((item) => {
                const isActive = pathname === item.path;
                const badgeCount = item.badge ? stats[item.badge] : 0;
                return (
                  <button
                    key={item.path}
                    className={`adm-nav-item ${isActive ? "adm-nav-active" : ""}`}
                    onClick={() => { navigate(item.path); setMobileOpen(false); }}
                    title={collapsed ? item.label : ""}
                  >
                    <i className={`fas ${item.icon}`} />
                    {!collapsed && <span>{item.label}</span>}
                    {!collapsed && badgeCount > 0 && (
                      <span className={`adm-nav-badge ${item.badgeColor === "red" ? "adm-badge-red" : ""}`}>
                        {badgeCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="adm-sidebar-foot">
          <div className="adm-admin-pill">
            <div className="adm-admin-ava">A</div>
            {!collapsed && (
              <div className="adm-admin-info">
                <div className="adm-admin-name">Super Admin</div>
                <div className="adm-admin-role">مشرف النظام</div>
              </div>
            )}
            {!collapsed && (
              <button className="adm-logout-btn" onClick={handleLogout} title="تسجيل الخروج">
                <i className="fas fa-right-from-bracket" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="adm-main">

        {/* TOPBAR */}
        <header className="adm-topbar">
          <button className="adm-hamburger" onClick={() => setMobileOpen(true)}>
            <i className="fas fa-bars" />
          </button>
          <div className="adm-topbar-title">
            <h1>{current.title}</h1>
            {current.sub && <p>{current.sub}</p>}
          </div>
          <div className="adm-topbar-right">
            <div className="adm-search">
              <i className="fas fa-search" />
              <input placeholder="بحث سريع..." />
            </div>
            <div className="adm-topbar-icon">
              <i className="fas fa-bell" />
              {stats.reports > 0 && <span className="adm-topbar-dot" />}
            </div>
            <button className="adm-topbar-logout" onClick={handleLogout}>
              <i className="fas fa-right-from-bracket" />
            </button>
          </div>
        </header>

        {/* CONTENT */}
        <main className="adm-content">
          {children}
        </main>
      </div>
    </div>
  );
}