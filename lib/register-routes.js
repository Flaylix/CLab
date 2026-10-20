import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { pricingForClient, getOptionById, LEGAL } from '../config/pricing.js';
import { createOrder, updateOrder, getOrder, listOrders } from './orders.js';
import { upsertClientFromOrder, listClients, getClientByEmail, updateClient } from './clients.js';
import { createSubscriptionCheckout, stripeEnabled, addOptionToSubscription } from './stripe-service.js';
import { notifyOwnerNewOrder, emailClientOrderConfirmation, emailClientOptionAdded, notifyOwnerOptionAdded } from './brevo-mail.js';
import { requireAdmin } from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '..', 'data', 'uploads');

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024, files: 12 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Images uniquement'));
    cb(null, true);
  },
});

export function registerAppRoutes(app) {
  app.get('/api/public-config', (_req, res) => {
    res.json({ gtagId: process.env.GOOGLE_ADS_ID || '' });
  });

  app.get('/api/pricing', (_req, res) => {
    res.json(pricingForClient());
  });

  app.post('/api/orders/prepare', (req, res) => {
    try {
      const body = req.body || {};
      if (!body.email?.trim() || !body.companyName?.trim()) {
        return res.status(400).json({ error: 'Nom d\'entreprise et e-mail requis pour enregistrer votre dossier.' });
      }
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + LEGAL.deliveryHours);
      const monthlyTotal = Number(body.monthlyTotal) || 34.9;
      const order = createOrder({
        email: body.email.trim(),
        companyName: body.companyName.trim(),
        phone: body.phone?.trim() || '',
        siret: body.siret?.trim() || '',
        metier: body.metier?.trim() || '',
        address: body.address?.trim() || '',
        googleBusinessUrl: body.googleBusinessUrl?.trim() || '',
        siteBrief: body.siteBrief || {},
        packId: body.packId || null,
        optionIds: body.optionIds || [],
        monthlyTotal,
        cgvAccepted: false,
        deliveryDeadline: deadline.toISOString(),
        files: [],
      });
      res.json({ ok: true, orderId: order.id });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Impossible d\'enregistrer le dossier.' });
    }
  });

  app.patch('/api/orders/:id', (req, res) => {
    const order = getOrder(req.params.id);
    if (!order) return res.status(404).json({ error: 'Commande introuvable' });
    const body = req.body || {};
    const patch = {};
    for (const key of [
      'companyName', 'phone', 'siret', 'metier', 'address', 'googleBusinessUrl',
      'siteBrief', 'packId', 'optionIds', 'monthlyTotal', 'cgvAccepted',
    ]) {
      if (body[key] !== undefined) patch[key] = body[key];
    }
    if (body.email?.trim()) patch.email = body.email.trim();
    const updated = updateOrder(order.id, patch);
    if (updated && body.syncClient) upsertClientFromOrder(updated);
    res.json({ ok: true, order: updated });
  });

  app.post('/api/orders', async (req, res) => {
    try {
      const body = req.body || {};
      if (!body.cgvAccepted) {
        return res.status(400).json({ error: 'Acceptation des CGV requise.' });
      }
      const monthlyTotal = Number(body.monthlyTotal);
      if (!body.email || !body.companyName || !monthlyTotal) {
        return res.status(400).json({ error: 'Informations entreprise incomplètes.' });
      }

      const deadline = new Date();
      deadline.setHours(deadline.getHours() + LEGAL.deliveryHours);

      let order;
      if (body.orderId) {
        order = updateOrder(body.orderId, {
          email: body.email.trim(),
          companyName: body.companyName.trim(),
          phone: body.phone?.trim() || '',
          siret: body.siret?.trim() || '',
          metier: body.metier?.trim() || '',
          address: body.address?.trim() || '',
          googleBusinessUrl: body.googleBusinessUrl?.trim() || '',
          siteBrief: body.siteBrief || {},
          packId: body.packId || null,
          optionIds: body.optionIds || [],
          monthlyTotal,
          cgvAccepted: true,
          deliveryDeadline: deadline.toISOString(),
        });
        if (!order) return res.status(404).json({ error: 'Commande introuvable.' });
      } else {
        order = createOrder({
        email: body.email.trim(),
        companyName: body.companyName.trim(),
        phone: body.phone?.trim() || '',
        siret: body.siret?.trim() || '',
        metier: body.metier?.trim() || '',
        address: body.address?.trim() || '',
        googleBusinessUrl: body.googleBusinessUrl?.trim() || '',
        siteBrief: body.siteBrief || {},
        packId: body.packId || null,
        optionIds: body.optionIds || [],
        monthlyTotal,
        cgvAccepted: Boolean(body.cgvAccepted),
        deliveryDeadline: deadline.toISOString(),
        files: body.files || [],
        });
      }

      upsertClientFromOrder(order);

      let checkoutUrl = null;
      if (stripeEnabled()) {
        try {
          const base = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
          const session = await createSubscriptionCheckout({
            orderId: order.id,
            email: order.email,
            packId: order.packId,
            optionIds: order.optionIds,
            successUrl: `${base}/commander?success=1&order=${order.id}`,
            cancelUrl: `${base}/commander?cancel=1`,
          });
          checkoutUrl = session.url;
          updateOrder(order.id, { stripeSessionId: session.id });
        } catch (e) {
          console.error('Stripe checkout:', e.message);
        }
      }

      res.json({ ok: true, orderId: order.id, checkoutUrl });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Impossible de créer la commande.' });
    }
  });

  app.post('/api/orders/:id/files', (req, res, next) => {
    upload.array('files', 12)(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || 'Upload impossible.' });
      }
      next();
    });
  }, (req, res) => {
    const order = getOrder(req.params.id);
    if (!order) return res.status(404).json({ error: 'Commande introuvable' });
    const names = (req.files || []).map((f) => f.filename);
    updateOrder(order.id, { files: [...(order.files || []), ...names] });
    res.json({ ok: true, files: names });
  });

  app.get('/api/client/me', (req, res) => {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: 'E-mail requis' });
    const client = getClientByEmail(email);
    if (!client) return res.status(404).json({ error: 'Compte introuvable' });
    res.json({ client: sanitizeClient(client) });
  });

  app.post('/api/client/add-option', async (req, res) => {
    const { email, optionId } = req.body || {};
    const client = getClientByEmail(email);
    if (!client) return res.status(404).json({ error: 'Compte introuvable' });
    if (!client.stripeSubscriptionId) {
      return res.status(400).json({ error: 'Abonnement Stripe non actif.' });
    }
    try {
      await addOptionToSubscription(client.stripeSubscriptionId, optionId);
      const opt = getOptionById(optionId);
      const options = [...(client.options || []), {
        id: optionId,
        addedAt: new Date().toISOString(),
        commitmentEnd: addMonthsIso(3),
      }];
      updateClient(client.id, {
        optionIds: [...new Set([...(client.optionIds || []), optionId])],
        options,
        monthlyTotal: Math.round((client.monthlyTotal + (opt?.priceMonthly || 0)) * 100) / 100,
      });
      await emailClientOptionAdded(client.email, opt?.name || optionId);
      await notifyOwnerOptionAdded(client, optionId);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/admin/clients', requireAdmin, (_req, res) => {
    const clients = listClients();
    const mrr = clients
      .filter((c) => ['actif', 'en_creation', 'livre'].includes(c.status))
      .reduce((s, c) => s + (c.monthlyTotal || 0), 0);
    res.json({
      mrr: Math.round(mrr * 100) / 100,
      activeCount: clients.filter((c) => c.status === 'actif' || c.status === 'livre').length,
      avgBasket:
        clients.length > 0
          ? Math.round((clients.reduce((s, c) => s + (c.monthlyTotal || 0), 0) / clients.length) * 100) / 100
          : 0,
      clients,
    });
  });

  app.post('/api/admin/clients/:id/delivered', requireAdmin, (req, res) => {
    const client = updateClient(req.params.id, {
      status: 'livre',
      deliveredAt: new Date().toISOString(),
    });
    if (!client) return res.status(404).json({ error: 'Client introuvable' });
    res.json({ ok: true, client });
  });

  app.get('/api/admin/orders', requireAdmin, (_req, res) => {
    res.json({ orders: listOrders() });
  });
}

function sanitizeClient(c) {
  const { stripeCustomerId, stripeSubscriptionId, ...rest } = c;
  return rest;
}

function addMonthsIso(n) {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}
