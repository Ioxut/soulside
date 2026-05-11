import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        .auth-back-btn {
          position: fixed;
          top: 20px;
          left: 20px;
          z-index: 100;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 10px;
          background: rgba(139,92,246,0.08);
          border: 1px solid rgba(139,92,246,0.2);
          color: rgba(241,240,245,0.7);
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          backdrop-filter: blur(12px);
          transition: background 0.2s, color 0.2s, border-color 0.2s;
        }
        .auth-back-btn:hover {
          background: rgba(139,92,246,0.16);
          color: #f1f0f5;
          border-color: rgba(139,92,246,0.4);
        }
      `}</style>
      <Link href="/" className="auth-back-btn">
        <ArrowLeft size={15} />
        Înapoi
      </Link>
      {children}
    </>
  );
}
