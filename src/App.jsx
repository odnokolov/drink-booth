import { useState } from 'react';
import StartScreen  from './components/StartScreen';
import GameScreen   from './components/GameScreen';
import ContactForm  from './components/ContactForm';
import QRScreen     from './components/QRScreen';
import './App.css';

const SCREENS = { START: 'start', GAME: 'game', CONTACT: 'contact', QR: 'qr' };

export default function App() {
  const [screen, setScreen] = useState(SCREENS.START);
  const [result, setResult] = useState(null); // {token, name, drink}

  const handleWin = () => setScreen(SCREENS.CONTACT);

  const handleContact = (data) => {
    setResult(data);
    setScreen(SCREENS.QR);
  };

  const handleRestart = () => {
    setResult(null);
    setScreen(SCREENS.START);
  };

  return (
    <div className="app-wrapper">
      {screen === SCREENS.START   && <StartScreen onStart={() => setScreen(SCREENS.GAME)} />}
      {screen === SCREENS.GAME    && <GameScreen onWin={handleWin} />}
      {screen === SCREENS.CONTACT && <ContactForm onSubmit={handleContact} />}
      {screen === SCREENS.QR      && result && (
        <QRScreen
          token={result.token}
          name={result.name}
          drink={result.drink}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
