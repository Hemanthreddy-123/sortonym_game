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

  /* DAILY CHALLENGE STATES */
  const [showDailyPopup, setShowDailyPopup] = useState(false)
  const [showConfirmDailyModal, setShowConfirmDailyModal] = useState(false)
  const [showAlreadyPlayedModal, setShowAlreadyPlayedModal] = useState(false)
  const [timeToNextChallenge, setTimeToNextChallenge] = useState('')

  // Daily Challenge Logic: Auto Popup
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const lastShownInfo = localStorage.getItem('last_daily_popup_shown_date')
    const lastPlayedDate = localStorage.getItem('daily_challenge_played_date')

    const hasPlayedToday = lastPlayedDate === today

    // Only show the "Live" popup if they haven't seen it today AND haven't played today
    if (lastShownInfo !== today && !hasPlayedToday) {
      const timer = setTimeout(() => setShowDailyPopup(true), 1200)
      return () => clearTimeout(timer)
    }
  }, [])

  // Countdown Timer for "Already Played" Modal
  useEffect(() => {
    let interval = null;
    if (showAlreadyPlayedModal) {
      const updateTimer = () => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setHours(24, 0, 0, 0); // Next midnight
        const diff = tomorrow - now;

        if (diff <= 0) {
          setTimeToNextChallenge("00h 00m 00s");
        } else {
          const h = Math.floor(diff / (1000 * 60 * 60));
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const s = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeToNextChallenge(`${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`);
        }
      };

      updateTimer(); // Initial call
      interval = setInterval(updateTimer, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    }
  }, [showAlreadyPlayedModal]);

  function handleDismissDaily() {
    setShowDailyPopup(false)
    const today = new Date().toISOString().split('T')[0]
    localStorage.setItem('last_daily_popup_shown_date', today)
  }

  function handlePlayDaily() {
    // Check if played today
    const today = new Date().toISOString().split('T')[0]
    const lastPlayedDate = localStorage.getItem('daily_challenge_played_date')

    // Close the initial popup if it was the source
    setShowDailyPopup(false)
    // Mark as seen so it doesn't pop up again automatically
    localStorage.setItem('last_daily_popup_shown_date', today)

    if (lastPlayedDate === today) {
      // Already played
      setShowAlreadyPlayedModal(true)
    } else {
      // Not played yet -> Show Confirmation
      setShowConfirmDailyModal(true)
    }
  }

  function startDailyGame() {
    navigate('/game?mode=daily')
  }

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

            {/* --- DAILY CHALLENGE POPUPS --- */}

            {/* 1. AUTO POPUP: "Today's Challenge is Live" */}
            {showDailyPopup && (
              <div className="daily-popup-overlay">
                <div className="daily-popup-content">
                  <div className="daily-popup-header">
                    <h2>🎯 Today’s Challenge is Live!</h2>
                  </div>
                  <div className="daily-popup-body">
                    <p>Test your skills and see how you perform today.</p>
                    <div className="daily-info-row">
                      <span><i className="bi bi-clock"></i> 60s</span>
                      <span><i className="bi bi-star"></i> Rank #1</span>
                    </div>
                  </div>
                  <div className="daily-popup-footer">
                    <button className="btn btn-secondary" onClick={handleDismissDaily}>Later</button>
                    <button className="btn btn-primary" onClick={handlePlayDaily}>Play Now</button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. CONFIRM MODAL: "First Time" -> "You can play only once" */}
            {showConfirmDailyModal && (
              <div className="daily-popup-overlay">
                <div className="daily-popup-content">
                  <div className="daily-popup-header">
                    <h2>▶️ Ready for Daily Challenge?</h2>
                  </div>
                  <div className="daily-popup-body">
                    <p>🎯 You can play today’s Daily Challenge only once.</p>
                    <p className="text-muted small">Give it your best shot and check your performance when results are revealed!</p>
                  </div>
                  <div className="daily-popup-footer">
                    <button className="btn btn-secondary" onClick={() => setShowConfirmDailyModal(false)}>Cancel</button>
                    <button className="btn btn-primary" onClick={startDailyGame}>✅ Start Daily Challenge</button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. ALREADY PLAYED MODAL */}
            {showAlreadyPlayedModal && (
              <div className="daily-popup-overlay">
                <div className="daily-popup-content">
                  <div className="daily-popup-header">
                    <h2>✅ You’ve played today’s challenge</h2>
                  </div>
                  <div className="daily-popup-body">
                    <p style={{ marginBottom: '10px' }}>You have already participated in today’s challenge.</p>
                    <div className="alert-box-info" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                      <div style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Next Challenge In</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'monospace', color: '#00A63F' }}>
                        {timeToNextChallenge}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '8px' }}>Results will be unlocked in 24h</div>
                    </div>
                  </div>
                  <div className="daily-popup-footer">
                    <button className="btn btn-secondary" onClick={() => setShowAlreadyPlayedModal(false)}>❌ Close</button>
                    <button className="btn btn-outline-primary" onClick={() => navigate('/daily-challenge-results')}>🔒 View Countdown</button>
                  </div>
                </div>
              </div>
            )}

            <style>{`
              .daily-popup-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.6);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                backdrop-filter: blur(4px);
              }
              .daily-popup-content {
                background: white;
                padding: 30px;
                border-radius: 16px;
                text-align: center;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 20px 40px rgba(0,0,0,0.2);
                border: 2px solid #00A63F;
                animation: popIn 0.3s ease-out;
              }
              @keyframes popIn {
                from { transform: scale(0.9); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
              }
              .daily-popup-header h2 {
                color: #111827;
                font-size: 1.5rem;
                margin-bottom: 0.5rem;
              }
              .daily-popup-body p {
                color: #6B7280;
                margin-bottom: 20px;
              }
              .daily-info-row {
                 display: flex;
                 gap: 15px;
                 justify-content: center;
                 margin-bottom: 24px;
                 color: #00A63F;
                 font-weight: 600;
              }
              .daily-popup-footer {
                display: flex;
                gap: 10px;
                justify-content: center;
              }
              .daily-card {
                background: linear-gradient(135deg, #00A63F 0%, #008C35 100%);
                border-radius: 12px;
                padding: 20px;
                color: white;
                margin-top: 30px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                box-shadow: 0 10px 20px rgba(0, 166, 63, 0.2);
              }
              .daily-card-text h3 {
                margin: 0 0 5px 0;
                font-size: 1.25rem;
              }
              .daily-card-text p {
                 margin: 0;
                 opacity: 0.9;
                 font-size: 0.9rem;
              }
            `}</style>

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

            {/* DAILY CHALLENGE DASHBOARD CARD */}
            <div className="daily-card">
              <div className="daily-card-text">
                <h3>Today's Daily Challenge</h3>
                <p>Compete with everyone on the same words!</p>
              </div>
              {(() => {
                const today = new Date().toISOString().split('T')[0];
                const isPlayed = localStorage.getItem('daily_challenge_played_date') === today;
                const isAdmin = member?.email === 'admin.test@sortonym.com';

                if (isAdmin) {
                  return (
                    <button className="btn" style={{ backgroundColor: '#fbbf24', color: '#000', fontWeight: 'bold', border: 'none' }} onClick={startDailyGame}>
                      Play (Override)
                    </button>
                  )
                }

                return isPlayed ? (
                  <button className="btn btn-light" style={{ color: '#00A63F', fontWeight: 'bold' }} onClick={() => navigate('/daily-challenge-results')}>
                    View Results
                  </button>
                ) : (
                  <button className="btn btn-light" style={{ color: '#00A63F', fontWeight: 'bold' }} onClick={handlePlayDaily}>
                    Play Now
                  </button>
                );
              })()}
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
