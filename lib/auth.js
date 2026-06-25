import crypto from 'crypto';

const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;
const sessions = new Map();

export function createSession() {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + SESSION_TTL);
  return token;
}

export function isValidSession(token) {
  if (!token) return false;
  const expires = sessions.get(token);
  if (!expires) return false;
  if (Date.now() > expires) {
    sessions.delete(token);
    return false;
  }
  return true;
}

export function destroySession(token) {
  sessions.delete(token);
}

export function getCookie(req, name) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function setSessionCookie(res, token) {
  res.setHeader(
    'Set-Cookie',
    `admin_token=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${SESSION_TTL / 1000}`,
  );
}

export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', 'admin_token=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0');
}

export function requireAdmin(req, res, next) {
  const token = getCookie(req, 'admin_token');
  if (!isValidSession(token)) {
    return res.status(401).json({ error: 'Non autorisé.' });
  }
  next();
}
