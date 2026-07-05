import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'reservations.json');
const MAX_ENTRIES = 500;

function ensureData() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, '[]');
}

function readAll() {
  ensureData();
  return JSON.parse(fs.readFileSync(FILE, 'utf8'));
}

function writeAll(entries) {
  ensureData();
  fs.writeFileSync(FILE, JSON.stringify(entries, null, 2));
}

export function logReservation(data, status = 'sent') {
  const entries = readAll();
  const entry = {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    status,
    name: data.name,
    email: data.email,
    phone: data.phone || '',
    project: data.project,
    budget: data.budget || '',
    slot: data.slot,
    message: data.message || '',
  };
  entries.unshift(entry);
  writeAll(entries.slice(0, MAX_ENTRIES));
  return entry;
}

export function getReservations(limit = 100) {
  const entries = readAll();
  const total = entries.length;
  const todayKey = new Date().toISOString().slice(0, 10);
  const today = entries.filter((e) => e.createdAt.startsWith(todayKey)).length;
  return {
    total,
    today,
    items: entries.slice(0, Math.min(limit, MAX_ENTRIES)),
  };
}
