import { nanoid } from 'nanoid';

const BASE_URL = 'https://api.airtable.com/v0';
const BASE_ID  = process.env.AIRTABLE_BASE_ID;
const TABLE    = process.env.AIRTABLE_TABLE || 'Contacts';
const API_KEY  = process.env.AIRTABLE_API_KEY;
const SHEETS_URL = process.env.GOOGLE_SCRIPT_URL;

function sendToSheets(data) {
  if (!SHEETS_URL) return;
  fetch(SHEETS_URL, {
    method: 'POST',
    body: JSON.stringify({ ...data, createdAt: new Date().toISOString() }),
  }).catch(() => {});
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, contact, drink } = req.body ?? {};

  if (!name?.trim() || !contact?.trim() || !drink) {
    return res.status(400).json({ error: 'Missing required fields: name, contact, drink' });
  }

  const safeName    = String(name).slice(0, 60).trim();
  const safeContact = String(contact).slice(0, 80).trim();
  const safeDrink   = String(drink).slice(0, 20).trim();
  const token       = nanoid(12);

  if (!BASE_ID || !API_KEY) {
    sendToSheets({ name: safeName, contact: safeContact, drink: safeDrink, token });
    return res.status(200).json({ token });
  }

  try {
    const airtableRes = await fetch(
      `${BASE_URL}/${BASE_ID}/${encodeURIComponent(TABLE)}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            Name:      safeName,
            Contact:   safeContact,
            Drink:     safeDrink,
            Token:     token,
            Used:      false,
            CreatedAt: new Date().toISOString(),
          },
        }),
      }
    );

    if (!airtableRes.ok) {
      const err = await airtableRes.json().catch(() => ({}));
      return res.status(502).json({ error: err?.error?.message || 'Airtable error' });
    }

    sendToSheets({ name: safeName, contact: safeContact, drink: safeDrink, token });
    return res.status(200).json({ token });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
