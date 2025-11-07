const database = require('../config/database');

class Submission {
    static async create(submissionData) {
        const { user_id, challenge_id, submitted_flag, is_correct, points_awarded } = submissionData;
        const sql = `
            INSERT INTO submissions (user_id, challenge_id, submitted_flag, is_correct, points_awarded)
            VALUES (?, ?, ?, ?, ?)
        `;
        const result = await database.run(sql, [user_id, challenge_id, submitted_flag, is_correct, points_awarded]);
        return result.id;
    }

    static async findByUser(userId) {
        const sql = `
            SELECT s.*, c.title as challenge_title, c.challenge_id, cat.name as category_name
            FROM submissions s
            JOIN challenges c ON s.challenge_id = c.id
            JOIN categories cat ON c.category_id = cat.id
            WHERE s.user_id = ?
            ORDER BY s.submitted_at DESC
        `;
        return await database.all(sql, [userId]);
    }

    static async findByChallenge(challengeId) {
        const sql = `
            SELECT s.*, u.username
            FROM submissions s
            JOIN users u ON s.user_id = u.id
            WHERE s.challenge_id = ?
            ORDER BY s.submitted_at DESC
        `;
        return await database.all(sql, [challengeId]);
    }

    static async getAll() {
        const sql = `
            SELECT s.*, c.title as challenge_title, c.challenge_id, u.username
            FROM submissions s
            JOIN challenges c ON s.challenge_id = c.id
            JOIN users u ON s.user_id = u.id
            ORDER BY s.submitted_at DESC
            LIMIT 100
        `;
        return await database.all(sql);
    }

    static async getCorrectCount(userId) {
        const sql = 'SELECT COUNT(*) as count FROM submissions WHERE user_id = ? AND is_correct = 1';
        const result = await database.get(sql, [userId]);
        return result.count;
    }
}

module.exports = Submission;
