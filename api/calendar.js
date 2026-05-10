// api/calendar.js
// Creates recurring Google Calendar events using the user's access token

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const origin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Expect Bearer token from frontend
  const authHeader = req.headers.authorization || '';
  const accessToken = authHeader.replace('Bearer ', '').trim();

  if (!accessToken) {
    return res.status(401).json({ error: 'No access token provided. Please connect Google Calendar first.' });
  }

  const { title, time, recurrence, description, colorId } = req.body;

  if (!title || !time) {
    return res.status(400).json({ error: 'title and time are required' });
  }

  // Build start datetime for today at the given time (EAT = UTC+3)
  const now   = new Date();
  const year  = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day   = String(now.getDate()).padStart(2, '0');

  // Parse time string like "5:00 AM" or "6:30 PM"
  const parseTime = (t) => {
    // Strip anything after a slash or parenthesis e.g. "5:00 AM (or 6:30 PM)"
    const clean = t.split(/[/(]/)[0].trim();
    const match = clean.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return { h: 7, m: 0 };
    let h = parseInt(match[1]);
    const m = parseInt(match[2]);
    const period = match[3].toUpperCase();
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return { h, m };
  };

  const { h, m } = parseTime(time);
  const startLocal = `${year}-${month}-${day}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`;
  const endH = h + 1;
  const endLocal   = `${year}-${month}-${day}T${String(endH).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`;

  const event = {
    summary: title,
    description: description || '',
    colorId: colorId || '2',
    start: {
      dateTime: startLocal,
      timeZone: 'Africa/Dar_es_Salaam',
    },
    end: {
      dateTime: endLocal,
      timeZone: 'Africa/Dar_es_Salaam',
    },
    recurrence: recurrence ? [recurrence] : [],
    reminders: {
      useDefault: false,
      overrides: [{ method: 'popup', minutes: 10 }],
    },
  };

  try {
    const gcalRes = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(event),
      }
    );

    const data = await gcalRes.json();

    if (!gcalRes.ok) {
      // Token expired
      if (gcalRes.status === 401) {
        return res.status(401).json({ error: 'Token expired. Please reconnect Google Calendar.' });
      }
      return res.status(gcalRes.status).json({ error: data.error?.message || 'Google Calendar error' });
    }

    return res.status(200).json({ success: true, eventId: data.id, link: data.htmlLink });
  } catch (err) {
    console.error('calendar error:', err);
    return res.status(500).json({ error: err.message });
  }
}
