import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { BLOCK_TYPES, LEVELS, executeProgram, DIR_ANGLE } from '../lib/gameLogic';

const STEP_DELAY = 500; // ms per animation step

export default function GameScreen({ onWin, levels: adminLevels }) {
  const activeLevels = useMemo(() =>
    adminLevels
      .filter(l => l.enabled !== false)
      .map(adminL => {
        const base = LEVELS.find(l => l.id === adminL.id);
        return base ? { ...base, hint: adminL.hint, maxBlocks: adminL.maxBlocks } : null;
      })
      .filter(Boolean),
  [adminLevels]);

  const [levelIdx, setLevelIdx] = useState(0);
  const level = activeLevels[levelIdx] ?? LEVELS[0];

  const [program, setProgram]     = useState([]);
  const [running, setRunning]     = useState(false);
  const [robotPos, setRobotPos]   = useState({ col: level.robot.col, row: level.robot.row, dir: level.robot.dir });
  const [clearedCells, setClearedCells] = useState(new Set());
  const [message, setMessage]     = useState(null); // {text, type: 'error'|'success'}
  const [activeBlock, setActiveBlock] = useState(null); // index of executing block, or null
  const [errorBlock, setErrorBlock]   = useState(null); // index of block that caused error
  const timerRef = useRef([]);

  const resetLevel = useCallback((lvl) => {
    setProgram([]);
    setRunning(false);
    setRobotPos({ col: lvl.robot.col, row: lvl.robot.row, dir: lvl.robot.dir });
    setClearedCells(new Set([`${lvl.robot.col},${lvl.robot.row}`]));
    setMessage(null);
    setActiveBlock(null);
    setErrorBlock(null);
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];
  }, []);

  useEffect(() => { resetLevel(level); }, [level, resetLevel]);

  const addBlock = (type) => {
    if (running) return;
    if (program.length >= level.maxBlocks) return;
    setProgram(p => [...p, { id: Date.now() + Math.random(), type }]);
  };

  const removeBlock = (id) => {
    if (running) return;
    setProgram(p => p.filter(b => b.id !== id));
  };

  const runProgram = () => {
    if (running || program.length === 0) return;
    setMessage(null);
    setActiveBlock(null);
    setErrorBlock(null);
    setRunning(true);

    // Re-init cleared cells with start position
    const startCleared = new Set([`${level.robot.col},${level.robot.row}`]);
    setClearedCells(startCleared);
    setRobotPos({ col: level.robot.col, row: level.robot.row, dir: level.robot.dir });

    const { steps, success, error } = executeProgram(level, program);

    steps.forEach((step, i) => {
      const t = setTimeout(() => {
        setRobotPos({ col: step.col, row: step.row, dir: step.dir });
        const allSnow = new Set(level.snow.map(([c, r]) => `${c},${r}`));
        const remaining = new Set(step.cleared);
        const cleared = new Set([...allSnow].filter(k => !remaining.has(k)));
        cleared.add(`${step.col},${step.row}`);
        setClearedCells(cleared);

        // step 0 = initial position (no block yet), step i executes block i-1
        setActiveBlock(i > 0 ? i - 1 : null);

        if (i === steps.length - 1) {
          setTimeout(() => {
            setRunning(false);
            setActiveBlock(null);
            if (error) {
              setErrorBlock(i - 1);
              setMessage({ text: error + ' Попробуй снова!', type: 'error' });
            } else if (success) {
              if (levelIdx < activeLevels.length - 1) {
                setMessage({ text: '✅ Отлично! Следующий уровень...', type: 'success' });
                setTimeout(() => setLevelIdx(i => i + 1), 1500);
              } else {
                setMessage({ text: '🎉 Все уровни пройдены!', type: 'success' });
                setTimeout(() => onWin(), 1000);
              }
            } else {
              setMessage({ text: '🔴 Не весь снег убран! Попробуй другую программу.', type: 'error' });
            }
          }, 300);
        }
      }, i * STEP_DELAY);
      timerRef.current.push(t);
    });
  };

  const snowSet = new Set(level.snow.map(([c, r]) => `${c},${r}`));

  return (
    <div className="game-screen">
      <header className="game-header">
        <span className="level-badge">{level.title}</span>
        <span className="level-hint">{level.hint}</span>
      </header>

      {/* Grid */}
      <div className="grid-wrapper">
        <div
          className="game-grid"
          style={{ '--cols': level.grid.cols, '--rows': level.grid.rows }}
        >
          {Array.from({ length: level.grid.rows }, (_, row) =>
            Array.from({ length: level.grid.cols }, (_, col) => {
              const key = `${col},${row}`;
              const isSnow    = snowSet.has(key);
              const isCleared = clearedCells.has(key);
              const isRobot   = robotPos.col === col && robotPos.row === row;
              return (
                <div
                  key={key}
                  className={`cell ${isSnow ? 'cell-snow' : 'cell-empty'} ${isCleared ? 'cell-cleared' : ''}`}
                >
                  {isSnow && !isCleared && <span className="snow-pile">❄</span>}
                  {isRobot && (
                    <span
                      className="robot-icon"
                      style={{ transform: 'scaleX(-1)' }}
                    >🚜</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`game-message ${message.type}`}>{message.text}</div>
      )}

      {/* Program sequence */}
      <div className="program-area">
        <div className="program-label">
          Программа <span className="block-count">{program.length}/{level.maxBlocks}</span>
        </div>
        <div className="program-slots">
          {program.map((block, i) => {
            const bt = BLOCK_TYPES.find(b => b.id === block.type);
            const isActive = activeBlock === i;
            const isError  = errorBlock === i;
            return (
              <button
                key={block.id}
                className={`prog-block${isActive ? ' prog-block--active' : ''}${isError ? ' prog-block--error' : ''}`}
                style={{ background: bt.color }}
                onClick={() => removeBlock(block.id)}
                title="Нажми чтобы удалить"
              >
                <span className="prog-block-num">{i + 1}</span>
                <span className="prog-block-emoji">{bt.emoji}</span>
              </button>
            );
          })}
          {Array.from({ length: level.maxBlocks - program.length }, (_, i) => (
            <div key={`empty-${i}`} className="prog-slot-empty" />
          ))}
        </div>
      </div>

      {/* Block palette */}
      <div className="block-palette">
        {BLOCK_TYPES.map(bt => (
          <button
            key={bt.id}
            className="palette-block"
            style={{ background: bt.color, opacity: running || program.length >= level.maxBlocks ? 0.4 : 1 }}
            onClick={() => addBlock(bt.id)}
            disabled={running || program.length >= level.maxBlocks}
          >
            <span className="palette-emoji">{bt.emoji}</span>
            <span className="palette-label">{bt.label}</span>
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="game-controls">
        <button
          className="btn-secondary"
          onClick={() => resetLevel(level)}
          disabled={running}
        >↺ Сбросить</button>
        <button
          className="btn-primary"
          onClick={runProgram}
          disabled={running || program.length === 0}
        >{running ? '⏳ Едет...' : '▶ Запустить'}</button>
      </div>
    </div>
  );
}
