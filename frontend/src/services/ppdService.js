// frontend/src/services/ppdService.js
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function calculatePPDRisk(userId) {
  try {
    const res = await fetch(`${API_BASE}/api/ppd/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) return { skipped: true };
    return await res.json();
  } catch {
    return { skipped: true };
  }
}