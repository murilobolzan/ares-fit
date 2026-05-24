export const colors = {
  brand: '#FFE600',
  brandHover: '#E6CF00',
  brandSoft: 'rgba(255,230,0,0.10)',
  background: '#000000',
  surface: '#0F0F0F',
  surface2: '#1A1A1A',
  surface3: '#222225',
  border: '#222225',
  primary: '#FFFFFF',
  secondary: '#A1A1AA',
  muted: '#555558',
  danger: '#FF3B30',
  success: '#22C55E',
  warning: '#FF9F0A',
} as const;

export const borderRadius = {
  sm: '10px',
  md: '16px',
  lg: '24px',
  pill: '100px',
} as const;

export const spacing = {
  screenPadding: '20px',
  cardPadding: '16px',
  gap: '12px',
} as const;

export type AccountType = 'student' | 'trainer' | 'pending_trainer';
export type Plan = 'free' | 'pro';
export type SetType = 'normal' | 'warmup' | 'top' | 'failure' | 'drop' | 'rest_pause' | 'backoff';