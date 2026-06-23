// middleware/auth.js
// Ce fichier protège les routes admin — seul vous pouvez y accéder avec votre token JWT

const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  // Récupère le token dans le header Authorization: Bearer <token>
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Accès refusé. Token manquant.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next(); // Token valide → on continue
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: 'Token invalide ou expiré. Reconnectez-vous.'
    });
  }
}

module.exports = authMiddleware;
