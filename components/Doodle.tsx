
import React, { useEffect, useState, useMemo, useRef } from 'react';

type SpriteMood = 'thinking' | 'dancing' | 'napping' | 'walking';

interface Position {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  transform: string;
  transition?: string;
}

const InkSprite: React.FC = () => {
  const [mood, setMood] = useState<SpriteMood>('walking');
  const [pos, setPos] = useState<Position>({ bottom: '5%', left: '-150px', transform: 'scale(1.8)' });
  const [visible, setVisible] = useState(false);
  const cycleTimeoutRef = useRef<number | null>(null);

  const boardSideHotspots: Position[] = useMemo(() => [
    { top: '40%', left: 'calc(50% - 320px)', transform: 'rotate(-3deg) scale(1.2)', transition: 'all 0.7s ease' },
    { top: '40%', right: 'calc(50% - 320px)', transform: 'rotate(3deg) scale(1.2)', transition: 'all 0.7s ease' },
  ], []);

  const cornerHotspots: Position[] = useMemo(() => [
    { top: '8%', left: '6%', transform: 'rotate(-5deg) scale(1.8)', transition: 'all 0.7s ease' },
    { top: '8%', right: '6%', transform: 'rotate(5deg) scale(1.8)', transition: 'all 0.7s ease' },
    { bottom: '15%', left: '6%', transform: 'rotate(5deg) scale(1.8)', transition: 'all 0.7s ease' },
    { bottom: '15%', right: '6%', transform: 'rotate(-5deg) scale(1.8)', transition: 'all 0.7s ease' },
  ], []);

  const triggerNextState = () => {
    setVisible(false);
    if (cycleTimeoutRef.current) clearTimeout(cycleTimeoutRef.current);

    setTimeout(() => {
      const moods: SpriteMood[] = ['thinking', 'dancing', 'napping', 'walking'];
      const nextMood = moods[Math.floor(Math.random() * moods.length)];
      
      if (nextMood === 'walking') {
        const isLTR = Math.random() > 0.5;
        const startLeft = isLTR ? '-150px' : '100vw';
        const endLeft = isLTR ? '100vw' : '-150px';
        const flip = isLTR ? 'scale(1.8)' : 'scale(-1.8, 1.8)';

        setMood('walking');
        setPos({ bottom: '5%', left: startLeft, transform: flip, transition: 'none' });

        setTimeout(() => {
          setVisible(true);
          setPos({ 
            bottom: '5%', 
            left: endLeft, 
            transform: flip,
            transition: 'left 14s linear, opacity 0.5s ease' 
          });
          cycleTimeoutRef.current = window.setTimeout(triggerNextState, 14000);
        }, 50);
      } else {
        let nextPos: Position;
        if (nextMood === 'thinking') {
          nextPos = boardSideHotspots[Math.floor(Math.random() * boardSideHotspots.length)];
        } else {
          nextPos = cornerHotspots[Math.floor(Math.random() * cornerHotspots.length)];
        }

        setMood(nextMood);
        setPos({ ...nextPos, transition: 'all 0.7s ease' });
        setVisible(true);
        cycleTimeoutRef.current = window.setTimeout(triggerNextState, 5000);
      }
    }, 800);
  };

  useEffect(() => {
    triggerNextState();
    return () => { if (cycleTimeoutRef.current) clearTimeout(cycleTimeoutRef.current); };
  }, []);

  const renderLimbAnimation = (mood: SpriteMood) => {
    const strokeColor = "#2d3436";
    
    switch (mood) {
      case 'dancing':
        return (
          <g fill="none">
            <animateTransform attributeName="transform" type="translate" values="0 0; 2 -4; -2 0; 0 0" dur="0.6s" repeatCount="indefinite" />
            <circle cx="30" cy="20" r="10" stroke={strokeColor} strokeWidth="2.5" />
            <path d="M30 30Q35 40 30 50" stroke={strokeColor} strokeWidth="2.5">
                 <animate attributeName="d" values="M30 30Q38 40 30 50;M30 30Q22 40 30 50;M30 30Q38 40 30 50" dur="0.4s" repeatCount="indefinite" />
            </path>
            <path d="M30 35Q15 30 5 15" stroke={strokeColor} strokeWidth="2.5">
                <animate attributeName="d" values="M30 35Q15 30 5 15;M30 35Q10 45 5 35;M30 35Q15 30 5 15" dur="0.4s" repeatCount="indefinite" />
            </path>
            <path d="M30 35Q45 30 55 15" stroke={strokeColor} strokeWidth="2.5">
                <animate attributeName="d" values="M30 35Q45 30 55 15;M30 35Q50 45 55 35;M30 35Q45 30 55 15" dur="0.4s" repeatCount="indefinite" />
            </path>
            <path d="M30 50Q20 60 15 75" stroke={strokeColor} strokeWidth="2.5">
                <animate attributeName="d" values="M30 50Q20 60 15 75;M30 50Q35 60 25 75;M30 50Q20 60 15 75" dur="0.4s" repeatCount="indefinite" />
            </path>
            <path d="M30 50Q40 60 45 75" stroke={strokeColor} strokeWidth="2.5">
                <animate attributeName="d" values="M30 50Q40 60 45 75;M30 50Q25 60 35 75;M30 50Q40 60 45 75" dur="0.4s" repeatCount="indefinite" />
            </path>
          </g>
        );
      case 'napping':
        return (
          <g fill="none">
            <circle cx="30" cy="40" r="10" stroke={strokeColor} strokeWidth="2.5" />
            <path d="M25 40H35" stroke={strokeColor} strokeWidth="1.5" />
            <path d="M30 50V65" stroke={strokeColor} strokeWidth="2.5" />
            <path d="M30 65L15 65L15 75" stroke={strokeColor} strokeWidth="2.5" />
            <path d="M30 65L45 65L45 75" stroke={strokeColor} strokeWidth="2.5" />
            <path d="M30 55L15 60" stroke={strokeColor} strokeWidth="2.5" />
            <path d="M30 55L45 60" stroke={strokeColor} strokeWidth="2.5" />
            <text x="45" y="35" fontSize="12" fill={strokeColor} stroke="none" className="font-bold opacity-60">
                Z
                <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
                <animateTransform attributeName="transform" type="translate" values="0 0; 10 -15" dur="2s" repeatCount="indefinite" additive="sum" />
            </text>
          </g>
        );
      case 'thinking':
        return (
          <g fill="none">
            <circle cx="30" cy="20" r="10" stroke={strokeColor} strokeWidth="2.5" />
            <path d="M30 30V55" stroke={strokeColor} strokeWidth="2.5" />
            <path d="M30 35L15 50" stroke={strokeColor} strokeWidth="2.5" />
            <path d="M30 35Q45 35 40 22" stroke={strokeColor} strokeWidth="2.5">
               <animate attributeName="d" values="M30 35Q45 35 40 22;M30 35Q48 32 40 22;M30 35Q45 35 40 22" dur="0.8s" repeatCount="indefinite" />
            </path>
            <path d="M30 55L22 75" stroke={strokeColor} strokeWidth="2.5" />
            <path d="M30 55L38 75" stroke={strokeColor} strokeWidth="2.5" />
            <text x="42" y="12" fontSize="14" fill="#00b894" stroke="none" className="font-bold italic">?</text>
          </g>
        );
      case 'walking':
        return (
          <g fill="none">
            {/* 上下起伏（Bobbing）效果 */}
            <animateTransform attributeName="transform" type="translate" values="0 0; 0 3; 0 0" dur="0.6s" repeatCount="indefinite" />
            
            <circle cx="30" cy="20" r="10" stroke={strokeColor} strokeWidth="2.5" />
            <path d="M30 30V55" stroke={strokeColor} strokeWidth="2.5" />
            
            {/* 后手臂 (与右腿同步) */}
            <path d="M30 35L45 45" stroke={strokeColor} strokeWidth="2.5" opacity="0.3">
                <animate attributeName="d" values="M30 35L45 45;M30 35L15 45;M30 35L45 45" dur="0.6s" repeatCount="indefinite" />
            </path>
            
            {/* 前手臂 (与左腿同步) */}
            <path d="M30 35L15 45" stroke={strokeColor} strokeWidth="2.5">
                <animate attributeName="d" values="M30 35L15 45;M30 35L45 45;M30 35L15 45" dur="0.6s" repeatCount="indefinite" />
            </path>

            {/* 左腿 */}
            <path d="M30 55L20 75" stroke={strokeColor} strokeWidth="2.5">
                 <animate attributeName="d" values="M30 55L20 75;M30 55L40 75;M30 55L20 75" dur="0.6s" repeatCount="indefinite" />
            </path>
            
            {/* 右腿 */}
            <path d="M30 55L40 75" stroke={strokeColor} strokeWidth="2.5">
                 <animate attributeName="d" values="M30 55L40 75;M30 55L20 75;M30 55L40 75" dur="0.6s" repeatCount="indefinite" />
            </path>
          </g>
        );
    }
  };

  return (
    <div 
      className="fixed pointer-events-none transition-all duration-700 ease-in-out hidden lg:block"
      style={{ 
        ...pos,
        opacity: visible ? (mood === 'thinking' ? 0.7 : 0.4) : 0,
        zIndex: 5 // 降低层级，确保在棋盘和按钮 (z-10) 的下面
      }}
    >
      <div className="relative group">
        <svg width="80" height="100" viewBox="0 0 80 100">
          {renderLimbAnimation(mood)}
        </svg>
        
        {visible && mood === 'thinking' && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/90 border border-slate-900 rounded-full px-3 py-1 text-[10px] font-black italic shadow-sm animate-pop-in">
                让我想想...
            </div>
        )}
      </div>
    </div>
  );
};

export default InkSprite;
