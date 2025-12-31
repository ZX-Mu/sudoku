
import React from 'react';

interface NumpadProps {
  onNumberClick: (num: number) => void;
  onErase: () => void;
  disabled?: boolean;
}

const Numpad: React.FC<NumpadProps> = ({ onNumberClick, onErase, disabled }) => {
  return (
    <div className="grid grid-cols-5 gap-3 w-full max-w-md mx-auto mt-10 px-2">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
        <button
          key={num}
          disabled={disabled}
          onClick={() => onNumberClick(num)}
          className="aspect-square flex items-center justify-center text-2xl font-bold bg-white border-2 border-slate-800 rounded-xl hand-drawn-shadow hover:bg-slate-50 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
        >
          {num}
        </button>
      ))}
      <button
        disabled={disabled}
        onClick={onErase}
        className="aspect-square flex items-center justify-center bg-white border-2 border-slate-800 rounded-xl hand-drawn-shadow hover:bg-red-50 text-red-500 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.375-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.211-.211.498-.33.796-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.796-.33z" />
        </svg>
      </button>
    </div>
  );
};

export default Numpad;
