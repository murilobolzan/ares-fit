'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  rightElement?: React.ReactNode;
}

export function PageHeader({ 
  title, 
  subtitle, 
  backHref, 
  rightElement 
}: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-black/90 backdrop-blur-md border-b border-border/50 px-[20px] py-4 flex items-center justify-between">
      <div className="flex items-center gap-3 overflow-hidden mr-2">
        {backHref && (
          <Link 
            href={backHref}
            className="w-10 h-10 shrink-0 bg-surface-2 border border-border rounded-full flex items-center justify-center text-primary hover:bg-surface-3 transition-colors active:scale-95"
          >
            <ArrowLeft size={20} />
          </Link>
        )}
        
        <div className="overflow-hidden">
          <h1 className="text-lg font-black uppercase tracking-widest text-primary truncate leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-secondary truncate mt-0.5 font-medium">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {rightElement && (
        <div className="shrink-0 flex items-center">
          {rightElement}
        </div>
      )}
    </header>
  );
}