import React from 'react';
import { Button } from './Button';

interface ConfirmSheetProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmSheet({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmSheetProps) {
  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/80 z-40 animate-fade-in" 
        onClick={onCancel}
      />
      <div className="fixed bottom-0 left-0 right-0 bg-surface z-50 rounded-t-[24px] p-[20px] animate-slide-up flex flex-col gap-4">
        <div className="text-center mb-2">
          <h3 className="text-xl font-bold text-primary">{title}</h3>
          <p className="text-secondary mt-2 text-sm">{description}</p>
        </div>
        
        <div className="flex flex-col gap-3">
          <Button 
            variant={danger ? 'danger' : 'primary'} 
            size="lg" 
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
          <Button 
            variant="ghost" 
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
        </div>
      </div>
    </>
  );
}