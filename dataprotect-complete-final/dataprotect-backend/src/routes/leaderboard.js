const express = require('express');
const LeaderboardController = require('../controllers/leaderboardController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', LeaderboardController.getLeaderboard);
router.get('/top/:limit', LeaderboardController.getTop);

// Protected routes
router.get('/user/rank', authenticateToken, LeaderboardController.getUserRank);

module.exports = router;
