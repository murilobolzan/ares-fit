import React from 'react';
import { Search } from 'lucide-react';

interface ExerciseLibraryProps {
  onSelect?: (exercise: any) => void;
}

export default function ExerciseLibrary({ onSelect }: ExerciseLibraryProps) {
  return (
    <div className="flex flex-col items-center justify-center pt-20 opacity-50 text-center">
      <Search size={48} className="text-secondary mb-4 mx-auto" />
      <p className="text-secondary font-medium">Biblioteca de exercícios em construção.</p>
    </div>
  );
}