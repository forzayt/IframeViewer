import { useEffect, useState } from 'react'

function getHostname(url) {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}

export default function Modal({ card, onClose }) {
  const [loaded, setLoaded] = useState(false)
  const hostname = getHostname(card.url)

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {/* Modal header */}
        <div className="modal-header">
          <div className="modal-title">
            <span className="modal-dot" />
            <span>{hostname}</span>
          </div>
          <div className="modal-actions">
            <a
              className="modal-open-link"
              href={card.url}
              target="_blank"
              rel="noopener noreferrer"
              title="Open in new tab"
            >
              ↗ Open
            </a>
            <button className="modal-close" onClick={onClose} title="Close (Esc)">✕</button>
          </div>
        </div>

        {/* iframe */}
        <div className="modal-body">
          {!loaded && (
            <div className="modal-loading">
              <div className="spinner large" />
              <p>Loading {hostname}…</p>
            </div>
          )}
          <iframe
            src={card.url}
            title={card.label}
            onLoad={() => setLoaded(true)}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            style={{ opacity: loaded ? 1 : 0 }}
          />
        </div>

        {/* URL bar */}
        <div className="modal-footer">
          <span className="modal-url">{card.url}</span>
          <span className="modal-esc-hint">Press <kbd>Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  )
}
