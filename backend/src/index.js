// backend/src/index.js
import "dotenv/config";
import app from "./app.js";

const requiredEnvVars = ["GROQ_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
const missing = requiredEnvVars.filter((v) => !process.env[v]);
if (missing.length > 0) {
  console.error("❌ المتغيرات التالية مفقودة في .env:", missing.join(", "));
  process.exit(1);
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ الخادم يعمل على المنفذ ${PORT}`);
  console.log(`🔗 اختبر: http://localhost:${PORT}/api/test`);
  console.log(`🤖 صحة Chatbot: http://localhost:${PORT}/api/chatbot/health`);
});
