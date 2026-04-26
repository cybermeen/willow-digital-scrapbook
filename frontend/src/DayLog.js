import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Rnd } from 'react-rnd';
import './DayLog.css';

const API = '/api/scrapbook';

// ── Helpers ────────────────────────────────────────────────────────────────

const PROMPT_TYPES = [
  { value: 'short',      label: 'Short and sweet' },
  { value: 'reflective', label: 'Reflective' },
  { value: 'creative',   label: 'Creative' },
];

function formatDisplayDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return {
    weekday: d.toLocaleDateString('en-US', { weekday: 'long' }),
    full:    d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
    ordinal: (() => {
      const day = d.getDate();
      const s = ['th','st','nd','rd'];
      const v = day % 100;
      return day + (s[(v - 20) % 10] || s[v] || s[0]);
    })(),
    month: d.toLocaleDateString('en-US', { month: 'long' }),
    year:  d.getFullYear(),
  };
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function StampPhoto({ src, alt, style }) {
  return (
    <div className="stamp-photo" style={style}>
      <img src={src} alt={alt || 'log photo'} />
      </div>
  );
}

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Shared Rnd style ───────────────────────────────────────────────────────
// No position:absolute on the inner child — Rnd handles all positioning.
const RND_HANDLE_STYLES = {
  topLeft:     { width: 12, height: 12, left: -6,  top: -6,  background: '#fff', border: '2px solid #aad4e8', borderRadius: '50%', zIndex: 20 },
  topRight:    { width: 12, height: 12, right: -6, top: -6,  background: '#fff', border: '2px solid #aad4e8', borderRadius: '50%', zIndex: 20 },
  bottomLeft:  { width: 12, height: 12, left: -6,  bottom: -6, background: '#fff', border: '2px solid #aad4e8', borderRadius: '50%', zIndex: 20 },
  bottomRight: { width: 12, height: 12, right: -6, bottom: -6, background: '#fff', border: '2px solid #aad4e8', borderRadius: '50%', zIndex: 20 },
};

const ENABLE_CORNERS = { topLeft: true, topRight: true, bottomLeft: true, bottomRight: true };


// ── Main Component ─────────────────────────────────────────────────────────

export default function DayLog({ user }) {
  const date    = todayStr();
  const display = formatDisplayDate(date);

  // Log & content state
  const [log,      setLog]      = useState(null);
  const [photos,   setPhotos]   = useState([]);
  const [videos,   setVideos]   = useState([]);
  const [audio,    setAudio]    = useState([]);
  const [answers,  setAnswers]  = useState([]);
  const [stickers, setStickers] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  // Daily prompt
  const [dailyPrompt,  setDailyPrompt]  = useState(null);
  const [promptType,   setPromptType]   = useState('short');
  const [answerText,   setAnswerText]   = useState('');
  const [savingAnswer, setSavingAnswer] = useState(false);

  // Upload states
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  // File input refs
  const photoInputRef = useRef();
  const videoInputRef = useRef();
  const audioInputRef = useRef();

  // Magic Library
  const [showLibrary,   setShowLibrary]   = useState(false);
  const [assets,        setAssets]        = useState([]);
  const [assetsLoading, setAssetsLoading] = useState(false);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  // Track which item is being hovered (to show handles)
  const [hoveredId, setHoveredId] = useState(null);

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
        setPhotos(logData.photos   || []);
        setVideos(logData.videos   || []);
        setAudio(logData.audio     || []);
        setStickers(logData.stickers || []);
        setAnswers(logData.answers   || []);
        if (logData.answers?.length > 0) {
          setAnswerText(logData.answers[0].answer_text || '');
        }
        if (promptRes.ok) setDailyPrompt(await promptRes.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [date]);

  // ── Art assets ─────────────────────────────────────────────────────────

  const loadAssets = useCallback(async () => {
    if (assets.length > 0) return;
    setAssetsLoading(true);
    try {
      const res = await fetch(`${API}/assets`, { credentials: 'include' });
      if (res.ok) setAssets(await res.json());
    } finally {
      setAssetsLoading(false);
    }
  }, [assets.length]);

  const openLibrary = () => { setShowLibrary(true); loadAssets(); };

  // ── Photo upload ────────────────────────────────────────────────────────

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !log) return;
    setUploadingPhoto(true);
    try {
      const form = new FormData();
      form.append('photo', file);
      const res = await fetch(`${API}/photos/${log.id}`, {
        method: 'POST', credentials: 'include', body: form,
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
      await fetch(`${API}/photos/${photoId}`, { method: 'DELETE', credentials: 'include' });
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      setSaved(false);
    } catch (err) { console.error('Delete photo error:', err); }
  };

  // ── Video upload ────────────────────────────────────────────────────────

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !log) return;
    setUploadingVideo(true);
    try {
      const form = new FormData();
      form.append('video', file);
      const res = await fetch(`${API}/videos/${log.id}`, {
        method: 'POST', credentials: 'include', body: form,
      });
      if (res.ok) {
        const newVideo = await res.json();
        setVideos(prev => [...prev, newVideo]);
        setSaved(false);
      } else {
        const err = await res.json();
        alert(err.error || 'Video upload failed');
      }
    } finally {
      setUploadingVideo(false);
      e.target.value = '';
    }
  };

  const handleDeleteVideo = async (videoId) => {
    try {
      await fetch(`${API}/videos/${videoId}`, { method: 'DELETE', credentials: 'include' });
      setVideos(prev => prev.filter(v => v.id !== videoId));
      setSaved(false);
    } catch (err) { console.error('Delete video error:', err); }
  };

  // ── Audio upload ────────────────────────────────────────────────────────

  const handleAudioUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !log) return;
    setUploadingAudio(true);
    try {
      const form = new FormData();
      form.append('audio', file);
      const res = await fetch(`${API}/audio/${log.id}`, {
        method: 'POST', credentials: 'include', body: form,
      });
      if (res.ok) {
        const newAudio = await res.json();
        setAudio(prev => [...prev, newAudio]);
        setSaved(false);
      } else {
        const err = await res.json();
        alert(err.error || 'Audio upload failed');
      }
    } finally {
      setUploadingAudio(false);
      e.target.value = '';
    }
  };

  const handleDeleteAudio = async (audioId) => {
    try {
      await fetch(`${API}/audio/${audioId}`, { method: 'DELETE', credentials: 'include' });
      setAudio(prev => prev.filter(a => a.id !== audioId));
      setSaved(false);
    } catch (err) { console.error('Delete audio error:', err); }
  };

  // ── Stickers ────────────────────────────────────────────────────────────

  const handlePlaceSticker = async (asset) => {
    if (!log) return;
    try {
      const res = await fetch(`${API}/stickers/${log.id}`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: asset.id,
          pos_x: Math.floor(Math.random() * 300) + 50,
          pos_y: Math.floor(Math.random() * 300) + 50,
          width: 80, height: 80,
        }),
      });
      if (res.ok) {
        const newSticker = await res.json();
        setStickers(prev => [...prev, { ...newSticker, asset_path: asset.file_path, asset_name: asset.name }]);
        setSaved(false);
      }
    } catch (err) { console.error('Place sticker error:', err); }
    setShowLibrary(false);
  };

  const handleDeleteSticker = async (stickerId) => {
    try {
      await fetch(`${API}/stickers/${stickerId}`, { method: 'DELETE', credentials: 'include' });
      setStickers(prev => prev.filter(s => s.id !== stickerId));
      setSaved(false);
    } catch (err) { console.error('Delete sticker error:', err); }
  };

  // ── Prompt answer ───────────────────────────────────────────────────────

  const handleSaveAnswer = async () => {
    if (!log || !dailyPrompt || !answerText.trim()) return;
    setSavingAnswer(true);
    try {
      const existing = answers[0];
      if (existing) {
        const res = await fetch(`${API}/prompts/answer/${existing.id}`, {
          method: 'PATCH', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answer_text: answerText }),
        });
        if (res.ok) setAnswers([await res.json()]);
      } else {
        const res = await fetch(`${API}/prompts/answer/${log.id}`, {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt_id: dailyPrompt.id, answer_text: answerText }),
        });
        if (res.ok) setAnswers([await res.json()]);
      }
    } finally { setSavingAnswer(false); }
  };

  // ── Save & Reset ─────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!log) return;
    setSaving(true);
    try {
      await handleSaveAnswer();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally { setSaving(false); }
  };

  const handleReset = () => {
    setAnswerText('');
    setSaved(false);
  };

  // ── Render ──────────────────────────────────────────────────────────────

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
          <div className="dl-editor">
            {/* Prompt type selector */}
            <div className="dl-field-group">
              <label className="dl-label">Choose prompt type:</label>
              <div className="dl-select-wrap">
                <select className="dl-select" value={promptType} onChange={e => setPromptType(e.target.value)}>
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
                {/* Image */}
                <button
                  className="dl-add-btn"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  title="Upload an image"
                >
                  {uploadingPhoto ? '…' : '🖼 Image'}
                </button>

                {/* Video */}
                <button
                  className="dl-add-btn"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={uploadingVideo}
                  title="Upload a video (MP4, MOV, WebM — max 200MB)"
                >
                  {uploadingVideo ? '⏳ Uploading…' : '🎬 Video'}
                </button>

                {/* Audio */}
                <button
                  className="dl-add-btn"
                  onClick={() => audioInputRef.current?.click()}
                  disabled={uploadingAudio}
                  title="Upload audio (MP3, WAV, AAC — max 50MB)"
                >
                  {uploadingAudio ? '⏳ Uploading…' : '🎵 Audio'}
                </button>
              </div>

              {/* Hidden file inputs */}
              <input ref={photoInputRef} type="file" accept="image/*"
                style={{ display: 'none' }} onChange={handlePhotoUpload} />
              <input ref={videoInputRef} type="file"
                accept="video/mp4,video/quicktime,video/webm,video/x-msvideo,video/mpeg"
                style={{ display: 'none' }} onChange={handleVideoUpload} />
              <input ref={audioInputRef} type="file"
                accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/aac,audio/x-m4a"
                style={{ display: 'none' }} onChange={handleAudioUpload} />
            </div>

            {/* Open Magic Library */}
            <button className="dl-library-btn" onClick={openLibrary}>
              Open Magic Library
            </button>
          </div>
        ) : (
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
                <button key={asset.id} className="dl-asset-btn" onClick={() => handlePlaceSticker(asset)} title={asset.name}>
                  <img src={`/uploads/${asset.file_path}`} alt={asset.name}
                    onError={e => { e.target.style.display = 'none'; }} />
                </button>
              ))}
            </div>
            <button className="dl-library-back" onClick={() => setShowLibrary(false)}>◀</button>
          </div>
        )}

        {showLibrary && (
          <div className="dl-library-footer">
            <button className="dl-import-btn" onClick={() => photoInputRef.current?.click()}>
              Import your own assets
            </button>
            <button className={`dl-save-btn ${saved ? 'dl-save-btn--saved' : ''}`} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
            </button>
            <input ref={photoInputRef} type="file" accept="image/*"
              style={{ display: 'none' }} onChange={handlePhotoUpload} />
          </div>
        )}

        {!showLibrary && (
          <div className="dl-actions">
            <button className="dl-reset-btn" onClick={handleReset}>Reset</button>
            <button className={`dl-save-btn ${saved ? 'dl-save-btn--saved' : ''}`} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* ── Right Panel: Canvas ── */}
      <div className="dl-canvas-wrap">
        <div className="dl-canvas">
          {/* Date stamp */}
          <div className="dl-canvas-date">
            <span>{display.weekday}</span>
            <span>{display.ordinal} {display.month} {display.year}</span>
          </div>


          {/* Photos */}
          {photos.map((photo, i) => (
            <div key={photo.id} className="dl-canvas-item" style={{
              top: `${(photo.pos_y || 40) + i * 10}px`,
              left: `${(photo.pos_x || 30) + i * 5}px`,
            }}>
              <StampPhoto src={`/${photo.file_path}`} alt={photo.original_name} />
              <button className="dl-canvas-delete" onClick={() => handleDeletePhoto(photo.id)} title="Remove photo">×</button>
            </div>
          ))}

          {/* Videos */}
          {videos.map((video, i) => (
            <div key={video.id} className="dl-canvas-item dl-canvas-item--video" style={{
              top: `${(video.pos_y || 40) + i * 15}px`,
              left: `${(video.pos_x || 30) + i * 5}px`,
            }}>
              <div className="dl-video-wrap">
                <video
                  src={`/${video.file_path}`}
                  controls
                  preload="metadata"
                  className="dl-video-player"
                >
                  Your browser does not support video.
                </video>
                <div className="dl-media-label">
                  🎬 {video.original_name}
                  <span className="dl-media-size">{formatFileSize(video.file_size)}</span>
                </div>
              </div>
              <button className="dl-canvas-delete" onClick={() => handleDeleteVideo(video.id)} title="Remove video">×</button>
            </div>
          ))}

          {/* Audio */}
          {audio.map((track, i) => (
            <div key={track.id} className="dl-canvas-item dl-canvas-item--audio" style={{
              top: `${(track.pos_y || 200) + i * 80}px`,
              left: `${(track.pos_x || 30) + i * 5}px`,
            }}>
              <div className="dl-audio-wrap">
                <div className="dl-audio-header">
                  <span className="dl-audio-icon">🎵</span>
                  <span className="dl-audio-name">{track.original_name}</span>
                  <span className="dl-media-size">{formatFileSize(track.file_size)}</span>
                </div>
                <audio
                  src={`/${track.file_path}`}
                  controls
                  preload="metadata"
                  className="dl-audio-player"
                >
                  Your browser does not support audio.
                </audio>
              </div>
              <button className="dl-canvas-delete" onClick={() => handleDeleteAudio(track.id)} title="Remove audio">×</button>
            </div>
          ))}

          {/* Prompt answer */}
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

          {/* Uploaded photos as stamps */}
          {photos.map((photo, i) => {
            // Rendered in LogPage for drag/resize, but could also show a static preview here if desired
            const isHovered = hoveredId === `photo-${photo.id}`;
            return (
              <Rnd
                key={photo.id}
                size={{ width: photo.width || 200, height: photo.height || 200 }}
                position={{ x: photo.pos_x || 30, y: photo.pos_y || 40 }}
                onDragStop={(e, d) => {
                  setPhotos(prev => prev.map((p, idx) =>
                    idx === i ? { ...p, pos_x: d.x, pos_y: d.y } : p
                  ));
                  setSaved(false);
                }}
                onResizeStop={(e, direction, ref, delta, position) => {
                  setPhotos(prev => prev.map((p, idx) =>
                    idx === i ? {
                      ...p,
                      width: parseInt(ref.style.width),
                      height: parseInt(ref.style.height),
                      pos_x: position.x,
                      pos_y: position.y,
                    } : p
                  ));
                  setSaved(false);
                }}
                bounds="parent"
                enableResizing={ENABLE_CORNERS}
                resizeHandleStyles={RND_HANDLE_STYLES}
                // Only show handles on hover via inline style toggle
                resizeHandleComponent={isHovered ? undefined : {
                  topLeft: <div style={{ display: 'none' }} />,
                  topRight: <div style={{ display: 'none' }} />,
                  bottomLeft: <div style={{ display: 'none' }} />,
                  bottomRight: <div style={{ display: 'none' }} />,
                }}
                minWidth={80}
                minHeight={80}
                style={{ cursor: 'move' }}
              >
                {/*
                  KEY FIX: This wrapper must NOT have position:absolute,
                  must fill 100% of the Rnd box, and must use pointerEvents:none
                  on non-interactive children so Rnd receives all mouse events.
                */}
                <div
                  className="dl-rnd-item"
                  onMouseEnter={() => setHoveredId(`photo-${photo.id}`)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    transform: `rotate(${photo.rotation || 0}deg)`,
                  }}
                >
                  {/* pointerEvents:none so the img doesn't steal drag events */}
                  <div style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
                    <StampPhoto
                      src={`/${photo.file_path}`}
                      alt={photo.original_name}
                    />
                  </div>
                  <button
                    className="dl-canvas-delete"
                    style={{ opacity: isHovered ? 1 : 0 }}
                    onMouseDown={e => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePhoto(photo.id);
                    }}
                  >×</button>
                </div>
              </Rnd>
            );
        })}

          {/* Prompt answer rendered like washi tape note */}
          {answerText && dailyPrompt && (() => {
            const ans = answers[0];
            const isHovered = hoveredId === 'answer-0';
            return (
              <Rnd
                key="answer-rnd"
                size={{ width: ans?.width || 260, height: ans?.height || 120 }}
                position={{ x: ans?.pos_x ?? 50, y: ans?.pos_y ?? 300 }}
                onDragStop={(e, d) => {
                  setAnswers(prev => {
                    const updated = [...prev];
                    if (!updated[0]) updated[0] = { pos_x: d.x, pos_y: d.y, width: 260, height: 120 };
                    else updated[0] = { ...updated[0], pos_x: d.x, pos_y: d.y };
                    return updated;
                  });
                  setSaved(false);
                }}
                onResizeStop={(e, direction, ref, delta, position) => {
                  setAnswers(prev => {
                    const updated = [...prev];
                    const entry = updated[0] || {};
                    updated[0] = {
                      ...entry,
                      pos_x: position.x,
                      pos_y: position.y,
                      width: parseInt(ref.style.width),
                      height: parseInt(ref.style.height),
                    };
                    return updated;
                  });
                  setSaved(false);
                }}
                bounds="parent"
                enableResizing={ENABLE_CORNERS}
                resizeHandleStyles={RND_HANDLE_STYLES}
                resizeHandleComponent={isHovered ? undefined : {
                  topLeft: <div style={{ display: 'none' }} />,
                  topRight: <div style={{ display: 'none' }} />,
                  bottomLeft: <div style={{ display: 'none' }} />,
                  bottomRight: <div style={{ display: 'none' }} />,
                }}
                minWidth={150}
                minHeight={60}
                style={{ cursor: 'move' }}
              >
                {/*
                  KEY FIX for text: No position:absolute here.
                  The washi note fills the Rnd box completely.
                  Text uses pointerEvents:none so drag works.
                */}
                <div
                  className="dl-rnd-item dl-rnd-answer"
                  onMouseEnter={() => setHoveredId('answer-0')}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    padding: '0.5rem 0.75rem',
                    boxSizing: 'border-box',
                  }}
                >
                  <div
                    className="dl-canvas-answer-label"
                    style={{ pointerEvents: 'none', flexShrink: 0 }}
                  >
                    {dailyPrompt.prompt_text.split(' ').slice(0, 5).join(' ')}…
                  </div>
                  <div
                    className="dl-canvas-washi"
                    style={{ flex: 1, overflow: 'hidden', pointerEvents: 'none' }}
                  >
                    <span className="dl-canvas-answer-text">{answerText}</span>
                  </div>
                </div>
              </Rnd>
            );
          })()}


          {/* Stickers */}
          {stickers.map(sticker => (
            <div key={sticker.id} className="dl-canvas-sticker" style={{
              top: `${sticker.pos_y || 100}px`,
              left: `${sticker.pos_x || 200}px`,
              width: `${sticker.width || 80}px`,
              height: `${sticker.height || 80}px`,
            }}>
              <img src={`/uploads/${sticker.asset_path}`} alt={sticker.asset_name}
                onError={e => { e.target.style.display = 'none'; }} />
              <button className="dl-canvas-delete" onClick={() => handleDeleteSticker(sticker.id)} title="Remove sticker">×</button>
            </div>
          ))}

          {/* Empty state */}
          {photos.length === 0 && videos.length === 0 && audio.length === 0 && stickers.length === 0 && !answerText && (
            <div className="dl-canvas-empty">
              <p>Your log is empty — add photos, videos, audio, answer the prompt, or place stickers!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
