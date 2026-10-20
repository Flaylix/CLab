import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, '..', 'data', 'clients.json');

function ensure() {
  const dir = path.dirname(FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, '[]');
}

function readAll() {
  ensure();
  return JSON.parse(fs.readFileSync(FILE, 'utf8'));
}

function writeAll(rows) {
  ensure();
  fs.writeFileSync(FILE, JSON.stringify(rows, null, 2));
}

export function upsertClientFromOrder(order) {
  const rows = readAll();
  let client = rows.find((c) => c.email === order.email);
  const now = new Date().toISOString();
  const baseEnd = addMonths(new Date(), 12);
  const payload = {
    id: client?.id || crypto.randomBytes(8).toString('hex'),
    email: order.email,
    companyName: order.companyName,
    phone: order.phone,
    siret: order.siret,
    metier: order.metier,
    planId: order.planId,
    packId: order.packId || null,
    optionIds: order.optionIds || [],
    options: (order.optionIds || []).map((oid) => ({
      id: oid,
      addedAt: now,
      commitmentEnd: addMonths(new Date(), 3).toISOString().slice(0, 10),
    })),
    monthlyTotal: order.monthlyTotal,
    status: order.status === 'paye' ? 'en_creation' : 'en_attente_paiement',
    stripeCustomerId: order.stripeCustomerId || null,
    stripeSubscriptionId: order.stripeSubscriptionId || null,
    planCommitmentEnd: baseEnd.toISOString().slice(0, 10),
    deliveryDeadline: order.deliveryDeadline || null,
    deliveredAt: null,
    createdAt: client?.createdAt || now,
    updatedAt: now,
  };
  if (client) {
    Object.assign(client, payload);
  } else {
    client = payload;
    rows.unshift(client);
  }
  writeAll(rows);
  return client;
}

export function listClients() {
  return readAll();
}

export function getClientByEmail(email) {
  return readAll().find((c) => c.email === email) || null;
}

export function updateClient(id, patch) {
  const rows = readAll();
  const i = rows.findIndex((c) => c.id === id);
  if (i === -1) return null;
  rows[i] = { ...rows[i], ...patch, updatedAt: new Date().toISOString() };
  writeAll(rows);
  return rows[i];
}

function addMonths(d, n) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}
