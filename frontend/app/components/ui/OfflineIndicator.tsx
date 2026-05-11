"use client";

import { useEffect, useState } from "react";

export default function OfflineIndicator() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline  = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online",  goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online",  goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
      background: "var(--warning-bg)", borderBottom: "1px solid var(--warning-border)",
      color: "var(--warning)", fontFamily: "var(--font-display)", fontWeight: 700,
      fontSize: "13px", textAlign: "center", padding: "10px 16px",
      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
    }}>
      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M1 1l18 18M9.9 4.9A10 10 0 0119 10a10 10 0 01-1.5 5.2M6.5 6.5A10 10 0 001 10a10 10 0 005 8.7"/>
      </svg>
      Fără conexiune la internet. Acțiunile tale nu vor fi salvate.
    </div>
  );
}
