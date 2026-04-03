export default function StartScreen({ onStart }) {
  return (
    <div className="start-screen">
      <div className="snowflakes" aria-hidden>
        {['❄','❅','❆','❄','❅'].map((s, i) => (
          <span key={i} className={`flake flake-${i}`}>{s}</span>
        ))}
      </div>

      <div className="start-content">
        <div className="robot-hero">
          <img src="/snowbot.svg" alt="" />
        </div>
        <h1 className="start-title">Запрограммируй снегоуборщика!</h1>
        <p className="start-sub">
          Расставь блоки так, чтобы робот расчистил весь снег.<br/>
          Получи QR-код и выбери напиток 🥤
        </p>

        <div className="steps-list">
          <div className="step"><span className="step-num">1</span><span>Составь программу из блоков</span></div>
          <div className="step"><span className="step-num">2</span><span>Запусти робота ▶</span></div>
          <div className="step"><span className="step-num">3</span><span>Введи контакты и получи QR</span></div>
          <div className="step"><span className="step-num">4</span><span>Покажи QR — робот нальёт напиток</span></div>
        </div>

        <button className="btn-primary btn-large" onClick={onStart}>
          Начать игру 🚀
        </button>
      </div>
    </div>
  );
}
