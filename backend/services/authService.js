const db = require('../db/db');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const authService = {
    // WF1 Requirement: hashPassword(password: string)
    async register(email, password, displayName) {
        const hash = await bcrypt.hash(password, saltRounds);
        const query = `
            INSERT INTO users (email, password_hash, display_name, is_first_login)
            VALUES ($1, $2, $3, true)
            RETURNING user_id, email, display_name, is_first_login
        `;
        const { rows } = await db.query(query, [email, hash, displayName]);
        return rows[0];
    },

    // WF1 Requirement: verifyPassword(password: string)
    async login(email, password) {
        const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (rows.length === 0) return null;

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        return isMatch ? user : null;
    }
};

module.exports = authService;