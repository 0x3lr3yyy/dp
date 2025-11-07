const Machine = require('../models/Machine');
const Challenge = require('../models/Challenge');

class MachineController {
    // Start a machine for a challenge
    static async start(req, res, next) {
        try {
            const { challengeId } = req.params;
            const userId = req.user.id;

            // Check if challenge exists
            const challenge = await Challenge.findById(challengeId);
            if (!challenge) {
                return res.status(404).json({ error: 'Challenge not found' });
            }

            // Check if user already has an active machine for this challenge
            const existingMachine = await Machine.findActiveByUserAndChallenge(userId, challengeId);
            if (existingMachine) {
                return res.status(400).json({ 
                    error: 'Machine already running for this challenge',
                    machine: existingMachine
                });
            }

            // Generate machine IP
            const machineIp = Machine.generateIP();

            // Calculate expiration time (1 hour from now)
            const sessionDuration = parseInt(process.env.MACHINE_SESSION_DURATION || 3600);
            const expiresAt = new Date(Date.now() + sessionDuration * 1000).toISOString();

            // Create machine
            const machineId = await Machine.create({
                user_id: userId,
                challenge_id: challengeId,
                machine_ip: machineIp,
                expires_at: expiresAt
            });

            const machine = await Machine.findById(machineId);

            res.status(201).json({
                message: 'Machine started successfully',
                machine: {
                    id: machine.id,
                    machine_ip: machine.machine_ip,
                    status: machine.status,
                    started_at: machine.started_at,
                    expires_at: machine.expires_at,
                    challenge_title: machine.challenge_title,
                    session_duration: sessionDuration
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Stop a machine
    static async stop(req, res, next) {
        try {
            const { machineId } = req.params;
            const userId = req.user.id;

            const machine = await Machine.findById(machineId);
            if (!machine) {
                return res.status(404).json({ error: 'Machine not found' });
            }

            // Check if machine belongs to user (or user is admin)
            if (machine.user_id !== userId && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Access denied' });
            }

            if (machine.status !== 'running') {
                return res.status(400).json({ error: 'Machine is not running' });
            }

            await Machine.stop(machineId);

            res.json({ message: 'Machine stopped successfully' });
        } catch (error) {
            next(error);
        }
    }

    // Get machine status
    static async getStatus(req, res, next) {
        try {
            const { machineId } = req.params;
            const userId = req.user.id;

            const machine = await Machine.findById(machineId);
            if (!machine) {
                return res.status(404).json({ error: 'Machine not found' });
            }

            // Check if machine belongs to user (or user is admin)
            if (machine.user_id !== userId && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Access denied' });
            }

            // Check if machine has expired
            if (machine.status === 'running' && new Date(machine.expires_at) < new Date()) {
                await Machine.expire(machineId);
                machine.status = 'expired';
            }

            res.json({ machine });
        } catch (error) {
            next(error);
        }
    }

    // Get user's active machines
    static async getUserMachines(req, res, next) {
        try {
            const userId = req.user.id;
            const machines = await Machine.findActiveByUser(userId);

            res.json({ machines });
        } catch (error) {
            next(error);
        }
    }

    // Get all machines (Admin only)
    static async getAll(req, res, next) {
        try {
            const machines = await Machine.getAll();
            res.json({ machines });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = MachineController;
