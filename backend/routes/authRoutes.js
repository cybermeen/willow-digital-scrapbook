const express = require('express');
const router = express.Router();
const authService = require('../services/authService');

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { email, password, displayName } = req.body;

        // 1. Validation (WF1 Requirement)
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        // 2. Register via Service (Handles Hashing)
        const newUser = await authService.register(email, password, displayName);

        // 3. Auto-login after registration (Establish Session)
        req.session.userId = newUser.user_id;

        res.status(201).json({
            message: "User registered successfully",
            user: newUser // Contains is_first_login: true
        });
    } catch (error) {
    // THIS IS THE LINE YOU NEED RIGHT NOW
    console.error("DEBUG - Registration Crash:", error); 

    if (error.code === '23505') {
        return res.status(400).json({ message: "Email already exists." });
    }
    // Return the REAL error message to Postman so we can see it
    res.status(500).json({ 
        message: "Server error during registration.",
        detail: error.message 
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

        // 4. Secure Session Management (WF1 Requirement)
        req.session.userId = user.user_id;

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

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ message: "Could not log out." });
        res.clearCookie('connect.sid'); // Clears the session cookie
        res.json({ message: "Logged out successfully" });
    });
});

module.exports = router;