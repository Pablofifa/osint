// api/auth-middleware.js
import { randomUUID } from 'node:crypto';

const failedAttempts = new Map();
const blockedUntil = new Map();

const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000;

export function requireAuth(req, res, next) {
  const ip = getClientIP(req);
  const now = Date.now();

  const blocked = blockedUntil.get(ip);
  if (blocked && now < blocked) {
    const remaining = Math.ceil((blocked - now) / 1000 / 60);
    return res.status(423).json({ 
      ok: false, 
      error: `IP bloqueada. Inténtalo de nuevo en ${remaining} minutos.` 
    });
  } else if (blocked) {
    blockedUntil.delete(ip);
    failedAttempts.delete(ip);
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const expected = process.env.OSINT_ACCESS_PASSWORD;

  if (!expected) {
    console.warn('OSINT_ACCESS_PASSWORD no configurada - permitiendo acceso sin auth');
    return next();
  }

  if (token !== expected) {
    const attempts = (failedAttempts.get(ip) || 0) + 1;
    failedAttempts.set(ip, attempts);

    if (attempts >= MAX_ATTEMPTS) {
      blockedUntil.set(ip, now + BLOCK_DURATION_MS);
      return res.status(423).json({ 
        ok: false, 
        error: 'Demasiados intentos fallidos. IP bloqueada durante 15 minutos.' 
      });
    }

    return res.status(401).json({ 
      ok: false, 
      error: 'Contraseña no válida.',
      attemptsRemaining: MAX_ATTEMPTS - attempts
    });
  }

  failedAttempts.delete(ip);
  blockedUntil.delete(ip);
  next();
}

function getClientIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

export function authStatus(req, res) {
  const ip = getClientIP(req);
  const blocked = blockedUntil.get(ip);
  const attempts = failedAttempts.get(ip) || 0;

  res.json({
    ok: true,
    isBlocked: !!blocked && Date.now() < blocked,
    attemptsUsed: attempts,
    attemptsRemaining: MAX_ATTEMPTS - attempts
  });
}
