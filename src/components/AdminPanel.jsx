import { useState } from 'react';
import { LEVELS } from '../lib/gameLogic';
import { saveSettings, resetSettings } from '../lib/adminSettings';

export default function AdminPanel({ settings, onSave }) {
  const [drinks, setDrinks] = useState(() => settings.drinks.map(d => ({ ...d })));
  const [levels, setLevels] = useState(() => settings.levels.map(l => ({ ...l })));
  const [status, setStatus] = useState(null); // null | 'saving' | 'saved' | 'error'

  const updateDrink = (i, field, value) => {
    setDrinks(prev => prev.map((d, idx) => idx === i ? { ...d, [field]: value } : d));
    setStatus(null);
  };

  const updateLevel = (i, field, value) => {
    setLevels(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
    setStatus(null);
  };

  const handleSave = async () => {
    setStatus('saving');
    try {
      await saveSettings(drinks, levels);
      onSave({ drinks, levels });
      setStatus('saved');
      setTimeout(() => setStatus(null), 2500);
    } catch {
      setStatus('error');
    }
  };

  const handleReset = async () => {
    if (!confirm('Сбросить все настройки к значениям по умолчанию?')) return;
    const fresh = resetSettings();
    setDrinks(fresh.drinks);
    setLevels(fresh.levels);
    setStatus(null);
    await saveSettings(fresh.drinks, fresh.levels);
    onSave(fresh);
  };

  const saveLabel = status === 'saving' ? '⏳ Сохраняем...'
                  : status === 'saved'  ? '✅ Сохранено!'
                  : status === 'error'  ? '❌ Ошибка'
                  : '💾 Сохранить';

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1 className="admin-title">⚙️ Настройки стенда</h1>
        <p className="admin-sub">Изменения сохраняются в Google Sheets и применяются для всех</p>
      </div>

      {/* Drinks */}
      <section className="admin-section">
        <h2 className="admin-section-title">🥤 Напитки</h2>
        <div className="admin-table">
          <div className="admin-table-head">
            <span>Иконка</span>
            <span>Название (показывается игроку)</span>
            <span>ID (в QR)</span>
          </div>
          {drinks.map((d, i) => (
            <div key={d.id} className="admin-table-row">
              <input
                className="admin-input admin-input--icon"
                value={d.icon}
                onChange={e => updateDrink(i, 'icon', e.target.value)}
                maxLength={4}
              />
              <input
                className="admin-input"
                value={d.label}
                onChange={e => updateDrink(i, 'label', e.target.value)}
                maxLength={40}
              />
              <code className="admin-id">{d.id}</code>
            </div>
          ))}
        </div>
      </section>

      {/* Levels */}
      <section className="admin-section">
        <h2 className="admin-section-title">🎮 Уровни</h2>
        {levels.map((l, i) => (
          <div key={l.id} className={`admin-level-card ${!l.enabled ? 'admin-level-card--off' : ''}`}>
            <div className="admin-level-header">
              <span className="admin-level-name">{LEVELS[i]?.title ?? `Уровень ${l.id}`}</span>
              <label className="admin-toggle">
                <input
                  type="checkbox"
                  checked={l.enabled ?? true}
                  onChange={e => updateLevel(i, 'enabled', e.target.checked)}
                />
                <span className="admin-toggle-slider" />
              </label>
            </div>
            <label className="admin-field-label">Подсказка игроку</label>
            <input
              className="admin-input"
              value={l.hint}
              onChange={e => updateLevel(i, 'hint', e.target.value)}
              disabled={!l.enabled}
              maxLength={100}
            />
            <label className="admin-field-label">Максимум блоков: <strong>{l.maxBlocks}</strong></label>
            <input
              type="range"
              min={4}
              max={24}
              value={l.maxBlocks}
              onChange={e => updateLevel(i, 'maxBlocks', Number(e.target.value))}
              disabled={!l.enabled}
              className="admin-range"
            />
          </div>
        ))}
      </section>

      {/* Actions */}
      <div className="admin-actions">
        <button className="btn-ghost" onClick={handleReset}>↺ Сбросить</button>
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={status === 'saving'}
        >
          {saveLabel}
        </button>
      </div>

      <p className="admin-hint">
        Открой <code>/?admin</code> чтобы вернуться сюда
      </p>
    </div>
  );
}
