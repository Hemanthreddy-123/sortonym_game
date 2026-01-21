import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import '../styles/landing.css'

function LandingPage() {
  const navigate = useNavigate()
  const { user, member, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
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
    navigate('/login')
  }

  function handleLetsGo() {
    navigate('/game')
  }

  function handleLeaderboard() {
    navigate('/leaderboard')
  }

  return (
    <div className="landing-shell">
      <div className="landing-topbar">
        <div className="landing-team">Team No: {user?.team_no ?? '--'}</div>
        <div className="dropdown" ref={menuRef}>
          <button
            className="landing-userbtn"
            type="button"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <i className="bi bi-person-circle"></i>
          </button>
          <ul
            className={`dropdown-menu dropdown-menu-end landing-dropdown${
              menuOpen ? ' show' : ''
            }`}
          >
            <li className="px-3 pt-2 pb-1">
              <div className="landing-userline">
                <i className="bi bi-person-circle"></i>
                <div>
                  <div className="landing-username">{member?.name || '--'}</div>
                  <div className="landing-userdetail">{member?.email || '--'}</div>
                  <div className="landing-userdetail">{member?.phone || '--'}</div>
                  <div className="landing-userdetail">{member?.member_id || '--'}</div>
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
        <h1 className="landing-title">Sortonym</h1>
        <div className="landing-instructions">
          <p>
            One anchor word will be shown with 8 words appearing below it. 
            4 of these words are synonyms and 4 are antonyms of the anchor word.
          </p>
          <p>
            Drag the synonyms into the green box and the antonyms into the red box. 
            You must complete the sorting before the timer ends to score points.
          </p>
        </div>
        
        <div className="landing-actions">
          <button 
            className="btn btn-primary landing-lets-go-btn" 
            type="button"
            onClick={handleLetsGo}
          >
            Let's Go
          </button>
          <button 
            className="btn btn-secondary landing-leaderboard-btn" 
            type="button"
            onClick={handleLeaderboard}
          >
            🏆 Leaderboard
          </button>
        </div>
      </main>
    </div>
  )
}

export default LandingPage
