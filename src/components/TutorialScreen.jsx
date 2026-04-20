import { useState } from 'react';
import { BLOCK_TYPES } from '../lib/gameLogic';

const STEPS = [
  {
    title: '1. Перетяни блок в программу',
    text: 'Перетаскивай блоки из нижней панели в строку программы. Если удобнее, можно просто нажимать на блоки.',
  },
  {
    title: '2. Блок "Вперёд"',
    text: 'После запуска один блок "Вперёд" перемещает робота ровно на 1 клетку в направлении взгляда.',
  },
  {
    title: '3. Блок "Налево"',
    text: 'Блок "Налево" поворачивает робота на месте: позиция не меняется, меняется только направление.',
  },
  {
    title: '4. Блок "Направо"',
    text: 'Блок "Направо" так же поворачивает робота на месте, но в правую сторону.',
  },
];

const COLOR_BY_ID = {
  FORWARD: 'blue',
  TURN_LEFT: 'purple',
  TURN_RIGHT: 'pink',
};

const PROGRAM = BLOCK_TYPES.map((block) => ({
  id: block.id,
  icon: block.emoji,
  color: COLOR_BY_ID[block.id],
}));

const DEMO = [
  { row: 1, col: 1, dir: 'up', activeBlock: 0 },
  { row: 0, col: 1, dir: 'up', activeBlock: 0 },
  { row: 1, col: 1, dir: 'left', activeBlock: 1 },
  { row: 1, col: 1, dir: 'right', activeBlock: 2 },
];

const TUTORIAL_SEEN_KEY = 'tutorial_seen_v1';

export default function TutorialScreen({ onContinue }) {
  const [step, setStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const isFirstStep = step === 0;
  const isLastStep = step === STEPS.length - 1;

  const demo = DEMO[step];

  const handleContinue = () => {
    if (dontShowAgain) {
      localStorage.setItem(TUTORIAL_SEEN_KEY, '1');
    }
    onContinue();
  };

  const handlePrev = () => {
    setStep((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setStep((prev) => Math.min(STEPS.length - 1, prev + 1));
  };

  return (
    <div className="tutorial-screen">
      <div className="tutorial-card">
        <h2 className="tutorial-title">Как программировать робота</h2>
        <p className="tutorial-sub">{STEPS[step].text}</p>

        <div className="tutorial-demo" aria-hidden>
          <div className="tutorial-panel">
            <div className="tutorial-label">Программа</div>
            <div className="tutorial-program-row">
              {PROGRAM.map((block, idx) => (
                <div
                  key={block.id}
                  className={`tutorial-prog-block tutorial-prog-block--${block.color} ${idx === demo.activeBlock ? 'tutorial-prog-block--active' : ''}`}
                >
                  <span className="tutorial-prog-icon">{block.icon}</span>
                </div>
              ))}
              {step === 0 && <div className="tutorial-drag-ghost">{PROGRAM[0].icon}</div>}
            </div>

            <div className="tutorial-limit">
              Блоков: <strong>{PROGRAM.length}</strong> / 16 (на уровне 2)
            </div>
          </div>

          <div className="tutorial-grid">
            {[0, 1, 2].map(row => (
              <div className="tutorial-grid-row" key={row}>
                {[0, 1, 2].map(col => {
                  const robotHere = demo.row === row && demo.col === col;

                  return (
                    <div className="tutorial-cell tutorial-cell--empty" key={`${row}-${col}`}>
                      {step === 1 && row === 0 && col === 1 && <span className="tutorial-move-target">+1</span>}
                      {robotHere && <img className="tutorial-robot" src="/snowbot.svg" alt="" />}
                      {robotHere && (
                        <span className={`tutorial-robot-dir tutorial-robot-dir--${demo.dir}`}>
                          ↑
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="tutorial-step-title">{STEPS[step].title}</div>
        <div className="tutorial-dots" aria-hidden>
          {STEPS.map((_, idx) => (
            <span key={idx} className={`tutorial-dot ${idx === step ? 'tutorial-dot--active' : ''}`} />
          ))}
        </div>

        <label className="tutorial-checkbox">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
          />
          <span>Больше не показывать обучение</span>
        </label>

        <div className="tutorial-actions">
          <button className="btn-secondary" onClick={handlePrev} disabled={isFirstStep}>
            ← Назад
          </button>
          <button className="btn-secondary" onClick={handleNext} disabled={isLastStep}>
            Далее →
          </button>
        </div>

        <button className="btn-primary btn-large tutorial-start-btn" onClick={handleContinue} disabled={!isLastStep}>
          Поехали 🚀
        </button>
        {!isLastStep && (
          <p className="tutorial-progress-note">
            Пройди все шаги, чтобы начать игру
          </p>
        )}
      </div>
    </div>
  );
}
