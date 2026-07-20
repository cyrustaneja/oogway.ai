"use client";

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Play } from 'lucide-react';

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

  const showPreview = (timestampStr: string, e: React.MouseEvent) => {
    if (!videoUrl) return;
    
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    
    const x = Math.min(e.clientX + 15, typeof window !== 'undefined' ? window.innerWidth - 320 : 0);
    const y = Math.max(e.clientY - 200, 20);

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
    }, 150);
  };

  return (
    <VideoPreviewContext.Provider value={{ showPreview, hidePreview }}>
      {children}
      
      <AnimatePresence>
        {preview.visible && videoUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[100] pointer-events-auto w-72 rounded-xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.2)] bg-black border border-white/20 group cursor-pointer"
            style={{ left: preview.x, top: preview.y }}
            onMouseEnter={() => {
              if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
            }}
            onMouseLeave={hidePreview}
            onClick={() => {
              if (onNavigate) {
                onNavigate(preview.timestampStr);
                hidePreview(); // Force close
              }
            }}
          >
            <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md flex items-center gap-1.5 border border-white/10">
              <Clock className="w-3 h-3 text-white" />
              <span className="text-[10px] font-mono font-bold text-white tracking-widest">
                Preview (10s)
              </span>
            </div>
            
            <PreviewVideoPlayer 
              videoUrl={videoUrl}
              timestamp={preview.timestamp}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </VideoPreviewContext.Provider>
  );
}

function PreviewVideoPlayer({ videoUrl, timestamp }: { videoUrl: string, timestamp: number }) {
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

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger the global navigation
    if (videoRef.current) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(e => console.log('Preview autoplay prevented:', e));
    }
  };

  return (
    <div className="relative w-full h-auto aspect-video bg-black">
      <video 
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain"
        playsInline
        onTimeUpdate={(e) => {
          if (e.currentTarget.currentTime > timestamp + 10) {
            e.currentTarget.pause();
            setIsPlaying(false);
          }
        }}
        onPause={() => setIsPlaying(false)}
      />
      
      {!isPlaying && isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
          <button 
            onClick={handlePlayClick}
            className="w-12 h-12 bg-brand-orange text-white rounded-full flex items-center justify-center shadow-lg transform transition-transform hover:scale-110 hover:bg-brand-orange-dark"
          >
            <Play className="w-5 h-5 ml-1 fill-current" />
          </button>
        </div>
      )}
      
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="w-6 h-6 border-2 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

export const useVideoPreview = () => useContext(VideoPreviewContext);
