const database = require('../config/database');

class ChallengeDocker {
    /**
     * Add Docker configuration to a challenge
     */
    static async addDockerConfig(challengeId, dockerConfig) {
        const query = `
            INSERT INTO challenge_docker_config (
                challenge_id, docker_image, exposed_ports, environment_vars,
                memory_limit, cpu_limit, timeout_duration, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `;

        const params = [
            challengeId,
            dockerConfig.dockerImage,
            JSON.stringify(dockerConfig.exposedPorts || []),
            JSON.stringify(dockerConfig.environmentVars || {}),
            dockerConfig.memoryLimit || 512,
            dockerConfig.cpuLimit || 512,
            dockerConfig.timeoutDuration || 3600
        ];

        try {
            const result = await database.run(query, params);
            return result.lastID;
        } catch (error) {
            throw new Error(`Failed to add Docker config: ${error.message}`);
        }
    }

    /**
     * Get Docker configuration for a challenge
     */
    static async getDockerConfig(challengeId) {
        const query = `
            SELECT * FROM challenge_docker_config
            WHERE challenge_id = ?
        `;

        try {
            const config = await database.get(query, [challengeId]);
            if (!config) return null;

            return {
                id: config.id,
                challengeId: config.challenge_id,
                dockerImage: config.docker_image,
                exposedPorts: JSON.parse(config.exposed_ports),
                environmentVars: JSON.parse(config.environment_vars),
                memoryLimit: config.memory_limit,
                cpuLimit: config.cpu_limit,
                timeoutDuration: config.timeout_duration,
                createdAt: config.created_at,
                updatedAt: config.updated_at
            };
        } catch (error) {
            throw new Error(`Failed to get Docker config: ${error.message}`);
        }
    }

    /**
     * Update Docker configuration
     */
    static async updateDockerConfig(challengeId, dockerConfig) {
        const query = `
            UPDATE challenge_docker_config
            SET docker_image = ?,
                exposed_ports = ?,
                environment_vars = ?,
                memory_limit = ?,
                cpu_limit = ?,
                timeout_duration = ?,
                updated_at = datetime('now')
            WHERE challenge_id = ?
        `;

        const params = [
            dockerConfig.dockerImage,
            JSON.stringify(dockerConfig.exposedPorts || []),
            JSON.stringify(dockerConfig.environmentVars || {}),
            dockerConfig.memoryLimit || 512,
            dockerConfig.cpuLimit || 512,
            dockerConfig.timeoutDuration || 3600,
            challengeId
        ];

        try {
            await database.run(query, params);
            return true;
        } catch (error) {
            throw new Error(`Failed to update Docker config: ${error.message}`);
        }
    }

    /**
     * Delete Docker configuration
     */
    static async deleteDockerConfig(challengeId) {
        const query = `DELETE FROM challenge_docker_config WHERE challenge_id = ?`;
        
        try {
            await database.run(query, [challengeId]);
            return true;
        } catch (error) {
            throw new Error(`Failed to delete Docker config: ${error.message}`);
        }
    }

    /**
     * Get all challenges with Docker configuration
     */
    static async getAllWithDockerConfig() {
        const query = `
            SELECT 
                c.*,
                cdc.docker_image,
                cdc.exposed_ports,
                cdc.environment_vars,
                cdc.memory_limit,
                cdc.cpu_limit,
                cdc.timeout_duration
            FROM challenges c
            LEFT JOIN challenge_docker_config cdc ON c.id = cdc.challenge_id
            WHERE c.is_active = 1
            ORDER BY c.category, c.difficulty
        `;

        try {
            const challenges = await database.all(query);
            return challenges.map(c => ({
                ...c,
                exposedPorts: c.exposed_ports ? JSON.parse(c.exposed_ports) : null,
                environmentVars: c.environment_vars ? JSON.parse(c.environment_vars) : null,
                hasDocker: !!c.docker_image
            }));
        } catch (error) {
            throw new Error(`Failed to get challenges with Docker config: ${error.message}`);
        }
    }
}

module.exports = ChallengeDocker;
