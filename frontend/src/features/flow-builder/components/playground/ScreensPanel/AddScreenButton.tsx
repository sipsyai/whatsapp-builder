import React from 'react';

interface AddScreenButtonProps {
  onClick: () => void;
}

export const AddScreenButton: React.FC<AddScreenButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 px-4 py-3
                 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white
                 border-t border-zinc-700 transition-colors"
      type="button"
    >
      <span className="material-symbols-outlined text-xl">add</span>
      <span className="text-sm font-medium">Add screen</span>
    </button>
  );
};
