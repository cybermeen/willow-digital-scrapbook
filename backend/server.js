// script to set up Express server and connect scrapbook routes

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;


const scrapbookRoutes = require('./routes/scrapbook');

// All scrapbook APIs will start with /api/scrapbook
app.use('/api/scrapbook', scrapbookRoutes);

// Serve the uploads folder as a static URL path
// Now a file at uploads/photo-123.jpg is accessible at:
// http://localhost:5000/uploads/photo-123.jpg
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
