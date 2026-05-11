"use client";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { RotateCcw, Home } from "lucide-react";
import Link from "next/link";
import SpaceBackground from "@/components/ui/SpaceBackground";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="relative min-h-screen flex items-center justify-center px-6 text-center">
      <SpaceBackground />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
          <span className="text-3xl">⚠️</span>
        </div>
        <h1 className="text-xl font-semibold text-white mb-2">Ceva nu a mers bine</h1>
        <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
          A apărut o eroare neașteptată. Încearcă din nou sau întoarce-te la pagina principală.
        </p>
        {process.env.NODE_ENV === "development" && (
          <p className="text-xs text-red-400/70 bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2 mb-5 font-mono max-w-sm mx-auto text-left">
            {error.message}
          </p>
        )}
        <div className="flex items-center justify-center gap-3">
          <button onClick={reset}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all">
            <RotateCcw size={15} />
            Încearcă din nou
          </button>
          <Link href="/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/[0.07] text-slate-400 hover:text-slate-200 text-sm transition-all hover:bg-white/[0.03]">
            <Home size={15} />
            Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
