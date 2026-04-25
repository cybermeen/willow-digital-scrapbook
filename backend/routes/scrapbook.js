const express = require('express');
const router = express.Router();
const ctrl = require('../services/scrapbookService');
const auth = require('../auth/auth');  
const upload = require('../uploads/upload');

// Apply auth middleware to ALL routes in this file.
// If a user is not logged in, they get a 401 error before reaching any of the route handlers below.
router.use(auth);

// ------------------ DAY LOG -----------------------------
// GET  /api/scrapbook/logs/:date  → Get or create today's log
router.get('/logs/:date', ctrl.getOrCreateLog);

// GET  /api/scrapbook/logs        → Get all past logs (calendar archive)
router.get('/logs', ctrl.getAllLogs);

// PATCH /api/scrapbook/logs/:logId → Update log-level settings (mood, layout)
router.patch('/logs/:logId', ctrl.updateLog);

// -------------------- PHOTOS ----------------------------
// POST /api/scrapbook/photos/:logId → Upload a photo
// 'upload.single("photo")' is Multer middleware — it processes
// the uploaded file before the handler runs
router.post('/photos/:logId', upload.single('photo'), ctrl.uploadPhoto);

// PATCH /api/scrapbook/photos/:photoId → Update position/caption
router.patch('/photos/:photoId', ctrl.updatePhoto);

// DELETE /api/scrapbook/photos/:photoId → Remove a photo
router.delete('/photos/:photoId', ctrl.deletePhoto);

// -------------------- NOTES ----------------------------
router.post('/notes/:logId', ctrl.createNote);
router.patch('/notes/:noteId', ctrl.updateNote);
router.delete('/notes/:noteId', ctrl.deleteNote);

// -------------------- PROMPTS ----------------------------
// GET /api/scrapbook/prompts/daily → Get today's random prompt
router.get('/prompts/daily', ctrl.getDailyPrompt);

// POST /api/scrapbook/prompts/answer/:logId → Save an answer
router.post('/prompts/answer/:logId', ctrl.savePromptAnswer);

// PATCH /api/scrapbook/prompts/answer/:answerId → Edit an answer
router.patch('/prompts/answer/:answerId', ctrl.updatePromptAnswer);

// ------------------ STICKERS -----------------------------
// GET /api/scrapbook/assets → List all available art assets
router.get('/assets', ctrl.getArtAssets);

// POST /api/scrapbook/stickers/:logId → Place a sticker on a log
router.post('/stickers/:logId', ctrl.placeSticker);

// PATCH /api/scrapbook/stickers/:stickerId → Move/resize a sticker
router.patch('/stickers/:stickerId', ctrl.updateSticker);

// DELETE /api/scrapbook/stickers/:stickerId → Remove a sticker
router.delete('/stickers/:stickerId', ctrl.deleteSticker);

// -------------------------- LAYOUT ------------------------------
// POST /api/scrapbook/layout/:logId → Save entire layout in one call
router.post('/layout/:logId', ctrl.saveLayout);

// POST /api/scrapbook/logs/:logId/unlock-achievement
router.post('/logs/:logId/unlock-achievement', ctrl.unlockAchievement);

module.exports = router;
