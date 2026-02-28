import axios from "axios";

const resolveApiBaseUrl = () => {
  const envUrl =
    (import.meta.env.VITE_API_URL as string | undefined) ||
    (import.meta.env.VITE_API_BASE_URL as string | undefined);
  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    // Local dev fallback only.
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `${protocol}//${hostname}:8000`;
    }

    // Hosted fallback: assume same-origin proxy/rewrite if env var is missing.
    return `${window.location.origin}/api`;
  }

  return "http://127.0.0.1:8000";
};

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
