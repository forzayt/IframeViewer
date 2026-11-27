import { useState, useRef, useCallback } from 'react'

const MIN_W = 260
const MIN_H = 200

function getFavicon(url) {
  try {
    const { hostname } = new URL(url)
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`
  } catch { return null }
}

function getHostname(url) {
  try { return new URL(url).hostname.replace('www.', '') }
  catch { return url }
}

export default function IframeCard({
  card,
  onRemove,
  onResize,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
  isOver,
}) {
  const [loaded, setLoaded]   = useState(false)
  const [error, setError]     = useState(false)
  const [resizing, setResizing] = useState(false)
  const cardRef = useRef(null)

  const { size } = card          // { w, h } lives in App state
  const favicon  = getFavicon(card.url)
  const hostname = getHostname(card.url)

  /* ── Generic corner resize factory ── */
  const makeResizeHandler = useCallback((corner) => (e) => {
    e.preventDefault()
    e.stopPropagation()

    const isTouch = e.type === 'touchstart'
    const startX  = isTouch ? e.touches[0].clientX : e.clientX
    const startY  = isTouch ? e.touches[0].clientY : e.clientY
    const startW  = cardRef.current?.offsetWidth  ?? size.w
    const startH  = cardRef.current?.offsetHeight ?? size.h

    setResizing(true)

    const onMove = (ev) => {
      const cx = isTouch ? ev.touches[0].clientX : ev.clientX
      const cy = isTouch ? ev.touches[0].clientY : ev.clientY
      const dx = cx - startX
      const dy = cy - startY

      let newW = startW, newH = startH
      if (corner.includes('e')) newW = startW + dx
      if (corner.includes('w')) newW = startW - dx
      if (corner.includes('s')) newH = startH + dy
      if (corner.includes('n')) newH = startH - dy

      onResize(card.id, {
        w: Math.max(MIN_W, newW),
        h: Math.max(MIN_H, newH),
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
  }, [card.id, size.w, size.h, onResize])

  const previewH = size.h - 72  // card height minus bar + footer

  /* ── Class list ── */
  const cls = [
    'card',
    resizing  ? 'card--resizing'  : '',
    isDragging ? 'card--dragging'  : '',
    isOver     ? 'card--drag-over' : '',
  ].filter(Boolean).join(' ')

  return (
    <div
      ref={cardRef}
      className={cls}
      style={{ width: size.w, height: size.h }}
      onDragOver={(e) => { e.preventDefault(); onDragOver(card.id) }}
      onDrop={(e)     => { e.preventDefault(); onDrop(card.id) }}
      onDragEnd={onDragEnd}
    >
      {/* ── Top bar (drag handle lives here) ── */}
      <div className="card-bar">
        {/* Grip — only this element initiates drag */}
        <div
          className="drag-grip"
          draggable="true"
          onDragStart={(e) => {
            e.stopPropagation()
            // ghost image
            e.dataTransfer.effectAllowed = 'move'
            onDragStart(card.id)
          }}
          title="Drag to reorder"
        >
          <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
            <circle cx="4" cy="3"  r="1.4"/>
            <circle cx="8" cy="3"  r="1.4"/>
            <circle cx="4" cy="8"  r="1.4"/>
            <circle cx="8" cy="8"  r="1.4"/>
            <circle cx="4" cy="13" r="1.4"/>
            <circle cx="8" cy="13" r="1.4"/>
          </svg>
        </div>

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
              width: '200%', height: '200%',
              transform: 'scale(0.5)', transformOrigin: '0 0',
              pointerEvents: 'none', border: 'none',
            }}
          />
        )}
      </div>

      {/* ── Footer ── */}
      <div className="card-footer">
        <span className="card-label">{card.label}</span>
      </div>

      {/* ── 4-corner resize handles ── */}
      {['se','sw','ne','nw'].map(corner => (
        <div
          key={corner}
          className={`resize-handle resize-handle--${corner}`}
          onMouseDown={makeResizeHandler(corner)}
          onTouchStart={makeResizeHandler(corner)}
          title="Drag to resize"
        >
          <svg
            width="10" height="10" viewBox="0 0 10 10" fill="none"
            style={{
              transform: { se:'none', sw:'scaleX(-1)', ne:'rotate(-90deg)', nw:'rotate(180deg)' }[corner]
            }}
          >
            <path d="M1 9L9 1M5 9L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      ))}

      {/* ── Size badge while resizing ── */}
      {resizing && (
        <div className="size-badge">{Math.round(size.w)} × {Math.round(size.h)}</div>
      )}
    </div>
  )
}
