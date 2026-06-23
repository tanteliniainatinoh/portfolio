const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const auth = require('../middleware/auth');
const router = express.Router();

const DATA_FILE = path.join(__dirname, '../data/projects.json');
const UPLOADS_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

// Multer config — stocke les images dans uploads/
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `project_${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Fichier image uniquement'));
  }
});

function readData() { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')); }
function writeData(data) { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); }

// GET public
router.get('/', (req, res) => res.json({ success: true, data: readData() }));
router.get('/:id', (req, res) => {
  const p = readData().find(p => p.id === parseInt(req.params.id));
  if (!p) return res.status(404).json({ success: false, message: 'Introuvable.' });
  res.json({ success: true, data: p });
});

// POST — ajouter projet avec photos multiples
router.post('/', auth, upload.array('images', 10), (req, res) => {
  const projects = readData();
  const { title, description, stack, thumb, github, live, featured, client } = req.body;
  if (!title || !description) return res.status(400).json({ success: false, message: 'Titre et description requis.' });

  // Récupérer les URLs des images uploadées
  const imageUrls = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];
  
  // Utiliser la première image comme image principale si disponible
  const mainImage = imageUrls.length > 0 ? imageUrls[0] : null;

  const newProject = {
    id: projects.length > 0 ? Math.max(...projects.map(p => p.id)) + 1 : 1,
    title,
    description,
    stack: stack ? (typeof stack === 'string' ? stack.split(',').map(s => s.trim()) : stack) : [],
    thumb: thumb || '💻',
    image: mainImage,
    images: imageUrls,
    github: github || '',
    live: live || '',
    featured: featured === 'true' || featured === true,
    client: client || '',
    createdAt: new Date().toISOString().split('T')[0]
  };
  projects.push(newProject);
  writeData(projects);
  res.status(201).json({ success: true, message: 'Projet ajouté !', data: newProject });
});

// PUT — modifier projet
router.put('/:id', auth, upload.array('images', 10), (req, res) => {
  const projects = readData();
  const index = projects.findIndex(p => p.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ success: false, message: 'Introuvable.' });

  const updated = { ...projects[index], ...req.body, id: projects[index].id };
  
  if (req.body.stack && typeof req.body.stack === 'string')
    updated.stack = req.body.stack.split(',').map(s => s.trim());
  
  // Gérer les nouvelles images
  if (req.files && req.files.length > 0) {
    const newImageUrls = req.files.map(f => `/uploads/${f.filename}`);
    
    // Conserver les anciennes images si elles existent déjà
    const existingImages = updated.images || [];
    
    // Si on a uploadé de nouvelles images, on les ajoute à la liste
    // On garde l'ancienne image principale si elle existe toujours
    updated.images = [...existingImages, ...newImageUrls];
    
    // Mettre à jour l'image principale (la première)
    if (updated.images.length > 0) {
      updated.image = updated.images[0];
    }
  }

  projects[index] = updated;
  writeData(projects);
  res.json({ success: true, message: 'Projet mis à jour !', data: updated });
});

// DELETE
router.delete('/:id', auth, (req, res) => {
  let projects = readData();
  const index = projects.findIndex(p => p.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ success: false, message: 'Introuvable.' });
  
  // Supprimer toutes les images du projet
  const project = projects[index];
  if (project.images && project.images.length > 0) {
    project.images.forEach(imgPath => {
      const fullPath = path.join(__dirname, '..', imgPath);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    });
  } else if (project.image) {
    const imgPath = path.join(__dirname, '..', project.image);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }
  
  const deleted = projects.splice(index, 1);
  writeData(projects);
  res.json({ success: true, message: 'Supprimé.', data: deleted[0] });
});

module.exports = router;