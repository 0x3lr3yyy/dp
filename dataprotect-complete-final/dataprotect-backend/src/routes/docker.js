const express = require('express');
const router = express.Router();
const DockerController = require('../controllers/dockerController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// User routes - start/stop machines
router.post('/start/:challengeId', authenticateToken, DockerController.startMachine);
router.post('/stop/:machineId', authenticateToken, DockerController.stopMachine);
router.post('/extend/:machineId', authenticateToken, DockerController.extendTime);
router.get('/status/:machineId', authenticateToken, DockerController.getMachineStatus);
router.get('/user/machines', authenticateToken, DockerController.getUserMachines);

// Admin routes - system management
router.get('/admin/system-info', authenticateToken, requireAdmin, DockerController.getSystemInfo);
router.get('/admin/logs/:machineId', authenticateToken, requireAdmin, DockerController.getContainerLogs);
router.post('/admin/cleanup', authenticateToken, requireAdmin, DockerController.cleanupExpired);

module.exports = router;
