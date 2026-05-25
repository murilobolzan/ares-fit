import React from 'react';
import { Search } from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
}

interface ExerciseLibraryProps {
  onSelect?: (exercise: Exercise) => void;
}

export default function ExerciseLibrary({ onSelect }: ExerciseLibraryProps) {
  const handleMockClick = () => {
    if (onSelect) {
      onSelect({ id: 'mock-1', name: 'Supino Reto' });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center pt-20 text-center">
      <Search size={48} className="text-secondary mb-4 mx-auto opacity-50" />
      <p className="text-secondary font-medium mb-4 opacity-50">Biblioteca de exercícios em construção.</p>
      <button 
        type="button"
        onClick={handleMockClick}
        className="px-4 py-2 bg-surface-2 border border-border text-xs font-bold text-brand rounded-full hover:bg-surface-3 transition-colors"
      >
        Simular Seleção (Supino Reto)
      </button>
    </div>
  );
}