import { useState } from 'react';
import { DRINKS } from '../lib/gameLogic';
import { saveContact } from '../lib/airtable';

export default function ContactForm({ onSubmit }) {
  const [name,    setName]    = useState('');
  const [contact, setContact] = useState('');
  const [drink,   setDrink]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const isValid = name.trim() && contact.trim() && drink;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || loading) return;
    setLoading(true);
    setError(null);
    try {
      const token = await saveContact({ name: name.trim(), contact: contact.trim(), drink });
      onSubmit({ token, name: name.trim(), drink });
    } catch (err) {
      setError('Что-то пошло не так. Попробуй ещё раз.');
      setLoading(false);
    }
  };

  return (
    <div className="contact-screen">
      <div className="win-badge">🎉</div>
      <h2 className="contact-title">Ты прошёл игру!</h2>
      <p className="contact-sub">Введи контакты и выбери напиток — получишь QR-код</p>

      <form className="contact-form" onSubmit={handleSubmit}>
        <label className="field-label">Имя</label>
        <input
          className="field-input"
          placeholder="Как тебя зовут?"
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={loading}
          maxLength={60}
        />

        <label className="field-label">Телефон или Email</label>
        <input
          className="field-input"
          placeholder="+7 999 ... или name@mail.ru"
          value={contact}
          onChange={e => setContact(e.target.value)}
          disabled={loading}
          maxLength={80}
        />

        <label className="field-label">Выбери напиток</label>
        <div className="drink-grid">
          {DRINKS.map(d => (
            <button
              key={d.id}
              type="button"
              className={`drink-btn ${drink === d.id ? 'drink-selected' : ''}`}
              onClick={() => setDrink(d.id)}
              disabled={loading}
            >
              <span className="drink-icon">{d.icon}</span>
              <span className="drink-name">{d.label}</span>
            </button>
          ))}
        </div>

        {error && <p className="form-error">{error}</p>}

        <button
          type="submit"
          className="btn-primary btn-large"
          disabled={!isValid || loading}
        >
          {loading ? '⏳ Сохраняем...' : 'Получить QR-код 📱'}
        </button>
      </form>
    </div>
  );
}
