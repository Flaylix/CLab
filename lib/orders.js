import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, '..', 'data', 'orders.json');

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

export function createOrder(data) {
  const rows = readAll();
  const order = {
    id: crypto.randomBytes(8).toString('hex'),
    createdAt: new Date().toISOString(),
    status: 'en_attente_paiement',
    ...data,
  };
  rows.unshift(order);
  writeAll(rows.slice(0, 500));
  return order;
}

export function updateOrder(id, patch) {
  const rows = readAll();
  const i = rows.findIndex((o) => o.id === id);
  if (i === -1) return null;
  rows[i] = { ...rows[i], ...patch, updatedAt: new Date().toISOString() };
  writeAll(rows);
  return rows[i];
}

export function getOrder(id) {
  return readAll().find((o) => o.id === id) || null;
}

export function listOrders() {
  return readAll();
}
