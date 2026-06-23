// server.js — Point d'entrée du backend portfolio de Martinoh
// Démarrer avec : npm run dev (développement) ou npm start (production)

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── MIDDLEWARES ──────────────────────────────────────────

// CORS : autorise votre frontend à appeler l'API
app.use(cors({
  origin: function(origin, callback) {
    // Autorise : pas d'origin (fichiers locaux file://), localhost, et votre domaine
    const allowed = [
      'http://localhost:3000',
      'http://localhost:5500',
      'http://localhost:5501',
      'http://127.0.0.1:5500',
      'http://127.0.0.1:5501',
      'https://tanteliniainatix.vercel.app'
    ];
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // En développement : tout autoriser
    }
  },
  credentials: true
}));

app.use(express.json());

// Servir les fichiers statiques du dossier uploads (images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Log des requêtes (utile pour le debug)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ─── ROUTES ───────────────────────────────────────────────

app.use('/api/auth',        require('./routes/auth'));
app.use('/api/projects',    require('./routes/projects'));
app.use('/api/experiences', require('./routes/experiences'));
app.use('/api/formation',   require('./routes/formation'));

// ─── ROUTE RACINE (test rapide) ───────────────────────────

app.get('/', (req, res) => {
  res.json({
    message: '🚀 Backend Portfolio Martinoh — API opérationnelle',
    version: '1.0.0',
    routes: {
      public: [
        'GET /api/projects',
        'GET /api/projects/:id',
        'GET /api/experiences',
        'GET /api/formation'
      ],
      admin: [
        'POST   /api/auth/login',
        'GET    /api/auth/verify',
        'PUT    /api/auth/credentials',
        'POST   /api/projects         ← token requis',
        'PUT    /api/projects/:id     ← token requis',
        'DELETE /api/projects/:id     ← token requis',
        'POST   /api/experiences      ← token requis',
        'PUT    /api/experiences/:id  ← token requis',
        'DELETE /api/experiences/:id  ← token requis',
        'POST   /api/formation        ← token requis',
        'PUT    /api/formation/:id    ← token requis',
        'DELETE /api/formation/:id    ← token requis'
      ]
    }
  });
});

// ─── GESTION DES ERREURS 404 ──────────────────────────────

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route introuvable.' });
});

// ─── DÉMARRAGE ────────────────────────────────────────────

app.listen(PORT, () => {
  console.log('');
  console.log('  ✅  Backend Portfolio Martinoh démarré !');
  console.log(`  🌐  Serveur : http://localhost:${PORT}`);
  console.log(`  📁  Routes  : http://localhost:${PORT}/`);
  console.log(`  📸  Uploads : http://localhost:${PORT}/uploads/`);
  console.log('');
});