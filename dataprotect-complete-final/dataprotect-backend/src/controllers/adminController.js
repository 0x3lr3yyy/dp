const User = require('../models/User');
const Challenge = require('../models/Challenge');
const Category = require('../models/Category');
const Machine = require('../models/Machine');
const Submission = require('../models/Submission');

class AdminController {
    // Get dashboard statistics
    static async getDashboard(req, res, next) {
        try {
            const userCount = (await User.getAll()).length;
            const challengeCount = (await Challenge.getAllForAdmin()).length;
            const categoryCount = (await Category.getAll()).length;
            const activeMachines = (await Machine.getAll()).filter(m => m.status === 'running').length;
            const recentSubmissions = await Submission.getAll();

            res.json({
                stats: {
                    total_users: userCount,
                    total_challenges: challengeCount,
                    total_categories: categoryCount,
                    active_machines: activeMachines
                },
                recent_submissions: recentSubmissions.slice(0, 10)
            });
        } catch (error) {
            next(error);
        }
    }

    // Get all users
    static async getAllUsers(req, res, next) {
        try {
            const users = await User.getAll();
            res.json({ users });
        } catch (error) {
            next(error);
        }
    }

    // Update user
    static async updateUser(req, res, next) {
        try {
            const { id } = req.params;
            const { username, email, team_name, role } = req.body;

            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            await User.update(id, { username, email, team_name, role });
            const updatedUser = await User.findById(id);

            res.json({
                message: 'User updated successfully',
                user: updatedUser
            });
        } catch (error) {
            next(error);
        }
    }

    // Delete user
    static async deleteUser(req, res, next) {
        try {
            const { id } = req.params;

            // Prevent deleting yourself
            if (parseInt(id) === req.user.id) {
                return res.status(400).json({ error: 'Cannot delete your own account' });
            }

            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            await User.delete(id);
            res.json({ message: 'User deleted successfully' });
        } catch (error) {
            next(error);
        }
    }

    // Get all machines
    static async getAllMachines(req, res, next) {
        try {
            const machines = await Machine.getAll();
            res.json({ machines });
        } catch (error) {
            next(error);
        }
    }

    // Force stop machine
    static async stopMachine(req, res, next) {
        try {
            const { id } = req.params;

            const machine = await Machine.findById(id);
            if (!machine) {
                return res.status(404).json({ error: 'Machine not found' });
            }

            await Machine.stop(id);
            res.json({ message: 'Machine stopped successfully' });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = AdminController;
