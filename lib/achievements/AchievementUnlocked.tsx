'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface Props {
  achievement: {
    name: string;
    emoji: string;
    description: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  };
  onClose: () => void;
}

export function AchievementUnlocked({ achievement, onClose }: Props) {
  const rarityColors = {
    common: 'text-zinc-400',
    rare: 'text-blue-400',
    epic: 'text-purple-400',
    legendary: 'text-[#FFE600]'
  };

  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#0F0F0F] border-2 border-[#FFE600] rounded-[32px] p-8 w-full max-w-xs text-center shadow-[0_0_50px_rgba(255,230,0,0.2)] animate-slide-up relative overflow-hidden">
        
        {/* Shine effect */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#FFE600] to-transparent animate-pulse" />

        <div className="flex flex-col items-center gap-4">
          <span className="text-7xl mb-2 animate-bounce">{achievement.emoji}</span>
          
          <div>
            <p className="text-[#FFE600] text-[10px] font-black uppercase tracking-[0.2em] mb-1 flex items-center justify-center gap-2">
              <Sparkles size={12} /> Conquista Desbloqueada
            </p>
            <h3 className="text-white text-2xl font-black uppercase tracking-tight">{achievement.name}</h3>
            <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${rarityColors[achievement.rarity]}`}>
              Raridade: {achievement.rarity}
            </p>
          </div>

          <p className="text-[#A1A1AA] text-sm leading-relaxed">
            {achievement.description}
          </p>
        </div>
      </div>
    </div>
  );
}