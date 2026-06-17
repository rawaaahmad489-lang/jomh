
export default function WaitingApproval() {
  return (
    <div className="auth-wrapper">
      <div className="auth-box" style={{ textAlign: "center" }}>
        <h2>⏳ طلبك قيد المراجعة</h2>
        <p>سيتم مراجعة حسابك من قبل الإدارة وإعلامك قريباً.</p>
        <a href="/login">العودة لتسجيل الدخول</a>
      </div>
    </div>
  );
}