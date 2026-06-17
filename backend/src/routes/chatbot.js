// backend/src/routes/chatbot.js

import express from "express";
import { createClient } from "@supabase/supabase-js";
//import { generateReply, streamReply } from "../services/providers/geminiProvider.js";
import { generateReply, streamReply } from "../services/providers/groqProvider.js";
const router = express.Router();

// التحقق من متغيرات البيئة عند التشغيل
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_URL أو SUPABASE_SERVICE_ROLE_KEY غير موجود في .env");
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getMotherContext(motherId) {
  if (!motherId) return null;

  try {
    // ── 1) جلب بيانات الأم ──
    const { data: mother, error: motherError } = await supabase
      .from("mother_profiles")
      .select("age, number_of_children, is_first_time_mother, pregnancy_status, due_date, preferred_language")
      .eq("mother_id", motherId)   // ← كان user_id
      .maybeSingle();

    if (motherError) {
      console.error("Supabase mother error:", motherError.message);
      return null;
    }
    if (!mother) {
      console.warn("لا توجد بيانات للأم:", motherId);
      return null;
    }

    // ── 2) جلب اسم الأم من users ──
    const { data: userData } = await supabase
      .from("users")
      .select("name")
      .eq("user_id", motherId)
      .maybeSingle();

    // ── 3) جلب الأطفال ──
    const { data: children } = await supabase
      .from("children")
      .select("name, gender, birth_date, feeding_method, blood_type")
      .eq("mother_id", motherId);  // ← كان user_id

    // ── 4) جلب المهام ──
    const { data: todos } = await supabase
      .from("todo_list")
      .select("title, due_date")
      .eq("mother_id", motherId)   // ← كان user_id
      .neq("status", "completed")
      .order("due_date", { ascending: true })
      .limit(5);

    // ── 5) جلب المواعيد ──
    const { data: appointments } = await supabase
      .from("appointments")
      .select("appointment_date, type, status, doctor_profiles(specialization, users(name))")
      .eq("mother_id", motherId)   // ← كان user_id
      .gte("appointment_date", new Date().toISOString())
      .order("appointment_date", { ascending: true })
      .limit(3);

    // ── بناء نص السياق ──
    const childrenText =
      (children || [])
        .map((c) => {
          const ageMonths = Math.round(
            (Date.now() - new Date(c.birth_date).getTime()) /
              (1000 * 60 * 60 * 24 * 30.44)
          );
          const gender = c.gender === "male" ? "ذكر" : "أنثى";
          const feeding = {
            breastfeeding: "رضاعة طبيعية",
            formula: "حليب صناعي",
            mixed: "مختلط",
          }[c.feeding_method] || c.feeding_method;
          return `${c.name} (${ageMonths} شهر، ${gender}، ${feeding})`;
        })
        .join("؛ ") || "لا يوجد أطفال مسجلون";

    const todosText =
      (todos || []).map((t) => t.title).join("، ") || "لا توجد مهام معلقة";

    const appointmentsText =
      (appointments || [])
        .map((a) => {
          const date = new Date(a.appointment_date).toLocaleDateString("ar-SA");
          const docName = a.doctor_profiles?.users?.name || "طبيب";
          const spec = a.doctor_profiles?.specialization || "";
          const type = { checkup: "فحص", vaccination: "تطعيم", consultation: "استشارة" }[a.type] || a.type;
          return `${type} مع د.${docName}${spec ? ` (${spec})` : ""} بتاريخ ${date}`;
        })
        .join("؛ ") || "لا توجد مواعيد قادمة";

    const context = `
معلومات الأم:
- الاسم: ${userData?.name || "غير محدد"}
- العمر: ${mother.age || "غير محدد"} سنة
- عدد الأطفال: ${mother.number_of_children || 1}
- أم لأول مرة: ${mother.is_first_time_mother ? "نعم" : "لا"}
- حالة الحمل: ${mother.pregnancy_status || "غير محددة"}
${mother.due_date ? `- موعد الولادة المتوقع: ${new Date(mother.due_date).toLocaleDateString("ar-SA")}` : ""}
- اللغة المفضلة: ${mother.preferred_language || "عربي"}

الأطفال: ${childrenText}
المهام المعلقة: ${todosText}
المواعيد القادمة: ${appointmentsText}
    `.trim();

    console.log("✅ تم جلب سياق الأم بنجاح:", motherId);
    return context;

  } catch (err) {
    console.error("❌ getMotherContext خطأ:", err.message);
    return null;
  }
}
/*async function getMotherContext(motherId) {
  if (!motherId) return null;

  try {
    // جلب بيانات الأم مع اسمها من جدول users
    const { data: mother, error: motherError } = await supabase
      .from("mother_profiles")
      .select(
        "age, number_of_children, is_first_time_mother, pregnancy_status, due_date, preferred_language, users!inner(name, email)"
      )
      .eq("user_id", motherId)
      .maybeSingle(); // استخدام maybeSingle بدل single لتجنب الخطأ إذا لم يُوجد

    if (motherError) {
      console.error("Supabase mother error:", motherError.message);
      return null;
    }
    if (!mother) {
      console.warn("لا توجد بيانات للأم بهذا الـ ID:", motherId);
      return null;
    }

    // جلب الأطفال
    const { data: children, error: childrenError } = await supabase
      .from("children")
      .select("name, gender, birth_date, feeding_method, blood_type")
      .eq("user_id", motherId);

    if (childrenError) {
      console.error("Supabase children error:", childrenError.message);
    }

    // جلب المهام المعلقة (آخر 5)
    const { data: todos } = await supabase
      .from("todo_list")
      .select("title, due_date")
      .eq("user_id", motherId)
      .neq("status", "completed")
      .order("due_date", { ascending: true })
      .limit(5);

    // جلب آخر موعد قادم
    const { data: appointments } = await supabase
      .from("appointments")
      .select(
        "appointment_date, type, status, doctor_profiles(specialization, users(name))"
      )
      .eq("user_id", motherId)
      .gte("appointment_date", new Date().toISOString())
      .order("appointment_date", { ascending: true })
      .limit(3);

    // بناء نص السياق
    const childrenText =
      (children || [])
        .map((c) => {
          const ageMonths = Math.round(
            (Date.now() - new Date(c.birth_date).getTime()) /
              (1000 * 60 * 60 * 24 * 30.44)
          );
          const gender = c.gender === "male" ? "ذكر" : "أنثى";
          const feeding =
            {
              breastfeeding: "رضاعة طبيعية",
              formula: "حليب صناعي",
              mixed: "مختلط",
            }[c.feeding_method] || c.feeding_method;
          return `${c.name} (${ageMonths} شهر، ${gender}، ${feeding})`;
        })
        .join("؛ ") || "لا يوجد أطفال مسجلون";

    const todosText =
      (todos || []).map((t) => t.title).join("، ") || "لا توجد مهام معلقة";

    const appointmentsText =
      (appointments || [])
        .map((a) => {
          const date = new Date(a.appointment_date).toLocaleDateString("ar-SA");
          const docName = a.doctor_profiles?.users?.name || "طبيب";
          const spec = a.doctor_profiles?.specialization || "";
          const type =
            { checkup: "فحص", vaccination: "تطعيم", consultation: "استشارة" }[
              a.type
            ] || a.type;
          return `${type} مع د.${docName}${spec ? ` (${spec})` : ""} بتاريخ ${date}`;
        })
        .join("؛ ") || "لا توجد مواعيد قادمة";

    const context = `
معلومات الأم:
- الاسم: ${mother.users?.name || "غير محدد"}
- العمر: ${mother.age || "غير محدد"} سنة
- عدد الأطفال: ${mother.number_of_children || 1}
- أم لأول مرة: ${mother.is_first_time_mother ? "نعم" : "لا"}
- حالة الحمل: ${mother.pregnancy_status || "غير محددة"}
${mother.due_date ? `- موعد الولادة المتوقع: ${new Date(mother.due_date).toLocaleDateString("ar-SA")}` : ""}
- اللغة المفضلة: ${mother.preferred_language || "عربي"}

الأطفال: ${childrenText}

المهام المعلقة: ${todosText}

المواعيد القادمة: ${appointmentsText}
    `.trim();

    console.log("✅ تم جلب سياق الأم بنجاح لـ:", motherId);
    return context;
  } catch (err) {
    console.error("❌ getMotherContext خطأ غير متوقع:", err.message);
    return null;
  }
}*/
// ══════════════════════════════════════════════
// POST /api/chatbot/mother-articles
// اقتراح مقالات مناسبة للأم
// ══════════════════════════════════════════════
router.post("/mother-articles", async (req, res) => {
  try {
    const { motherId } = req.body;

    if (!motherId) {
      return res.status(400).json({
        suggestions: [],
        summary: "يرجى توفير معرّف الأم (motherId)",
      });
    }

    // جلب السياق والمقالات بالتوازي
    const [context, articlesResult] = await Promise.all([
      getMotherContext(motherId),
      supabase
        .from("articles")
     .select("article_id, title, content")
        .eq("status", "approved")
        .limit(20),
    ]);

    if (!context) {
      return res.status(404).json({
        suggestions: [],
        summary: "لم يتم العثور على بيانات الأم. تأكدي من تسجيل الدخول.",
      });
    }

    const articles = articlesResult.data || [];

    if (articles.length === 0) {
      return res.json({
        suggestions: [],
        summary: "لا توجد مقالات معتمدة متاحة في الوقت الحالي.",
      });
    }
const articlesText = articles
  .map((a, i) => `${i + 1}. ID:${a.article_id} | "${a.title}": ${(a.content || "").slice(0, 200)}...`)
  .join("\n");
  
const prompt = `أنتِ مساعدة دافئة ومتخصصة في دعم الأمومة وصحة الأطفال.

بناءً على وضع هذه الأم:
${context}

من قائمة المقالات المتاحة:
${articlesText}

اختاري أكثر 3 مقالات ملاءمة لوضعها.

مهم جداً في صياغة الردود:
- خاطبي الأم مباشرةً بضمير المخاطبة المؤنثة (أنتِ / لكِ / طفلكِ / ستجدين)
- اجعلي كل "reason" جملة تشجيعية مقنعة تشرح الفائدة المباشرة لها
- الـ summary: جملة واحدة دافئة تخاطب فيها الأم مباشرة وتشجعها على القراءة
- لا تستخدمي أبداً صيغة الغائب (الأم / لها / طفلها)

أجيبي بـ JSON فقط بدون أي نص إضافي أو backticks:
{"suggestions": [{"id": "معرف_المقالة", "title": "عنوان المقالة", "reason": "خاطبي الأم هنا مباشرةً"}], "summary": "جملة دافئة تخاطب فيها الأم مباشرةً"}`;
    const response = await generateReply(prompt);
    console.log("AI Response (mother-articles):", response.slice(0, 200));

    // محاولة استخراج JSON من الرد
    let parsed;
    try {
      // تنظيف الرد من أي أحرف غير JSON
      const cleaned = response
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      // البحث عن أول { وآخر }
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      if (start !== -1 && end !== -1) {
        parsed = JSON.parse(cleaned.slice(start, end + 1));
      } else {
        throw new Error("لم يُعثر على JSON صالح");
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError.message, "| Response:", response.slice(0, 300));
      parsed = {
        suggestions: [],
        summary: response.slice(0, 200),
      };
    }

    return res.json(parsed);
  } catch (err) {
    console.error("❌ /mother-articles error:", err.message);
    return res.status(500).json({
      suggestions: [],
      summary: "حدث خطأ في الخادم. يرجى المحاولة لاحقاً.",
    });
  }
});

// ══════════════════════════════════════════════
// POST /api/chatbot/chat
// دردشة مباشرة مع streaming
// ══════════════════════════════════════════════
router.post("/chat", async (req, res) => {
  const { messages, motherId } = req.body;

  // التحقق من البيانات
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "يرجى إرسال رسائل صالحة" });
  }

  // ضبط headers الـ SSE
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // مهم لـ Nginx/proxies
  res.flushHeaders(); // إرسال headers فوراً

  // دالة مساعدة لإرسال أحداث SSE
  const sendEvent = (data) => {
    try {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      // res.flush() إذا كانت متاحة (compression middleware)
      if (typeof res.flush === "function") res.flush();
    } catch (e) {
      console.error("sendEvent error:", e.message);
    }
  };

  try {
    // جلب سياق الأم (إن وُجد)
    let context = "";
    if (motherId) {
      context = (await getMotherContext(motherId)) || "";
    }

    const systemPrompt = `أنت نور، مساعد ذكي متخصص في دعم الأمومة وصحة الأطفال، تعمل على منصة "رحلة الأمومة".
قواعدك:
- أجب دائماً باللغة العربية بأسلوب دافئ ومحترف
- اهتمي بالأم عاطفياً قبل الإجابة العلمية
- لا تعطي أدوية أو جرعات محددة، وجّهي للطبيب عند الحاجة
- إذا كانت الحالة طارئة، أكدي على الذهاب للطوارئ فوراً
${context ? `\nمعلومات الأم الحالية:\n${context}` : ""}`;

    console.log("✅ بدأ streaming للمحادثة، عدد الرسائل:", messages.length);

    let hasContent = false;

    for await (const chunk of streamReply(messages, systemPrompt)) {
      if (chunk) {
        hasContent = true;
        sendEvent({ content: chunk });
      }
    }

    if (!hasContent) {
      sendEvent({ content: "عذراً، لم أتمكن من توليد رد. يرجى المحاولة مجدداً." });
    }

    sendEvent({ done: true });
    res.end();
    console.log("✅ انتهى streaming بنجاح");
  } catch (err) {
    console.error("❌ /chat streaming error:", err.message);
    sendEvent({ error: "حدث خطأ غير متوقع. يرجى المحاولة لاحقاً." });
    sendEvent({ done: true });
    res.end();
  }
});

// ══════════════════════════════════════════════
// GET /api/chatbot/health
// فحص صحة الخدمة
// ══════════════════════════════════════════════
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
   // gemini: !!process.env.GEMINI_API_KEY,
   groq: !!process.env.GROQ_API_KEY,
    supabase: !!process.env.SUPABASE_URL,
    timestamp: new Date().toISOString(),
  });
});

export default router;
