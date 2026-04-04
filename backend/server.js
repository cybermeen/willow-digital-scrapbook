require('dotenv').config();
const express = require('express');
const path = require('path'); // MUST BE HERE for both of you
const session = require('express-session'); //for login auth
const app = express();
const PORT = process.env.PORT || 3000;

// middleware: This allows the server to read the JSON you send in Postman
app.use(express.json()); 

// SESSION CONFIGURATION (Crucial for Login to work)
app.use(session({
  secret: process.env.SESSION_SECRET || 'iba_secret_key', 
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true if using HTTPS
    httpOnly: true, 
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

//ROUTES
//const scrapbookRoutes = require('./routes/scrapbook');
const todoRoutes = require('./routes/to-do');
const authRoutes = require('./routes/authRoutes');

app.use('/api/auth', authRoutes);
//app.use('/api/scrapbook', scrapbookRoutes);
app.use('/api/todo', todoRoutes);

// static files: This line requires 'path' to be defined at the top
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
