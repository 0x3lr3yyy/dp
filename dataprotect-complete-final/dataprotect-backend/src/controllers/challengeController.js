const Challenge = require('../models/Challenge');
const Solve = require('../models/Solve');

class ChallengeController {
    // Get all challenges (active only for users)
    static async getAll(req, res, next) {
        try {
            const challenges = await Challenge.getAll();
            
            // Remove flags from response
            const safeChallenges = challenges.map(ch => {
                const { flag, ...rest } = ch;
                return rest;
            });

            res.json({ challenges: safeChallenges });
        } catch (error) {
            next(error);
        }
    }

    // Get all challenges for admin (including inactive)
    static async getAllForAdmin(req, res, next) {
        try {
            const challenges = await Challenge.getAllForAdmin();
            res.json({ challenges });
        } catch (error) {
            next(error);
        }
    }

    // Get challenge by ID
    static async getById(req, res, next) {
        try {
            const { id } = req.params;
            const challenge = await Challenge.findById(id);

            if (!challenge) {
                return res.status(404).json({ error: 'Challenge not found' });
            }

            // Check if user has solved this challenge
            let isSolved = false;
            if (req.user) {
                isSolved = await Solve.checkIfSolved(req.user.id, challenge.id);
            }

            // Remove flag from response unless solved
            const { flag, ...safeChallenge } = challenge;
            
            res.json({ 
                challenge: safeChallenge,
                is_solved: isSolved
            });
        } catch (error) {
            next(error);
        }
    }

    // Get challenges by category
    static async getByCategory(req, res, next) {
        try {
            const { category } = req.params;
            const challenges = await Challenge.findByCategory(category);

            // Remove flags from response
            const safeChallenges = challenges.map(ch => {
                const { flag, ...rest } = ch;
                return rest;
            });

            res.json({ challenges: safeChallenges });
        } catch (error) {
            next(error);
        }
    }

    // Create new challenge (Admin only)
    static async create(req, res, next) {
        try {
            const { challenge_id, category_id, title, description, difficulty, points, flag, is_active } = req.body;

            const challengeDbId = await Challenge.create({
                challenge_id,
                category_id,
                title,
                description,
                difficulty,
                points,
                flag,
                is_active: is_active !== undefined ? is_active : 1
            });

            const challenge = await Challenge.findById(challengeDbId);

            res.status(201).json({
                message: 'Challenge created successfully',
                challenge
            });
        } catch (error) {
            next(error);
        }
    }

    // Update challenge (Admin only)
    static async update(req, res, next) {
        try {
            const { id } = req.params;
            const { challenge_id, category_id, title, description, difficulty, points, flag, is_active } = req.body;

            const challenge = await Challenge.findById(id);
            if (!challenge) {
                return res.status(404).json({ error: 'Challenge not found' });
            }

            await Challenge.update(id, {
                challenge_id,
                category_id,
                title,
                description,
                difficulty,
                points,
                flag,
                is_active
            });

            const updatedChallenge = await Challenge.findById(id);

            res.json({
                message: 'Challenge updated successfully',
                challenge: updatedChallenge
            });
        } catch (error) {
            next(error);
        }
    }

    // Delete challenge (Admin only)
    static async delete(req, res, next) {
        try {
            const { id } = req.params;

            const challenge = await Challenge.findById(id);
            if (!challenge) {
                return res.status(404).json({ error: 'Challenge not found' });
            }

            await Challenge.delete(id);
            res.json({ message: 'Challenge deleted successfully' });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = ChallengeController;
