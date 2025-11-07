const jwt = require('jsonwebtoken');
const User = require('../models/User');
const jwtConfig = require('../config/jwt');

class AuthController {
    // Register new user
    static async register(req, res, next) {
        try {
            const { username, email, password, team_name } = req.body;

            // Check if user already exists
            const existingUser = await User.findByUsername(username);
            if (existingUser) {
                return res.status(409).json({ error: 'Username already exists' });
            }

            const existingEmail = await User.findByEmail(email);
            if (existingEmail) {
                return res.status(409).json({ error: 'Email already exists' });
            }

            // Create new user
            const userId = await User.create({
                username,
                email,
                password,
                team_name: team_name || username,
                role: 'user'
            });

            // Generate JWT token
            const token = jwt.sign(
                { userId, username, role: 'user' },
                jwtConfig.secret,
                { expiresIn: jwtConfig.expiresIn }
            );

            res.status(201).json({
                message: 'User registered successfully',
                token,
                user: {
                    id: userId,
                    username,
                    email,
                    team_name: team_name || username,
                    role: 'user'
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Login user
    static async login(req, res, next) {
        try {
            const { username, password } = req.body;

            // Find user
            const user = await User.findByUsername(username);
            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Verify password
            const isValidPassword = await User.verifyPassword(password, user.password_hash);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Generate JWT token
            const token = jwt.sign(
                { userId: user.id, username: user.username, role: user.role },
                jwtConfig.secret,
                { expiresIn: jwtConfig.expiresIn }
            );

            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    team_name: user.team_name,
                    role: user.role,
                    total_score: user.total_score
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Get current user profile
    static async getProfile(req, res, next) {
        try {
            const user = await User.findById(req.user.id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Get solved challenges
            const solvedChallenges = await User.getSolvedChallenges(user.id);

            res.json({
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    team_name: user.team_name,
                    role: user.role,
                    total_score: user.total_score,
                    created_at: user.created_at
                },
                solved_challenges: solvedChallenges
            });
        } catch (error) {
            next(error);
        }
    }

    // Logout (client-side token removal)
    static async logout(req, res) {
        res.json({ message: 'Logout successful' });
    }
}

module.exports = AuthController;
