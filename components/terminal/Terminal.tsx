'use client';

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { TerminalLine } from '@/types/terminal';
import { AVAILABLE_COMMANDS, CommandContext, parseAndExecuteCommand } from './commandParser';
import { Terminal as TerminalIcon, Maximize2, Minimize2, Trash2, HelpCircle } from 'lucide-react';

interface TerminalProps {
  context: CommandContext;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  className?: string;
}

export default function Terminal({
  context,
  isMinimized = false,
  onToggleMinimize,
  className = '',
}: TerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: 'init-1',
      type: 'system',
      content: 'MELO_OS KERNEL v1.0.0 (x86_64-browser-wasm)',
      timestamp: 1773400000000,
    },
    {
      id: 'init-2',
      type: 'info',
      content: 'Type "help" for a manual of available audio commands, or "play 1" to start.',
      timestamp: 1773400000000,
    },
  ]);

  const [inputVal, setInputVal] = useState<string>('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const terminalBodyRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto scroll to bottom whenever output is appended
  useEffect(() => {
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
    }
  }, [lines]);

  // Provide clear function to context
  useEffect(() => {
    context.clearHistory = () => {
      setLines([]);
    };
  }, [context]);

  const handleExecute = async () => {
    const raw = inputVal.trim();
    if (!raw) return;

    // Append user input line
    const inputLine: TerminalLine = {
      id: `in-${Date.now()}`,
      type: 'input',
      content: raw,
      timestamp: Date.now(),
    };

    setLines((prev) => [...prev, inputLine]);
    setHistory((prev) => [raw, ...prev]);
    setHistoryIdx(-1);
    setInputVal('');
    setSuggestions([]);

    // Execute through parser
    try {
      const res = await parseAndExecuteCommand(raw, context);
      if (res.output) {
        const outLine: TerminalLine = {
          id: `out-${Date.now()}`,
          type: res.type || 'output',
          content: res.output,
          timestamp: Date.now(),
        };
        setLines((prev) => [...prev, outLine]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown execution error';
      setLines((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          type: 'error',
          content: `Execution error: ${msg}`,
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
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const current = inputVal.trim().toLowerCase();
      if (current) {
        const matches = AVAILABLE_COMMANDS.filter((cmd) => cmd.startsWith(current));
        if (matches.length === 1) {
          setInputVal(matches[0] + ' ');
        } else if (matches.length > 1) {
          setSuggestions(matches);
        }
      }
    }
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <div
      onClick={focusInput}
      className={`border border-[var(--color-term-border)] bg-[var(--color-term-surface)] flex flex-col font-mono text-xs overflow-hidden transition-all duration-200 ${className}`}
    >
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#020909] border-b border-[var(--color-term-border)] select-none">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-3.5 h-3.5 text-[var(--color-term-green)]" />
          <span className="font-bold text-[var(--color-term-green)] tracking-wide">
            melo@terminal:~
          </span>
          <span className="text-[10px] text-[var(--color-term-dim)]">// CLI v1.0.0</span>
        </div>

        <div className="flex items-center gap-1.5 text-[var(--color-term-muted)]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setInputVal('help');
              inputRef.current?.focus();
            }}
            title="Help"
            className="p-1 hover:text-[var(--color-term-cyan)] transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLines([]);
            }}
            title="Clear output"
            className="p-1 hover:text-[var(--color-term-error)] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {onToggleMinimize && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleMinimize();
              }}
              title={isMinimized ? 'Expand terminal' : 'Minimize terminal'}
              className="p-1 hover:text-[var(--color-term-green)] transition-colors"
            >
              {isMinimized ? (
                <Maximize2 className="w-3.5 h-3.5" />
              ) : (
                <Minimize2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Scrollable Terminal Output Screen */}
          <div
            ref={terminalBodyRef}
            className="flex-1 p-2.5 space-y-1 overflow-y-auto min-h-0 select-text leading-relaxed font-mono"
          >
            {lines.map((line) => {
              if (line.type === 'input') {
                return (
                  <div key={line.id} className="flex items-start gap-1.5">
                    <span className="text-[var(--color-term-green)] font-bold shrink-0">
                      melo@terminal:~$
                    </span>
                    <span className="text-[var(--color-term-cyan)] font-medium break-all">
                      {line.content}
                    </span>
                  </div>
                );
              }

              let colorCls = 'text-[var(--color-term-text)]';
              if (line.type === 'error') colorCls = 'text-[var(--color-term-error)] font-bold';
              else if (line.type === 'success') colorCls = 'text-[var(--color-term-green)]';
              else if (line.type === 'info') colorCls = 'text-[var(--color-term-cyan)]';
              else if (line.type === 'system') colorCls = 'text-[var(--color-term-dim)] italic';

              return (
                <pre
                  key={line.id}
                  className={`whitespace-pre-wrap break-all ${colorCls} text-[11px] leading-tight font-mono pl-3`}
                >
                  {line.content}
                </pre>
              );
            })}

            {/* Tab Suggestions if multiple */}
            {suggestions.length > 0 && (
              <div className="pl-3 py-1 flex items-center gap-2 text-[10px] text-[var(--color-term-cyan)]">
                <span className="text-[var(--color-term-muted)]">Suggestions:</span>
                {suggestions.map((s) => (
                  <span
                    key={s}
                    onClick={() => {
                      setInputVal(s + ' ');
                      setSuggestions([]);
                    }}
                    className="underline cursor-pointer hover:text-[var(--color-term-green)]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Command Input Prompt */}
          <div className="flex items-center px-2.5 py-1.5 border-t border-[var(--color-term-border)] bg-[#010606] text-xs">
            <span className="text-[var(--color-term-green)] font-bold shrink-0 mr-2">
              melo@terminal:~$
            </span>
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              autoComplete="off"
              className="flex-1 bg-transparent border-none p-0 text-[var(--color-term-cyan)] focus:outline-none focus:ring-0 font-mono text-xs caret-[var(--color-term-green)]"
              placeholder="type 'help' or command..."
            />
          </div>
        </>
      )}
    </div>
  );
}
