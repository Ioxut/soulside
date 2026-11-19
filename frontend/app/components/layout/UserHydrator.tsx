"use client";

import { useEffect } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function UserHydrator() {
  const { user, setUser } = useAuthStore();

  useEffect(() => {
    if (user) return;
    api.get("/auth/me")
      .then(({ data }) => setUser(data))
      .catch(() => {});
  }, []);

  return null;
}
