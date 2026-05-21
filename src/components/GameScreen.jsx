import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { BLOCK_TYPES, LEVELS, executeProgram } from '../lib/gameLogic';

const STEP_DELAY = 500; // ms per animation step

export default function GameScreen({ onWin, levels: adminLevels }) {
  const activeLevels = useMemo(() =>
    adminLevels
      .filter(l => l.enabled !== false)
      .map(adminL => {
        const base = LEVELS.find(l => l.id === adminL.id);
        return base ? { ...base, hint: adminL.hint, maxBlocks: base.maxBlocks } : null;
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
  const [burstCells, setBurstCells]   = useState({}); // snow-cleared burst animation keys
  const timerRef    = useRef([]);
  const slotsRef    = useRef(null);
  const blockRefs   = useRef({});
  const clearedRef  = useRef(new Set());
  const level2FailsRef = useRef(0);
  const [stuckModalOpen, setStuckModalOpen] = useState(false);

  const resetLevel = useCallback((lvl) => {
    setProgram([]);
    setRunning(false);
    setRobotPos({ col: lvl.robot.col, row: lvl.robot.row, dir: lvl.robot.dir });
    const start = new Set([`${lvl.robot.col},${lvl.robot.row}`]);
    clearedRef.current = start;
    setClearedCells(start);
    setMessage(null);
    setActiveBlock(null);
    setErrorBlock(null);
    setBurstCells({});
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];
  }, []);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- полный сброс поля и модалки при смене уровня */
    resetLevel(level);
    level2FailsRef.current = 0;
    setStuckModalOpen(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [level, resetLevel]);

  useEffect(() => {
    document.body.style.overflow = stuckModalOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [stuckModalOpen]);

  const BLOCK_STEP   = 54;  // 48px block + 6px gap
  const SCROLL_AFTER = 5;  // start scrolling after 6th block (index 5, 0-based)

  // Scroll right by 1 block each time a new block is added (only after 6th)
  useEffect(() => {
    if (!running && slotsRef.current) {
      const idx = program.length - 1;
      if (idx > SCROLL_AFTER) {
        slotsRef.current.scrollTo({ left: (idx - SCROLL_AFTER) * BLOCK_STEP, behavior: 'smooth' });
      }
    }
  }, [program.length, running]);

  // Follow active block during execution (only after 6th)
  useEffect(() => {
    if (activeBlock !== null && activeBlock > SCROLL_AFTER && slotsRef.current) {
      slotsRef.current.scrollTo({ left: (activeBlock - SCROLL_AFTER) * BLOCK_STEP, behavior: 'smooth' });
    }
  }, [activeBlock]);

  const addBlock = (type) => {
    if (running || stuckModalOpen) return;
    if (program.length >= level.maxBlocks) return;
    setProgram(p => [...p, { id: Date.now() + Math.random(), type }]);
  };

  const removeBlock = (id) => {
    if (running || stuckModalOpen) return;
    setProgram(p => p.filter(b => b.id !== id));
  };

  const runProgram = () => {
    if (running || stuckModalOpen || program.length === 0) return;
    setMessage(null);
    setActiveBlock(null);
    setErrorBlock(null);
    setBurstCells({});
    setRunning(true);

    // Re-init cleared cells with start position
    const startCleared = new Set([`${level.robot.col},${level.robot.row}`]);
    clearedRef.current = new Set(startCleared);
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

        const prevCleared = clearedRef.current;
        clearedRef.current = new Set(cleared);
        const newlyClearedSnow = [...cleared].filter(k => !prevCleared.has(k) && allSnow.has(k));
        if (newlyClearedSnow.length > 0) {
          setBurstCells(b => {
            const n = { ...b };
            newlyClearedSnow.forEach(k => { n[k] = true; });
            return n;
          });
          const toClear = newlyClearedSnow;
          setTimeout(() => {
            setBurstCells(b => {
              const n = { ...b };
              toClear.forEach(k => { delete n[k]; });
              return n;
            });
          }, 1050);
        }

        setClearedCells(cleared);

        // step 0 = initial position (no block yet), step i executes block i-1
        setActiveBlock(i > 0 ? i - 1 : null);

        if (i === steps.length - 1) {
          setTimeout(() => {
            setRunning(false);
            setActiveBlock(null);
            if (success) {
              if (levelIdx < activeLevels.length - 1) {
                setMessage({ text: '✅ Отлично! Следующий уровень...', type: 'success' });
                setTimeout(() => setLevelIdx(i => i + 1), 1500);
              } else {
                setMessage({ text: '🎉 Все уровни пройдены!', type: 'success' });
                setTimeout(() => onWin(), 1000);
              }
            } else {
              if (error) {
                setErrorBlock(i - 1);
                setMessage({ text: `${error} Попробуй снова!`, type: 'error' });
              } else {
                setMessage({ text: '🔴 Не весь снег убран! Попробуй другую программу.', type: 'error' });
              }

              if (level.id === 2) {
                level2FailsRef.current += 1;
                if (level2FailsRef.current >= 2) {
                  setStuckModalOpen(true);
                }
              }
            }
          }, 300);
        }
      }, i * STEP_DELAY);
      timerRef.current.push(t);
    });
  };

  const snowSet = new Set(level.snow.map(([c, r]) => `${c},${r}`));

  const handleStuckRetry = () => {
    setStuckModalOpen(false);
    level2FailsRef.current = 0;
    resetLevel(level);
  };

  const handleSkipToDrinks = () => {
    setStuckModalOpen(false);
    onWin();
  };

  const uiLocked = running || stuckModalOpen;

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
              const showBurst = isSnow && isCleared && burstCells[key];
              return (
                <div
                  key={key}
                  className={`cell ${isSnow ? 'cell-snow' : 'cell-empty'} ${isCleared ? 'cell-cleared' : ''}`}
                >
                  {isSnow && !isCleared && <span className="snow-pile">❄</span>}
                  {showBurst && (
                    <div className="snow-burst" aria-hidden>
                      <img className="snow-particle snow-particle--l" src="/snowflake.svg" alt="" />
                      <img className="snow-particle snow-particle--r" src="/snowflake.svg" alt="" />
                      <img className="snow-particle snow-particle--ul" src="/snowflake.svg" alt="" />
                      <img className="snow-particle snow-particle--ur" src="/snowflake.svg" alt="" />
                    </div>
                  )}
                  {isRobot && (
                    <img
                      className="robot-icon"
                      src="/techbot.svg"
                      alt=""
                    />
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
        <div className="program-slots" ref={slotsRef}>
          {program.map((block, i) => {
            const bt = BLOCK_TYPES.find(b => b.id === block.type);
            const isActive = activeBlock === i;
            const isError  = errorBlock === i;
            return (
              <button
                key={block.id}
                ref={el => { blockRefs.current[i] = el; }}
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
          {program.length < level.maxBlocks && (
            <div key="empty-next" className="prog-slot-empty" />
          )}
        </div>
      </div>

      {/* Block palette */}
      <div className="block-palette">
        {BLOCK_TYPES.map(bt => (
          <button
            key={bt.id}
            className="palette-block"
            style={{ background: bt.color, opacity: uiLocked || program.length >= level.maxBlocks ? 0.4 : 1 }}
            onClick={() => addBlock(bt.id)}
            disabled={uiLocked || program.length >= level.maxBlocks}
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
          disabled={uiLocked}
        >↺ Сбросить</button>
        <button
          className="btn-primary"
          onClick={runProgram}
          disabled={running || stuckModalOpen || program.length === 0}
        >{running ? '⏳ Едет...' : '▶ Запустить'}</button>
      </div>

      {stuckModalOpen && (
        <div
          className="game-modal-root"
          aria-hidden={false}
        >
          <div className="game-modal-backdrop" />
          <div
            className="game-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="game-stuck-modal-title"
            aria-describedby="game-stuck-modal-desc"
          >
            <h2 id="game-stuck-modal-title" className="game-modal-title">
              Уровень 2 получился сложным
            </h2>
            <p id="game-stuck-modal-desc" className="game-modal-desc">
              Две попытки подряд не увенчались успехом. Попробуй ещё раз или перейди к выбору напитка и QR-коду.
            </p>
            <div className="game-modal-actions">
              <button type="button" className="btn-secondary btn-modal" onClick={handleStuckRetry}>
                Попробовать ещё раз
              </button>
              <button type="button" className="btn-primary btn-modal" onClick={handleSkipToDrinks}>
                Перейти к выбору напитка
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
