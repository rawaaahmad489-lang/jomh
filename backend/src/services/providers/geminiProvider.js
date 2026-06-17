// backend/src/services/providers/geminiProvider.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MODEL_NAME = "gemini-2.5-flash";

async function generateReply(prompt) {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log("✅ generateReply نجح، طول الرد:", text.length);
    return text;
  } catch (error) {
    console.error("❌ generateReply error:", error.message);
    return JSON.stringify({
      suggestions: [],
      summary: "عذراً، المساعد الذكي غير متاح حالياً.",
    });
  }
}

async function* streamReply(messages, systemPrompt) {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const contents = [];

    if (systemPrompt?.trim()) {
      contents.push({
        role: "user",
        parts: [{ text: `[تعليمات]: ${systemPrompt}` }],
      });
      contents.push({
        role: "model",
        parts: [{ text: "مفهوم، سأتبع هذه التعليمات وأساعدك." }],
      });
    }

    for (const msg of messages) {
      const role = msg.role === "assistant" ? "model" : "user";
      const text = (msg.content || "").trim();
      if (!text) continue;

      const last = contents[contents.length - 1];
      if (last && last.role === role) {
        last.parts[0].text += "\n" + text;
      } else {
        contents.push({ role, parts: [{ text }] });
      }
    }

    if (!contents.length || contents[contents.length - 1].role !== "user") {
      yield "يرجى إرسال رسالة للبدء.";
      return;
    }

    console.log(`✅ streamReply: ${MODEL_NAME}، رسائل: ${contents.length}`);

    const result = await model.generateContentStream({ contents });

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }

    console.log("✅ streamReply انتهى بنجاح");
  } catch (error) {
    console.error("❌ streamReply error:", error.message);
    yield `عذراً، حدث خطأ: ${error.message}`;
  }
}

export { generateReply, streamReply };
