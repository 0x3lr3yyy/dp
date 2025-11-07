const Category = require('../models/Category');
const Challenge = require('../models/Challenge');

class CategoryController {
    // Get all categories
    static async getAll(req, res, next) {
        try {
            const categories = await Category.getAll();
            
            // Add challenge count for each category
            const categoriesWithCount = await Promise.all(
                categories.map(async (cat) => {
                    const count = await Category.getChallengeCount(cat.id);
                    return { ...cat, challenge_count: count };
                })
            );

            res.json({ categories: categoriesWithCount });
        } catch (error) {
            next(error);
        }
    }

    // Get category by ID
    static async getById(req, res, next) {
        try {
            const { id } = req.params;
            const category = await Category.findById(id);

            if (!category) {
                return res.status(404).json({ error: 'Category not found' });
            }

            const challengeCount = await Category.getChallengeCount(category.id);
            res.json({ 
                category: { ...category, challenge_count: challengeCount }
            });
        } catch (error) {
            next(error);
        }
    }

    // Get category by slug
    static async getBySlug(req, res, next) {
        try {
            const { slug } = req.params;
            const category = await Category.findBySlug(slug);

            if (!category) {
                return res.status(404).json({ error: 'Category not found' });
            }

            const challenges = await Challenge.findByCategory(slug);
            res.json({ 
                category,
                challenges
            });
        } catch (error) {
            next(error);
        }
    }

    // Create new category (Admin only)
    static async create(req, res, next) {
        try {
            const { slug, name, description, icon } = req.body;

            const categoryId = await Category.create({ slug, name, description, icon });
            const category = await Category.findById(categoryId);

            res.status(201).json({
                message: 'Category created successfully',
                category
            });
        } catch (error) {
            next(error);
        }
    }

    // Update category (Admin only)
    static async update(req, res, next) {
        try {
            const { id } = req.params;
            const { slug, name, description, icon } = req.body;

            const category = await Category.findById(id);
            if (!category) {
                return res.status(404).json({ error: 'Category not found' });
            }

            await Category.update(id, { slug, name, description, icon });
            const updatedCategory = await Category.findById(id);

            res.json({
                message: 'Category updated successfully',
                category: updatedCategory
            });
        } catch (error) {
            next(error);
        }
    }

    // Delete category (Admin only)
    static async delete(req, res, next) {
        try {
            const { id } = req.params;

            const category = await Category.findById(id);
            if (!category) {
                return res.status(404).json({ error: 'Category not found' });
            }

            await Category.delete(id);
            res.json({ message: 'Category deleted successfully' });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = CategoryController;
