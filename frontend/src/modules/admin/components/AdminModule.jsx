// src/modules/admin/AdminModule.jsx
// هذا الملف هو نقطة الدخول الرئيسية لكل صفحات الأدمن
import { Routes, Route, Navigate } from "react-router-dom";
import AdminDashboard     from "../pages/AdminDashboard";
import AdminMothers       from "../pages/AdminMothers";
import AdminDoctors       from "../pages/AdminDoctors";
import AdminVendors       from "../pages/AdminVendors";
import AdminArticles      from "../pages/AdminArticles";
import AdminReports       from "../pages/AdminReports";
import AdminGamification  from "../pages/AdminGamification";
import AdminNotifications from "../pages/AdminNotifications";
import AdminSecurity      from "../pages/AdminSecurity";

export default function AdminModule() {
  return (
    <Routes>
      {/* الصفحة الافتراضية تنتقل للـ dashboard */}
      <Route index element={<Navigate to="dashboard" replace />} />

      <Route path="dashboard"     element={<AdminDashboard />} />
      <Route path="mothers"       element={<AdminMothers />} />
      <Route path="doctors"       element={<AdminDoctors />} />
      <Route path="vendors"       element={<AdminVendors />} />
      <Route path="articles"      element={<AdminArticles />} />
      <Route path="reports"       element={<AdminReports />} />
      <Route path="gamification"  element={<AdminGamification />} />
      <Route path="notifications" element={<AdminNotifications />} />
      <Route path="security"      element={<AdminSecurity />} />

      {/* أي مسار غير معروف → dashboard */}
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}