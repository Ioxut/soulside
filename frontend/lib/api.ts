import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";

export const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

const AUTH_SKIP = ["/auth/login", "/auth/register", "/auth/verify-otp", "/auth/refresh"];

let refreshing: Promise<void> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const url: string = original?.url ?? "";
    const isAuthEndpoint = AUTH_SKIP.some(path => url.includes(path));
    const status: number = error.response?.status;
    if (status >= 500) {
      toast.error("Eroare de server. Încearcă din nou.");
    }
    if (status === 429) {
      if (error.response) {
        error.response.data = {
          ...error.response.data,
          detail: "Prea multe încercări. Încearcă din nou mai târziu.",
        };
      }
    }
    if (status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        if (!refreshing) {
          refreshing = axios
            .post("/api/auth/refresh", {}, { withCredentials: true })
            .then(() => { refreshing = null; })
            .catch((err) => { refreshing = null; throw err; });
        }
        await refreshing;
        return api(original);
      } catch {
        if (typeof window !== "undefined") {
          useAuthStore.getState().logout();
          window.location.replace("/login");
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
