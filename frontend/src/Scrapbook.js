import React, { useState, useEffect } from 'react';
import './Scrapbook.css';

const API = '/api/scrapbook';

// ── Helpers ────────────────────────────────────────────────────────────────

function formatLogDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDate();
  const s = ['th','st','nd','rd'];
  const v = day % 100;
  const ordinal = day + (s[(v - 20) % 10] || s[v] || s[0]);
  return {
    weekday: d.toLocaleDateString('en-US', { weekday: 'long' }),
    full: `${ordinal} ${d.toLocaleDateString('en-US', { month: 'long' })} ${d.getFullYear()}`,
  };
}

// ── Scrapbook Page (two logs side by side) ─────────────────────────────────

function ScrapbookPage({ leftLog, rightLog }) {
  return (
    <div className="sb-spread">
      {/* Left page */}
      <div className="sb-page sb-page--left">
        {leftLog ? (
          <LogPage log={leftLog} side="left" />
        ) : (
          <div className="sb-page-empty" />
        )}
      </div>

      {/* Spine */}
      <div className="sb-spine" />

      {/* Right page */}
      <div className="sb-page sb-page--right">
        {rightLog ? (
          <LogPage log={rightLog} side="right" />
        ) : (
          <div className="sb-page-empty" />
        )}
      </div>
    </div>
  );
}

// ── Individual log page ────────────────────────────────────────────────────

function LogPage({ log, side }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const display = formatLogDate(log.log_date);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${API}/logs/${log.log_date}`, { credentials: 'include' });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setDetail(data);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [log.log_date]);

  return (
    <div className="sb-log-page">
      {/* Date header */}
      <div className={`sb-date ${side === 'left' ? 'sb-date--left' : 'sb-date--right'}`}>
        <span className="sb-date-weekday">{display.weekday}</span>
        <span className="sb-date-full">{display.full}</span>
      </div>

      {loading && <div className="sb-log-loading">…</div>}

      {!loading && detail && (
        <>
          {/* Photos as stamps */}
          {detail.photos?.map((photo, i) => (
            <div
              key={photo.id}
              className="sb-stamp-wrap"
              style={{
                top: `${(photo.pos_y || 60) + i * 15}px`,
                left: `${(photo.pos_x || (side === 'left' ? 20 : 30)) + i * 10}px`,
              }}
            >
              <WashiTapeDecor index={i} />
              <div className="sb-stamp">
                <img
                  src={`/${photo.file_path}`}
                  alt={photo.original_name || 'memory'}
                />
              </div>
            </div>
          ))}

          {/* Prompt answers */}
          {detail.answers?.map((answer, i) => (
            <div
              key={answer.id}
              className="sb-answer-wrap"
              style={{
                bottom: `${80 + i * 60}px`,
                left: side === 'left' ? '20px' : '15px',
              }}
            >
              <div className="sb-answer-prompt">{answer.prompt_text}:</div>
              <div className="sb-answer-washi">
                <span className="sb-answer-text">{answer.answer_text}</span>
              </div>
            </div>
          ))}

          {/* Stickers */}
          {detail.stickers?.map((sticker) => (
            <div
              key={sticker.id}
              className="sb-sticker"
              style={{
                top: `${sticker.pos_y || 120}px`,
                left: `${sticker.pos_x || 160}px`,
                width: `${sticker.width || 60}px`,
                height: `${sticker.height || 60}px`,
              }}
            >
              <img
                src={`/uploads/${sticker.asset_path}`}
                alt={sticker.asset_name}
                onError={e => { e.target.style.display = 'none'; }}
              />
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ── Decorative washi tape piece ────────────────────────────────────────────

function WashiTapeDecor({ index }) {
  const colors = [
    { bg: '#aad4e8', dots: true },
    { bg: '#e8d4aa', dots: false },
    { bg: '#c8d4aa', dots: false },
  ];
  const c = colors[index % colors.length];
  return (
    <div
      className={`sb-washi-tape ${c.dots ? 'sb-washi-tape--dots' : ''}`}
      style={{ background: c.bg, transform: `rotate(${-5 + (index * 7) % 20}deg)` }}
    />
  );
}

// ── Main Scrapbook Component ───────────────────────────────────────────────

export default function Scrapbook() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageIndex, setPageIndex] = useState(0); // each "page" shows 2 logs

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API}/logs`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load logs');
        const data = await res.json();
        setLogs(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalPages = Math.ceil(logs.length / 2);
  const leftLog = logs[pageIndex * 2] || null;
  const rightLog = logs[pageIndex * 2 + 1] || null;

  const goPrev = () => setPageIndex(p => Math.max(0, p - 1));
  const goNext = () => setPageIndex(p => Math.min(totalPages - 1, p + 1));

  // ── Render ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="sb-loading">
        <span>📖</span>
        <p>Opening your scrapbook…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sb-error">
        <p>⚠️ {error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="sb-empty">
        <span>📖</span>
        <h2>Your scrapbook is empty</h2>
        <p>Head over to Day Log to create your first entry!</p>
      </div>
    );
  }

  return (
    <div className="sb-layout">
      {/* Share button */}
      <div className="sb-toolbar">
        <button className="sb-share-btn">Share</button>
      </div>

      {/* Book spread */}
      <div className="sb-book-wrap">
        <ScrapbookPage leftLog={leftLog} rightLog={rightLog} />
      </div>

      {/* Pagination arrows */}
      <div className="sb-nav">
        <button
          className="sb-arrow sb-arrow--left"
          onClick={goPrev}
          disabled={pageIndex === 0}
          aria-label="Previous page"
        >
          ◀
        </button>
        <span className="sb-page-indicator">
          {pageIndex + 1} / {totalPages}
        </span>
        <button
          className="sb-arrow sb-arrow--right"
          onClick={goNext}
          disabled={pageIndex >= totalPages - 1}
          aria-label="Next page"
        >
          ▶
        </button>
      </div>
    </div>
  );
}
