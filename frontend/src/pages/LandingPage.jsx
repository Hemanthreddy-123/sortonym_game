import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'

import userAvatar from '../assets/user_avatar.png'
import '../styles/landing.css'
import { useTheme } from '../hooks/useTheme'

function LandingPage() {
  const navigate = useNavigate()
  const { member, signOut, updateMember } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(member?.name || '')

  // Theme Toggle Logic
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const menuRef = useRef(null)



  useEffect(() => {
    function onDocMouseDown(e) {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [])

  async function onLogout() {
    await signOut()
    navigate('/auth')
  }

  function handleEditToggle() {
    if (isEditing) {
      updateMember({ name: editName })
      setIsEditing(false)
    } else {
      setEditName(member?.name || '')
      setIsEditing(true)
    }
  }

  function handleCancelEdit() {
    setIsEditing(false)
    setEditName(member?.name || '')
  }

  return (
    <div className="landing-shell">
      <div className="bg-pattern"></div>

      <header className="landing-topbar">
        <div className="landing-container">
          <div className="topbar-inner">
            <div className="topbar-brand">
              <div className="brand-logo-img">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="32" height="32" rx="8" fill="#00A63F" />
                  <path d="M16 8L24 16L16 24L8 16L16 8Z" fill="white" />
                </svg>
              </div>
              <span className="topbar-logo-text">Sortonym Challenge</span>
            </div>

            <div className="topbar-right">
              <button
                className="theme-toggle-btn"
                onClick={toggleTheme}
                aria-label="Toggle Theme"
              >
                {theme === 'light' ? <i className="bi bi-moon"></i> : <i className="bi bi-sun-fill"></i>}
              </button>

              <div className="dropdown" ref={menuRef}>
                <button
                  className="landing-userbtn"
                  type="button"
                  aria-expanded={menuOpen}
                  onClick={() => {
                    setMenuOpen((v) => !v)
                    setIsEditing(false)
                  }}
                >
                  <img src={userAvatar} alt="User" className="user-avatar-img" />
                </button>

                <ul className={`dropdown-menu dropdown-menu-end landing-dropdown${menuOpen ? ' show' : ''}`}>
                  <li className="px-3 pt-2 pb-1">
                    <div className="landing-user-info">
                      <div className="user-info-icon">
                        <i className="bi bi-person" />
                      </div>
                      <div className="user-info-details">
                        {isEditing ? (
                          <div className="edit-name-group">
                            <input
                              type="text"
                              className="form-control form-control-sm mb-1"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              autoFocus
                            />
                            <div className="edit-actions">
                              <button className="btn btn-primary btn-sm" onClick={handleEditToggle}>Save</button>
                              <button className="btn btn-secondary btn-sm" onClick={handleCancelEdit}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="name-display-group">
                            <div className="landing-username">
                              {member?.name || '--'}
                              <button className="btn-edit-small" onClick={handleEditToggle}>
                                <i className="bi bi-pencil" />
                              </button>
                            </div>
                          </div>
                        )}
                        <div className="landing-userdetail">{member?.email || '--'}</div>
                      </div>
                    </div>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li className="px-3 pb-2">
                    <button className="btn btn-secondary w-100 btn-logout" onClick={onLogout}>
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="landing-center">
        {/* --- Hero Section --- */}
        <div className="landing-container">
          <section className="hero-section">
            <div className="hero-badge">
              <i className="bi bi-lightning-charge"></i> Fast-Paced Word Challenge
            </div>

            <h1 className="landing-title">
              Master Your <span className="text-highlight">Vocabulary</span>
            </h1>

            <p className="landing-subtitle">
              Sort synonyms and antonyms against the clock in this fast-paced word challenge.
              Test your skills and climb the leaderboard!
            </p>

            <div className="landing-actions">
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/game')}>
                <i className="bi bi-play-fill me-2"></i> START CHALLENGE
              </button>
              <button className="btn btn-outline-green btn-lg" onClick={() => navigate('/leaderboard')}>
                <i className="bi bi-trophy me-2"></i> LEADERBOARD
              </button>
            </div>

            <div className="hero-stats">
              <div className="stat-card">
                <span className="stat-value">10K+</span>
                <span className="stat-label">Players</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">50K+</span>
                <span className="stat-label">Words</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">99%</span>
                <span className="stat-label">Fun Rate</span>
              </div>
            </div>
          </section>
        </div>

        {/* --- Protocol Section (Full Width Outer) --- */}
        <div className="protocol-bg-outer">
          <div className="landing-container">
            <section className="protocol-section">
              <div className="section-header">
                <h2>Game Protocol</h2>
                <p className="section-subtitle">Four simple steps to vocabulary mastery</p>
              </div>

              <div className="protocol-grid">
                <div className="protocol-card">
                  <div className="card-top">
                    <div className="card-icon"><i className="bi bi-eye"></i></div>
                    <span className="bg-number">1</span>
                  </div>
                  <h3>Observe</h3>
                  <p>Study the target word and the options available.</p>
                </div>

                <div className="protocol-card">
                  <div className="card-top">
                    <div className="card-icon"><i className="bi bi-bullseye"></i></div>
                    <span className="bg-number">2</span>
                  </div>
                  <h3>Classify</h3>
                  <p>Drag options to Synonym or Antonym boxes.</p>
                </div>

                <div className="protocol-card">
                  <div className="card-top">
                    <div className="card-icon"><i className="bi bi-lightning"></i></div>
                    <span className="bg-number">3</span>
                  </div>
                  <h3>Acceleration</h3>
                  <p>Maintain speed to maximize your bonus points.</p>
                </div>

                <div className="protocol-card">
                  <div className="card-top">
                    <div className="card-icon"><i className="bi bi-graph-up-arrow"></i></div>
                    <span className="bg-number">4</span>
                  </div>
                  <h3>Ascend</h3>
                  <p>Climb the ranks and validate your expertise.</p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* --- Benefits & CTA --- */}
        <div className="landing-container">
          <section className="benefits-section">
            <div className="benefits-grid">
              <div className="benefit-card">
                <div className="benefit-icon-box"><i className="bi bi-lightning-charge"></i></div>
                <h3>Lightning Fast</h3>
                <p>Quick rounds keep you engaged and test your reflexes along with vocabulary.</p>
              </div>

              <div className="benefit-card">
                <div className="benefit-icon-box"><i className="bi bi-trophy"></i></div>
                <h3>Competitive Rankings</h3>
                <p>Climb the global leaderboard and prove your vocabulary mastery.</p>
              </div>

              <div className="benefit-card">
                <div className="benefit-icon-box"><i className="bi bi-bullseye"></i></div>
                <h3>Skill Building</h3>
                <p>Expand your vocabulary while having fun with challenging word combinations.</p>
              </div>
            </div>
          </section>

          <section className="cta-section">
            <div className="cta-card">
              <h2>Ready to Challenge Yourself?</h2>
              <p>Join thousands of players improving their vocabulary skills</p>
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/game')}>
                <i className="bi bi-play-fill me-2"></i> Start Playing Now
              </button>
            </div>
          </section>

          <footer className="landing-footer">
            <p>© 2026 Sortonym Challenge. Master your vocabulary, one word at a time.</p>
          </footer>
        </div>
      </main>
    </div>
  )
}

export default LandingPage;
