"use client";

import { useState } from "react";
import { X, Loader2, Key, User, Mail, Save } from "lucide-react";

interface UserInfo {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

export function EditUserModal({ user, onClose, onRefresh }: { 
  user: UserInfo; 
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/users/${user.id}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      if (res.ok) {
        setSuccess("Password updated successfully");
        setNewPassword("");
        setTimeout(onClose, 2000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update password");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="glass-card w-full max-w-md p-8 relative border border-white/10 shadow-2xl">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 flex items-center justify-center border border-brand-orange/20">
            <User className="w-6 h-6 text-brand-orange" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Edit Access</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Managing {user.name || user.email}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <p className="text-xs text-slate-300 font-medium">{user.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-[9px] font-bold text-brand-orange uppercase tracking-widest">
                {user.role}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-4 h-4 text-brand-orange" />
              <h3 className="text-sm font-bold text-white tracking-tight">Reset Password</h3>
            </div>

            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <input 
                  type="password"
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  placeholder="Enter new strong password"
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3.5 px-4 text-white text-sm placeholder-slate-700 focus:outline-none focus:border-brand-orange/50 transition-all" 
                />
              </div>

              {error && (
                <p className="text-[10px] font-bold text-brand-danger uppercase tracking-widest">{error}</p>
              )}
              {success && (
                <p className="text-[10px] font-bold text-brand-success uppercase tracking-widest">{success}</p>
              )}

              <button 
                type="submit" 
                disabled={saving}
                className="w-full btn-primary py-4 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-brand-orange/20"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Syncing...</>
                ) : (
                  <><Save className="w-4 h-4" /> Update Credentials</>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
