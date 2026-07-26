"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ShieldCheck, AlertTriangle } from "lucide-react";

export default function AdminEmergencyLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@kraftshala.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: email.trim(),
        password: password,
      });

      if (res?.error) {
        setError("Invalid admin email or password.");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-4 text-white">
      <div className="glass-card p-8 sm:p-10 w-full max-w-md bg-slate-900/90 shadow-2xl border border-slate-800 rounded-3xl space-y-6">
        
        {/* LOGO & TITLE */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-3 shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Admin Emergency Access
          </h1>
          <p className="text-slate-400 text-[10px] font-extrabold tracking-widest uppercase mt-1">
            Restricted Administrative Control Panel
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs font-bold flex items-center gap-2 leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1.5">
              Admin Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-9 pr-4 text-white text-xs font-medium focus:outline-none focus:border-purple-500 transition-all"
                placeholder="admin@kraftshala.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1.5">
              Admin Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-9 pr-4 text-white text-xs font-medium focus:outline-none focus:border-purple-500 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-purple-600/20 mt-4 cursor-pointer"
          >
            {loading ? "Authenticating..." : "Log In as Admin"}
          </button>
        </form>

        <p className="text-[10px] text-center text-slate-500 font-medium">
          🔐 This access point is strictly monitored for security audits.
        </p>
      </div>
    </div>
  );
}
