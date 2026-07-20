"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
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
        email,
        password,
      });

      if (res?.error) {
        setError(res.error);
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
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center p-4">
      <div className="ks-card p-10 w-full max-w-md relative z-10 bg-white">
        
        <div className="flex flex-col items-center justify-center mb-10">
          <img src="/logo.png" alt="Oogway Logo" className="w-20 h-20 object-contain mb-2" />
          <h1 className="text-4xl font-black tracking-tighter text-ks-navy" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Oogway
          </h1>
          <p className="text-ks-muted text-[10px] font-bold tracking-[0.15em] uppercase leading-none mt-2">
            The Intelligence of KraftShala
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-ks-red/10 border border-ks-red/20 rounded-lg text-ks-red text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[11px] font-bold text-ks-muted tracking-widest uppercase mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ks-muted/60" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg py-3.5 pl-10 pr-4 text-ks-navy placeholder-gray-400 focus:outline-none focus:border-ks-yellow focus:ring-1 focus:ring-ks-yellow transition-all"
                placeholder="admin@kraftshala.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-ks-muted tracking-widest uppercase mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ks-muted/60" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg py-3.5 pl-10 pr-4 text-ks-navy placeholder-gray-400 focus:outline-none focus:border-ks-yellow focus:ring-1 focus:ring-ks-yellow transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary mt-8"
          >
            {loading ? "Authenticating..." : "Log In"}
          </button>
        </form>
      </div>
    </div>
  );
}
