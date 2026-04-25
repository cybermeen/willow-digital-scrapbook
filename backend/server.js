require('dotenv').config();
const express = require('express');
const path = require('path'); 
const session = require('express-session'); //for login auth
const app = express();
const PORT = process.env.PORT || 3000;

// allows the server to read the JSON sent in Postman
app.use(express.json()); 

// SESSION CONFIGURATION
app.use(session({
  secret: process.env.SESSION_SECRET || 'iba_secret_key', 
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, 
    httpOnly: true, 
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

//ROUTES
const scrapbookRoutes = require('./routes/scrapbook');
const todoRoutes = require('./routes/to-do');
const authRoutes = require('./routes/authRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/scrapbook', scrapbookRoutes);
app.use('/api/todo', todoRoutes);

// static files: This line requires 'path' to be defined at the top
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Fallback to index.html for any unmatched routes (for client-side routing)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
