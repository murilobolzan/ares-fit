'use client';

export const haptics = {
  light: () => {
    if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
  },
  medium: () => {
    if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
  },
  heavy: () => {
    if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
  },
  success: () => {
    if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate([10, 50, 10]);
  },
  error: () => {
    if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate([50, 30, 50]);
  },
  timer: () => {
    if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate([200, 100, 200]);
  }
};