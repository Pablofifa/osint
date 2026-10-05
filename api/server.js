// api/server.js
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Servir estáticos desde la raíz
app.use(express.static(join(__dirname, '..')));

// Importar middlewares y rutas
import { requireAuth, authStatus } from './auth-middleware.js';
import exifPingRouter from './exif-ping.js';
import exifRouter from './exif.js';

// Autenticación global - aplicar a TODAS las rutas /api/*
app.use('/api', requireAuth);

// Estado de autenticación (pública, para que el frontend consulte)
app.get('/api/auth-status', authStatus);

// Rutas de ExifTool
app.use('/api/exif-ping', exifPingRouter);
app.use('/api/exif', exifRouter);

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`OSINT API running on port ${PORT}`);
});

export default app;
