const database = require('../config/database');

class Machine {
    static async create(machineData) {
        const { user_id, challenge_id, machine_ip, expires_at } = machineData;
        const sql = `
            INSERT INTO machines (user_id, challenge_id, machine_ip, status, expires_at)
            VALUES (?, ?, ?, 'running', ?)
        `;
        const result = await database.run(sql, [user_id, challenge_id, machine_ip, expires_at]);
        return result.id;
    }

    static async findById(id) {
        const sql = `
            SELECT m.*, c.title as challenge_title, c.challenge_id, u.username
            FROM machines m
            JOIN challenges c ON m.challenge_id = c.id
            JOIN users u ON m.user_id = u.id
            WHERE m.id = ?
        `;
        return await database.get(sql, [id]);
    }

    static async findActiveByUser(userId) {
        const sql = `
            SELECT m.*, c.title as challenge_title, c.challenge_id
            FROM machines m
            JOIN challenges c ON m.challenge_id = c.id
            WHERE m.user_id = ? AND m.status = 'running'
            ORDER BY m.started_at DESC
        `;
        return await database.all(sql, [userId]);
    }

    static async findActiveByUserAndChallenge(userId, challengeId) {
        const sql = `
            SELECT * FROM machines 
            WHERE user_id = ? AND challenge_id = ? AND status = 'running'
        `;
        return await database.get(sql, [userId, challengeId]);
    }

    static async getAll() {
        const sql = `
            SELECT m.*, c.title as challenge_title, c.challenge_id, u.username
            FROM machines m
            JOIN challenges c ON m.challenge_id = c.id
            JOIN users u ON m.user_id = u.id
            ORDER BY m.started_at DESC
        `;
        return await database.all(sql);
    }

    static async stop(id) {
        const sql = `
            UPDATE machines 
            SET status = 'stopped', stopped_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        return await database.run(sql, [id]);
    }

    static async expire(id) {
        const sql = `
            UPDATE machines 
            SET status = 'expired', stopped_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        return await database.run(sql, [id]);
    }

    static async expireOldMachines() {
        const sql = `
            UPDATE machines 
            SET status = 'expired', stopped_at = CURRENT_TIMESTAMP
            WHERE status = 'running' AND expires_at < datetime('now')
        `;
        return await database.run(sql);
    }

    static generateIP() {
        const octet2 = Math.floor(Math.random() * 254) + 1;
        const octet3 = Math.floor(Math.random() * 254) + 1;
        const octet4 = Math.floor(Math.random() * 254) + 1;
        return `10.${octet2}.${octet3}.${octet4}`;
    }

    static async getById(id) {
        const sql = `SELECT * FROM machines WHERE id = ?`;
        return await database.get(sql, [id]);
    }

    static async getUserActiveMachine(userId, challengeId) {
        const sql = `
            SELECT * FROM machines 
            WHERE user_id = ? AND challenge_id = ? AND status = 'running'
        `;
        return await database.get(sql, [userId, challengeId]);
    }

    static async getUserMachines(userId) {
        const sql = `
            SELECT m.*, c.title as challenge_title
            FROM machines m
            JOIN challenges c ON m.challenge_id = c.id
            WHERE m.user_id = ? AND m.status = 'running'
            ORDER BY m.started_at DESC
        `;
        return await database.all(sql, [userId]);
    }

    static async updateExpiresAt(id, expiresAt) {
        const sql = `
            UPDATE machines 
            SET expires_at = ?
            WHERE id = ?
        `;
        return await database.run(sql, [expiresAt.toISOString(), id]);
    }

    static async create(machineData) {
        const { userId, challengeId, ipAddress, status, expiresAt, containerId, instanceId } = machineData;
        const sql = `
            INSERT INTO machines (user_id, challenge_id, ip_address, status, expires_at, container_id, instance_id, started_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;
        const result = await database.run(sql, [userId, challengeId, ipAddress, status, expiresAt, containerId, instanceId]);
        return result.lastID;
    }
}

module.exports = Machine;
