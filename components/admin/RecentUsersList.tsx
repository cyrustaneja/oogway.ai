"use client";

import { useState } from "react";
import { Settings2 } from "lucide-react";
import { EditUserModal } from "./EditUserModal";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: any;
}

export function RecentUsersList({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const ROLE_COLOR: Record<string, string> = {
    ADMIN: "text-brand-orange bg-brand-orange/10 border-brand-orange/20",
    TEAM:  "text-brand-info bg-brand-info/10 border-brand-info/20",
    EXPERT:"text-brand-success bg-brand-success/10 border-brand-success/20",
  };

  return (
    <>
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Recent Users</p>
        </div>
        <div className="divide-y divide-white/5">
          {users.map(u => (
            <div key={u.id} className="px-6 py-4 flex items-center justify-between group/row">
              <div>
                <p className="text-xs font-bold text-white group-hover/row:text-brand-orange transition-colors">
                  {u.name || "(no name)"}
                </p>
                <p className="text-[10px] text-slate-500 font-mono">{u.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-full border ${ROLE_COLOR[u.role] ?? ""}`}>
                  {u.role}
                </span>
                <button
                  onClick={() => setEditingUser(u)}
                  className="p-2 rounded-lg bg-white/5 text-slate-500 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover/row:opacity-100"
                  title="Edit Credentials"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {users.length === 0 && <p className="px-6 py-4 text-xs text-slate-500">No users found.</p>}
        </div>
      </div>

      {editingUser && (
        <EditUserModal 
          user={editingUser} 
          onClose={() => setEditingUser(null)} 
          onRefresh={() => window.location.reload()} 
        />
      )}
    </>
  );
}
