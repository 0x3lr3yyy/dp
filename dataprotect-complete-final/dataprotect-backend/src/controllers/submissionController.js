const Submission = require('../models/Submission');
const Solve = require('../models/Solve');
const Challenge = require('../models/Challenge');
const User = require('../models/User');

class SubmissionController {
    // Submit a flag
    static async submit(req, res, next) {
        try {
            const { challenge_id, flag } = req.body;
            const userId = req.user.id;

            // Find challenge
            const challenge = await Challenge.findById(challenge_id);
            if (!challenge) {
                return res.status(404).json({ error: 'Challenge not found' });
            }

            // Check if already solved
            const alreadySolved = await Solve.checkIfSolved(userId, challenge_id);
            if (alreadySolved) {
                return res.status(400).json({ 
                    error: 'Challenge already solved',
                    is_correct: false
                });
            }

            // Verify flag
            const isCorrect = flag.trim() === challenge.flag.trim();
            const pointsAwarded = isCorrect ? challenge.points : 0;

            // Create submission record
            await Submission.create({
                user_id: userId,
                challenge_id,
                submitted_flag: flag,
                is_correct: isCorrect,
                points_awarded: pointsAwarded
            });

            // If correct, create solve record and update user score
            if (isCorrect) {
                await Solve.create({
                    user_id: userId,
                    challenge_id
                });

                await User.updateScore(userId, pointsAwarded);
            }

            res.json({
                message: isCorrect ? 'Correct flag! Challenge solved!' : 'Incorrect flag. Try again.',
                is_correct: isCorrect,
                points_awarded: pointsAwarded
            });
        } catch (error) {
            next(error);
        }
    }

    // Get user's submission history
    static async getUserSubmissions(req, res, next) {
        try {
            const userId = req.user.id;
            const submissions = await Submission.findByUser(userId);

            res.json({ submissions });
        } catch (error) {
            next(error);
        }
    }

    // Get submissions for a challenge (Admin only)
    static async getChallengeSubmissions(req, res, next) {
        try {
            const { challengeId } = req.params;
            const submissions = await Submission.findByChallenge(challengeId);

            res.json({ submissions });
        } catch (error) {
            next(error);
        }
    }

    // Get all recent submissions (Admin only)
    static async getAll(req, res, next) {
        try {
            const submissions = await Submission.getAll();
            res.json({ submissions });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = SubmissionController;
