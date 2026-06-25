import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'views.json');

function ensureData() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, '{}');
}

function readData() {
  ensureData();
  return JSON.parse(fs.readFileSync(FILE, 'utf8'));
}

function writeData(data) {
  ensureData();
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

export function recordView() {
  const data = readData();
  const key = dateKey(new Date());
  data[key] = (data[key] || 0) + 1;
  writeData(data);
}

export function getStats(days) {
  const data = readData();
  const result = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    result.push({ date: key, views: data[key] || 0 });
  }

  const total = result.reduce((sum, row) => sum + row.views, 0);
  const todayViews = data[dateKey(today)] || 0;

  return { total, today: todayViews, series: result };
}
