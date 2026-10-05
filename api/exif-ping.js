// api/exif-ping.js
import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const expected = process.env.OSINT_ACCESS_PASSWORD;

  if (!expected || token !== expected) {
    return res.status(401).json({ ok: false, error: 'Contraseña no válida.' });
  }

  res.json({ ok: true });
});

export default router;
