const express = require('express');
const router = express.Router();
const authService = require('../services/authService');

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        console.log('DEBUG - Register payload:', req.body);
        const { email, password, displayName } = req.body;

        // Validation 
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        // Register via Service (Handles Hashing)
        const newUser = await authService.register(email, password, displayName);

        // Auto-login after registration (Establish Session)
        req.session.userId = newUser.user_id;

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: newUser.user_id,
                email: newUser.email,
                displayName: newUser.display_name,
                isFirstLogin: newUser.is_first_login
            }
        });
    } catch (error) {
        console.error("DEBUG - Registration Crash:", error.stack || error);

        if (error.code === '23505') {
            return res.status(400).json({ message: "Email already exists." });
        }

        res.status(500).json({
            message: "Server error during registration.",
            detail: error.message,
            code: error.code || null
        });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await authService.login(email, password);

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        // Secure Session Management
        req.session.userId = user.user_id;

        // Recalculate progress on login so streak and average are fresh
        const ProgressService = require('../services/progressService');
        await ProgressService.calculateDailyProgress(user.user_id);
        await ProgressService.calculateStreak(user.user_id);

        res.json({
            message: "Login successful",
            user: {
                id: user.user_id,
                email: user.email,
                displayName: user.display_name,
                isFirstLogin: user.is_first_login
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Server error during login." });
    }
});

// GET /api/auth/me — Check if session is still valid (called on app load)
router.get('/me', async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: 'No active session' });
    }
    try {
        const db = require('../db/db');
        const result = await db.query(
            'SELECT user_id, email, display_name FROM users WHERE user_id = $1',
            [req.session.userId]
        );
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'User not found' });
        }
        const u = result.rows[0];
        res.json({
            user: {
                id: u.user_id,
                email: u.email,
                displayName: u.display_name,
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});


// POST /api/auth/logout
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ message: "Could not log out." });
        res.clearCookie('connect.sid'); // Clears the session cookie
        res.json({ message: "Logged out successfully" });
    });
});

module.exports = router;