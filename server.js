import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL;
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'CLab';
const BREVO_RECIPIENT_EMAIL = process.env.BREVO_RECIPIENT_EMAIL;

async function sendReservationEmail(data) {
  const { name, email, phone, project, budget, slot, message } = data;

  const html = `
    <h2>Nouvelle demande de rendez-vous — CLab</h2>
    <p><strong>Nom / activité :</strong> ${escapeHtml(name)}</p>
    <p><strong>E-mail :</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
    ${phone ? `<p><strong>Téléphone :</strong> <a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a></p>` : ''}
    <p><strong>Projet :</strong> ${escapeHtml(project)}</p>
    <p><strong>Budget :</strong> ${escapeHtml(budget || 'À définir')}</p>
    <p><strong>Créneau souhaité :</strong> ${escapeHtml(slot)}</p>
    ${message ? `<p><strong>Message :</strong><br>${escapeHtml(message).replace(/\n/g, '<br>')}</p>` : ''}
  `;

  const text = [
    'Nouvelle demande de rendez-vous — CLab',
    '',
    `Nom / activité : ${name}`,
    `E-mail : ${email}`,
    phone ? `Téléphone : ${phone}` : null,
    `Projet : ${project}`,
    `Budget : ${budget || 'À définir'}`,
    `Créneau souhaité : ${slot}`,
    message ? `\nMessage :\n${message}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
      to: [{ email: BREVO_RECIPIENT_EMAIL }],
      replyTo: { email, name },
      subject: `Nouveau RDV — ${name}`,
      htmlContent: html,
      textContent: text,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo API error (${res.status}): ${err}`);
  }
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
}

const app = express();
app.use(express.json({ limit: '32kb' }));

app.post('/api/reservation', async (req, res) => {
  if (!BREVO_API_KEY || !BREVO_SENDER_EMAIL || !BREVO_RECIPIENT_EMAIL) {
    return res.status(503).json({
      error: 'Service e-mail non configuré. Définissez BREVO_API_KEY, BREVO_SENDER_EMAIL et BREVO_RECIPIENT_EMAIL.',
    });
  }

  const { name, email, phone, project, budget, slot, message } = req.body || {};

  if (!name?.trim() || !email?.trim()) {
    return res.status(400).json({ error: 'Nom et e-mail requis.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'E-mail invalide.' });
  }

  try {
    await sendReservationEmail({
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim() || '',
      project: project?.trim() || 'À définir',
      budget: budget?.trim() || '',
      slot: slot?.trim() || 'Non précisé',
      message: message?.trim() || '',
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Reservation email failed:', err);
    res.status(500).json({ error: "Impossible d'envoyer la demande. Réessayez dans un instant." });
  }
});

if (isProd) {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });
  app.use(vite.middlewares);
}

app.listen(PORT, () => {
  console.log(`CLab server running on http://localhost:${PORT} (${isProd ? 'production' : 'development'})`);
});
