import { useState, useEffect } from 'react';
import StartScreen  from './components/StartScreen';
import GameScreen   from './components/GameScreen';
import ContactForm  from './components/ContactForm';
import QRScreen     from './components/QRScreen';
import AdminPanel   from './components/AdminPanel';
import { loadSettings } from './lib/adminSettings';
import './App.css';

const SCREENS = { START: 'start', GAME: 'game', CONTACT: 'contact', QR: 'qr' };
const isAdmin = new URLSearchParams(window.location.search).has('admin');

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

  if (!settings) {
    return (
      <div className="app-wrapper">
        <div className="settings-loading">⏳</div>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="app-wrapper">
        <AdminPanel settings={settings} onSave={setSettings} />
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      {screen === SCREENS.START   && <StartScreen onStart={() => setScreen(SCREENS.GAME)} />}
      {screen === SCREENS.GAME    && <GameScreen  onWin={handleWin} levels={settings.levels} />}
      {screen === SCREENS.CONTACT && <ContactForm onSubmit={handleContact} drinks={settings.drinks} />}
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
