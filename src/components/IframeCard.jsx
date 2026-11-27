import { useState, useRef, useCallback } from 'react'

const MIN_W = 260
const MIN_H = 200
const DEFAULT_W = 320
const DEFAULT_H = 260

function getFavicon(url) {
  try {
    const { hostname } = new URL(url)
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`
  } catch {
    return null
  }
}

function getHostname(url) {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}

export default function IframeCard({ card, onClick, onRemove }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [size, setSize] = useState({ w: DEFAULT_W, h: DEFAULT_H })
  const [resizing, setResizing] = useState(false)
  const cardRef = useRef(null)
  const favicon = getFavicon(card.url)
  const hostname = getHostname(card.url)

  /* ---- Resize via bottom-right corner (mouse + touch) ---- */
  const startResize = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()

    const isTouch = e.type === 'touchstart'
    const startX = isTouch ? e.touches[0].clientX : e.clientX
    const startY = isTouch ? e.touches[0].clientY : e.clientY
    const startW = cardRef.current?.offsetWidth  ?? size.w
    const startH = cardRef.current?.offsetHeight ?? size.h

    setResizing(true)

    const onMove = (ev) => {
      const cx = isTouch ? ev.touches[0].clientX : ev.clientX
      const cy = isTouch ? ev.touches[0].clientY : ev.clientY
      setSize({
        w: Math.max(MIN_W, startW + cx - startX),
        h: Math.max(MIN_H, startH + cy - startY),
      })
    }

    const onUp = () => {
      setResizing(false)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend',  onUp)
    }

    if (isTouch) {
      window.addEventListener('touchmove', onMove, { passive: false })
      window.addEventListener('touchend',  onUp)
    } else {
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup',   onUp)
    }
  }, [size.w, size.h])

  /* iframe is scaled 2× so it renders a full desktop viewport in a small box */
  const previewH = size.h - 72 /* subtract bar + footer heights */

  return (
    <div
      ref={cardRef}
      className={`card${resizing ? ' card--resizing' : ''}`}
      style={{ width: size.w, height: size.h }}
      onClick={!resizing ? onClick : undefined}
      title="Click to enlarge"
    >
      {/* ── Top bar ── */}
      <div className="card-bar">
        {favicon && <img className="favicon" src={favicon} alt="" />}
        <span className="card-host">{hostname}</span>
        <button
          className="remove-btn"
          onClick={e => { e.stopPropagation(); onRemove(card.id) }}
          title="Remove"
        >✕</button>
      </div>

      {/* ── iframe preview ── */}
      <div className="card-preview" style={{ height: previewH }}>
        {!loaded && !error && (
          <div className="card-loading"><div className="spinner" /></div>
        )}
        {error ? (
          <div className="card-error">
            <span>🚫</span>
            <p>Cannot preview this page</p>
            <small>{hostname}</small>
          </div>
        ) : (
          <iframe
            src={card.url}
            title={card.label}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            loading="lazy"
            style={{
              width:  '200%',
              height: '200%',
              transform: 'scale(0.5)',
              transformOrigin: '0 0',
              pointerEvents: 'none',
              border: 'none',
            }}
          />
        )}
      </div>

      {/* ── Footer ── */}
      <div className="card-footer">
        <span className="card-label">{card.label}</span>
        <span className="expand-hint">⤢ Click to expand</span>
      </div>

      {/* ── Resize handles ── */}
      {/* Bottom-right */}
      <div
        className="resize-handle resize-handle--se"
        onMouseDown={startResize}
        onTouchStart={startResize}
        title="Drag to resize"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1 9L9 1M5 9L9 5M9 9V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Bottom-left */}
      <div
        className="resize-handle resize-handle--sw"
        onMouseDown={(e) => {
          e.preventDefault(); e.stopPropagation()
          const startX = e.clientX
          const startW = cardRef.current?.offsetWidth ?? size.w
          const startH = cardRef.current?.offsetHeight ?? size.h
          const startY = e.clientY
          setResizing(true)
          const onMove = (ev) => {
            const dx = ev.clientX - startX
            const dy = ev.clientY - startY
            setSize({
              w: Math.max(MIN_W, startW - dx),
              h: Math.max(MIN_H, startH + dy),
            })
          }
          const onUp = () => {
            setResizing(false)
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
          }
          window.addEventListener('mousemove', onMove)
          window.addEventListener('mouseup', onUp)
        }}
        title="Drag to resize"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: 'scaleX(-1)' }}>
          <path d="M1 9L9 1M5 9L9 5M9 9V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Top-right */}
      <div
        className="resize-handle resize-handle--ne"
        onMouseDown={(e) => {
          e.preventDefault(); e.stopPropagation()
          const startX = e.clientX
          const startY = e.clientY
          const startW = cardRef.current?.offsetWidth ?? size.w
          const startH = cardRef.current?.offsetHeight ?? size.h
          setResizing(true)
          const onMove = (ev) => {
            setSize({
              w: Math.max(MIN_W, startW + ev.clientX - startX),
              h: Math.max(MIN_H, startH - (ev.clientY - startY)),
            })
          }
          const onUp = () => {
            setResizing(false)
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
          }
          window.addEventListener('mousemove', onMove)
          window.addEventListener('mouseup', onUp)
        }}
        title="Drag to resize"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: 'rotate(-90deg)' }}>
          <path d="M1 9L9 1M5 9L9 5M9 9V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Top-left */}
      <div
        className="resize-handle resize-handle--nw"
        onMouseDown={(e) => {
          e.preventDefault(); e.stopPropagation()
          const startX = e.clientX
          const startY = e.clientY
          const startW = cardRef.current?.offsetWidth ?? size.w
          const startH = cardRef.current?.offsetHeight ?? size.h
          setResizing(true)
          const onMove = (ev) => {
            setSize({
              w: Math.max(MIN_W, startW - (ev.clientX - startX)),
              h: Math.max(MIN_H, startH - (ev.clientY - startY)),
            })
          }
          const onUp = () => {
            setResizing(false)
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
          }
          window.addEventListener('mousemove', onMove)
          window.addEventListener('mouseup', onUp)
        }}
        title="Drag to resize"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: 'rotate(180deg)' }}>
          <path d="M1 9L9 1M5 9L9 5M9 9V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Size badge shown while resizing */}
      {resizing && (
        <div className="size-badge">{Math.round(size.w)} × {Math.round(size.h)}</div>
      )}
    </div>
  )
}
