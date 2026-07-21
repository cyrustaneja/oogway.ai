"use client";

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Play, Pause } from 'lucide-react';

type PreviewState = {
  visible: boolean;
  timestamp: number; // in seconds
  timestampStr: string;
  x: number;
  y: number;
};

const VideoPreviewContext = createContext<{
  showPreview: (timestampStr: string, e: React.MouseEvent) => void;
  hidePreview: () => void;
}>({
  showPreview: () => {},
  hidePreview: () => {},
});

function parseTimestamp(timeStr: string): number {
  const parts = timeStr.trim().split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

export function VideoPreviewProvider({ 
  children, 
  videoUrl, 
  onNavigate 
}: { 
  children: React.ReactNode, 
  videoUrl: string | null,
  onNavigate?: (timestampStr: string) => void 
}) {
  const [preview, setPreview] = useState<PreviewState>({ visible: false, timestamp: 0, timestampStr: "", x: 0, y: 0 });
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const showPreview = (timestampStr: string, e: React.MouseEvent) => {
    if (!videoUrl) return;
    
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    
    const x = Math.min(e.clientX + 15, typeof window !== 'undefined' ? window.innerWidth - 340 : 0);
    const y = Math.max(e.clientY - 220, 20);

    setPreview({
      visible: true,
      timestamp: parseTimestamp(timestampStr),
      timestampStr,
      x,
      y
    });
  };

  const hidePreview = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setPreview(prev => ({ ...prev, visible: false }));
    }, 200);
  };

  // Close preview when clicking anywhere outside or pressing Escape
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPreview(prev => ({ ...prev, visible: false }));
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreview(prev => ({ ...prev, visible: false }));
      }
    };

    if (preview.visible) {
      document.addEventListener('mousedown', handleDocumentClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [preview.visible]);

  return (
    <VideoPreviewContext.Provider value={{ showPreview, hidePreview }}>
      {children}
      
      <AnimatePresence>
        {preview.visible && videoUrl && (
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[100] pointer-events-auto w-80 rounded-2xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.35)] bg-slate-950 border border-white/20 group"
            style={{ left: preview.x, top: preview.y }}
            onMouseEnter={() => {
              if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
            }}
            onMouseLeave={hidePreview}
          >
            {/* Header Badge showing starting timestamp from transcript */}
            <div className="absolute top-2.5 left-2.5 z-20 px-2.5 py-1 bg-black/75 backdrop-blur-md rounded-lg flex items-center gap-1.5 border border-white/15 shadow-sm">
              <Clock className="w-3.5 h-3.5 text-brand-orange" />
              <span className="text-[11px] font-mono font-extrabold text-white tracking-wider">
                {preview.timestampStr}
              </span>
            </div>
            
            <PreviewVideoPlayer 
              videoUrl={videoUrl}
              timestamp={preview.timestamp}
              timestampStr={preview.timestampStr}
              onNavigate={onNavigate}
              onClose={() => setPreview(prev => ({ ...prev, visible: false }))}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </VideoPreviewContext.Provider>
  );
}

function PreviewVideoPlayer({ 
  videoUrl, 
  timestamp,
  timestampStr,
  onNavigate,
  onClose,
}: { 
  videoUrl: string; 
  timestamp: number;
  timestampStr: string;
  onNavigate?: (t: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsPlaying(false);
    setIsLoaded(false);

    if (!videoRef.current) return;
    const vid = videoRef.current;
    
    const setFrame = () => {
      vid.currentTime = timestamp;
      setIsLoaded(true);
    };

    if (vid.readyState >= 1) {
      setFrame();
    } else {
      vid.addEventListener('loadedmetadata', setFrame, { once: true });
      return () => vid.removeEventListener('loadedmetadata', setFrame);
    }
  }, [timestamp]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const vid = videoRef.current;
    if (isPlaying) {
      vid.pause();
      setIsPlaying(false);
    } else {
      vid.play().then(() => setIsPlaying(true)).catch((err) => console.log('Playback error:', err));
    }
  };

  return (
    <div className="relative w-full aspect-video bg-black cursor-pointer group" onClick={togglePlay}>
      <video 
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain"
        playsInline
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />
      
      {/* Clean Play / Pause overlay */}
      {isLoaded && (
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${isPlaying ? 'opacity-0 group-hover:opacity-100 bg-black/30' : 'bg-black/40'}`}>
          <button 
            onClick={togglePlay}
            className="w-12 h-12 bg-brand-orange text-white rounded-full flex items-center justify-center shadow-xl transform transition-transform group-hover:scale-110 hover:bg-orange-600"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current text-white" />
            ) : (
              <Play className="w-5 h-5 ml-0.5 fill-current text-white" />
            )}
          </button>
        </div>
      )}
      
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="w-7 h-7 border-2 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

export const useVideoPreview = () => useContext(VideoPreviewContext);
