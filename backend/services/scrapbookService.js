// services/scrapbookService.js

const db = require('../db/db');
const fs = require('fs');
const path = require('path');


// HELPER FUNCTION — Ownership Check
// Before modifying any log, verify it belongs to the logged-in user.
// This is critical for security — User A must never edit User B's log.
async function verifyLogOwnership(logId, userId) {
  const result = await db.query(
    'SELECT id FROM day_logs WHERE id = $1 AND user_id = $2',
    [logId, userId]
  );
  return result.rows.length > 0;
}


// GET /api/scrapbook/logs/:date
// Called when user opens the Day Log page for a specific date.
// If no log exists yet for that date, create one automatically.
exports.getOrCreateLog = async (req, res) => {
  try {
    const userId = req.user.id;    // Set by auth middleware
    const { date } = req.params;   // e.g. '2025-01-15'

    // Try to find an existing log
    let result = await db.query(
      'SELECT * FROM day_logs WHERE user_id = $1 AND log_date = $2',
      [userId, date]
    );

    // If none exists, create one
    if (result.rows.length === 0) {
      result = await db.query(
        `INSERT INTO day_logs (user_id, log_date)`,
        ` VALUES ($1, $2) RETURNING *`,
        [userId, date]
      );
    }

    const log = result.rows[0];

    // Fetch all content associated with this log in parallel
    // Promise.all runs all queries simultaneously (faster than sequential)
    const [photos, notes, answers, stickers] = await Promise.all([
      db.query('SELECT * FROM log_photos WHERE log_id = $1 ORDER BY z_index', [log.id]),
      db.query('SELECT * FROM log_notes WHERE log_id = $1 ORDER BY z_index', [log.id]),
      db.query(
        `SELECT lpa.*, rp.prompt_text FROM log_prompt_answers lpa`,
        ` JOIN reflective_prompts rp ON lpa.prompt_id = rp.id`,
        ` WHERE lpa.log_id = $1`,
        [log.id]
      ),
      db.query(
        `SELECT ls.*, aa.file_path as asset_path, aa.name as asset_name`,
        ` FROM log_stickers ls JOIN art_assets aa ON ls.asset_id = aa.id`,
        ` WHERE ls.log_id = $1 ORDER BY ls.z_index`,
        [log.id]
      )
    ]);

    // Return everything the frontend needs to render the scrapbook
    res.json({
      log,
      photos: photos.rows,
      notes: notes.rows,
      answers: answers.rows,
      stickers: stickers.rows
    });

  } catch (err) {
    console.error('getOrCreateLog error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};


// GET /api/scrapbook/logs
// Returns a summary of all days the user has a log.
// Used to populate the calendar/archive view.
exports.getAllLogs = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT
        dl.id,
        dl.log_date,
        dl.mood,
        dl.achievement_unlocked,
        COUNT(DISTINCT lp.id) AS photo_count,
        COUNT(DISTINCT ln.id) AS note_count
       FROM day_logs dl
       LEFT JOIN log_photos lp ON lp.log_id = dl.id
       LEFT JOIN log_notes ln ON ln.log_id = dl.id
       WHERE dl.user_id = $1
       GROUP BY dl.id
       ORDER BY dl.log_date DESC`,
      [userId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error('getAllLogs error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
  

// POST /api/scrapbook/photos/:logId
// Multer has already saved the file before this function runs.
// req.file contains: { filename, originalname, size, path, mimetype }
exports.uploadPhoto = async (req, res) => {
  try {
    const { logId } = req.params;
    const userId = req.user.id;

    // Security check: make sure this log belongs to the logged-in user
    const isOwner = await verifyLogOwnership(logId, userId);
    if (!isOwner) {
      // Delete the file Multer already saved (clean up)
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Build the public URL path for the file
    const filePath = `uploads/${req.file.filename}`;

    // Save photo metadata to the database
    const result = await db.query(
      `INSERT INTO log_photos (log_id, file_path, original_name, file_size)`,
      ` VALUES ($1, $2, $3, $4) RETURNING *`,
      [logId, filePath, req.file.originalname, req.file.size]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    // If DB insert fails, clean up the uploaded file
    if (req.file) fs.unlinkSync(req.file.path);
    console.error('uploadPhoto error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
  

// PATCH /api/scrapbook/photos/:photoId
// Called when user drags a photo to a new position on the canvas,
// resizes it, rotates it, or edits its caption.
exports.updatePhoto = async (req, res) => {
  try {
    const { photoId } = req.params;
    const { pos_x, pos_y, width, height, rotation, z_index, caption } = req.body;

    // First verify this photo's log belongs to the current user
    const ownership = await db.query(
      `SELECT dl.user_id FROM log_photos lp`,
      ` JOIN day_logs dl ON lp.log_id = dl.id`,
      ` WHERE lp.id = $1`,
      [photoId]
    );
    if (!ownership.rows.length || ownership.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await db.query(
      `UPDATE log_photos`,
      ` SET pos_x = COALESCE($1, pos_x),`,
      `     pos_y = COALESCE($2, pos_y),`,
      `     width = COALESCE($3, width),`,
      `     height = COALESCE($4, height),`,
      `     rotation = COALESCE($5, rotation),`,
      `     z_index = COALESCE($6, z_index),`,
      `     caption = COALESCE($7, caption)`,
      ` WHERE id = $8 RETURNING *`,
      [pos_x, pos_y, width, height, rotation, z_index, caption, photoId]
    );

    // COALESCE($1, pos_x) means: if $1 is null, keep the existing value.
    // This lets the frontend send only the fields that changed.

    res.json(result.rows[0]);

  } catch (err) {
    console.error('updatePhoto error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
  


exports.deletePhoto = async (req, res) => {
  try {
    const { photoId } = req.params;

    // Get the file path before deleting the DB record
    const photo = await db.query(
      `SELECT lp.*, dl.user_id FROM log_photos lp`,
      ` JOIN day_logs dl ON lp.log_id = dl.id`,
      ` WHERE lp.id = $1`,
      [photoId]
    );

    if (!photo.rows.length) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    if (photo.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete from database first
    await db.query('DELETE FROM log_photos WHERE id = $1', [photoId]);

    // Then delete the actual file from disk
    const filePath = path.join(__dirname, '../', photo.rows[0].file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: 'Photo deleted successfully' });

  } catch (err) {
    console.error('deletePhoto error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
  

exports.createNote = async (req, res) => {
  try {
    const { logId } = req.params;
    const { content, pos_x, pos_y, bg_color, font_size } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Note content cannot be empty' });
    }

    const isOwner = await verifyLogOwnership(logId, req.user.id);
    if (!isOwner) return res.status(403).json({ error: 'Access denied' });

    const result = await db.query(
      `INSERT INTO log_notes (log_id, content, pos_x, pos_y, bg_color, font_size)`,
      ` VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [logId, content.trim(), pos_x || 0, pos_y || 0, bg_color || '#FFFDE7', font_size || 14]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error('createNote error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { content, pos_x, pos_y, width, rotation, z_index, bg_color, font_size } = req.body;

    // Verify ownership through the log
    const ownership = await db.query(
      `SELECT dl.user_id FROM log_notes ln`,
      ` JOIN day_logs dl ON ln.log_id = dl.id WHERE ln.id = $1`,
      [noteId]
    );
    if (!ownership.rows.length || ownership.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await db.query(
      `UPDATE log_notes SET`,
      `  content   = COALESCE($1, content),`,
      `  pos_x     = COALESCE($2, pos_x),`,
      `  pos_y     = COALESCE($3, pos_y),`,
      `  width     = COALESCE($4, width),`,
      `  rotation  = COALESCE($5, rotation),`,
      `  z_index   = COALESCE($6, z_index),`,
      `  bg_color  = COALESCE($7, bg_color),`,
      `  font_size = COALESCE($8, font_size)`,
      ` WHERE id = $9 RETURNING *`,
      [content, pos_x, pos_y, width, rotation, z_index, bg_color, font_size, noteId]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error('updateNote error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const ownership = await db.query(
      `SELECT dl.user_id FROM log_notes ln`,
      ` JOIN day_logs dl ON ln.log_id = dl.id WHERE ln.id = $1`,
      [noteId]
    );
    if (!ownership.rows.length || ownership.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    await db.query('DELETE FROM log_notes WHERE id = $1', [noteId]);
    res.json({ message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
  

// GET /api/scrapbook/prompts/daily
// Serves a prompt for the day. Uses a deterministic approach:
// the same user gets the same prompt for the same date,
// but different users get different prompts.
exports.getDailyPrompt = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'

    // Count total active prompts
    const countResult = await db.query(
      'SELECT COUNT(*) FROM reflective_prompts WHERE is_active = true'
    );
    const total = parseInt(countResult.rows[0].count);
    if (total === 0) return res.status(404).json({ error: 'No prompts available' });

    // Deterministic 'random': pick index based on userId + date hash
    // This gives a consistent prompt per user per day
    const dateNum = parseInt(today.replace(/-/g, ''));
    const offset = (userId + dateNum) % total;

    const result = await db.query(
      `SELECT * FROM reflective_prompts`,
      ` WHERE is_active = true ORDER BY id LIMIT 1 OFFSET $1`,
      [offset]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error('getDailyPrompt error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.savePromptAnswer = async (req, res) => {
  try {
    const { logId } = req.params;
    const { prompt_id, answer_text, pos_x, pos_y } = req.body;

    if (!answer_text || answer_text.trim() === '') {
      return res.status(400).json({ error: 'Answer cannot be empty' });
    }

    const isOwner = await verifyLogOwnership(logId, req.user.id);
    if (!isOwner) return res.status(403).json({ error: 'Access denied' });

    const result = await db.query(
      `INSERT INTO log_prompt_answers (log_id, prompt_id, answer_text, pos_x, pos_y)`,
      ` VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [logId, prompt_id, answer_text.trim(), pos_x || 0, pos_y || 0]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error('savePromptAnswer error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
  

// GET /api/scrapbook/assets
// Returns all available stickers/icons.
// Locked achievement assets are only shown if the user unlocked them.
exports.getArtAssets = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM art_assets WHERE is_active = true ORDER BY category, name`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.placeSticker = async (req, res) => {
  try {
    const { logId } = req.params;
    const { asset_id, pos_x, pos_y, width, height, rotation } = req.body;

    const isOwner = await verifyLogOwnership(logId, req.user.id);
    if (!isOwner) return res.status(403).json({ error: 'Access denied' });

    // If this is an achievement sticker, verify it was unlocked
    const asset = await db.query(
      'SELECT * FROM art_assets WHERE id = $1', [asset_id]
    );
    if (asset.rows[0]?.is_achievement_reward) {
      const log = await db.query(
        'SELECT achievement_unlocked FROM day_logs WHERE id = $1', [logId]
      );
      if (!log.rows[0]?.achievement_unlocked) {
        return res.status(403).json({ error: 'Complete all tasks to unlock this sticker!' });
      }
    }

    const result = await db.query(
      `INSERT INTO log_stickers (log_id, asset_id, pos_x, pos_y, width, height, rotation)`,
      ` VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [logId, asset_id, pos_x || 0, pos_y || 0, width || 80, height || 80, rotation || 0]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error('placeSticker error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
  

// POST /api/scrapbook/layout/:logId
// Saves all element positions in a single request.
// The frontend sends the full current state of the canvas.
// This is called when the user clicks 'Save Layout'.
exports.saveLayout = async (req, res) => {
  const client = await db.connect(); // Get a dedicated client for a transaction
  try {
    const { logId } = req.params;
    const { photos, notes, stickers, answers, layout_style, mood } = req.body;

    const isOwner = await verifyLogOwnership(logId, req.user.id);
    if (!isOwner) return res.status(403).json({ error: 'Access denied' });

    // Use a database TRANSACTION — all updates succeed or all fail together.
    // This prevents partial saves (e.g., photos saved but notes failed).
    await client.query('BEGIN');

    // Update each photo's position
    if (photos) {
      for (const photo of photos) {
        await client.query(
          `UPDATE log_photos SET pos_x=$1, pos_y=$2, width=$3, height=$4,`,
          `  rotation=$5, z_index=$6 WHERE id=$7 AND log_id=$8`,
          [photo.pos_x, photo.pos_y, photo.width, photo.height,
           photo.rotation, photo.z_index, photo.id, logId]
        );
      }
    }

    // Update each note's position
    if (notes) {
      for (const note of notes) {
        await client.query(
          `UPDATE log_notes SET pos_x=$1, pos_y=$2, width=$3,`,
          `  rotation=$4, z_index=$5 WHERE id=$6 AND log_id=$7`,
          [note.pos_x, note.pos_y, note.width,
           note.rotation, note.z_index, note.id, logId]
        );
      }
    }

    // Update each sticker's position
    if (stickers) {
      for (const sticker of stickers) {
        await client.query(
          `UPDATE log_stickers SET pos_x=$1, pos_y=$2, width=$3,`,
          `  height=$4, rotation=$5, z_index=$6 WHERE id=$7 AND log_id=$8`,
          [sticker.pos_x, sticker.pos_y, sticker.width,
           sticker.height, sticker.rotation, sticker.z_index, sticker.id, logId]
        );
      }
    }

    // Update the log itself
    await client.query(
      `UPDATE day_logs SET layout_style = COALESCE($1, layout_style),`,
      `  mood = COALESCE($2, mood), updated_at = NOW()`,
      ` WHERE id = $3`,
      [layout_style, mood, logId]
    );

    await client.query('COMMIT'); // Save everything
    res.json({ message: 'Layout saved successfully' });

  } catch (err) {
    await client.query('ROLLBACK'); // Undo everything on error
    console.error('saveLayout error:', err);
    res.status(500).json({ error: 'Failed to save layout' });
  } finally {
    client.release(); // Always return the client to the pool
  }
};

exports.unlockAchievement = async (req, res) => {
  try {
    const { logId } = req.params;
    const isOwner = await verifyLogOwnership(logId, req.user.id);
    if (!isOwner) return res.status(403).json({ error: 'Access denied' });

    await db.query(
      'UPDATE day_logs SET achievement_unlocked = true WHERE id = $1',
      [logId]
    );

    res.json({
      message: 'Achievement unlocked! A special sticker is now available.',
      achievement: true
    });

  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

