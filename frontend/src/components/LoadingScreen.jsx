// src/core/components/LoadingScreen.jsx

const THEME_COLORS = {
  mother:  { primary: "#e91e8c", light: "#fce4f3", text: "#b5166e" },
  doctor:  { primary: "#1976d2", light: "#e3f0fd", text: "#1251a3" },
  vendor:  { primary: "#388e3c", light: "#e6f4e7", text: "#256427" },
  admin:   { primary: "#7b1fa2", light: "#f3e5f5", text: "#5a1275" },
  default: { primary: "#9c8caa", light: "#f3eff7", text: "#6b5c7a" },
};

export default function LoadingScreen({ role, message = "جارٍ التحقق..." }) {
  const theme = THEME_COLORS[role] || THEME_COLORS.default;

  const styles = {
    wrapper: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      background: theme.light,
      gap: 20,
      fontFamily: "'Cairo', sans-serif",
    },
    spinner: {
      width: 52,
      height: 52,
      borderRadius: "50%",
      border: `5px solid ${theme.primary}22`,
      borderTop: `5px solid ${theme.primary}`,
      animation: "spin 0.9s linear infinite",
    },
    text: {
      color: theme.text,
      fontSize: "1rem",
      fontWeight: 600,
      letterSpacing: 0.3,
    },
  };

  return (
    <div style={styles.wrapper}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={styles.spinner} />
      <p style={styles.text}>{message}</p>
    </div>
  );
}