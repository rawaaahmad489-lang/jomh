import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// موديل سريع وقوي
const MODEL_NAME = "llama-3.3-70b-versatile";

// ═══════════════════════════════════════
// توليد رد عادي
// ═══════════════════════════════════════
async function generateReply(prompt) {
  try {
    const completion = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const text =
      completion.choices?.[0]?.message?.content ||
      "لم يتم إنشاء رد.";

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

// ═══════════════════════════════════════
// Streaming
// ═══════════════════════════════════════
async function* streamReply(messages, systemPrompt) {
  try {
    const formattedMessages = [];

    // system prompt
    if (systemPrompt?.trim()) {
      formattedMessages.push({
        role: "system",
        content: systemPrompt,
      });
    }

    // user/assistant messages
    for (const msg of messages) {
      if (!msg.content?.trim()) continue;

      formattedMessages.push({
        role: msg.role,
        content: msg.content.trim(),
      });
    }

    console.log(
      `✅ streamReply: ${MODEL_NAME}، رسائل: ${formattedMessages.length}`
    );

    const stream = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages: formattedMessages,
      temperature: 0.7,
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices?.[0]?.delta?.content;

      if (text) {
        yield text;
      }
    }

    console.log("✅ streamReply انتهى بنجاح");
  } catch (error) {
    console.error("❌ streamReply error:", error.message);

    yield "عذراً، حدث خطأ أثناء إنشاء الرد.";
  }
}

export { generateReply, streamReply };