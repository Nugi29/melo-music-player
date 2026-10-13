import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'MELO_OS // NUGI Music Library',
  description: 'Hacker-Style ASCII Music Library & Player with Web Audio Visualizer and CLI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} h-full antialiased dark`}>
      <body className="h-full w-full overflow-hidden bg-[#030605] text-[#00f3ff]">
        {children}
      </body>
    </html>
  );
}
