import React, { useState, useEffect, useRef, useCallback } from 'react';
import './DayLog.css';

const API = '/api/scrapbook';

// ── Helpers ────────────────────────────────────────────────────────────────

const PROMPT_TYPES = [
  { value: 'short', label: 'Short and sweet' },
  { value: 'reflective', label: 'Reflective' },
  { value: 'creative', label: 'Creative' },
];

function formatDisplayDate(dateStr) {
  // dateStr: 'YYYY-MM-DD'
  const d = new Date(dateStr + 'T00:00:00');
  return {
    weekday: d.toLocaleDateString('en-US', { weekday: 'long' }),
    full: d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
    ordinal: (() => {
      const day = d.getDate();
      const s = ['th','st','nd','rd'];
      const v = day % 100;
      return day + (s[(v - 20) % 10] || s[v] || s[0]);
    })(),
    month: d.toLocaleDateString('en-US', { month: 'long' }),
    year: d.getFullYear(),
  };
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

// Stamp-edge clip path for photos (scalloped border effect via CSS)
function StampPhoto({ src, alt, style }) {
  return (
    <div className="stamp-photo" style={style}>
      <img src={src} alt={alt || 'log photo'} />
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function DayLog({ user }) {
  const date = todayStr();
  const display = formatDisplayDate(date);

  // Log & content state
  const [log, setLog] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [stickers, setStickers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Daily prompt
  const [dailyPrompt, setDailyPrompt] = useState(null);
  const [promptType, setPromptType] = useState('short');
  const [answerText, setAnswerText] = useState('');
  const [savingAnswer, setSavingAnswer] = useState(false);

  // Photo upload
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef();

  // Magic Library
  const [showLibrary, setShowLibrary] = useState(false);
  const [assets, setAssets] = useState([]);
  const [assetsLoading, setAssetsLoading] = useState(false);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // ── Load today's log ────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [logRes, promptRes] = await Promise.all([
          fetch(`${API}/logs/${date}`, { credentials: 'include' }),
          fetch(`${API}/prompts/daily`, { credentials: 'include' }),
        ]);

        if (!logRes.ok) throw new Error('Failed to load log');
        const logData = await logRes.json();
        setLog(logData.log);
        setPhotos(logData.photos || []);
        setStickers(logData.stickers || []);
        setAnswers(logData.answers || []);

        // Pre-fill answer if one exists
        if (logData.answers?.length > 0) {
          setAnswerText(logData.answers[0].answer_text || '');
        }

        if (promptRes.ok) {
          const p = await promptRes.json();
          setDailyPrompt(p);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [date]);

  // ── Load art assets for Magic Library ──────────────────────────────────

  const loadAssets = useCallback(async () => {
    if (assets.length > 0) return; // already loaded
    setAssetsLoading(true);
    try {
      const res = await fetch(`${API}/assets`, { credentials: 'include' });
      if (res.ok) setAssets(await res.json());
    } finally {
      setAssetsLoading(false);
    }
  }, [assets.length]);

  const openLibrary = () => {
    setShowLibrary(true);
    loadAssets();
  };

  // ── Photo upload ────────────────────────────────────────────────────────

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !log) return;
    setUploadingPhoto(true);
    try {
      const form = new FormData();
      form.append('photo', file);
      const res = await fetch(`${API}/photos/${log.id}`, {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      if (res.ok) {
        const newPhoto = await res.json();
        setPhotos(prev => [...prev, newPhoto]);
        setSaved(false);
      }
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleDeletePhoto = async (photoId) => {
    try {
      await fetch(`${API}/photos/${photoId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      setSaved(false);
    } catch (err) {
      console.error('Delete photo error:', err);
    }
  };

  // ── Sticker placement ────────────────────────────────────────────────────

  const handlePlaceSticker = async (asset) => {
    if (!log) return;
    try {
      const res = await fetch(`${API}/stickers/${log.id}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: asset.id,
          pos_x: Math.floor(Math.random() * 300) + 50,
          pos_y: Math.floor(Math.random() * 300) + 50,
          width: 80,
          height: 80,
        }),
      });
      if (res.ok) {
        const newSticker = await res.json();
        // Attach asset info for rendering
        setStickers(prev => [...prev, { ...newSticker, asset_path: asset.file_path, asset_name: asset.name }]);
        setSaved(false);
      }
    } catch (err) {
      console.error('Place sticker error:', err);
    }
    setShowLibrary(false);
  };

  const handleDeleteSticker = async (stickerId) => {
    try {
      await fetch(`${API}/stickers/${stickerId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setStickers(prev => prev.filter(s => s.id !== stickerId));
      setSaved(false);
    } catch (err) {
      console.error('Delete sticker error:', err);
    }
  };

  // ── Save prompt answer ───────────────────────────────────────────────────

  const handleSaveAnswer = async () => {
    if (!log || !dailyPrompt || !answerText.trim()) return;
    setSavingAnswer(true);
    try {
      const existingAnswer = answers[0];
      if (existingAnswer) {
        // Update
        const res = await fetch(`${API}/prompts/answer/${existingAnswer.id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answer_text: answerText }),
        });
        if (res.ok) {
          const updated = await res.json();
          setAnswers([updated]);
        }
      } else {
        // Create
        const res = await fetch(`${API}/prompts/answer/${log.id}`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt_id: dailyPrompt.id,
            answer_text: answerText,
          }),
        });
        if (res.ok) {
          const created = await res.json();
          setAnswers([created]);
        }
      }
    } finally {
      setSavingAnswer(false);
    }
  };

  // ── Save full layout ─────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!log) return;
    setSaving(true);
    try {
      await handleSaveAnswer();
      const res = await fetch(`${API}/layout/${log.id}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photos, stickers }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Reset ────────────────────────────────────────────────────────────────

  const handleReset = () => {
    setAnswerText(answers[0]?.answer_text || '');
    setShowLibrary(false);
  };

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="dl-loading">
        <span className="dl-loading-icon">🌿</span>
        <p>Loading your log…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dl-error">
        <p>⚠️ {error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="dl-layout">
      {/* ── Left Panel ── */}
      <div className="dl-panel">
        <div className="dl-panel-title">Create Today's Log</div>

        {!showLibrary ? (
          /* ── Normal editor mode ── */
          <div className="dl-editor">
            {/* Prompt type selector */}
            <div className="dl-field-group">
              <label className="dl-label">Choose prompt type:</label>
              <div className="dl-select-wrap">
                <select
                  className="dl-select"
                  value={promptType}
                  onChange={e => setPromptType(e.target.value)}
                >
                  {PROMPT_TYPES.map(pt => (
                    <option key={pt.value} value={pt.value}>{pt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Today's prompt */}
            {dailyPrompt && (
              <div className="dl-field-group">
                <label className="dl-label">Today's prompt:</label>
                <div className="dl-prompt-box">
                  <em>"{dailyPrompt.prompt_text}"</em>
                </div>
              </div>
            )}

            {/* Answer textarea */}
            <textarea
              className="dl-textarea"
              placeholder="Write your thoughts here…"
              value={answerText}
              onChange={e => { setAnswerText(e.target.value); setSaved(false); }}
              rows={6}
            />

            {/* Media add buttons */}
            <div className="dl-add-section">
              <span className="dl-add-label">Add:</span>
              <div className="dl-add-btns">
                <button
                  className="dl-add-btn"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploadingPhoto}
                >
                  {uploadingPhoto ? '…' : 'Image'}
                </button>
                <button className="dl-add-btn" disabled title="Coming soon">Video</button>
                <button className="dl-add-btn" disabled title="Coming soon">Audio</button>
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handlePhotoUpload}
              />
            </div>

            {/* Open Magic Library */}
            <button className="dl-library-btn" onClick={openLibrary}>
              Open Magic Library
            </button>
          </div>
        ) : (
          /* ── Magic Library mode ── */
          <div className="dl-library">
            <div className="dl-library-header">
              <div className="dl-library-title-pill">Magic Library</div>
            </div>

            <div className="dl-library-grid">
              {assetsLoading && <p className="dl-library-loading">Loading assets…</p>}
              {!assetsLoading && assets.length === 0 && (
                <p className="dl-library-empty">No assets found</p>
              )}
              {assets.map(asset => (
                <button
                  key={asset.id}
                  className="dl-asset-btn"
                  onClick={() => handlePlaceSticker(asset)}
                  title={asset.name}
                >
                  <img
                    src={`/uploads/${asset.file_path}`}
                    alt={asset.name}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                </button>
              ))}
            </div>

            {/* Back arrow */}
            <button className="dl-library-back" onClick={() => setShowLibrary(false)}>
              ◀
            </button>
          </div>
        )}

        {/* Import your own assets (shown in library mode) */}
        {showLibrary && (
          <div className="dl-library-footer">
            <button
              className="dl-import-btn"
              onClick={() => photoInputRef.current?.click()}
            >
              Import your own assets
            </button>
            <button
              className={`dl-save-btn ${saved ? 'dl-save-btn--saved' : ''}`}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoUpload}
            />
          </div>
        )}

        {/* Action buttons (shown in editor mode) */}
        {!showLibrary && (
          <div className="dl-actions">
            <button className="dl-reset-btn" onClick={handleReset}>Reset</button>
            <button
              className={`dl-save-btn ${saved ? 'dl-save-btn--saved' : ''}`}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* ── Right Panel: Canvas preview ── */}
      <div className="dl-canvas-wrap">
        <div className="dl-canvas">
          {/* Date stamp */}
          <div className="dl-canvas-date">
            <span>{display.weekday}</span>
            <span>{display.ordinal} {display.month} {display.year}</span>
          </div>

          {/* Uploaded photos as stamps */}
          {photos.map((photo, i) => (
            <div key={photo.id} className="dl-canvas-item" style={{
              top: `${(photo.pos_y || 40) + i * 10}px`,
              left: `${(photo.pos_x || 30) + i * 5}px`,
            }}>
              <StampPhoto
                src={`/${photo.file_path}`}
                alt={photo.original_name}
              />
              <button
                className="dl-canvas-delete"
                onClick={() => handleDeletePhoto(photo.id)}
                title="Remove photo"
              >×</button>
            </div>
          ))}

          {/* Prompt answer rendered like washi tape note */}
          {answerText && dailyPrompt && (
            <div className="dl-canvas-answer">
              <div className="dl-canvas-answer-label">
                {dailyPrompt.prompt_text.split(' ').slice(0, 5).join(' ')}…
              </div>
              <div className="dl-canvas-washi">
                <span className="dl-canvas-answer-text">{answerText}</span>
              </div>
            </div>
          )}

          {/* Stickers */}
          {stickers.map((sticker) => (
            <div
              key={sticker.id}
              className="dl-canvas-sticker"
              style={{
                top: `${sticker.pos_y || 100}px`,
                left: `${sticker.pos_x || 200}px`,
                width: `${sticker.width || 80}px`,
                height: `${sticker.height || 80}px`,
              }}
            >
              <img
                src={`/uploads/${sticker.asset_path}`}
                alt={sticker.asset_name}
                onError={e => { e.target.style.display = 'none'; }}
              />
              <button
                className="dl-canvas-delete"
                onClick={() => handleDeleteSticker(sticker.id)}
                title="Remove sticker"
              >×</button>
            </div>
          ))}

          {/* Empty state hint */}
          {photos.length === 0 && stickers.length === 0 && !answerText && (
            <div className="dl-canvas-empty">
              <p>Your log is empty — add photos, answer the prompt, or place stickers!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
