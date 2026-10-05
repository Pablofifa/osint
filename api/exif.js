// api/exif.js
import express from 'express';
import multer from 'multer';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';

const execFileAsync = promisify(execFile);
const router = express.Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: tmpdir(),
    filename: (req, file, cb) => {
      const ext = file.originalname.split('.').pop() || '';
      cb(null, `${randomUUID()}.${ext}`);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
});

const ALLOWED_MIME_PREFIXES = ['image/', 'video/', 'audio/', 'application/pdf'];

function validateFile(file) {
  if (!file) throw new Error('No se ha proporcionado ningún archivo.');
  const mime = file.mimetype || '';
  const allowed = ALLOWED_MIME_PREFIXES.some(p => mime.startsWith(p));
  if (!allowed) throw new Error(`Tipo no permitido: ${mime}`);
}

async function runExifTool(filePath) {
  try {
    const { stdout, stderr } = await execFileAsync('exiftool', ['-json', filePath]);
    if (stderr && !stderr.trim().startsWith('Warning')) console.warn('ExifTool:', stderr);
    const parsed = JSON.parse(stdout);
    if (!Array.isArray(parsed) || parsed.length === 0) return { tags: {}, warnings: ['Sin metadatos'] };
    const tags = parsed[0];
    const warnings = tags['Warning'] ? [tags['Warning']] : [];
    delete tags['SourceFile'];
    delete tags['ExifToolVersion'];
    return { tags, warnings };
  } catch (err) {
    console.error('ExifTool error:', err);
    throw new Error('Error al ejecutar ExifTool');
  }
}

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const expected = process.env.OSINT_ACCESS_PASSWORD;
    if (!expected || token !== expected) {
      return res.status(401).json({ ok: false, error: 'Contraseña no válida.' });
    }

    const file = req.file;
    validateFile(file);
    const { tags, warnings } = await runExifTool(file.path);
    try { await unlink(file.path); } catch (e) {}

    res.json({ ok: true, file: { name: file.originalname, size: file.size, mime: file.mimetype }, tags, warnings });
  } catch (err) {
    console.error('Error en /api/exif:', err);
    res.status(500).json({ ok: false, error: err.message || 'Error interno' });
  }
});

export default router;
