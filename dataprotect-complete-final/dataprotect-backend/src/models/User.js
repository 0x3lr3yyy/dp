const database = require('../config/database');
const bcrypt = require('bcrypt');

class User {
    static async create(userData) {
        const { username, email, password, team_name, role = 'user' } = userData;
        const password_hash = await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO users (username, email, password_hash, team_name, role)
            VALUES (?, ?, ?, ?, ?)
        `;

        const result = await database.run(sql, [username, email, password_hash, team_name, role]);
        return result.id;
    }

    static async findByUsername(username) {
        const sql = 'SELECT * FROM users WHERE username = ?';
        return await database.get(sql, [username]);
    }

    static async findByEmail(email) {
        const sql = 'SELECT * FROM users WHERE email = ?';
        return await database.get(sql, [email]);
    }

    static async findById(id) {
        const sql = 'SELECT * FROM users WHERE id = ?';
        return await database.get(sql, [id]);
    }

    static async getAll() {
        const sql = 'SELECT id, username, email, team_name, role, total_score, created_at FROM users ORDER BY created_at DESC';
        return await database.all(sql);
    }

    static async updateScore(userId, points) {
        const sql = 'UPDATE users SET total_score = total_score + ? WHERE id = ?';
        return await database.run(sql, [points, userId]);
    }

    static async update(userId, userData) {
        const { username, email, team_name, role } = userData;
        const sql = `
            UPDATE users 
            SET username = ?, email = ?, team_name = ?, role = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        return await database.run(sql, [username, email, team_name, role, userId]);
    }

    static async delete(userId) {
        const sql = 'DELETE FROM users WHERE id = ?';
        return await database.run(sql, [userId]);
    }

    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    static async getSolvedChallenges(userId) {
        const sql = `
            SELECT c.*, cat.name as category_name, s.solved_at
            FROM solves s
            JOIN challenges c ON s.challenge_id = c.id
            JOIN categories cat ON c.category_id = cat.id
            WHERE s.user_id = ?
            ORDER BY s.solved_at DESC
        `;
        return await database.all(sql, [userId]);
    }
}

module.exports = User;
