import { nanoid } from 'nanoid';

const BASE_URL    = 'https://api.airtable.com/v0';
const BASE_ID     = import.meta.env.VITE_AIRTABLE_BASE_ID;
const TABLE       = import.meta.env.VITE_AIRTABLE_TABLE || 'Contacts';
const API_KEY     = import.meta.env.VITE_AIRTABLE_API_KEY;
const SHEETS_URL  = import.meta.env.VITE_GOOGLE_SCRIPT_URL;

function sendToSheets({ name, contact, drink, token }) {
  if (!SHEETS_URL) return;
  fetch(SHEETS_URL, {
    method: 'POST',
    body: JSON.stringify({ name, contact, drink, token, createdAt: new Date().toISOString() }),
  }).catch(err => console.warn('[sheets] failed to send:', err));
}

export async function saveContact({ name, contact, drink }) {
  const token = nanoid(12);

  if (!BASE_ID || !API_KEY) {
    // Dev mode: skip Airtable, just return a token
    console.warn('[airtable] env vars not set — using mock token');
    sendToSheets({ name, contact, drink, token });
    return token;
  }

  const res = await fetch(`${BASE_URL}/${BASE_ID}/${encodeURIComponent(TABLE)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        Name:    name,
        Contact: contact,
        Drink:   drink,
        Token:   token,
        Used:    false,
        CreatedAt: new Date().toISOString(),
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Airtable error ${res.status}`);
  }

  sendToSheets({ name, contact, drink, token });
  return token;
}

// Called by the robot PC to validate and mark the token as used
export async function validateToken(token) {
  if (!BASE_ID || !API_KEY) return { valid: true, drink: 'coffee' };

  const url = `${BASE_URL}/${BASE_ID}/${encodeURIComponent(TABLE)}?filterByFormula=Token="${token}"`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });

  if (!res.ok) return { valid: false };

  const data = await res.json();
  const record = data.records?.[0];
  if (!record || record.fields.Used) return { valid: false };

  // Mark as used
  await fetch(`${BASE_URL}/${BASE_ID}/${encodeURIComponent(TABLE)}/${record.id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields: { Used: true } }),
  });

  return { valid: true, drink: record.fields.Drink, name: record.fields.Name };
}
