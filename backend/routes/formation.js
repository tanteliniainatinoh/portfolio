// routes/formation.js
// Gestion de la formation académique

const express = require('express');
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth');
const router = express.Router();

const DATA_FILE = path.join(__dirname, '../data/formation.json');

function readData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// GET /api/formation — public
router.get('/', (req, res) => {
  const formation = readData();
  res.json({ success: true, data: formation });
});

// POST /api/formation — protégé
router.post('/', auth, (req, res) => {
  const formation = readData();
  const { diplome, etablissement, lieu, dateDebut, dateFin, enCours, mention, description } = req.body;

  if (!diplome || !etablissement) {
    return res.status(400).json({ success: false, message: 'Diplôme et établissement requis.' });
  }

  const newFormation = {
    id: formation.length > 0 ? Math.max(...formation.map(f => f.id)) + 1 : 1,
    diplome, etablissement,
    lieu: lieu || '',
    dateDebut: dateDebut || '',
    dateFin: dateFin || null,
    enCours: enCours || false,
    mention: mention || '',
    description: description || ''
  };

  formation.push(newFormation);
  writeData(formation);
  res.status(201).json({ success: true, message: 'Formation ajoutée !', data: newFormation });
});

// PUT /api/formation/:id — protégé
router.put('/:id', auth, (req, res) => {
  const formation = readData();
  const index = formation.findIndex(f => f.id === parseInt(req.params.id));

  if (index === -1) return res.status(404).json({ success: false, message: 'Formation introuvable.' });

  formation[index] = { ...formation[index], ...req.body, id: formation[index].id };
  writeData(formation);
  res.json({ success: true, message: 'Formation mise à jour !', data: formation[index] });
});

// DELETE /api/formation/:id — protégé
router.delete('/:id', auth, (req, res) => {
  let formation = readData();
  const index = formation.findIndex(f => f.id === parseInt(req.params.id));

  if (index === -1) return res.status(404).json({ success: false, message: 'Formation introuvable.' });

  const deleted = formation.splice(index, 1);
  writeData(formation);
  res.json({ success: true, message: 'Formation supprimée.', data: deleted[0] });
});

module.exports = router;
