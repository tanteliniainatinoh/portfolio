// routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth');
const router = express.Router();

const CREDS_FILE = path.join(__dirname, '../data/credentials.json');

// Initialise le fichier credentials s'il n'existe pas
function getCredentials() {
  if (fs.existsSync(CREDS_FILE)) {
    return JSON.parse(fs.readFileSync(CREDS_FILE, 'utf-8'));
  }
  // Première fois : utilise les valeurs du .env
  return {
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD
  };
}

function saveCredentials(creds) {
  fs.writeFileSync(CREDS_FILE, JSON.stringify(creds, null, 2), 'utf-8');
}

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const creds = getCredentials();

  if (username !== creds.username || password !== creds.password) {
    return res.status(401).json({ success: false, message: 'Identifiants incorrects.' });
  }

  const token = jwt.sign(
    { username, role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ success: true, message: 'Connexion réussie !', token });
});

// GET /api/auth/verify
router.get('/verify', auth, (req, res) => {
  const creds = getCredentials();
  res.json({ success: true, user: req.user, currentUsername: creds.username });
});

// PUT /api/auth/credentials — changer identifiant et/ou mot de passe (protégé)
router.put('/credentials', auth, (req, res) => {
  const { currentPassword, newUsername, newPassword } = req.body;
  const creds = getCredentials();

  // Vérifie le mot de passe actuel avant de changer
  if (currentPassword !== creds.password) {
    return res.status(401).json({ success: false, message: 'Mot de passe actuel incorrect.' });
  }

  if (!newUsername && !newPassword) {
    return res.status(400).json({ success: false, message: 'Aucune modification fournie.' });
  }

  const updated = {
    username: newUsername || creds.username,
    password: newPassword || creds.password
  };

  saveCredentials(updated);
  res.json({ success: true, message: 'Identifiants mis à jour ! Reconnectez-vous.' });
});

module.exports = router;