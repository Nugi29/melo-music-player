'use client';

import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';

interface ShortcutsModalProps {
  onClose: () => void;
}

export default function ShortcutsModal({ onClose }: ShortcutsModalProps) {
  const shortcuts = [
    { key: 'Space', desc: 'Play / Pause (when not typing in terminal or search)' },
    { key: '← / →', desc: 'Seek audio backward / forward 5 seconds' },
    { key: 'Ctrl + K / ⌘K', desc: 'Quick jump & focus library search bar' },
    { key: 'Esc', desc: 'Dismiss active modal or search box' },
    { key: '↑ / ↓', desc: 'Cycle terminal command history (when CLI is active)' },
    { key: 'Tab', desc: 'Auto-complete commands in terminal CLI' },
    { key: 'M', desc: 'Toggle mute / unmute audio output' },
    { key: 'S', desc: 'Toggle shuffle playback mode' },
    { key: 'R', desc: 'Cycle repeat mode (All -> Track -> Off)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 font-mono text-xs select-none">
      <div className="w-full max-w-md border border-[var(--color-term-border)] bg-[#030909] p-4 flex flex-col gap-3 shadow-[0_0_20px_rgba(0,255,136,0.15)]">
        <div className="flex items-center justify-between border-b border-[var(--color-term-border)] pb-2">
          <div className="flex items-center gap-2 text-[var(--color-term-green)] font-bold text-sm">
            <Keyboard className="w-4 h-4" />
            <span>KEYBOARD SHORTCUTS MANUAL</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[var(--color-term-muted)] hover:text-[var(--color-term-error)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="divide-y divide-[#002222] max-h-72 overflow-y-auto pr-1">
          {shortcuts.map((sc) => (
            <div key={sc.key} className="py-2 flex items-center justify-between gap-3">
              <span className="text-[var(--color-term-text)] text-[11px]">{sc.desc}</span>
              <kbd className="px-2 py-0.5 bg-[#011414] border border-[var(--color-term-border)] text-[var(--color-term-cyan)] font-bold text-[10px] whitespace-nowrap">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2 border-t border-[var(--color-term-border)]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-[var(--color-term-green)] bg-[var(--color-term-green)]/15 text-[var(--color-term-green)] font-bold hover:bg-[var(--color-term-green)]/25"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
}
