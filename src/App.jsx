import { useState, useEffect } from 'react';
import StartScreen  from './components/StartScreen';
import TutorialScreen from './components/TutorialScreen';
import GameScreen   from './components/GameScreen';
import ContactForm  from './components/ContactForm';
import QRScreen     from './components/QRScreen';
import { loadSettings } from './lib/adminSettings';
import './App.css';

const SCREENS = { START: 'start', TUTORIAL: 'tutorial', GAME: 'game', CONTACT: 'contact', QR: 'qr' };
const TUTORIAL_SEEN_KEY = 'tutorial_seen_v1';

export default function App() {
  const [screen,   setScreen]   = useState(SCREENS.START);
  const [result,   setResult]   = useState(null);
  const [settings, setSettings] = useState(null); // null = loading

  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  const handleWin      = () => setScreen(SCREENS.CONTACT);
  const handleContact  = (data) => { setResult(data); setScreen(SCREENS.QR); };
  const handleRestart  = () => { setResult(null); setScreen(SCREENS.START); };
  const handleStart    = () => {
    const isSeen = localStorage.getItem(TUTORIAL_SEEN_KEY) === '1';
    setScreen(isSeen ? SCREENS.GAME : SCREENS.TUTORIAL);
  };

  if (!settings) {
    return (
      <div className="app-wrapper">
        <div className="settings-loading">⏳</div>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      {screen === SCREENS.START    && <StartScreen onStart={handleStart} />}
      {screen === SCREENS.TUTORIAL && <TutorialScreen onContinue={() => setScreen(SCREENS.GAME)} />}
      {screen === SCREENS.GAME    && <GameScreen  onWin={handleWin} levels={settings.levels} />}
      {screen === SCREENS.CONTACT && <ContactForm onSubmit={handleContact} drinks={settings.drinks} />}
      {screen === SCREENS.QR      && result && (
        <QRScreen
          token={result.token}
          name={result.name}
          drink={result.drink}
          drinks={settings.drinks}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
