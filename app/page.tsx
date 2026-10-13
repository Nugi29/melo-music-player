'use client';

import React from 'react';
import { AudioProvider } from '@/lib/audio/AudioEngine';
import MainLayout from '@/components/layout/MainLayout';

export default function Home() {
  return (
    <AudioProvider>
      <MainLayout />
    </AudioProvider>
  );
}
