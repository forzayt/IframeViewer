import { useState, useCallback } from 'react'
import IframeCard from './components/IframeCard'
import './App.css'

function normalizeUrl(raw) {
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return 'https://' + trimmed
}

function App() {
  const [inputValue, setInputValue] = useState('')
  const [cards, setCards] = useState([])

  const handleAdd = useCallback(() => {
    const url = normalizeUrl(inputValue)
    if (!url) return
    const id = Date.now()
    setCards(prev => [{ id, url, label: inputValue.trim() }, ...prev])
    setInputValue('')
  }, [inputValue])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd()
  }

  const handleRemove = useCallback((id) => {
    setCards(prev => prev.filter(c => c.id !== id))
  }, [])

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">⬡</span>
            <span className="logo-text">IFrame<span className="logo-accent">Viewer</span></span>
          </div>
          <div className="input-row">
            <input
              className="url-input"
              type="text"
              placeholder="Paste a URL and press Enter…"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button className="add-btn" onClick={handleAdd}>
              <span className="add-icon">+</span> Add
            </button>
          </div>
        </div>
      </header>

      {/* Main grid */}
      <main className="main">
        {cards.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🌐</div>
            <p className="empty-title">No pages yet</p>
            <p className="empty-sub">Paste a URL above and hit <kbd>Enter</kbd> to add your first card.</p>
          </div>
        ) : (
          <div className="grid">
            {cards.map(card => (
              <IframeCard
                key={card.id}
                card={card}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
