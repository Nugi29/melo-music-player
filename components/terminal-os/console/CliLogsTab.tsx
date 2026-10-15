'use client';

import React, { useRef, useEffect } from 'react';
import { TerminalLine } from '@/types/terminal';

interface CliLogsTabProps {
  lines: TerminalLine[];
  onClear?: () => void;
}

export default function CliLogsTab({ lines, onClear }: CliLogsTabProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto space-y-1 py-1 pr-1 font-mono text-xs select-text"
    >
      {lines.map((line) => {
        let textClass = 'text-[var(--color-term-cyan)]';
        let prefix = '>';

        if (line.type === 'system') {
          textClass = 'text-[var(--color-term-green)] font-semibold';
          prefix = '[SYS]';
        } else if (line.type === 'input') {
          textClass = 'text-[var(--color-term-text)] font-bold';
          prefix = 'melo@terminal:~$';
        } else if (line.type === 'error') {
          textClass = 'text-[var(--color-term-error)]';
          prefix = '[ERR]';
        } else if (line.type === 'info') {
          textClass = 'text-[var(--color-term-muted)]';
          prefix = '[INFO]';
        }

        return (
          <div key={line.id} className="leading-snug break-words">
            <span className="text-[var(--color-term-dim)] mr-2 text-[10px] select-none">{prefix}</span>
            <span className={textClass}>{line.content}</span>
          </div>
        );
      })}
    </div>
  );
}
