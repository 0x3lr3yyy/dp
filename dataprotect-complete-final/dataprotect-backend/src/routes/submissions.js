const express = require('express');
const { body } = require('express-validator');
const SubmissionController = require('../controllers/submissionController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const validate = require('../middleware/validation');

const router = express.Router();

// User routes (protected)
router.post('/submit',
    authenticateToken,
    [
        body('challenge_id').isInt().withMessage('Challenge ID must be an integer'),
        body('flag').trim().notEmpty().withMessage('Flag is required')
    ],
    validate,
    SubmissionController.submit
);

router.get('/user', authenticateToken, SubmissionController.getUserSubmissions);

// Admin routes
router.get('/admin/all', authenticateToken, requireAdmin, SubmissionController.getAll);
router.get('/admin/challenge/:challengeId', authenticateToken, requireAdmin, SubmissionController.getChallengeSubmissions);

module.exports = router;
