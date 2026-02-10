import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage.jsx'
import LandingPage from './pages/LandingPage.jsx'
import RequireAuth from './auth/RequireAuth.jsx'
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
      <Route path="/" element={<Navigate to="/auth" replace />} />
      <Route path="/auth" element={<LoginPage />} />
      <Route
        path="/home"
        element={
          <RequireAuth>
            <LandingPage />
          </RequireAuth>
        }
      />
      <Route
        path="/game"
        element={
          <RequireAuth>
            <GamePage />
          </RequireAuth>
        }
      />
      <Route
        path="/result"
        element={
          <RequireAuth>
            <ResultPage />
          </RequireAuth>
        }
      />
      <Route
        path="/score-standalone"
        element={
          <RequireAuth>
            <ScorePageStandalone />
          </RequireAuth>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <RequireAuth>
            <LeaderboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/daily-challenge-results"
        element={
          <RequireAuth>
            <DailyChallengeResults />
          </RequireAuth>
        }
      />
      <Route
        path="/join-game"
        element={
          <RequireAuth>
            <JoinGamePage />
          </RequireAuth>
        }
      />
      <Route
        path="/team-lobby"
        element={
          <RequireAuth>
            <TeamGameLobby />
          </RequireAuth>
        }
      />
      <Route
        path="/create-team"
        element={
          <RequireAuth>
            <CreateTeamPage />
          </RequireAuth>
        }
      />
      <Route
        path="/team-game"
        element={
          <RequireAuth>
            <TeamGamePage />
          </RequireAuth>
        }
      />
      <Route
        path="/team-results"
        element={
          <RequireAuth>
            <TeamResultsPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  )
}

export default App
