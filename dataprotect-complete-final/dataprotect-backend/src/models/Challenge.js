const database = require('../config/database');

class Challenge {
    static async create(challengeData) {
        const { challenge_id, category_id, title, description, difficulty, points, flag, is_active = 1 } = challengeData;
        const sql = `
            INSERT INTO challenges (challenge_id, category_id, title, description, difficulty, points, flag, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const result = await database.run(sql, [challenge_id, category_id, title, description, difficulty, points, flag, is_active]);
        return result.id;
    }

    static async getAll() {
        const sql = `
            SELECT c.*, cat.name as category_name, cat.slug as category_slug
            FROM challenges c
            JOIN categories cat ON c.category_id = cat.id
            WHERE c.is_active = 1
            ORDER BY c.difficulty, c.title
        `;
        return await database.all(sql);
    }

    static async getAllForAdmin() {
        const sql = `
            SELECT c.*, cat.name as category_name, cat.slug as category_slug
            FROM challenges c
            JOIN categories cat ON c.category_id = cat.id
            ORDER BY c.created_at DESC
        `;
        return await database.all(sql);
    }

    static async findById(id) {
        const sql = `
            SELECT c.*, cat.name as category_name, cat.slug as category_slug
            FROM challenges c
            JOIN categories cat ON c.category_id = cat.id
            WHERE c.id = ?
        `;
        return await database.get(sql, [id]);
    }

    static async findByChallengeId(challenge_id) {
        const sql = `
            SELECT c.*, cat.name as category_name, cat.slug as category_slug
            FROM challenges c
            JOIN categories cat ON c.category_id = cat.id
            WHERE c.challenge_id = ?
        `;
        return await database.get(sql, [challenge_id]);
    }

    static async findByCategory(categorySlug) {
        const sql = `
            SELECT c.*, cat.name as category_name, cat.slug as category_slug
            FROM challenges c
            JOIN categories cat ON c.category_id = cat.id
            WHERE cat.slug = ? AND c.is_active = 1
            ORDER BY c.difficulty, c.title
        `;
        return await database.all(sql, [categorySlug]);
    }

    static async update(id, challengeData) {
        const { challenge_id, category_id, title, description, difficulty, points, flag, is_active } = challengeData;
        const sql = `
            UPDATE challenges 
            SET challenge_id = ?, category_id = ?, title = ?, description = ?, 
                difficulty = ?, points = ?, flag = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        return await database.run(sql, [challenge_id, category_id, title, description, difficulty, points, flag, is_active, id]);
    }

    static async delete(id) {
        const sql = 'DELETE FROM challenges WHERE id = ?';
        return await database.run(sql, [id]);
    }

    static async getSolveCount(challengeId) {
        const sql = 'SELECT COUNT(*) as count FROM solves WHERE challenge_id = ?';
        const result = await database.get(sql, [challengeId]);
        return result.count;
    }

    static async checkIfSolved(userId, challengeId) {
        const sql = 'SELECT * FROM solves WHERE user_id = ? AND challenge_id = ?';
        const result = await database.get(sql, [userId, challengeId]);
        return result !== undefined;
    }
}

module.exports = Challenge;
