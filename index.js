// index.js - Entry point for Express server
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const https = require('https');
const http = require('http');
const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Listen on all interfaces for hotspot
const DOMAIN = 'universoazorin.duckdns.org';
const IP = '137.101.20.115';

// HTTPS options (replace with your actual certificate paths)
/* const httpsOptions = {
  key: fs.readFileSync(__dirname + '/cert/key.pem'),
  cert: fs.readFileSync(__dirname + '/cert/cert.pem')
}; */

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Import routes
const authRoutes = require('./routes/auth');
const qrRoutes = require('./routes/qr');

app.use('/api', authRoutes);
app.use('/api', qrRoutes);

// Placeholder root route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Middleware to require login and unlocked skill for branch pages  
const requireAuthAndSkill = (skillId) => (req, res, next) => {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(401).send('No has iniciado sesión');
  const token = auth.split(' ')[1];
  try {
    const user = require('jsonwebtoken').verify(token, require('./controllers/authController').SECRET || 'supersecretkey');
    const db = require('./models/user');
    db.get('SELECT unlocked_skills FROM users WHERE id = ?', [user.id], (err, row) => {
      if (!row) return res.status(403).send('Usuario no encontrado');
      const unlocked = JSON.parse(row.unlocked_skills || '[]');
      if (!unlocked.includes(skillId)) return res.status(403).send('Habilidad no desbloqueada');
      next();
    });
  } catch {
    res.status(401).send('Token inválido');
  }
};

// Secure branch pages
app.get('/sciences.html', requireAuthAndSkill('sciences'), (req, res) => res.sendFile(__dirname + '/public/sciences.html'));
app.get('/humanities.html', requireAuthAndSkill('humanities'), (req, res) => res.sendFile(__dirname + '/public/humanities.html'));
app.get('/languages.html', requireAuthAndSkill('languages'), (req, res) => res.sendFile(__dirname + '/public/languages.html'));
app.get('/technology.html', requireAuthAndSkill('technology'), (req, res) => res.sendFile(__dirname + '/public/technology.html'));

// Start HTTP server - Using hotspot connection
app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`Local access: http://localhost:${PORT}`);
  console.log(`External access: http://${DOMAIN}`);
  console.log(`Direct IP access: http://${IP}`);
  console.log(`Hotspot IP: http://31.221.146.74`);
});

// Start HTTPS server (for production or local HTTPS)
/* https.createServer(httpsOptions, app).listen(443, () => {
  console.log(`HTTPS server running at https://${DOMAIN}`);
}); */

// HTTP to HTTPS redirect (for production)
/* http.createServer((req, res) => {
  res.writeHead(301, { Location: `https://${DOMAIN}${req.url}` });
  res.end();
}).listen(80); */