import { DRINKS, LEVELS } from './gameLogic';

const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
const CACHE_KEY  = 'admin_config_cache';

function defaults() {
  return {
    drinks: DRINKS.map(d => ({ ...d })),
    levels: LEVELS.map(l => ({ ...l, enabled: true })),
  };
}

function readCache() {
  try {
    const s = localStorage.getItem(CACHE_KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

function writeCache(config) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(config)); } catch {}
}

export async function loadSettings() {
  if (SCRIPT_URL) {
    try {
      const res  = await fetch(`${SCRIPT_URL}?type=config`);
      const data = await res.json();
      if (data.drinks && data.levels) {
        writeCache(data);
        return data;
      }
    } catch {}
  }
  return readCache() ?? defaults();
}

export async function saveSettings(drinks, levels) {
  const config = { drinks, levels };
  writeCache(config);
  if (SCRIPT_URL) {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ type: 'config', drinks, levels }),
    });
  }
}

export function resetSettings() {
  localStorage.removeItem(CACHE_KEY);
  return defaults();
}
