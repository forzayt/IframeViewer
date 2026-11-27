import { useState, useEffect, useCallback, useRef } from 'react'
import IframeCard from './components/IframeCard'
import './App.css'

const STORAGE_KEY = 'iframeviewer_cards'
const DEFAULT_SIZE = { w: 320, h: 260 }

function normalizeUrl(raw) {
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return 'https://' + trimmed
}

// Ensure legacy saved cards get a default size
function hydrate(raw) {
  try {
    const arr = JSON.parse(raw)
    return Array.isArray(arr)
      ? arr.map(c => ({ ...c, size: c.size ?? DEFAULT_SIZE }))
      : []
  } catch {
    return []
  }
}

function App() {
  const [inputValue, setInputValue] = useState('')
  const [cards, setCards] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? hydrate(saved) : []
  })

  // Drag-drop state (kept in refs to avoid re-renders mid-drag)
  const dragId   = useRef(null)
  const [overId, setOverId] = useState(null)

  // Persist cards (order + sizes) to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards))
  }, [cards])

  /* ── CRUD ── */
  const handleAdd = useCallback(() => {
    const url = normalizeUrl(inputValue)
    if (!url) return
    setCards(prev => [{ id: Date.now(), url, label: inputValue.trim(), size: DEFAULT_SIZE }, ...prev])
    setInputValue('')
  }, [inputValue])

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleAdd() }

  const handleRemove = useCallback((id) => {
    setCards(prev => prev.filter(c => c.id !== id))
  }, [])

  /* ── Resize: lifted so size is stored in cards array ── */
  const handleResize = useCallback((id, size) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, size } : c))
  }, [])

  /* ── Drag & Drop ── */
  const handleDragStart = useCallback((id) => {
    dragId.current = id
  }, [])

  const handleDragOver = useCallback((id) => {
    if (dragId.current !== null && id !== dragId.current) setOverId(id)
  }, [])

  const handleDrop = useCallback((targetId) => {
    const src = dragId.current
    if (!src || src === targetId) { dragId.current = null; setOverId(null); return }
    setCards(prev => {
      const arr = [...prev]
      const from = arr.findIndex(c => c.id === src)
      const to   = arr.findIndex(c => c.id === targetId)
      if (from === -1 || to === -1) return prev
      const [item] = arr.splice(from, 1)
      arr.splice(to, 0, item)
      return arr
    })
    dragId.current = null
    setOverId(null)
  }, [])

  const handleDragEnd = useCallback(() => {
    dragId.current = null
    setOverId(null)
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
                onResize={handleResize}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                isDragging={dragId.current === card.id}
                isOver={overId === card.id}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
