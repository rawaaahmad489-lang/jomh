/*export default function Unauthorized() {
  return <h1>Unauthorized Access</h1>;
}*/

export default function Unauthorized() {
  return (
    <div className="auth-wrapper">
      <div className="auth-box" style={{ textAlign: "center" }}>
        <h2>⛔ غير مصرح بالدخول</h2>
        <p>عذراً، لا تملك الصلاحية للوصول إلى هذه الصفحة.</p>
        <a href="/login">العودة لتسجيل الدخول</a>
      </div>
    </div>
  );
}