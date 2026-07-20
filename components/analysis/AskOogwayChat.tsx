"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
};

const STARTER_QUESTIONS = [
  "What were the biggest teaching gaps in this session?",
  "How engaged were the students?",
  "Was the pacing appropriate?",
  "What should the expert improve next time?",
  "Summarize the key student doubts.",
];

function ThinkingBubble() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="w-8 h-8 rounded-full bg-brand-orange/10 flex items-center justify-center shrink-0 border border-brand-orange/20 mt-1">
        <Bot className="w-4 h-4 text-brand-orange" />
      </div>
      <div className="bg-white border border-[var(--border)] rounded-2xl rounded-bl-sm px-5 py-3.5 shadow-sm flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-brand-orange/60"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}

export function AskOogwayChat({ sessionId }: { sessionId: string }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Greetings! I am Master Oogway. Ask me anything about this session — the teaching quality, student engagement, or specific moments in the transcript.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showStarterHints, setShowStarterHints] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }, [input]);

  const handleSubmit = async (text?: string) => {
    const userMessage = (text ?? input).trim();
    if (!userMessage || isLoading) return;

    setInput('');
    setShowStarterHints(false);
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: userMessage, timestamp: new Date() },
    ]);
    setIsLoading(true);

    try {
      // Filter out the initial greeting so Gemini history starts with 'user'
      const apiMessages = [
        ...messages,
        { role: 'user' as const, content: userMessage },
      ].filter((m, idx) => !(idx === 0 && m.role === 'assistant'));

      const res = await fetch(`/api/analysis/${sessionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error ${res.status}`);
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.text, timestamp: new Date() },
      ]);
    } catch (error: any) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Apologies, I encountered an error: ${error.message}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      // Re-focus input on mobile too
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (desktop). Cmd/Ctrl+Enter for explicit submit. Shift+Enter = newline.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full flex flex-col" style={{ height: 'calc(100dvh - 14rem)', minHeight: '480px', maxHeight: '800px' }}>
      {/* Top accent bar */}
      <div className="h-0.5 w-full bg-gradient-to-r from-brand-orange/20 via-brand-orange to-brand-orange/20 rounded-t-2xl shrink-0" />

      {/* Chat history */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5 bg-[var(--background)]/60 backdrop-blur-sm">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-brand-orange/10 flex items-center justify-center shrink-0 border border-brand-orange/20 mt-1">
                  <Bot className="w-4 h-4 text-brand-orange" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed shadow-sm prose prose-sm max-w-none ${
                  msg.role === 'user'
                    ? 'bg-brand-orange text-white rounded-br-sm prose-invert'
                    : 'bg-white border border-[var(--border)] text-[var(--foreground)] rounded-bl-sm'
                }`}
              >
                <ReactMarkdown>{msg.content}</ReactMarkdown>
                {msg.timestamp && (
                  <p className={`text-[10px] mt-1.5 opacity-40 ${msg.role === 'user' ? 'text-right text-white' : 'text-[var(--muted)]'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-[var(--layer-2)] flex items-center justify-center shrink-0 border border-[var(--border)] mt-1">
                  <User className="w-4 h-4 text-[var(--muted)]" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <ThinkingBubble />
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Starter question chips — shown until first user message */}
      <AnimatePresence>
        {showStarterHints && !isLoading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 sm:px-6 pb-3 overflow-hidden"
          >
            <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-brand-orange" />
              Suggested questions
            </p>
            <div className="flex flex-wrap gap-2">
              {STARTER_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSubmit(q)}
                  className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-[var(--layer-2)] border border-[var(--border)] text-[var(--foreground)] hover:bg-brand-orange/10 hover:border-brand-orange/30 hover:text-brand-orange transition-all active:scale-95"
                >
                  {q}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className="shrink-0 border-t border-[var(--border)] bg-white/80 backdrop-blur-sm px-4 sm:px-5 py-3">
        <div className="flex items-end gap-3">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this session…"
            disabled={isLoading}
            className="flex-1 resize-none bg-[var(--layer-2)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange/50 transition-all disabled:opacity-50 overflow-hidden"
            style={{ lineHeight: '1.5' }}
          />
          <button
            onClick={() => handleSubmit()}
            disabled={!input.trim() || isLoading}
            className="shrink-0 w-10 h-10 rounded-xl bg-brand-orange flex items-center justify-center text-white hover:bg-brand-orange/90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-brand-orange/20"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-[10px] text-[var(--muted)] mt-1.5 text-center opacity-60">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
