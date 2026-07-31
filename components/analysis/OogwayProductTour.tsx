"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, Zap, Target, GraduationCap, Video, HelpCircle,
  ChevronRight, ChevronLeft, X, Sparkles, CheckCircle2,
  FileText, MessageCircle, PlayCircle, BookOpen, Layers
} from 'lucide-react';

type TourStep = {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  badge: string;
  colorTheme: string; // Tailwind color class
  description: string;
  keyFeatures: string[];
  proTip: string;
};

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Oogway AI',
    subtitle: 'The Session Intelligence Platform of Kraftshala',
    icon: Sparkles,
    badge: 'Walkthrough Guide',
    colorTheme: 'from-amber-500 to-orange-500',
    description: 'Oogway transforms raw live session recordings and transcripts into actionable quality audits, student engagement analytics, and expert teaching feedback.',
    keyFeatures: [
      'Automatic session flow milestone timeline extraction',
      'Instant 360° Oogway Pulse executive overview',
      'Kraftshala 6-dimension Expert Go quality audit',
      'Batch doubt & confusion tracking with Student Go',
      'Interactive Ask Master Oogway AI session assistant',
    ],
    proTip: 'You can launch this Product Tour anytime from the header menu.',
  },
  {
    id: 'timeline',
    title: '1. Session Flow Timeline',
    subtitle: 'Milestones & Pacing Tracking',
    icon: Clock,
    badge: 'Milestone Analysis',
    colorTheme: 'from-slate-700 to-slate-900',
    description: 'The Timeline tab automatically chunks the live class into major structural milestones, identifying topic transitions and administrative delays.',
    keyFeatures: [
      'Chronological milestone markers with timestamp durations (⏱ MM:SS)',
      'Automatic pacing alert flags (e.g. "Significant dragging due to admin delays")',
      'One-click video timestamp jump directly to key moments',
    ],
    proTip: 'Click on any timestamp pill (⏱ 00:14:57) to jump directly to that exact moment in the video recording.',
  },
  {
    id: 'pulse',
    title: '2. Oogway Pulse',
    subtitle: 'Instant 360° Executive Overview',
    icon: Zap,
    badge: 'Instant Intelligence',
    colorTheme: 'from-amber-400 to-yellow-500',
    description: 'Oogway Pulse gives program directors and mentors an instant high-level synthesis of expert performance, student engagement, and topic coverage.',
    keyFeatures: [
      'Executive summary of core concepts taught',
      'Top expert teaching highlights & development alerts',
      'Student participation and comprehension summary',
    ],
    proTip: 'Use Oogway Pulse for a 60-second status check before diving deep into dimension analysis.',
  },
  {
    id: 'expert_go',
    title: '3. Expert Go',
    subtitle: '6-Dimension Expert Teaching Quality Audit',
    icon: Target,
    badge: 'Expert Quality Audit',
    colorTheme: 'from-orange-500 to-amber-500',
    description: 'Expert Go evaluates the trainer across Kraftshala SST standards: Content Accuracy, Pedagogical Approach, Platform Walkthrough, Pacing, Emotional Support, and Delivery Fluency.',
    keyFeatures: [
      'Kraftshala Quality Checklist with passed/flagged standards',
      'Single synthesized dimension cards combining What Happened, Why It Matters, & Action Items',
      'Expandable transcript evidence with hoverable video preview pills',
      'One-click Warm & Direct Feedback Email generator with pre-filled Gmail link',
    ],
    proTip: 'Click "Send Feedback Email ✉️" to open a pre-drafted feedback email in Gmail ready to send to the expert!',
  },
  {
    id: 'student_go',
    title: '4. Student Go',
    subtitle: 'Batch Comprehension & Confusion Friction Audit',
    icon: GraduationCap,
    badge: 'Cohort Intelligence',
    colorTheme: 'from-blue-600 to-indigo-600',
    description: 'Student Go shifts focus from the trainer to the batch — identifying specific topics where students felt confused, asked questions, or struggled.',
    keyFeatures: [
      'Batch Mastery Rating (Advanced, Competent, Developing, Needs Foundations)',
      'Timestamped Confusion Points with student quotes',
      'Question Analysis breakdown (Conceptual, Operational, Live Platform, Clarification)',
      'Class Engagement Sentiment & Academic Recommendations for Program Leads',
    ],
    proTip: 'Check Confusion Points to know exactly which topics require a quick recap in the next class.',
  },
  {
    id: 'source_and_chat',
    title: '5. Source Material & AI Chat',
    subtitle: 'Video Player, Transcript & Ask Oogway Assistant',
    icon: Video,
    badge: 'Interactive Tools',
    colorTheme: 'from-purple-600 to-slate-900',
    description: 'Access the complete raw session evidence and interact directly with Master Oogway.',
    keyFeatures: [
      'View Source Drawer: Synchronized video player & copyable .vtt transcript',
      'Ask Master Oogway: Floating AI chatbot widget to ask any custom question about the session',
    ],
    proTip: 'Ask Oogway questions like "What were the top 3 student doubts in this session?" for instant answers!',
  },
];

export function OogwayProductTour({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const Icon = step.icon;
  const isFirst = currentStep === 0;
  const isLast = currentStep === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) onClose();
    else setCurrentStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (!isFirst) setCurrentStep((prev) => prev - 1);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col"
        >
          {/* Header Banner */}
          <div className={`bg-gradient-to-r ${step.colorTheme} p-6 text-white relative flex items-center justify-between`}>
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shrink-0 shadow-sm">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                  {step.badge} ({currentStep + 1} of {TOUR_STEPS.length})
                </span>
                <h3 className="text-xl font-black text-white tracking-tight mt-1">{step.title}</h3>
                <p className="text-xs text-white/80 font-medium">{step.subtitle}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors text-white/80 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh] bg-slate-50/50">
            <p className="text-sm text-slate-700 leading-relaxed font-medium">
              {step.description}
            </p>

            <div className="ks-card p-4 rounded-2xl bg-white border-slate-200 space-y-2.5 shadow-sm">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                Key Features & Capabilities
              </span>
              <ul className="space-y-2">
                {step.keyFeatures.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs font-semibold text-slate-800 leading-snug">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {step.proTip && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-medium text-amber-900 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span><strong className="font-bold text-amber-950">Pro-Tip:</strong> {step.proTip}</span>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {TOUR_STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                    i === currentStep ? 'bg-amber-500 w-6' : 'bg-slate-200 hover:bg-slate-300'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  onClick={handlePrev}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
              )}

              <button
                onClick={handleNext}
                className="px-5 py-2 rounded-xl text-xs font-black bg-slate-900 text-white hover:bg-slate-800 shadow-md transition-all cursor-pointer flex items-center gap-1 active:scale-95"
              >
                <span>{isLast ? 'Got It! Start Analyzing 🚀' : 'Next Step'}</span>
                {!isLast && <ChevronRight className="w-4 h-4 text-amber-400" />}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
