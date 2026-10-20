const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL;
const SENDER_NAME = process.env.BREVO_SENDER_NAME || 'CLab';
const OWNER_EMAIL = process.env.BREVO_OWNER_EMAIL || process.env.BREVO_RECIPIENT_EMAIL;

export async function sendBrevoEmail({ to, subject, html, text }) {
  if (!BREVO_API_KEY || !SENDER_EMAIL || !to?.length) return false;
  if (BREVO_API_KEY.startsWith('xsmtpsib-')) return false;

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: to.map((email) => ({ email })),
      subject,
      htmlContent: html,
      textContent: text || html.replace(/<[^>]+>/g, ' '),
    }),
  });
  return res.ok;
}

export async function notifyOwnerNewOrder(order) {
  if (!OWNER_EMAIL) return;
  const files = (order.files || []).length ? `<p>Fichiers : ${order.files.join(', ')}</p>` : '';
  const brief = order.siteBrief ? `<pre>${JSON.stringify(order.siteBrief, null, 2)}</pre>` : '';
  const html = `<h2>Nouvelle commande CLab</h2>${brief}${files}<pre>${JSON.stringify(order, null, 2)}</pre>`;
  await sendBrevoEmail({
    to: [OWNER_EMAIL],
    subject: `Nouvelle commande — ${order.companyName || order.email}`,
    html,
  });
}

export async function emailClientOrderConfirmation(order) {
  await sendBrevoEmail({
    to: [order.email],
    subject: 'CLab — Confirmation de votre commande',
    html: `<p>Bonjour,</p><p>Nous avons bien reçu votre commande (${order.monthlyTotal} € HT/mois). Votre site sera prêt sous 72 h après réception de vos informations.</p><p>— CLab</p>`,
  });
}

export async function emailClientOptionAdded(email, optionName) {
  await sendBrevoEmail({
    to: [email],
    subject: 'CLab — Option ajoutée à votre abonnement',
    html: `<p>Bonjour,</p><p>L'option « ${optionName} » a bien été ajoutée à votre abonnement (prorata sur la prochaine facture).</p>`,
  });
}

export async function notifyOwnerOptionAdded(client, optionId) {
  if (!OWNER_EMAIL) return;
  await sendBrevoEmail({
    to: [OWNER_EMAIL],
    subject: `Option ajoutée — ${client.companyName || client.email}`,
    html: `<p>Client: ${client.email}</p><p>Option: ${optionId}</p>`,
  });
}

export async function emailClientPaymentFailed(email) {
  await sendBrevoEmail({
    to: [email],
    subject: 'CLab — Échec de prélèvement',
    html: `<p>Bonjour,</p><p>Votre dernier prélèvement n'a pas abouti. Merci de mettre à jour votre moyen de paiement pour éviter la suspension du site.</p>`,
  });
}
