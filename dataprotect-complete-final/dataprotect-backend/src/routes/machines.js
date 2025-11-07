const express = require('express');
const MachineController = require('../controllers/machineController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// User routes (protected)
router.post('/start/:challengeId', authenticateToken, MachineController.start);
router.post('/stop/:machineId', authenticateToken, MachineController.stop);
router.get('/status/:machineId', authenticateToken, MachineController.getStatus);
router.get('/user', authenticateToken, MachineController.getUserMachines);

// Admin routes
router.get('/admin/all', authenticateToken, requireAdmin, MachineController.getAll);

module.exports = router;
