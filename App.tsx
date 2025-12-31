
import React, { useState, useEffect, useCallback, useRef } from 'react';
import SudokuBoard from './components/SudokuBoard';
import Numpad from './components/Numpad';
import InkSprite from './components/Doodle';
import { createEmptyGrid, generatePuzzle } from './services/sudokuLogic';
import { getAIHint } from './services/geminiService';
import { Difficulty, GameState, Cell, AIHint, SudokuGrid } from './types';

const DIFFICULTY_MAP: Record<Difficulty, string> = {
  'Easy': '简单',
  'Medium': '中等',
  'Hard': '困难',
  'Expert': '专家'
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    grid: createEmptyGrid(),
    solution: [],
    difficulty: 'Easy',
    timer: 0,
    isActive: false,
    isWon: false,
    selectedCell: null,
    history: [],
    notesMode: false,
    conflicts: new Set(),
    flashingCells: new Set(),
  });

  const [aiHint, setAiHint] = useState<AIHint | null>(null);
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const timerRef = useRef<number | null>(null);

  const startNewGame = useCallback((difficulty: Difficulty = gameState.difficulty) => {
    const { grid, solution } = generatePuzzle(difficulty);
    setGameState(prev => ({
      ...prev,
      grid,
      solution,
      difficulty,
      timer: 0,
      isActive: true,
      isWon: false,
      selectedCell: null,
      history: [grid],
      notesMode: false,
      conflicts: new Set(),
      flashingCells: new Set(),
    }));
    setAiHint(null);
  }, [gameState.difficulty]);

  useEffect(() => {
    startNewGame('Easy');
  }, []); 

  useEffect(() => {
    if (gameState.isActive && !gameState.isWon) {
      timerRef.current = window.setInterval(() => {
        setGameState(prev => ({ ...prev, timer: prev.timer + 1 }));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState.isActive, gameState.isWon]);

  const checkConflicts = (grid: SudokuGrid) => {
    const newConflicts = new Set<string>();
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = grid[r][c].value;
        if (val === null) continue;
        for (let x = 0; x < 9; x++) {
          if (x !== c && grid[r][x].value === val) {
            newConflicts.add(`${r}-${c}`);
            newConflicts.add(`${r}-${x}`);
          }
        }
        for (let x = 0; x < 9; x++) {
          if (x !== r && grid[x][c].value === val) {
            newConflicts.add(`${r}-${c}`);
            newConflicts.add(`${x}-${c}`);
          }
        }
        const startR = r - (r % 3);
        const startC = c - (c % 3);
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            const row = startR + i;
            const col = startC + j;
            if ((row !== r || col !== c) && grid[row][col].value === val) {
              newConflicts.add(`${r}-${c}`);
              newConflicts.add(`${row}-${col}`);
            }
          }
        }
      }
    }
    return newConflicts;
  };

  const handleCellClick = (row: number, col: number) => {
    if (!gameState.isActive || gameState.isWon) return;
    setGameState(prev => ({ ...prev, selectedCell: { row, col } }));
    setAiHint(null);
  };

  const handleNumberInput = (num: number) => {
    const { selectedCell, grid, notesMode } = gameState;
    if (!selectedCell || !gameState.isActive || gameState.isWon) return;
    const cell = grid[selectedCell.row][selectedCell.col];
    if (cell.fixed) return;

    const newGrid = grid.map(row => row.map(c => ({ ...c, notes: [...c.notes] })));
    const targetCell = newGrid[selectedCell.row][selectedCell.col];

    if (notesMode) {
      if (targetCell.value !== null) return;
      const idx = targetCell.notes.indexOf(num);
      if (idx > -1) targetCell.notes.splice(idx, 1);
      else targetCell.notes.push(num);
      setGameState(prev => ({ ...prev, grid: newGrid }));
    } else {
      const oldConflicts = checkConflicts(grid);
      targetCell.value = num;
      targetCell.notes = [];
      const newConflicts = checkConflicts(newGrid);
      const newlyConflicted = new Set<string>();
      newConflicts.forEach(key => { if (!oldConflicts.has(key)) newlyConflicted.add(key); });
      const isComplete = newGrid.every(r => r.every(c => c.value !== null)) && newConflicts.size === 0;
      setGameState(prev => ({ 
        ...prev, 
        grid: newGrid, 
        conflicts: newConflicts,
        flashingCells: newlyConflicted,
        isWon: isComplete, 
        isActive: !isComplete,
        history: [...prev.history, newGrid]
      }));
      if (newlyConflicted.size > 0) {
        setTimeout(() => setGameState(prev => ({ ...prev, flashingCells: new Set() })), 2000);
      }
    }
  };

  const handleErase = () => {
    const { selectedCell, grid } = gameState;
    if (!selectedCell || !gameState.isActive) return;
    const cell = grid[selectedCell.row][selectedCell.col];
    if (cell.fixed) return;
    const newGrid = grid.map(row => row.map(c => ({ ...c, notes: [...c.notes] })));
    const target = newGrid[selectedCell.row][selectedCell.col];
    if (target.value === null) target.notes = [];
    else target.value = null;
    const newConflicts = checkConflicts(newGrid);
    setGameState(prev => ({ 
      ...prev, 
      grid: newGrid, 
      conflicts: newConflicts,
      history: [...prev.history, newGrid]
    }));
  };

  const handleUndo = () => {
    if (gameState.history.length <= 1) return;
    const newHistory = [...gameState.history];
    newHistory.pop();
    const lastState = newHistory[newHistory.length - 1];
    setGameState(prev => ({ 
      ...prev, 
      grid: lastState, 
      history: newHistory,
      conflicts: checkConflicts(lastState),
      flashingCells: new Set()
    }));
  };

  const requestAIHint = async () => {
    if (isAIAnalyzing || !gameState.isActive) return;
    setIsAIAnalyzing(true);
    const hint = await getAIHint(gameState.grid, gameState.solution);
    if (hint) {
      setAiHint(hint);
      setGameState(prev => ({ ...prev, selectedCell: { row: hint.row, col: hint.col } }));
    }
    setIsAIAnalyzing(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>


      {/* Success Modal */}
      {gameState.isWon && (
        <div className="fixed inset-0 bg-gradient-to-br from-teal-900/30 via-slate-900/40 via-30% via-slate-900/40 via-70% to-orange-900/30 backdrop-blur-md z-[120] flex items-center justify-center p-6 animate-pop-in">
          <div className="bg-gradient-to-br from-[#fffdf5] to-[#fff8e7] hand-drawn-border p-12 max-w-lg w-full shadow-2xl relative overflow-hidden">
            {/* 装饰性背景元素 */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-400/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-orange-400/10 rounded-full blur-3xl"></div>

            <button onClick={() => startNewGame()} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 hover:rotate-90 transition-all duration-300 p-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center relative z-10">
              {/* 庆祝图标组 */}
              <div className="flex justify-center items-center gap-4 mb-6">
                <span className="text-4xl animate-bounce" style={{animationDelay: '0s'}}>🎊</span>
                <span className="text-6xl">🎉</span>
                <span className="text-4xl animate-bounce" style={{animationDelay: '0.2s'}}>✨</span>
              </div>

              <h2 className="text-5xl font-black text-slate-900 mb-3 tracking-tight italic" style={{
                textShadow: '3px 3px 0px rgba(20, 184, 166, 0.3), -1px -1px 0px rgba(251, 146, 60, 0.3)'
              }}>
                完美通关！
              </h2>

              <p className="text-slate-500 text-sm mb-8 font-medium">
                又一次逻辑的胜利
              </p>

              {/* 时间显示卡片 */}
              <div className="inline-block bg-white/80 backdrop-blur-sm px-6 py-3 hand-drawn-border mb-10 shadow-md">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">用时</div>
                <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                  {formatTime(gameState.timer)}
                </div>
              </div>

              {/* 按钮组 */}
              <div className="flex gap-4">
                <button
                  onClick={() => startNewGame(gameState.difficulty)}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 text-white px-6 py-4 hand-drawn-border font-black text-base hover:from-teal-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                >
                  同难度再战
                </button>
                <button
                  onClick={() => {
                    const difficulties: Difficulty[] = ['Easy', 'Medium', 'Hard', 'Expert'];
                    const currentIndex = difficulties.indexOf(gameState.difficulty);
                    const nextDifficulty = difficulties[Math.min(currentIndex + 1, difficulties.length - 1)];
                    startNewGame(nextDifficulty);
                  }}
                  className="flex-1 bg-slate-900 text-white px-6 py-4 hand-drawn-border font-black text-base hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                >
                  挑战更难 →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen pb-12 flex flex-col items-center relative overflow-hidden">
      {/* 笔尖小精灵 (Ink Sprite) - 升级版动态交互 */}
      <InkSprite />

      {/* 背景装饰形状 */}
      <div className="blob animate-drift top-[-50px] left-[-50px]"></div>
      <div className="blob animate-drift bottom-[-50px] right-[-50px] bg-teal-300/40" style={{animationDelay: '2s'}}></div>

      {/* Header */}
      <header className="w-full max-w-4xl px-6 py-10 flex justify-between items-end animate-pop-in relative z-10">
        <div className="flex flex-col">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic rotate-[-1deg] mb-1">
            这是一个数独
          </h1>
          <div className="flex items-center gap-4 mt-3">
            <button onClick={() => setShowRules(true)} className="text-xs font-bold border-b-2 border-slate-900 hover:text-teal-600 transition-colors">
              游戏指引
            </button>
            <span className="text-sm font-mono font-black text-slate-800 bg-white/60 px-2 py-0.5 hand-drawn-border">
              {formatTime(gameState.timer)}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
           <select 
            className="bg-transparent border-none text-sm font-black text-slate-900 cursor-pointer focus:outline-none underline decoration-teal-400 decoration-2 underline-offset-4"
            value={gameState.difficulty}
            onChange={(e) => startNewGame(e.target.value as Difficulty)}
          >
            {Object.entries(DIFFICULTY_MAP).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          <button onClick={() => startNewGame()} className="bg-slate-900 text-white px-6 py-2 hand-drawn-border font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-sm">
            我不管，我要重来
          </button>
        </div>
      </header>

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-6 animate-pop-in">
          <div className="bg-[#fffdf5] hand-drawn-border p-10 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setShowRules(false)} className="absolute top-6 right-6 text-slate-900 hover:scale-110 p-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-2xl font-black text-slate-900 mb-6 italic">逻辑之美</h2>
            <div className="space-y-6 text-slate-800 text-base font-medium">
              <p className="border-l-4 border-teal-500 pl-4">每一行、每一列、每个九宫格，数字 1-9 都是独一无二的旅客。</p>
              <p className="border-l-4 border-orange-400 pl-4">笔记模式是您的“草稿纸”，用于记录可能的候选数字。</p>
              <div className="p-4 bg-teal-50/50 hand-drawn-border text-teal-800 text-sm italic">
                “数独不仅是数学，更是关于留白的艺术。”
              </div>
            </div>
            <button onClick={() => setShowRules(false)} className="w-full mt-10 bg-slate-900 text-white py-4 font-black text-lg hand-drawn-border hover:bg-slate-800 shadow-lg">
              领悟了
            </button>
          </div>
        </div>
      )}

      {/* Main Game Area */}
      <main className="w-full max-w-lg px-4 flex-grow animate-pop-in z-10" style={{ animationDelay: '0.1s' }}>
        <div className="flex justify-between items-center mb-8 px-1">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
              {gameState.conflicts.size > 0 ? "⚠️ 存在冲突" : "Zen Mode"}
            </span>
          </div>
          <div className="flex gap-4">
            <button onClick={handleUndo} disabled={gameState.history.length <= 1} className="text-slate-900 hover:text-teal-600 disabled:opacity-20 active:scale-90 transition-transform p-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>
            </button>
            <button 
              onClick={() => setGameState(prev => ({ ...prev, notesMode: !prev.notesMode }))}
              className={`flex items-center gap-2 px-4 py-1.5 hand-drawn-border font-black text-xs transition-all ${gameState.notesMode ? 'bg-teal-500 text-white shadow-md' : 'bg-white text-slate-800'}`}
            >
              笔记模式 {gameState.notesMode ? '开' : '关'}
            </button>
          </div>
        </div>

        <SudokuBoard 
          grid={gameState.grid} 
          selectedCell={gameState.selectedCell} 
          onCellClick={handleCellClick}
          hintCell={aiHint ? { row: aiHint.row, col: aiHint.col } : null}
          conflicts={gameState.conflicts}
          flashingCells={gameState.flashingCells}
        />

        <Numpad onNumberClick={handleNumberInput} onErase={handleErase} disabled={!gameState.isActive || gameState.isWon} />

        {/*<div className="mt-12 px-1">*/}
        {/*  {!aiHint ? (*/}
        {/*    <button onClick={requestAIHint} disabled={isAIAnalyzing || !gameState.isActive || gameState.isWon} className="w-full bg-white border-2 border-slate-900 py-5 font-black flex items-center justify-center gap-4 hand-drawn-shadow active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 text-base italic">*/}
        {/*      {isAIAnalyzing ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>灵感汲取中...</span> : <><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-teal-600"><path d="M12 18a.75.75 0 01.75.75V19a.75.75 0 01-1.5 0v-.25A.75.75 0 0112 18zM12 13a.75.75 0 01.75.75V15a.75.75 0 01-1.5 0v-1.25A.75.75 0 0112 13zM12 2a10 10 0 1010 10A10 10 0 0012 2zm0 18a8 8 0 118-8 8 8 0 01-8 8z" /></svg>向大师求得一记</>}*/}
        {/*    </button>*/}
        {/*  ) : (*/}
        {/*    <div className="bg-white hand-drawn-border p-8 shadow-2xl animate-pop-in relative border-teal-600 border-4">*/}
        {/*      <div className="flex justify-between items-start mb-4">*/}
        {/*        <div className="flex items-center gap-3">*/}
        {/*          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 font-black">AI</div>*/}
        {/*          <h3 className="text-slate-900 font-black text-lg italic underline decoration-teal-400 decoration-wavy underline-offset-4">{aiHint.strategy}</h3>*/}
        {/*        </div>*/}
        {/*        <button onClick={() => setAiHint(null)} className="text-slate-400 hover:text-slate-900 transition-colors p-1"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>*/}
        {/*      </div>*/}
        {/*      <p className="text-slate-700 text-base leading-relaxed mb-8 font-medium italic bg-slate-50 p-4 rounded-lg">“{aiHint.explanation}”</p>*/}
        {/*      <button onClick={() => handleNumberInput(aiHint.value)} className="w-full bg-teal-600 text-white py-4 font-black text-sm hand-drawn-border hover:bg-teal-700 shadow-md">直接抄答案 ({aiHint.value})</button>*/}
        {/*    </div>*/}
        {/*  )}*/}
        {/*</div>*/}


      </main>

      <footer className="mt-auto py-12 text-slate-400 text-[11px] font-black uppercase tracking-[0.5em] text-center opacity-40 select-none">
        Artistic Sudoku • 这是一个数独
      </footer>
    </div>
    </>
  );
};

export default App;
