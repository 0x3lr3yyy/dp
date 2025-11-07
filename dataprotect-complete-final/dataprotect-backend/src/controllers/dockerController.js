const dockerService = require('../services/dockerService');
const Machine = require('../models/Machine');
const ChallengeDocker = require('../models/ChallengeDocker');
const Challenge = require('../models/Challenge');

class DockerController {
    /**
     * Start a Docker container for a challenge
     */
    static async startMachine(req, res) {
        try {
            const { challengeId } = req.params;
            const userId = req.user.userId;

            // Get challenge details
            const challenge = await Challenge.getById(challengeId);
            if (!challenge) {
                return res.status(404).json({ error: 'Challenge not found' });
            }

            // Get Docker configuration
            const dockerConfig = await ChallengeDocker.getDockerConfig(challengeId);
            if (!dockerConfig) {
                return res.status(400).json({ 
                    error: 'This challenge does not have Docker configuration' 
                });
            }

            // Check if user already has an active machine for this challenge
            const existingMachine = await Machine.getUserActiveMachine(userId, challengeId);
            if (existingMachine) {
                return res.status(400).json({ 
                    error: 'You already have an active machine for this challenge',
                    machine: existingMachine
                });
            }

            // Start Docker container
            const containerInfo = await dockerService.startContainer({
                challengeId: parseInt(challengeId),
                userId,
                imageName: dockerConfig.dockerImage,
                exposedPorts: dockerConfig.exposedPorts,
                env: dockerConfig.environmentVars,
                duration: dockerConfig.timeoutDuration
            });

            // Create machine record in database
            const machineId = await Machine.create({
                userId,
                challengeId,
                ipAddress: containerInfo.ipAddress,
                status: 'running',
                expiresAt: containerInfo.expiresAt,
                containerId: containerInfo.containerId,
                instanceId: containerInfo.instanceId
            });

            res.json({
                message: 'Machine started successfully',
                machine: {
                    id: machineId,
                    challengeId,
                    ipAddress: containerInfo.ipAddress,
                    ports: containerInfo.ports,
                    status: 'running',
                    startedAt: containerInfo.startedAt,
                    expiresAt: containerInfo.expiresAt,
                    timeRemaining: dockerConfig.timeoutDuration
                }
            });

        } catch (error) {
            console.error('Error starting machine:', error);
            res.status(500).json({ 
                error: 'Failed to start machine',
                details: error.message 
            });
        }
    }

    /**
     * Stop a running machine
     */
    static async stopMachine(req, res) {
        try {
            const { machineId } = req.params;
            const userId = req.user.userId;

            // Get machine details
            const machine = await Machine.getById(machineId);
            if (!machine) {
                return res.status(404).json({ error: 'Machine not found' });
            }

            // Check ownership (unless admin)
            if (machine.user_id !== userId && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Unauthorized' });
            }

            // Stop Docker container
            if (machine.container_id) {
                await dockerService.stopContainer(machine.container_id);
            }

            // Update machine status in database
            await Machine.stop(machineId);

            res.json({ 
                message: 'Machine stopped successfully',
                machineId 
            });

        } catch (error) {
            console.error('Error stopping machine:', error);
            res.status(500).json({ 
                error: 'Failed to stop machine',
                details: error.message 
            });
        }
    }

    /**
     * Get machine status
     */
    static async getMachineStatus(req, res) {
        try {
            const { machineId } = req.params;
            const userId = req.user.userId;

            // Get machine from database
            const machine = await Machine.getById(machineId);
            if (!machine) {
                return res.status(404).json({ error: 'Machine not found' });
            }

            // Check ownership
            if (machine.user_id !== userId && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Unauthorized' });
            }

            // Get live status from Docker if container exists
            let dockerStatus = null;
            if (machine.container_id && machine.status === 'running') {
                try {
                    dockerStatus = await dockerService.getContainerStatus(machine.container_id);
                } catch (error) {
                    console.error('Failed to get Docker status:', error.message);
                }
            }

            const now = new Date();
            const expiresAt = new Date(machine.expires_at);
            const timeRemaining = Math.max(0, Math.floor((expiresAt - now) / 1000));

            res.json({
                machine: {
                    id: machine.id,
                    challengeId: machine.challenge_id,
                    ipAddress: machine.ip_address,
                    status: machine.status,
                    startedAt: machine.started_at,
                    expiresAt: machine.expires_at,
                    timeRemaining,
                    dockerStatus
                }
            });

        } catch (error) {
            console.error('Error getting machine status:', error);
            res.status(500).json({ 
                error: 'Failed to get machine status',
                details: error.message 
            });
        }
    }

    /**
     * Get user's active machines
     */
    static async getUserMachines(req, res) {
        try {
            const userId = req.user.userId;
            const machines = await Machine.getUserMachines(userId);

            // Calculate time remaining for each machine
            const now = new Date();
            const machinesWithTime = machines.map(m => {
                const expiresAt = new Date(m.expires_at);
                const timeRemaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
                return {
                    ...m,
                    timeRemaining
                };
            });

            res.json({ machines: machinesWithTime });

        } catch (error) {
            console.error('Error getting user machines:', error);
            res.status(500).json({ 
                error: 'Failed to get machines',
                details: error.message 
            });
        }
    }

    /**
     * Get container logs (admin only)
     */
    static async getContainerLogs(req, res) {
        try {
            const { machineId } = req.params;
            const { tail = 100 } = req.query;

            const machine = await Machine.getById(machineId);
            if (!machine) {
                return res.status(404).json({ error: 'Machine not found' });
            }

            if (!machine.container_id) {
                return res.status(400).json({ error: 'No container associated with this machine' });
            }

            const logs = await dockerService.getContainerLogs(machine.container_id, parseInt(tail));

            res.json({ 
                machineId,
                logs 
            });

        } catch (error) {
            console.error('Error getting container logs:', error);
            res.status(500).json({ 
                error: 'Failed to get logs',
                details: error.message 
            });
        }
    }

    /**
     * Get Docker system info (admin only)
     */
    static async getSystemInfo(req, res) {
        try {
            const systemInfo = await dockerService.getSystemInfo();
            const activeContainers = await dockerService.listActiveContainers();

            res.json({
                system: systemInfo,
                activeContainers: activeContainers.length,
                containers: activeContainers
            });

        } catch (error) {
            console.error('Error getting system info:', error);
            res.status(500).json({ 
                error: 'Failed to get system info',
                details: error.message 
            });
        }
    }

    /**
     * Extend machine time
     */
    static async extendTime(req, res) {
        try {
            const { machineId } = req.params;
            const { additionalMinutes = 60 } = req.body; // Default 1 hour
            const userId = req.user.userId;

            // Get machine details
            const machine = await Machine.getById(machineId);
            if (!machine) {
                return res.status(404).json({ error: 'Machine not found' });
            }

            // Check ownership
            if (machine.user_id !== userId && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Unauthorized' });
            }

            // Extend expiration time
            const newExpiresAt = new Date(machine.expires_at);
            newExpiresAt.setMinutes(newExpiresAt.getMinutes() + additionalMinutes);

            await Machine.updateExpiresAt(machineId, newExpiresAt);

            const now = new Date();
            const timeRemaining = Math.max(0, Math.floor((newExpiresAt - now) / 1000));

            res.json({
                message: 'Time extended successfully',
                machine: {
                    id: machineId,
                    expiresAt: newExpiresAt,
                    timeRemaining
                }
            });

        } catch (error) {
            console.error('Error extending time:', error);
            res.status(500).json({ 
                error: 'Failed to extend time',
                details: error.message 
            });
        }
    }

    /**
     * Cleanup expired containers (admin only)
     */
    static async cleanupExpired(req, res) {
        try {
            const cleaned = await dockerService.cleanupExpiredContainers();
            
            res.json({ 
                message: 'Cleanup completed',
                containersRemoved: cleaned 
            });

        } catch (error) {
            console.error('Error during cleanup:', error);
            res.status(500).json({ 
                error: 'Cleanup failed',
                details: error.message 
            });
        }
    }
}

module.exports = DockerController;
