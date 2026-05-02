"use client";

import { useState, useEffect } from "react";
import { 
  Trash2, 
  RotateCcw, 
  Trash, 
  Loader2, 
  AlertCircle, 
  Calendar,
  Search,
  CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface TrashItem {
  id: string;
  name: string;
  type: string;
  deletedAt: string;
}

const fadeInUp: any = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
};

export default function RecycleBinPage() {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadTrash = async () => {
    try {
      const res = await fetch("/api/trash");
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error("Failed to load recycle bin", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTrash(); }, []);

  const handleRestore = async (id: string, type: string) => {
    setProcessingId(id);
    try {
      const res = await fetch("/api/trash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, type }),
      });
      if (res.ok) {
        setSuccessMsg(`Successfully restored ${type}`);
        setTimeout(() => setSuccessMsg(""), 3000);
        await loadTrash();
      }
    } catch (err) {
      console.error("Restore failed", err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleHardDelete = async (id: string, type: string) => {
    if (!confirm("This will permanently erase this record and ALL its data. This CANNOT be undone. Proceed?")) return;
    
    setProcessingId(id);
    try {
      const res = await fetch("/api/trash", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, type }),
      });
      if (res.ok) {
        setSuccessMsg("Permanently deleted");
        setTimeout(() => setSuccessMsg(""), 3000);
        await loadTrash();
      }
    } catch (err) {
      console.error("Delete failed", err);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredItems = items.filter(it => 
    it.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    it.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2"
      >
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight">Recycle Bin</h1>
          <p className="text-[var(--muted)] text-sm mt-1 font-medium">Deleted items are kept here for 7 days before permanent removal.</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
          <input 
            type="text"
            placeholder="Search archive..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="liquid-input pl-11 shadow-inner"
          />
        </div>
      </motion.div>

      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-4 bg-brand-success/10 border border-brand-success/20 rounded-2xl text-brand-success text-sm font-bold text-center"
          >
            {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Card */}
      <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="glass-card p-5 bg-brand-orange/[0.03] border-brand-orange/10 flex items-start gap-4">
        <AlertCircle className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
        <p className="text-xs text-[var(--muted-foreground)] leading-relaxed font-medium">
          <span className="text-brand-orange font-bold uppercase tracking-wider mr-2 text-[10px]">Containment Protocol:</span> 
          Everything you delete enters this zone first. You have 7 days to restore items before the system permanently purges them.
        </p>
      </motion.div>

      {/* Content */}
      <motion.div 
        variants={fadeInUp} 
        initial="hidden" 
        animate="visible"
        className="glass-card overflow-hidden shadow-2xl"
      >
        {loading ? (
          <div className="py-24 flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-brand-orange animate-spin" />
            <p className="text-[var(--muted)] text-sm font-bold tracking-widest uppercase">Scanning archive...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-24 flex flex-col items-center gap-6 text-center">
            <div className="w-20 h-20 rounded-full bg-black/5 dark:bg-white/5 border border-[var(--card-border)] flex items-center justify-center opacity-40">
              <Trash2 className="w-10 h-10 text-[var(--muted)]" />
            </div>
            <div>
              <p className="text-[var(--foreground)] font-bold mb-1">Recycle Bin is empty</p>
              <p className="text-[var(--muted)] text-xs uppercase tracking-[0.2em] font-bold">No deleted signatures detected</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[var(--card-border)]">
            <div className="grid grid-cols-12 gap-4 px-8 py-4 bg-black/[0.02] dark:bg-white/[0.02] text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">
              <div className="col-span-6">Resource Trace</div>
              <div className="col-span-2">Cluster Type</div>
              <div className="col-span-2 text-center">Deletion Timeline</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            <AnimatePresence mode="popLayout">
              {filteredItems.map((it, i) => (
                <motion.div 
                  key={`${it.type}-${it.id}`} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className="grid grid-cols-12 gap-4 px-8 py-6 items-center hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-all group"
                >
                  <div className="col-span-6 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 dark:bg-black/20 border border-[var(--card-border)] flex items-center justify-center shrink-0 shadow-sm">
                      <Trash className="w-5 h-5 text-[var(--muted)] opacity-50" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold text-[var(--foreground)] truncate max-w-md">{it.name}</p>
                      <p className="text-[10px] text-[var(--muted)] font-mono opacity-60 truncate">{it.id}</p>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <span className="px-3 py-1 rounded-lg bg-black/5 dark:bg-white/5 border border-[var(--card-border)] text-[9px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">
                      {it.type.replace(/_/g, " ")}
                    </span>
                  </div>

                  <div className="col-span-2 flex items-center justify-center gap-2 text-[var(--muted-foreground)]">
                    <Calendar className="w-3.5 h-3.5 opacity-60" />
                    <span className="text-xs font-bold">{format(new Date(it.deletedAt), "MMM dd, HH:mm")}</span>
                  </div>

                  <div className="col-span-2 flex justify-end gap-3 px-2">
                    <button
                      disabled={processingId === it.id}
                      onClick={() => handleRestore(it.id, it.type)}
                      className="px-4 py-2 rounded-xl bg-brand-success/10 text-brand-success border border-brand-success/20 hover:bg-brand-success hover:text-white transition-all text-[10px] font-bold uppercase tracking-wider disabled:opacity-50"
                    >
                      {processingId === it.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                    </button>
                    <button
                      disabled={processingId === it.id}
                      onClick={() => handleHardDelete(it.id, it.type)}
                      className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 text-[var(--muted-foreground)] border border-[var(--card-border)] hover:bg-brand-danger/20 hover:text-brand-danger hover:border-brand-danger/30 transition-all disabled:opacity-50"
                      title="Permanently Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Auto Purge Warning */}
      <div className="text-center pt-8">
        <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-[0.3em] opacity-40">
          Automated Purge Cycle Active · 24h Integrity Check
        </p>
      </div>
    </div>
  );
}
