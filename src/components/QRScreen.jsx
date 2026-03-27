import { useRef } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { DRINKS } from '../lib/gameLogic';

export default function QRScreen({ token, name, drink, onRestart }) {
  const drinkInfo = DRINKS.find(d => d.id === drink);
  const qrValue   = `DRINKBOT:${token}:${drink}`;
  const canvasRef = useRef(null);

  const handleDownload = () => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `drinkbot-qr-${token}.png`;
    a.click();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Мой напиток', text: `Мой код: ${token}` });
      } catch {}
    }
  };

  return (
    <div className="qr-screen">
      <div className="qr-header">
        <h2 className="qr-title">Твой QR-код готов!</h2>
        <p className="qr-sub">
          Привет, <strong>{name}</strong>! Покажи этот код роботу и получи <strong>{drinkInfo?.label}</strong>
        </p>
      </div>

      <div className="qr-box">
        <QRCodeSVG
          value={qrValue}
          size={220}
          bgColor="#ffffff"
          fgColor="#1e293b"
          level="M"
          includeMargin
        />
      </div>

      {/* Скрытый canvas для скачивания */}
      <div ref={canvasRef} style={{ display: 'none' }}>
        <QRCodeCanvas
          value={qrValue}
          size={512}
          bgColor="#ffffff"
          fgColor="#1e293b"
          level="M"
          includeMargin
        />
      </div>

      <div className="qr-token">Код: <code>{token}</code></div>

      <div className="qr-instructions">
        <div className="instruction-step">
          <span className="instr-icon">🤖</span>
          <span>Подойди к роботу</span>
        </div>
        <div className="instruction-step">
          <span className="instr-icon">📱</span>
          <span>Поднеси экран к сканеру</span>
        </div>
        <div className="instruction-step">
          <span className="instr-icon">{drinkInfo?.icon}</span>
          <span>Получи {drinkInfo?.label}!</span>
        </div>
      </div>

      <div className="qr-actions">
        <button className="btn-download" onClick={handleDownload}>
          ⬇ Скачать QR
        </button>
        {navigator.share && (
          <button className="btn-secondary" onClick={handleShare}>
            Поделиться 📤
          </button>
        )}
      </div>

      <a
        className="btn-cases"
        href="https://hackathon.rusindustrial.ai"
        target="_blank"
        rel="noopener noreferrer"
      >
        🤖 Ознакомиться с кейсами
      </a>

      <button className="btn-ghost" onClick={onRestart}>
        Сыграть ещё раз
      </button>
    </div>
  );
}
