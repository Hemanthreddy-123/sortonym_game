import { Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage.jsx'
import GamePage from './pages/Game/GamePage.jsx'
import ResultPage from './pages/Certificate/ResultPage.jsx'
import ScorePageStandalone from './pages/ScorePageStandalone.jsx'
import LeaderboardPage from './pages/LeaderboardPage.jsx'
import DailyChallengeResults from './pages/DailyChallengeResults.jsx'
import TeamGameLobby from './pages/TeamGame/TeamGameLobby.jsx'
import CreateTeamPage from './pages/TeamGame/CreateTeamPage.jsx'
import TeamGamePage from './pages/TeamGame/TeamGamePage.jsx'
import TeamResultsPage from './pages/TeamGame/TeamResultsPage.jsx'
import JoinGamePage from './pages/TeamGame/JoinGamePage.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<LandingPage />} />

      {/* All Routes are now Public */}
      <Route path="/game" element={<GamePage />} />
      <Route path="/result" element={<ResultPage />} />
      <Route path="/score-standalone" element={<ScorePageStandalone />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />
      <Route path="/daily-challenge-results" element={<DailyChallengeResults />} />
      <Route path="/join-game" element={<JoinGamePage />} />
      <Route path="/team-lobby" element={<TeamGameLobby />} />
      <Route path="/create-team" element={<CreateTeamPage />} />
      <Route path="/team-game" element={<TeamGamePage />} />
      <Route path="/team-results" element={<TeamResultsPage />} />
      <Route path="/team-results/:gameCode" element={<TeamResultsPage />} />

      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  )
}

export default App
