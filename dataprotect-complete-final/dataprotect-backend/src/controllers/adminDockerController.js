const ChallengeDocker = require('../models/ChallengeDocker');

class AdminDockerController {
    /**
     * Get Docker configuration for a challenge
     */
    static async getDockerConfig(req, res) {
        try {
            const { challengeId } = req.params;
            const config = await ChallengeDocker.getDockerConfig(challengeId);

            if (!config) {
                return res.status(404).json({ error: 'Docker configuration not found' });
            }

            res.json({ config });
        } catch (error) {
            console.error('Error getting Docker config:', error);
            res.status(500).json({ error: 'Failed to get Docker configuration' });
        }
    }

    /**
     * Create or update Docker configuration
     */
    static async saveDockerConfig(req, res) {
        try {
            const { challengeId } = req.params;
            const dockerConfig = req.body;

            // Validate required fields
            if (!dockerConfig.dockerImage) {
                return res.status(400).json({ error: 'Docker image is required' });
            }

            // Check if config exists
            const existingConfig = await ChallengeDocker.getDockerConfig(challengeId);

            if (existingConfig) {
                // Update existing
                await ChallengeDocker.updateDockerConfig(challengeId, dockerConfig);
            } else {
                // Create new
                await ChallengeDocker.addDockerConfig(challengeId, dockerConfig);
            }

            res.json({ 
                message: 'Docker configuration saved successfully',
                challengeId: parseInt(challengeId)
            });

        } catch (error) {
            console.error('Error saving Docker config:', error);
            res.status(500).json({ error: 'Failed to save Docker configuration' });
        }
    }

    /**
     * Delete Docker configuration
     */
    static async deleteDockerConfig(req, res) {
        try {
            const { challengeId } = req.params;
            await ChallengeDocker.deleteDockerConfig(challengeId);

            res.json({ 
                message: 'Docker configuration deleted successfully',
                challengeId: parseInt(challengeId)
            });

        } catch (error) {
            console.error('Error deleting Docker config:', error);
            res.status(500).json({ error: 'Failed to delete Docker configuration' });
        }
    }

    /**
     * Get all challenges with Docker configuration status
     */
    static async getAllWithDockerStatus(req, res) {
        try {
            const challenges = await ChallengeDocker.getAllWithDockerConfig();

            res.json({ challenges });

        } catch (error) {
            console.error('Error getting challenges:', error);
            res.status(500).json({ error: 'Failed to get challenges' });
        }
    }
}

module.exports = AdminDockerController;
