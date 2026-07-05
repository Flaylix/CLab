import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { recordView, getStats } from './lib/analytics.js';
import {
  clearSessionCookie,
  createSession,
  destroySession,
  getCookie,
  requireAdmin,
  setSessionCookie,
} from './lib/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SMS_SENDER = process.env.BREVO_SMS_SENDER || 'CLab';
const BREVO_SMS_RECIPIENT = process.env.BREVO_SMS_RECIPIENT || '33637160713';

const PAGE_ROUTES = {
  '/': 'index.html',
  '/mentions-legales': 'mentions-legales.html',
  '/politique-confidentialite': 'politique-confidentialite.html',
  '/politique-cookies': 'politique-cookies.html',
  '/admin': 'admin.html',
};

function toBrevoPhone(number) {
  let digits = String(number).replace(/\D/g, '');
  if (digits.startsWith('0')) digits = `33${digits.slice(1)}`;
  return digits;
}

async function sendReservationSms(data) {
  const { name, email, phone, project, budget, slot } = data;
  const content = [
    'CLab — Nouveau RDV',
    name,
    project,
    slot,
    budget ? `Budget: ${budget}` : null,
    email,
    phone || null,
  ]
    .filter(Boolean)
    .join(' | ')
    .slice(0, 160);

  const res = await fetch('https://api.brevo.com/v3/transactionalSMS/send', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: BREVO_SMS_SENDER,
      recipient: toBrevoPhone(BREVO_SMS_RECIPIENT),
      content,
      type: 'transactional',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo SMS error (${res.status}): ${err}`);
  }
}

const app = express();
app.use(express.json({ limit: '32kb' }));

app.post('/api/view', (_req, res) => {
  try {
    recordView();
    res.json({ ok: true });
  } catch (err) {
    console.error('View tracking failed:', err);
    res.status(500).json({ error: 'Tracking error' });
  }
});

app.post('/api/admin/login', (req, res) => {
  if (!ADMIN_PASSWORD) {
    return res.status(503).json({ error: 'ADMIN_PASSWORD non configuré sur le serveur.' });
  }
  if (req.body?.password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Code incorrect.' });
  }
  const token = createSession();
  setSessionCookie(res, token);
  res.json({ ok: true });
});

app.post('/api/admin/logout', (req, res) => {
  destroySession(getCookie(req, 'admin_token'));
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.get('/api/admin/me', requireAdmin, (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
  res.json(getStats(days));
});

app.post('/api/reservation', async (req, res) => {
  if (!BREVO_API_KEY) {
    return res.status(503).json({
      error: 'SMS non configuré. Définissez BREVO_API_KEY.',
    });
  }

  const { name, email, phone, project, budget, slot, message } = req.body || {};

  if (!name?.trim() || !email?.trim()) {
    return res.status(400).json({ error: 'Nom et e-mail requis.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'E-mail invalide.' });
  }

  const payload = {
    name: name.trim(),
    email: email.trim(),
    phone: phone?.trim() || '',
    project: project?.trim() || 'À définir',
    budget: budget?.trim() || '',
    slot: slot?.trim() || 'Non précisé',
    message: message?.trim() || '',
  };

  try {
    await sendReservationSms(payload);
    res.json({ ok: true });
  } catch (err) {
    console.error('Reservation SMS failed:', err);
    res.status(500).json({ error: "Impossible d'envoyer la demande. Réessayez dans un instant." });
  }
});

if (isProd) {
  const dist = path.join(__dirname, 'dist');
  app.use(express.static(dist));

  for (const [route, file] of Object.entries(PAGE_ROUTES)) {
    if (route === '/') continue;
    app.get(route, (_req, res) => {
      res.sendFile(path.join(dist, file));
    });
  }
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });
  app.use(vite.middlewares);

  app.use('*', async (req, res, next) => {
    if (req.originalUrl.startsWith('/api/')) return next();

    const url = req.originalUrl.split('?')[0];
    const file = PAGE_ROUTES[url];
    if (!file) return next();

    try {
      const template = fs.readFileSync(path.join(__dirname, file), 'utf-8');
      const html = await vite.transformIndexHtml(req.originalUrl, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (err) {
      vite.ssrFixStacktrace(err);
      next(err);
    }
  });
}

app.listen(PORT, () => {
  console.log(`CLab server running on http://localhost:${PORT} (${isProd ? 'production' : 'development'})`);
});
