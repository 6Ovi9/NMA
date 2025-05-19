const jwt = require('jsonwebtoken');
const SECRET = 'supersecretkey'; // Replace with a secure key in production

const authMiddleware = (req, res, next) => {  if (!req || !req.headers) {
    return res.status(401).json({ message: 'Solicitud inválida' });
  }

  const auth = req.headers['authorization'];
  if (!auth) {
    return res.status(401).json({ message: 'Debes iniciar sesión primero' });
  }

  const token = auth.split(' ')[1];
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido' });
  }
};

module.exports = authMiddleware;
