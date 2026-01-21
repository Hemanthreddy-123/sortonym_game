import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { getLeaderboard, getGameScore } from '../api/gameApi.js'
import './LeaderboardPage.css'

function LeaderboardPage() {
  const navigate = useNavigate()
  const { token, user, member } = useAuth()
  const [leaderboard, setLeaderboard] = useState([])
  const [userScore, setUserScore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [leaderboardData, scoreData] = await Promise.all([
        getLeaderboard({ token }),
        getGameScore({ token })
      ])
      
      setLeaderboard(leaderboardData.leaderboard)
      setUserScore(scoreData)
    } catch (err) {
      setError(err.message || 'Failed to load leaderboard')
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    if (!userScore || userScore.rounds_played === 0) {
      alert('Play at least one round to share your score!')
      return
    }

    const shareText = `🎯 Sortonym Challenge!\n\n` +
      `Team ${user?.team_no} - ${member?.name}\n` +
      `📊 Total Score: ${userScore.total_score.toFixed(1)}\n` +
      `🎮 Rounds Played: ${userScore.rounds_played}\n` +
      `🏆 Best Round: ${userScore.best_round_score.toFixed(1)}\n` +
      `📈 Average: ${userScore.average_score.toFixed(1)}\n\n` +
      `Can you beat my score? 🚀`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Sortonym Challenge Results',
          text: shareText,
        })
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareText)
        alert('Score copied to clipboard!')
      } catch (err) {
        // Fallback to manual copy
        const textArea = document.createElement('textarea')
        textArea.value = shareText
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        alert('Score copied to clipboard!')
      }
    }
  }

  const handleBackToGame = () => {
    navigate('/landing')
  }

  if (loading) {
    return (
      <div className="leaderboard-page">
        <div className="loading-container">
          <h2>Loading Leaderboard...</h2>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="leaderboard-page">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button className="btn-primary" onClick={loadData}>Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-header">
        <h1>🏆 Leaderboard</h1>
        <button className="btn-secondary" onClick={handleBackToGame}>
          Back to Game
        </button>
      </div>

      {userScore && (
        <div className="user-stats">
          <h2>Your Stats</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Score</span>
              <span className="stat-value">{userScore.total_score.toFixed(1)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Rounds Played</span>
              <span className="stat-value">{userScore.rounds_played}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Best Round</span>
              <span className="stat-value">{userScore.best_round_score.toFixed(1)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Average Score</span>
              <span className="stat-value">{userScore.average_score.toFixed(1)}</span>
            </div>
          </div>
          <button className="btn-primary share-btn" onClick={handleShare}>
            📤 Share Score
          </button>
        </div>
      )}

      <div className="leaderboard-container">
        <h2>Top Players</h2>
        {leaderboard.length === 0 ? (
          <div className="empty-leaderboard">
            <p>No scores yet. Be the first to play!</p>
          </div>
        ) : (
          <div className="leaderboard-list">
            {leaderboard.map((player, index) => (
              <div 
                key={index} 
                className={`leaderboard-item ${
                  player.team_no === user?.team_no ? 'current-user' : ''
                }`}
              >
                <div className="rank">
                  {player.rank === 1 && '🥇'}
                  {player.rank === 2 && '🥈'}
                  {player.rank === 3 && '🥉'}
                  {player.rank > 3 && `#${player.rank}`}
                </div>
                <div className="player-info">
                  <div className="player-name">
                    Team {player.team_no} - {player.name}
                  </div>
                  <div className="player-details">
                    {player.rounds_played} rounds • Best: {player.best_round.toFixed(1)}
                  </div>
                </div>
                <div className="player-score">
                  {player.total_score.toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default LeaderboardPage
