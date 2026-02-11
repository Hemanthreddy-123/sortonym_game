import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLeaderboard } from '../api/gameApi.js'
import { useAuth } from '../auth/AuthContext.jsx'
import './LeaderboardPage.css'

function LeaderboardPage() {
  const navigate = useNavigate()
  const { member } = useAuth()
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState('all') // 'today' | 'all'
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      try {
        const period = timeFilter === 'today' ? 'today' : undefined;
        const data = await getLeaderboard({ period })
        setLeaderboard(data.leaderboard || [])
      } catch (err) {
        console.error('Failed to load leaderboard', err)
      } finally {
        setLoading(false)
      }
    }
    fetchLeaderboard()
  }, [timeFilter])

  const getDisplayName = (entry) => {
    if (entry.player_name) return entry.player_name;
    if (entry.player_email) return entry.player_email.split('@')[0];
    return "Unknown Player";
  }

  // Formatting helpers
  const formatScore = (score) => Math.round(score || 0);
  const formatTime = (time) => Math.round(time || 0);

  // Sorting/Filtering could happen here if API supported it
  const displayList = leaderboard.filter(entry => {
    const name = getDisplayName(entry).toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="game-lb-page">
      {/* 1. Trapezoid Header */}
      <div className="game-lb-header-container">
        <div className="trapezoid-title-block">
          <h2 className="game-title-small">SORTONYM</h2>
          <h1 className="game-lb-title">LEADERBOARD</h1>
        </div>
      </div>

      {/* 2. Controls / Toggle (Styled as tech bars) */}
      <div className="game-lb-controls">
        <button className="game-btn-back" onClick={() => navigate('/home')}>
          <i className="bi bi-box-arrow-right"></i> EXIT
        </button>

        <div className="toggle-pill-container">
          <button
            className={`toggle-pill ${timeFilter === 'today' ? 'active' : ''}`}
            onClick={() => setTimeFilter('today')}
          >
            TODAY
          </button>
          <button
            className={`toggle-pill ${timeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setTimeFilter('all')}
          >
            ALL TIME
          </button>
        </div>
      </div>

      {/* S. Search Bar */}
      <div className="search-bar-container">
        <div className="search-input-wrapper">

          <input
            type="text"
            className="search-input"
            placeholder="Search player..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* 3. The List (Sci-Fi Bars) */}
      <div className="game-lb-list-container">
        {loading && <div className="loading-text">LOADING DATA...</div>}

        {!loading && displayList.map((entry, index) => {
          const rank = index + 1;
          const isMe = member?.email === entry.player_email;
          const displayName = getDisplayName(entry);

          // Trophy Icon Logic
          let trophyIcon = null;
          if (rank === 1) trophyIcon = <i className="bi bi-trophy-fill gold-t"></i>;
          else if (rank === 2) trophyIcon = <i className="bi bi-trophy-fill silver-t"></i>;
          else if (rank === 3) trophyIcon = <i className="bi bi-trophy-fill bronze-t"></i>;
          else trophyIcon = <i className="bi bi-star-fill normal-t"></i>;

          return (
            <div key={index} className={`game-lb-row ${isMe ? 'row-me' : ''}`}>
              <div className="lb-left-group">
                {/* Block 1: Trophy */}
                <div className="lb-block block-trophy">
                  <div className="skew-fix">{trophyIcon}</div>
                </div>

                {/* Block 2: Rank */}
                <div className="lb-block block-rank">
                  <div className="skew-fix">{rank < 10 ? `0${rank}` : rank}</div>
                </div>

                {/* Block 3: Name (Wide) */}
                <div className="lb-block block-name">
                  <div className="skew-fix name-content">
                    <i className="bi bi-person-circle"></i>
                    <span>{displayName.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              <div className="lb-right-group">
                {/* Block 4: Score */}
                <div className="lb-block block-score">
                  <div className="skew-fix">{formatScore(entry.score)}</div>
                </div>

                {/* Block 5: Time */}
                <div className="lb-block block-time">
                  <div className="skew-fix">{formatTime(entry.time_taken)}s</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 4. Start Game Button (Floating Bottom) */}
      <div className="game-lb-footer">
        <button className="btn-start-game-lb" onClick={() => navigate('/game')}>
          <i className="bi bi-play-fill"></i> START NEW CHALLENGE
        </button>
      </div>
    </div>
  )
}

export default LeaderboardPage
