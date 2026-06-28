"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import SpaceBackground from "@/components/ui/SpaceBackground";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: "#03020a", overflow: "hidden" }}>
      <SpaceBackground />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", maxWidth: "480px", width: "100%" }}
      >
        <motion.img
          src="/logo.png"
          alt="SoulSide"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: "clamp(56px,10vw,72px)", height: "clamp(56px,10vw,72px)", borderRadius: "20px", objectFit: "cover", marginBottom: "28px", boxShadow: "0 0 40px rgba(139,92,246,0.45)" }}
        />

        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          style={{ fontSize: "clamp(80px,18vw,120px)", fontWeight: 900, lineHeight: 1, marginBottom: "12px", background: "linear-gradient(160deg, #c4b5fd 0%, #8b5cf6 40%, #4c1d95 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", userSelect: "none", letterSpacing: "-0.04em" }}
        >
          404
        </motion.p>

        <h1 style={{ fontSize: "clamp(18px,4vw,24px)", fontWeight: 700, color: "#f1f5f9", marginBottom: "10px", letterSpacing: "-0.02em" }}>
          Pagina nu a fost găsită
        </h1>
        <p style={{ fontSize: "clamp(13px,2.5vw,15px)", color: "#64748b", lineHeight: 1.65, marginBottom: "32px", maxWidth: "340px" }}>
          Pagina pe care o cauți s-a rătăcit undeva prin univers. Întoarce-te într-un loc sigur.
        </p>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center", width: "100%" }}>
          <Link href="/dashboard" style={{ textDecoration: "none", flex: "1 1 auto", minWidth: "140px", maxWidth: "200px" }}>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px 20px", borderRadius: "12px", background: "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "none", color: "white", fontSize: "14px", fontWeight: 600, cursor: "pointer", boxShadow: "0 0 20px rgba(139,92,246,0.35)", transition: "box-shadow 0.2s" }}
            >
              <Home size={15} />
              Dashboard
            </motion.button>
          </Link>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => window.history.back()}
            style={{ flex: "1 1 auto", minWidth: "120px", maxWidth: "160px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px 20px", borderRadius: "12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", fontSize: "14px", fontWeight: 500, cursor: "pointer", transition: "all 0.2s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#e2e8f0"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#94a3b8"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
          >
            <ArrowLeft size={15} />
            Înapoi
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
