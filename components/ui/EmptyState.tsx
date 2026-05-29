'use client';

import React from 'react';

interface EmptyStateProps {
  emoji: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ emoji, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in border border-dashed border-[#222225] rounded-3xl bg-[#0F0F0F]/50">
      <span className="text-6xl mb-4 block drop-shadow-lg">{emoji}</span>
      <h3 className="text-lg font-black text-white uppercase tracking-widest mb-2">{title}</h3>
      <p className="text-[#A1A1AA] text-sm mb-6 leading-relaxed max-w-[250px]">{description}</p>
      
      {actionLabel && onAction && (
        <button 
          onClick={onAction}
          className="bg-[#FFE600] text-black font-black uppercase tracking-widest text-xs px-6 py-3 rounded-[100px] hover:scale-95 transition-transform active:bg-[#E6CF00]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}