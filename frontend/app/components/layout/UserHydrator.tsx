"use client";

import { useEffect } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

/**
 * Runs once on mount inside the (app) layout.
 * Fetches /auth/me using the httpOnly cookie and populates
 * the Zustand store so all client components have a fresh user object.
 */
export default function UserHydrator() {
  const { user, setUser } = useAuthStore();

  useEffect(() => {
    if (user) return; // already hydrated from persist
    api.get("/auth/me")
      .then(({ data }) => setUser(data))
      .catch(() => {}); // proxy handles redirect on 401
  }, []);

  return null;
}
