// QR unlock logic
const db = require('../models/user');

// Skill unlock codes
const codes = {
  't3Rcmb+AHmCiX!4CJS+p': 'sciences',
  '}!firtEs3YxTv1Bp},bf': 'humanities',
  '~lz}Vxu,yT3BUo3YZUJX': 'languages',
  '~kd=pR&(bIJ5s6C1_I[Z': 'technology'
};

exports.unlock = (req, res) => {
  const userId = req.user?.id;
  const authHeader = req.headers.authorization;
  // Handle both GET and POST requests
  const code = (req.method === 'POST' ? req.body.code : req.query.code) || '';
  
  console.log('\n=== QR Unlock Request ===');
  console.log('Request details:', { 
    method: req.method, 
    code, 
    userId,
    hasAuth: !!authHeader,
    path: req.path,
    query: req.query,
    body: req.body
  });

  // If no user ID, return unauthorized
  if (!userId) {
    console.error('No user ID in request');      return res.status(401).json({ message: 'Debes iniciar sesión primero', success: false });
  }

  // If it's a check request, return current unlocked skills
  if (code === 'check') {
    console.log('\n=== Checking Unlocked Skills ===');
    console.log('User ID:', userId);
      db.get('SELECT unlocked_skills, username FROM users WHERE id = ?', [userId], (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Error del servidor', success: false });
      }
      
      if (!row) {
        console.error('User not found:', userId);
        return res.status(404).json({ message: 'User not found', success: false });
      }

      console.log('Found user:', row.username);
      
      let unlocked = [];
      try {
        // Handle both string and array inputs
        if (typeof row.unlocked_skills === 'string') {
          unlocked = JSON.parse(row.unlocked_skills || '[]');
        } else if (Array.isArray(row.unlocked_skills)) {
          unlocked = row.unlocked_skills;
        }
        console.log('Parsed unlocked skills:', unlocked);
        
        // Validate the unlocked skills array
        if (!Array.isArray(unlocked)) {
          console.error('Invalid unlocked_skills format, resetting to empty array');
          unlocked = [];
        }
      } catch (e) {
        console.error('Error parsing unlocked skills:', e);
        console.error('Raw unlocked_skills value:', row.unlocked_skills);
        unlocked = [];
      }

      const response = { 
        success: true, 
        unlockedSkills: unlocked,
        username: row.username 
      };
      console.log('Sending response:', response);
      return res.json(response);
    });
    return;
  }
  // Regular unlock request
  const skill = codes[code];

  if (!skill) {
    console.log('Invalid code provided:', code);
    return res.json({ message: 'Código QR inválido', success: false });
  }

  db.get('SELECT unlocked_skills FROM users WHERE id = ?', [userId], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Server error', success: false });
    }
      if (!row) {
      console.error('User not found:', userId);
      return res.status(404).json({ message: 'Usuario no encontrado', success: false });
    }

    let unlocked = [];
    try {
      unlocked = JSON.parse(row.unlocked_skills || '[]');
    } catch (e) {
      console.error('Error parsing existing unlocked skills:', e);
      unlocked = [];
    }

    if (unlocked.includes(skill)) {
      console.log('Habilidad ya desbloqueada', skill);
      return res.json({ 
        message: 'Habilidad ya desbloqueada',
        unlockedSkills: unlocked,
        success: true
      });
    }

    unlocked.push(skill);
    console.log('Updating unlocked skills for user', userId, 'to:', unlocked);
    db.run('UPDATE users SET unlocked_skills = ? WHERE id = ?', 
      [JSON.stringify(unlocked), userId], 
      (err) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Server error', success: false });
        }

        console.log('Successfully unlocked skill:', skill);
        return res.json({
          success: true,
          message: `¡Habilidad ${skill} desbloqueada exitosamente!`,
          unlockedSkills: unlocked
        });
      }
    );
  });
};
