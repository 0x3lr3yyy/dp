const database = require('../config/database');

class Category {
    static async create(categoryData) {
        const { slug, name, description, icon } = categoryData;
        const sql = `
            INSERT INTO categories (slug, name, description, icon)
            VALUES (?, ?, ?, ?)
        `;
        const result = await database.run(sql, [slug, name, description, icon]);
        return result.id;
    }

    static async getAll() {
        const sql = 'SELECT * FROM categories ORDER BY name';
        return await database.all(sql);
    }

    static async findById(id) {
        const sql = 'SELECT * FROM categories WHERE id = ?';
        return await database.get(sql, [id]);
    }

    static async findBySlug(slug) {
        const sql = 'SELECT * FROM categories WHERE slug = ?';
        return await database.get(sql, [slug]);
    }

    static async update(id, categoryData) {
        const { slug, name, description, icon } = categoryData;
        const sql = `
            UPDATE categories 
            SET slug = ?, name = ?, description = ?, icon = ?
            WHERE id = ?
        `;
        return await database.run(sql, [slug, name, description, icon, id]);
    }

    static async delete(id) {
        const sql = 'DELETE FROM categories WHERE id = ?';
        return await database.run(sql, [id]);
    }

    static async getChallengeCount(categoryId) {
        const sql = 'SELECT COUNT(*) as count FROM challenges WHERE category_id = ? AND is_active = 1';
        const result = await database.get(sql, [categoryId]);
        return result.count;
    }
}

module.exports = Category;
