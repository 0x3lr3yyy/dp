const express = require('express');
const { body } = require('express-validator');
const ChallengeController = require('../controllers/challengeController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const validate = require('../middleware/validation');

const router = express.Router();

// Public/User routes
router.get('/', ChallengeController.getAll);
router.get('/:id', ChallengeController.getById);
router.get('/category/:category', ChallengeController.getByCategory);

// Admin routes
router.get('/admin/all', authenticateToken, requireAdmin, ChallengeController.getAllForAdmin);

router.post('/',
    authenticateToken,
    requireAdmin,
    [
        body('challenge_id').trim().isLength({ min: 1, max: 50 }).withMessage('Challenge ID is required'),
        body('category_id').isInt().withMessage('Category ID must be an integer'),
        body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
        body('description').trim().notEmpty().withMessage('Description is required'),
        body('difficulty').isIn(['Easy', 'Medium', 'Hard']).withMessage('Difficulty must be Easy, Medium, or Hard'),
        body('points').isInt({ min: 0 }).withMessage('Points must be a positive integer'),
        body('flag').trim().notEmpty().withMessage('Flag is required'),
        body('is_active').optional().isBoolean()
    ],
    validate,
    ChallengeController.create
);

router.put('/:id',
    authenticateToken,
    requireAdmin,
    [
        body('challenge_id').trim().isLength({ min: 1, max: 50 }).withMessage('Challenge ID is required'),
        body('category_id').isInt().withMessage('Category ID must be an integer'),
        body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
        body('description').trim().notEmpty().withMessage('Description is required'),
        body('difficulty').isIn(['Easy', 'Medium', 'Hard']).withMessage('Difficulty must be Easy, Medium, or Hard'),
        body('points').isInt({ min: 0 }).withMessage('Points must be a positive integer'),
        body('flag').trim().notEmpty().withMessage('Flag is required'),
        body('is_active').optional().isBoolean()
    ],
    validate,
    ChallengeController.update
);

router.delete('/:id', authenticateToken, requireAdmin, ChallengeController.delete);

module.exports = router;
