const express = require('express');
const VPNController = require('../controllers/vpnController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All VPN routes require authentication
router.use(authenticateToken);

// Generate VPN configuration
router.post('/generate', VPNController.generateConfig);

// Download VPN configuration file
router.get('/download', VPNController.downloadConfig);

// Get VPN status
router.get('/status', VPNController.getStatus);

// Delete VPN configuration
router.delete('/config', VPNController.deleteConfig);

// Get setup instructions
router.get('/instructions', VPNController.getInstructions);

module.exports = router;
