module.exports = (req, res, next) => {
    // Strictly isolate data by checking the session
    if (req.session && req.session.userId) {
        req.user = { id: req.session.userId }; // attach user object for route handlers
        return next(); // Proceed to the route
    }
    // Secure Session Management: block unauthorized access
    return res.status(401).json({ message: "Unauthorized: Please log in." });
};