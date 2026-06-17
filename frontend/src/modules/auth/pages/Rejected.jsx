export default function Rejected() {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        background: "#c70303",
        color: "#fff",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "2rem", marginBottom: "10px" }}>
        🚫 الحساب موقوف
      </h1>

      <p style={{ opacity: 0.7 }}>
        تم رفض حسابك. يرجى التواصل مع الإدارة.
      </p>
    </div>
  );
}