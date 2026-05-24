import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  onClick,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'flex items-center justify-center font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-brand text-black rounded-[100px] w-full hover:bg-brand-hover',
    secondary: 'bg-transparent border border-brand text-brand rounded-[100px] w-full hover:bg-brand-soft',
    ghost: 'bg-surface-2 text-primary rounded-[100px] hover:bg-surface-3',
    danger: 'bg-danger text-white rounded-[100px] w-full hover:bg-red-600',
  };

  const sizes = {
    sm: 'h-10 px-4 text-sm',
    md: 'h-12 px-6 text-base',
    lg: 'h-14 px-8 text-lg',
  };

  const currentVariantStyle = variants[variant];
  const currentSizeStyle = variant === 'ghost' && size === 'md' ? 'h-12 px-6' : sizes[size];

  return (
    <button
      className={`${baseStyles} ${currentVariantStyle} ${currentSizeStyle} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        children
      )}
    </button>
  );
}