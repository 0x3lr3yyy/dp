const database = require('../config/database');
const Solve = require('../models/Solve');

class LeaderboardController {
    // Get global leaderboard
    static async getLeaderboard(req, res, next) {
        try {
            const limit = parseInt(req.query.limit) || 100;

            const sql = `
                SELECT 
                    u.id,
                    u.username,
                    u.team_name,
                    u.total_score,
                    COUNT(s.id) as solved_count,
                    (SELECT COUNT(*) FROM challenges WHERE is_active = 1) as total_challenges
                FROM users u
                LEFT JOIN solves s ON u.id = s.user_id
                GROUP BY u.id
                ORDER BY u.total_score DESC, solved_count DESC, u.created_at ASC
                LIMIT ?
            `;

            const leaderboard = await database.all(sql, [limit]);

            // Add rank
            const rankedLeaderboard = leaderboard.map((user, index) => ({
                rank: index + 1,
                ...user
            }));

            res.json({ leaderboard: rankedLeaderboard });
        } catch (error) {
            next(error);
        }
    }

    // Get top N users
    static async getTop(req, res, next) {
        try {
            const { limit } = req.params;
            const topLimit = parseInt(limit) || 10;

            const sql = `
                SELECT 
                    u.id,
                    u.username,
                    u.team_name,
                    u.total_score,
                    COUNT(s.id) as solved_count,
                    (SELECT COUNT(*) FROM challenges WHERE is_active = 1) as total_challenges
                FROM users u
                LEFT JOIN solves s ON u.id = s.user_id
                GROUP BY u.id
                ORDER BY u.total_score DESC, solved_count DESC, u.created_at ASC
                LIMIT ?
            `;

            const topUsers = await database.all(sql, [topLimit]);

            // Add rank
            const rankedUsers = topUsers.map((user, index) => ({
                rank: index + 1,
                ...user
            }));

            res.json({ top_users: rankedUsers });
        } catch (error) {
            next(error);
        }
    }

    // Get user rank
    static async getUserRank(req, res, next) {
        try {
            const userId = req.user.id;

            const sql = `
                SELECT 
                    COUNT(*) + 1 as rank
                FROM users
                WHERE total_score > (SELECT total_score FROM users WHERE id = ?)
            `;

            const result = await database.get(sql, [userId]);
            const solveCount = await Solve.getSolveCount(userId);

            const totalChallengesSql = 'SELECT COUNT(*) as count FROM challenges WHERE is_active = 1';
            const totalChallenges = await database.get(totalChallengesSql);

            res.json({
                rank: result.rank,
                solved_count: solveCount,
                total_challenges: totalChallenges.count
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = LeaderboardController;
