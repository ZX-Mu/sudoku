
export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert';

export interface Cell {
  value: number | null;
  fixed: boolean;
  notes: number[];
  row: number;
  col: number;
}

export type SudokuGrid = Cell[][];

export interface GameState {
  grid: SudokuGrid;
  solution: number[][];
  difficulty: Difficulty;
  timer: number;
  isActive: boolean;
  isWon: boolean;
  selectedCell: { row: number, col: number } | null;
  history: SudokuGrid[];
  notesMode: boolean;
  conflicts: Set<string>; // 格式 "row-col"
  flashingCells: Set<string>; // 正在闪烁的单元格
}

export interface AIHint {
  row: number;
  col: number;
  value: number;
  strategy: string;
  explanation: string;
}
