const database = require('../config/database');

class Solve {
    static async create(solveData) {
        const { user_id, challenge_id } = solveData;
        const sql = `
            INSERT INTO solves (user_id, challenge_id)
            VALUES (?, ?)
        `;
        try {
            const result = await database.run(sql, [user_id, challenge_id]);
            return result.id;
        } catch (error) {
            // Handle unique constraint violation (already solved)
            if (error.message.includes('UNIQUE')) {
                return null;
            }
            throw error;
        }
    }

    static async findByUser(userId) {
        const sql = `
            SELECT s.*, c.title as challenge_title, c.challenge_id, c.points, cat.name as category_name
            FROM solves s
            JOIN challenges c ON s.challenge_id = c.id
            JOIN categories cat ON c.category_id = cat.id
            WHERE s.user_id = ?
            ORDER BY s.solved_at DESC
        `;
        return await database.all(sql, [userId]);
    }

    static async findByChallenge(challengeId) {
        const sql = `
            SELECT s.*, u.username, u.team_name
            FROM solves s
            JOIN users u ON s.user_id = u.id
            WHERE s.challenge_id = ?
            ORDER BY s.solved_at ASC
        `;
        return await database.all(sql, [challengeId]);
    }

    static async checkIfSolved(userId, challengeId) {
        const sql = 'SELECT * FROM solves WHERE user_id = ? AND challenge_id = ?';
        const result = await database.get(sql, [userId, challengeId]);
        return result !== undefined;
    }

    static async getSolveCount(userId) {
        const sql = 'SELECT COUNT(*) as count FROM solves WHERE user_id = ?';
        const result = await database.get(sql, [userId]);
        return result.count;
    }
}

module.exports = Solve;
