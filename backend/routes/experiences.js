// routes/experiences.js
// CRUD complet pour les expériences professionnelles

const express = require('express');
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth');
const router = express.Router();

const DATA_FILE = path.join(__dirname, '../data/experiences.json');

function readData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ─── PUBLIC ───────────────────────────────────────────────

// GET /api/experiences
router.get('/', (req, res) => {
  const experiences = readData();
  res.json({ success: true, data: experiences });
});

// ─── PROTÉGÉ ──────────────────────────────────────────────

// POST /api/experiences — ajouter une expérience
router.post('/', auth, (req, res) => {
  const experiences = readData();
  const { poste, entreprise, lieu, dateDebut, dateFin, enCours, description, competences } = req.body;

  if (!poste || !entreprise) {
    return res.status(400).json({ success: false, message: 'Poste et entreprise requis.' });
  }

  const newExp = {
    id: experiences.length > 0 ? Math.max(...experiences.map(e => e.id)) + 1 : 1,
    poste,
    entreprise,
    lieu: lieu || '',
    dateDebut: dateDebut || '',
    dateFin: dateFin || null,
    enCours: enCours || false,
    description: description || '',
    competences: competences || []
  };

  experiences.push(newExp);
  writeData(experiences);
  res.status(201).json({ success: true, message: 'Expérience ajoutée !', data: newExp });
});

// PUT /api/experiences/:id
router.put('/:id', auth, (req, res) => {
  const experiences = readData();
  const index = experiences.findIndex(e => e.id === parseInt(req.params.id));

  if (index === -1) return res.status(404).json({ success: false, message: 'Expérience introuvable.' });

  experiences[index] = { ...experiences[index], ...req.body, id: experiences[index].id };
  writeData(experiences);
  res.json({ success: true, message: 'Expérience mise à jour !', data: experiences[index] });
});

// DELETE /api/experiences/:id
router.delete('/:id', auth, (req, res) => {
  let experiences = readData();
  const index = experiences.findIndex(e => e.id === parseInt(req.params.id));

  if (index === -1) return res.status(404).json({ success: false, message: 'Expérience introuvable.' });

  const deleted = experiences.splice(index, 1);
  writeData(experiences);
  res.json({ success: true, message: 'Expérience supprimée.', data: deleted[0] });
});

module.exports = router;
