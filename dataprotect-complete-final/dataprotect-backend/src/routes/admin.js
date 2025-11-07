const express = require('express');
const { body } = require('express-validator');
const AdminController = require('../controllers/adminController');
const AdminDockerController = require('../controllers/adminDockerController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const validate = require('../middleware/validation');

const router = express.Router();

// All routes require admin authentication
router.use(authenticateToken, requireAdmin);

// Dashboard
router.get('/dashboard', AdminController.getDashboard);

// Docker management
router.get('/docker-config/:challengeId', AdminDockerController.getDockerConfig);
router.post('/docker-config/:challengeId', AdminDockerController.saveDockerConfig);
router.delete('/docker-config/:challengeId', AdminDockerController.deleteDockerConfig);
router.get('/challenges-docker-status', AdminDockerController.getAllWithDockerStatus);

// User management
router.get('/users', AdminController.getAllUsers);
router.put('/users/:id',
    [
        body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
        body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
        body('team_name').optional().trim().isLength({ max: 100 }),
        body('role').isIn(['user', 'admin']).withMessage('Role must be user or admin')
    ],
    validate,
    AdminController.updateUser
);
router.delete('/users/:id', AdminController.deleteUser);

// Machine management
router.get('/machines', AdminController.getAllMachines);
router.post('/machines/:id/stop', AdminController.stopMachine);

module.exports = router;
