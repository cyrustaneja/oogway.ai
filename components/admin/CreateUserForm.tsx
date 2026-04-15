"use client";

import { useState } from "react";
import { Plus, X, Loader2, UserPlus, Shield, Users, UserCheck } from "lucide-react";

export function CreateUserForm() {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("TEAM");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(`User created successfully! Default password: ${data.defaultPassword}`);
        setName("");
        setEmail("");
        setRole("TEAM");
        // Optionally refresh the page or parent state
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setError(data.error || "Failed to create user");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowForm(true)}
        className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-lg text-xs font-bold tracking-widest uppercase transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        <Plus className="w-4 h-4" /> Add Team Member
      </button>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-8 relative border border-white/10">
            <button 
              onClick={() => setShowForm(false)} 
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-brand-orange" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-outfit)" }}>Add Team Member</h2>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">New system access</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-brand-danger/10 border border-brand-danger/20 rounded-lg text-brand-danger text-xs font-medium">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-brand-success/10 border border-brand-success/20 rounded-lg text-brand-success text-xs font-medium">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2">Full Name</label>
                <input 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="e.g. Rahul Gupta"
                  className="w-full bg-slate-900 border border-white/5 rounded-lg py-3 px-4 text-white text-sm placeholder-slate-700 focus:outline-none focus:border-brand-orange/50 transition-colors" 
                  required 
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2">Email Address</label>
                <input 
                  type="email"
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="rahul@kraftshala.com"
                  className="w-full bg-slate-900 border border-white/5 rounded-lg py-3 px-4 text-white text-sm placeholder-slate-700 focus:outline-none focus:border-brand-orange/50 transition-colors" 
                  required 
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2">Access Level (Role)</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "ADMIN", label: "Admin", icon: Shield },
                    { id: "TEAM", label: "Team", icon: Users },
                    { id: "EXPERT", label: "Expert", icon: UserCheck },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setRole(item.id)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                        role === item.id 
                          ? "bg-brand-orange/10 border-brand-orange/40 text-brand-orange" 
                          : "bg-slate-900/50 border-white/5 text-slate-500 hover:border-white/10"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="text-[9px] font-bold uppercase tracking-widest">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="w-full btn-primary py-3 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                  ) : (
                    "Authorize Access"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
