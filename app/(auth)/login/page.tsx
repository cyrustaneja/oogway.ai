"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ShieldCheck, ArrowRight } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "AccessDenied") {
      setError("Access Denied: Your Google email address is not registered in the system directory. Please ask an Admin to add your email to the User Directory.");
    } else if (err === "OAuthCallback" || err === "OAuthSignin" || err === "OAuthCreateAccount") {
      setError("Failed to authenticate with Google. Please ensure your email is pre-registered in the system directory.");
    } else if (err) {
      setError("Authentication failed. Please try again.");
    }
  }, [searchParams]);

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    setError("");
    signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
      <div className="glass-card p-8 sm:p-10 w-full max-w-md bg-white shadow-xl border border-slate-200 rounded-3xl relative overflow-hidden space-y-6">
        
        {/* LOGO & TITLE */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="relative mb-3">
            <img
              src="/oogway.jpg"
              alt="Oogway Logo"
              className="w-16 h-16 rounded-full object-cover border-2 border-[#E8A020] shadow-md"
            />
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-white">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Oogway Pulse
          </h1>
          <p className="text-slate-500 text-[10px] font-extrabold tracking-widest uppercase mt-1">
            Kraftshala Executive Intelligence
          </p>
        </div>

        {/* ERROR BANNER */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-xs font-bold flex items-start gap-2.5 leading-relaxed shadow-2xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* GOOGLE OAUTH EXCLUSIVE SIGN-IN */}
        <div className="space-y-4 pt-2">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full py-4 px-5 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-900 font-extrabold text-sm flex items-center justify-center gap-3 transition-all shadow-xs group cursor-pointer"
          >
            {googleLoading ? (
              <span className="text-slate-600 font-bold">Connecting to Google...</span>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform ml-auto" />
              </>
            )}
          </button>

          <p className="text-[11px] text-center text-slate-500 font-medium px-2 leading-relaxed">
            🔒 Authorized Kraftshala accounts only. Email must be pre-added in the Admin User Directory.
          </p>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs font-bold">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
