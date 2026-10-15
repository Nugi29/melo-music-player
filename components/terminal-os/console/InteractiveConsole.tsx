'use client';

import React, { useState, useRef, KeyboardEvent } from 'react';
import QueueTab from './QueueTab';
import CliLogsTab from './CliLogsTab';
import IrcChatTab from './IrcChatTab';
import { Track } from '@/types/music';
import { TerminalLine } from '@/types/terminal';
import { parseAndExecuteCommand, CommandContext } from '@/components/terminal/commandParser';

interface InteractiveConsoleProps {
  queue: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  terminalContext: CommandContext;
  className?: string;
}

export type ConsoleTab = 'queue' | 'cli' | 'irc';

const INITIAL_LINES: TerminalLine[] = [
  {
    id: 'init-1',
    type: 'system',
    content: 'MELO_OS ASCII VIDEO KERNEL v1.2.0 (Theme-Synchronized Pipeline Ready)',
    timestamp: 0,
  },
  {
    id: 'init-2',
    type: 'info',
    content: 'Interactive terminal ready. Type "help" for available commands.',
    timestamp: 0,
  },
];

export default function InteractiveConsole({
  queue,
  currentTrack,
  isPlaying,
  onPlayTrack,
  terminalContext,
  className = '',
}: InteractiveConsoleProps) {
  const [activeTab, setActiveTab] = useState<ConsoleTab>('queue');
  const [inputVal, setInputVal] = useState<string>('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);

  const [lines, setLines] = useState<TerminalLine[]>(INITIAL_LINES);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleExecute = async () => {
    const raw = inputVal.trim();
    if (!raw) return;

    // Save to history
    setHistory((prev) => [raw, ...prev]);
    setHistoryIdx(-1);
    setInputVal('');

    // If active tab is CLI, parse & execute
    const inputLine: TerminalLine = {
      id: `in-${Date.now()}`,
      type: 'input',
      content: raw,
      timestamp: Date.now(),
    };
    setLines((prev) => [...prev, inputLine]);

    try {
      const res = await parseAndExecuteCommand(raw, terminalContext);
      if (res.output) {
        setLines((prev) => [
          ...prev,
          {
            id: `out-${Date.now()}`,
            type: res.type || 'output',
            content: res.output,
            timestamp: Date.now(),
          },
        ]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Execution failed';
      setLines((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          type: 'error',
          content: `Error: ${msg}`,
          timestamp: Date.now(),
        },
      ]);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const nextIdx = Math.min(history.length - 1, historyIdx + 1);
        setHistoryIdx(nextIdx);
        setInputVal(history[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx > 0) {
        const nextIdx = historyIdx - 1;
        setHistoryIdx(nextIdx);
        setInputVal(history[nextIdx]);
      } else if (historyIdx === 0) {
        setHistoryIdx(-1);
        setInputVal('');
      }
    }
  };

  return (
    <section
      className={`h-44 border border-[var(--color-term-border)] bg-[var(--color-term-surface)] p-2 flex flex-col justify-between font-mono text-xs ${className}`}
      data-purpose="interactive-cli-box"
    >
      {/* Tab bar */}
      <div className="flex items-center justify-between border-b border-[var(--color-term-border)] pb-1 text-[11px] select-none">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Tab 1: Queue */}
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-2 py-0.5 transition-all font-semibold ${
              activeTab === 'queue'
                ? 'bg-[var(--color-term-border)]/50 text-[var(--color-term-green)] border-l-2 border-[var(--color-term-green)]'
                : 'text-[var(--color-term-muted)] hover:text-[var(--color-term-cyan)]'
            }`}
          >
            Up Next (Video Queue) [{queue.length}]
          </button>

          {/* Tab 2: CLI Logs */}
          <button
            onClick={() => setActiveTab('cli')}
            className={`px-2 py-0.5 transition-all font-semibold ${
              activeTab === 'cli'
                ? 'bg-[var(--color-term-border)]/50 text-[var(--color-term-green)] border-l-2 border-[var(--color-term-green)]'
                : 'text-[var(--color-term-muted)] hover:text-[var(--color-term-cyan)]'
            }`}
          >
            CLI Output &amp; Logs
          </button>

          {/* Tab 3: IRC Chat */}
          <button
            onClick={() => setActiveTab('irc')}
            className={`px-2 py-0.5 transition-all font-semibold ${
              activeTab === 'irc'
                ? 'bg-[var(--color-term-border)]/50 text-[var(--color-term-green)] border-l-2 border-[var(--color-term-green)]'
                : 'text-[var(--color-term-muted)] hover:text-[var(--color-term-cyan)]'
            }`}
          >
            Live Stream Chat (IRC)
          </button>
        </div>

        <div className="text-[10px] text-[var(--color-term-dim)] hidden sm:inline">
          BUFFER: 10s CACHED
        </div>
      </div>

      {/* Tab Content Panels */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {activeTab === 'queue' && (
          <QueueTab
            queue={queue}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onPlayTrack={onPlayTrack}
          />
        )}
        {activeTab === 'cli' && <CliLogsTab lines={lines} />}
        {activeTab === 'irc' && <IrcChatTab />}
      </div>

      {/* Terminal Interactive Command Line Prompt */}
      <div
        onClick={() => inputRef.current?.focus()}
        className="flex items-center pt-1.5 border-t border-[var(--color-term-border)] text-xs cursor-text"
      >
        <span className="text-[var(--color-term-green)] font-bold flex-none">melo@terminal:~$</span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type command (e.g. play 1, vol 80, theme amber, help)..."
          className="flex-1 bg-transparent border-none p-0 ml-1.5 text-xs text-[var(--color-term-text)] placeholder-[var(--color-term-muted)] focus:ring-0 focus:outline-none"
        />
        <span className="ml-1 inline-block w-2 h-3.5 bg-[var(--color-term-green)] term-cursor flex-none" />
      </div>
    </section>
  );
}
