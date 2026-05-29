'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-[#1A1A1A] animate-pulse rounded-xl ${className}`} />
  );
}

export function SkeletonText({ className = '', lines = 1 }: SkeletonProps & { lines?: number }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={`h-4 ${i === lines - 1 && lines > 1 ? 'w-2/3' : 'w-full'} rounded-md`} 
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: SkeletonProps) {
  return (
    <Skeleton className={`w-full h-32 rounded-2xl ${className}`} />
  );
}

export function SkeletonAvatar({ className = '', size = 'w-12 h-12' }: SkeletonProps & { size?: string }) {
  return (
    <Skeleton className={`${size} rounded-full ${className}`} />
  );
}