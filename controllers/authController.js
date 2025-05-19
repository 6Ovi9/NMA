// Authentication and user logic
const db = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET = 'supersecretkey'; // Change in production

exports.register = (req, res) => {  const { username, password } = req.body;
  if (!username || !password) return res.json({ message: 'Faltan campos requeridos' });
  const hash = bcrypt.hashSync(password, 10);
  db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hash], function(err) {
    if (err) return res.json({ message: 'El usuario ya existe' });
    res.json({ message: '¡Registrado exitosamente!' });
  });
};

exports.login = (req, res) => {
  const { username, password } = req.body;  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (!user) return res.json({ message: 'Credenciales inválidas' });
    if (!bcrypt.compareSync(password, user.password)) return res.json({ message: 'Credenciales inválidas' });
    const token = jwt.sign({ id: user.id, username: user.username }, SECRET);
    res.json({ message: 'Inicio de sesión exitoso', token });
  });
};

exports.authMiddleware = (req, res, next) => {  const auth = req.headers['authorization'];
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
