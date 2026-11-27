import { useState } from 'react'

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
  const favicon = getFavicon(card.url)
  const hostname = getHostname(card.url)

  return (
    <div className="card" onClick={onClick} title="Click to enlarge">
      {/* Card header bar */}
      <div className="card-bar">
        {favicon && <img className="favicon" src={favicon} alt="" />}
        <span className="card-host">{hostname}</span>
        <button
          className="remove-btn"
          onClick={e => { e.stopPropagation(); onRemove(card.id) }}
          title="Remove"
        >✕</button>
      </div>

      {/* iframe preview */}
      <div className="card-preview">
        {!loaded && !error && (
          <div className="card-loading">
            <div className="spinner" />
          </div>
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
          />
        )}
      </div>

      {/* Hover enlarge hint */}
      <div className="card-footer">
        <span className="card-label">{card.label}</span>
        <span className="expand-hint">⤢ Click to expand</span>
      </div>
    </div>
  )
}
