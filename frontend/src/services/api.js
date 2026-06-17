import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: `${API_BASE}/api`,
});

export default api;