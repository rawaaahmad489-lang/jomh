// backend/src/app.js
import express from "express";
import cors from "cors";
import chatbotRouter from "./routes/chatbot.js";
import ppdRoutes from "./routes/ppdRoutes.js";

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5174",
    /\.replit\.dev$/,
    /\.vercel\.app$/,
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get("/api/test", (req, res) =>
  res.json({ ok: true, message: "الخادم يعمل بشكل صحيح ✅" })
);

app.use("/api/chatbot", chatbotRouter);
app.use("/api/ppd", ppdRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `المسار ${req.path} غير موجود` });
});

app.use((err, req, res, next) => {
  console.error("❌ Global error:", err.message);
  res.status(500).json({ error: "خطأ داخلي في الخادم" });
});

export default app;
