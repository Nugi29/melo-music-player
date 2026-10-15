'use client';

import React from 'react';

interface ShortcutsCheatsheetProps {
  onInsertCommand?: (cmd: string) => void;
}

export default function ShortcutsCheatsheet({
  onInsertCommand,
}: ShortcutsCheatsheetProps) {
  const shortcuts = [
    { cmd: 'play <num>', desc: 'Play by index' },
    { cmd: 'theme <name>', desc: 'green, cyan, amber, magenta' },
    { cmd: 'cinema', desc: 'Toggle cinema view' },
    { cmd: 'vol <val>', desc: 'Set gain percentage' },
    { cmd: 'pause / stop', desc: 'Halt pipeline' },
  ];

  return (
    <section
      className="border border-[var(--color-term-border)] bg-[var(--color-term-surface)] p-2.5 flex flex-col font-mono text-[10px] select-none"
      data-purpose="terminal-shortcuts-cheatsheet"
    >
      <div className="text-[var(--color-term-green)] font-bold flex items-center gap-1 pb-1.5 mb-2 border-b border-[var(--color-term-border)]">
        <span>♬</span> TERMINAL SHORTCUTS
      </div>
      <div className="space-y-1 text-[var(--color-term-text)]">
        {shortcuts.map((item, idx) => (
          <div
            key={item.cmd}
            onClick={() => onInsertCommand?.(item.cmd)}
            className={`flex items-center justify-between py-0.5 cursor-pointer hover:bg-[var(--color-term-border)]/30 px-1 rounded-none transition-colors ${
              idx < shortcuts.length - 1 ? 'border-b border-[var(--color-term-border)]/50' : ''
            }`}
            title="Click to use command"
          >
            <span className="text-[var(--color-term-green)] font-bold">{item.cmd}</span>
            <span className="text-[var(--color-term-muted)]">{item.desc}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
