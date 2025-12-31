
import React from 'react';
import { Cell, SudokuGrid } from '../types';

interface SudokuBoardProps {
  grid: SudokuGrid;
  selectedCell: { row: number; col: number } | null;
  onCellClick: (row: number, col: number) => void;
  hintCell?: { row: number; col: number } | null;
  conflicts: Set<string>;
  flashingCells: Set<string>;
}

const SudokuBoard: React.FC<SudokuBoardProps> = ({ 
  grid, 
  selectedCell, 
  onCellClick, 
  hintCell,
  conflicts,
  flashingCells
}) => {
  const getCellClasses = (cell: Cell) => {
    const key = `${cell.row}-${cell.col}`;
    const isSelected = selectedCell?.row === cell.row && selectedCell?.col === cell.col;
    const isConflict = conflicts.has(key);
    const isFlashing = flashingCells.has(key);
    
    const isSameSubgrid = selectedCell && 
      Math.floor(selectedCell.row / 3) === Math.floor(cell.row / 3) && 
      Math.floor(selectedCell.col / 3) === Math.floor(cell.col / 3);
    const isSameRowOrCol = selectedCell && (selectedCell.row === cell.row || selectedCell.col === cell.col);
    const isSameValue = selectedCell && cell.value !== null && cell.value === grid[selectedCell.row][selectedCell.col].value;
    const isHint = hintCell?.row === cell.row && hintCell?.col === cell.col;

    let bg = 'bg-transparent';
    if (isSelected) bg = 'bg-slate-900 text-white';
    else if (isHint) bg = 'bg-amber-100 ring-2 ring-amber-400 z-10';
    else if (isConflict) bg = 'bg-red-50';
    else if (isSameValue) bg = 'bg-teal-800/10';
    else if (isSameRowOrCol || isSameSubgrid) bg = 'bg-slate-200/20';

    const animation = isFlashing ? 'animate-flash-red' : '';

    // 绘制手绘感的网格线
    const borderR = (cell.col + 1) % 3 === 0 && cell.col !== 8 ? 'border-r-[3px] border-r-slate-800' : 'border-r border-r-slate-300';
    const borderB = (cell.row + 1) % 3 === 0 && cell.row !== 8 ? 'border-b-[3px] border-b-slate-800' : 'border-b border-b-slate-300';

    let textColor = cell.fixed ? 'text-slate-900' : 'text-teal-700';
    if (isConflict && !isSelected) textColor = 'text-red-600';

    return `relative flex items-center justify-center text-2xl sm:text-3xl font-bold cursor-pointer transition-all duration-200 select-none
      aspect-square ${bg} ${borderR} ${borderB} ${animation}
      ${textColor}
      ${isSelected ? 'z-20 scale-105 shadow-xl border-none rounded-sm !text-white' : ''}
      hover:scale-[1.02] active:scale-95
    `;
  };

  return (
    <div className="w-full max-w-md mx-auto p-1 bg-white hand-drawn-border hand-drawn-shadow rotate-[0.2deg]">
      <div className="grid grid-cols-9">
        {grid.map((row, rIdx) => 
          row.map((cell, cIdx) => (
            <div 
              key={`${rIdx}-${cIdx}`}
              onClick={() => onCellClick(rIdx, cIdx)}
              className={getCellClasses(cell)}
            >
              {cell.value || (
                <div className="grid grid-cols-3 w-full h-full p-1 opacity-60">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <span key={i} className="text-[9px] sm:text-[11px] flex items-center justify-center font-medium text-slate-400">
                      {cell.notes.includes(i + 1) ? i + 1 : ''}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SudokuBoard;
