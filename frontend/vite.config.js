
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000", // ← غيّر 3000 لنفس port الباكند لديك
        changeOrigin: true,
      },
    },
  },
});