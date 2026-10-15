'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';

export default function IrcChatTab() {
  const [messages] = useState<ChatMessage[]>([
    {
      id: 'irc-1',
      sender: 'cyber_bot',
      color: 'var(--color-term-green)',
      text: '*** Connected to irc.melo-os.net:6697 (#ascii-stream) - 48 users in channel',
      time: '11:42',
      isSystem: true,
    },
    {
      id: 'irc-2',
      sender: 'pixel_matrix',
      color: 'var(--color-term-cyan)',
      text: 'This 160x48 ASCII dither shader is buttery smooth!',
      time: '11:43',
    },
    {
      id: 'irc-3',
      sender: 'synth_runner',
      color: 'var(--color-term-warning)',
      text: 'The Weeknd Blinding Lights cut in ASCII is insane 🔥',
      time: '11:43',
    },
    {
      id: 'irc-4',
      sender: 'neuro_coder',
      color: 'var(--color-term-green)',
      text: 'WebGL2 shaders locked at 60 FPS on CUDA',
      time: '11:44',
    },
    {
      id: 'irc-5',
      sender: 'hex_ghost',
      color: 'var(--color-term-cyan)',
      text: 'Type "play 2" in CLI to switch to Tron Legacy',
      time: '11:45',
    },
  ]);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto space-y-1 py-1 pr-1 font-mono text-xs select-text"
    >
      {messages.map((msg) => (
        <div key={msg.id} className="leading-snug break-words">
          <span className="text-[var(--color-term-dim)] mr-2 text-[10px]">[{msg.time}]</span>
          {msg.isSystem ? (
            <span className="text-[var(--color-term-green)] italic text-[11px]">{msg.text}</span>
          ) : (
            <>
              <span
                style={{ color: msg.color || 'var(--color-term-cyan)' }}
                className="font-bold mr-1.5"
              >
                &lt;{msg.sender}&gt;
              </span>
              <span className="text-[var(--color-term-text)]">{msg.text}</span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
