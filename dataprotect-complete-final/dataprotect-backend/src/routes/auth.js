const express = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const validate = require('../middleware/validation');

const router = express.Router();

// Register
router.post('/register',
    [
        body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
        body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('team_name').optional().trim().isLength({ max: 100 })
    ],
    validate,
    AuthController.register
);

// Login
router.post('/login',
    [
        body('username').trim().notEmpty().withMessage('Username is required'),
        body('password').notEmpty().withMessage('Password is required')
    ],
    validate,
    AuthController.login
);

// Get profile (protected)
router.get('/profile', authenticateToken, AuthController.getProfile);

// Logout
router.post('/logout', authenticateToken, AuthController.logout);

module.exports = router;
