const express = require('express');
const { body } = require('express-validator');
const CategoryController = require('../controllers/categoryController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const validate = require('../middleware/validation');

const router = express.Router();

// Public routes
router.get('/', CategoryController.getAll);
router.get('/:id', CategoryController.getById);
router.get('/slug/:slug', CategoryController.getBySlug);

// Admin routes
router.post('/',
    authenticateToken,
    requireAdmin,
    [
        body('slug').trim().isLength({ min: 2, max: 50 }).withMessage('Slug must be 2-50 characters'),
        body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
        body('description').optional().trim(),
        body('icon').optional().trim()
    ],
    validate,
    CategoryController.create
);

router.put('/:id',
    authenticateToken,
    requireAdmin,
    [
        body('slug').trim().isLength({ min: 2, max: 50 }).withMessage('Slug must be 2-50 characters'),
        body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
        body('description').optional().trim(),
        body('icon').optional().trim()
    ],
    validate,
    CategoryController.update
);

router.delete('/:id', authenticateToken, requireAdmin, CategoryController.delete);

module.exports = router;
