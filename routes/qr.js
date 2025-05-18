const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');
const authMiddleware = require('../middleware/auth');

// Protected route to unlock skills
router.get('/unlock', authMiddleware, qrController.unlock);
router.post('/unlock', authMiddleware, qrController.unlock);

module.exports = router;
