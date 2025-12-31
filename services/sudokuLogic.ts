
import { Cell, Difficulty, SudokuGrid } from '../types';

export const createEmptyGrid = (): SudokuGrid => {
  return Array.from({ length: 9 }, (_, r) =>
    Array.from({ length: 9 }, (_, c) => ({
      value: null,
      fixed: false,
      notes: [],
      row: r,
      col: c
    }))
  );
};

export const isValid = (grid: (number | null)[][], row: number, col: number, num: number): boolean => {
  // Row
  for (let x = 0; x < 9; x++) if (grid[row][x] === num) return false;
  // Column
  for (let x = 0; x < 9; x++) if (grid[x][col] === num) return false;
  // 3x3 Box
  const startRow = row - (row % 3);
  const startCol = col - (col % 3);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (grid[i + startRow][j + startCol] === num) return false;
    }
  }
  return true;
};

const solveSudoku = (grid: (number | null)[][]): boolean => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === null) {
        for (let num = 1; num <= 9; num++) {
          if (isValid(grid, row, col, num)) {
            grid[row][col] = num;
            if (solveSudoku(grid)) return true;
            grid[row][col] = null;
          }
        }
        return false;
      }
    }
  }
  return true;
};

const shuffle = <T,>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

export const generatePuzzle = (difficulty: Difficulty): { grid: SudokuGrid, solution: number[][] } => {
  const solution: (number | null)[][] = Array.from({ length: 9 }, () => Array(9).fill(null));
  
  // Fill diagonal boxes first to ensure randomness
  const fillDiagonal = () => {
    for (let i = 0; i < 9; i += 3) {
      let nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      let idx = 0;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          solution[i + r][i + c] = nums[idx++];
        }
      }
    }
  };

  fillDiagonal();
  solveSudoku(solution);
  const fullSolution = solution.map(row => [...row as number[]]);

  const puzzleGrid = createEmptyGrid();
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      puzzleGrid[r][c].value = fullSolution[r][c];
      puzzleGrid[r][c].fixed = true;
    }
  }

  const difficultyHoles: Record<Difficulty, number> = {
    'Easy': 35,
    'Medium': 45,
    'Hard': 55,
    'Expert': 62
  };

  let holes = difficultyHoles[difficulty];
  while (holes > 0) {
    const r = Math.floor(Math.random() * 9);
    const c = Math.floor(Math.random() * 9);
    if (puzzleGrid[r][c].value !== null) {
      puzzleGrid[r][c].value = null;
      puzzleGrid[r][c].fixed = false;
      holes--;
    }
  }

  return { grid: puzzleGrid, solution: fullSolution };
};
