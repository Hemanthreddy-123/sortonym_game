import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'

<<<<<<< HEAD
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



=======
function LandingPage() {
  const navigate = useNavigate()
  const { user, member, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

>>>>>>> c4aab529800c7f6d987e53657184410f45f54862
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

<<<<<<< HEAD
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
              <i className="bi bi-intersect"></i>
              <span className="topbar-logo-text">Sortonym Challenge</span>
            </div>

            <div className="topbar-right">


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

              <button
                className="theme-toggle-btn"
                onClick={toggleTheme}
                aria-label="Toggle Theme"
              >
                {theme === 'light' ? <i className="bi bi-moon-fill"></i> : <i className="bi bi-sun-fill"></i>}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="landing-center">
        <div className="landing-container">
          <div className="center-content-wrapper">
            {/* Hero Section */}
            <section className="hero-section">

              <p className="landing-subtitle">Master your vocabulary! Sort synonyms and antonyms against the clock in this fast-paced word challenge.</p>



              <div className="landing-actions">
                <button className="btn btn-primary btn-lg" onClick={() => navigate('/game')}>
                  <i className="bi bi-play me-2"></i> Start Challenge
                </button>
                <button className="btn btn-secondary btn-lg" onClick={() => navigate('/leaderboard')}>
                  <i className="bi bi-trophy me-2"></i> Leaderboard
                </button>
              </div>
            </section>

            {/* Instructions Strip */}
            <section className="how-to-play-grid">
              <div className="section-header">
                <h5>Game Protocol</h5>
              </div>

              <div className="grid-instructions">
                <div className="instruction-card">
                  <div className="card-icon"><i className="bi bi-eye"></i></div>
                  <h3>Observe</h3>
                  <p>Study the target word and the options available.</p>
                </div>
                <div className="instruction-card">
                  <div className="card-icon"><i className="bi bi-box-arrow-in-down-left"></i></div>
                  <h3>Classify</h3>
                  <p>Drag options to Synonym or Antonym boxes.</p>
                </div>
                <div className="instruction-card">
                  <div className="card-icon"><i className="bi bi-lightning-charge"></i></div>
                  <h3>Acceleration</h3>
                  <p>Maintain speed to maximize your bonus points.</p>
                </div>
                <div className="instruction-card">
                  <div className="card-icon"><i className="bi bi-award"></i></div>
                  <h3>Ascend</h3>
                  <p>Climb the ranks and validate your expertise.</p>
                </div>
              </div>
            </section>
          </div>
        </div>
=======
  return (
    <div className="landing-shell">
      <div className="landing-topbar">
        <div className="dropdown" ref={menuRef}>
          <button
            className="landing-userbtn"
            type="button"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <i className="bi bi-person-circle" />
          </button>

          <ul
            className={`dropdown-menu dropdown-menu-end landing-dropdown${menuOpen ? ' show' : ''}`}
          >
            <li className="px-3 pt-2 pb-1">
              <div className="landing-userline">
                <i className="bi bi-person-circle" />
                <div>
                  <div className="landing-username">{member?.name || '--'}</div>
                  <div className="landing-userdetail">{member?.email || '--'}</div>
                  <div className="landing-userdetail">{member?.phone || '--'}</div>
                </div>
              </div>
            </li>
            <li>
              <hr className="dropdown-divider" />
            </li>
            <li className="px-3 pb-3">
              <button className="btn btn-danger w-100" type="button" onClick={onLogout}>
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>

      <main className="landing-center" aria-live="polite">
        <h1 className="landing-title">Welcome to hackathon</h1>
        <p className="landing-subtitle">This is your Starting point of your hackathon.</p>
>>>>>>> c4aab529800c7f6d987e53657184410f45f54862
      </main>
    </div>
  )
}

export default LandingPage
