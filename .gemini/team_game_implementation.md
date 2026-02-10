# Team Game Mode Implementation

## Overview
Implemented a complete Team Game mode where multiple players can compete in two teams (Team A vs Team B) playing the same rounds and words, with individual scoring aggregated into team totals.

## Features

### 1. **Team Structure**
- **Two Teams**: Team A (Blue) and Team B (Red)
- **Multiple Players**: Each team can have multiple players
- **Pre-Game Lobby**: Players join teams before game starts
- **Game Code**: Unique code for each game session

### 2. **Team Game Lobby**
**Location**: `/team-lobby`

**Features:**
- Generate unique game code
- Team selection interface
- Visual team cards with player lists
- Difficulty selection (Easy/Medium/Hard)
- Start game button (requires both teams to have players)

**UI Elements:**
- Team A card with blue theme
- Team B card with red theme
- Player avatars and names
- Join/Leave team functionality
- Real-time player count

### 3. **Gameplay Flow**

**Game Structure:**
- **10 Rounds**: Fixed number of rounds per game
- **Same Words**: All players get the same words each round
- **Individual Play**: Each player plays independently
- **Continuous Flow**: No interruptions between rounds

**Round Progression:**
1. Player completes round
2. Score is recorded
3. Next round starts automatically
4. Repeat until round 10
5. Redirect to Team Results

**Header Display:**
- Team badge (Team A/Team B)
- Player name
- Round counter (Round X of 10)
- Timer
- Difficulty badge

### 4. **Scoring System**

**Individual Scores:**
- Each player's score is tracked per round
- Stored in round history

**Team Scoring:**
- **Total Score**: Sum of all player scores across all rounds
- **Average Score**: Total / (Team Size × 10 rounds)
- **Best Player (MVP)**: Player with highest total score in team

**Calculation Example:**
```
Team A: 3 players
Player 1: 10 rounds × avg 8.5 = 85 points
Player 2: 10 rounds × avg 7.2 = 72 points
Player 3: 10 rounds × avg 9.1 = 91 points

Team A Total: 248 points
Team A Average: 248 / (3 × 10) = 8.27 per round/player
Team A MVP: Player 3 (91 points)
```

### 5. **Team Results Page**
**Location**: `/team-results`

**Display Elements:**

**Winner Announcement:**
- Large animated header
- "Team A Wins!" or "Team B Wins!" or "It's a Tie!"

**Team Comparison:**
- Side-by-side team cards
- Total scores prominently displayed
- Average score per round
- Number of players
- MVP (best player) highlighted
- Winner gets crown badge and scale animation

**Your Performance:**
- Individual total score
- Personal average per round
- Rounds played (10)

**Actions:**
- Back to Home button
- Play Again button (returns to lobby)

### 6. **Visual Design**

**Team Colors:**
- **Team A**: Blue (#3b82f6)
- **Team B**: Red (#ef4444)
- **Accents**: Gold for MVP (#fbbf24)

**Animations:**
- Winner announcement fade-in scale
- Winner card scale-up effect
- Smooth transitions

**Responsive Design:**
- Desktop: Side-by-side team comparison
- Mobile: Stacked layout with VS divider

## File Structure

```
frontend/src/pages/TeamGame/
├── TeamGameLobby.jsx       # Pre-game team selection
├── TeamGameLobby.css       # Lobby styles
├── TeamGamePage.jsx        # Actual gameplay
├── TeamGamePage.css        # Game styles
├── TeamResultsPage.jsx     # Post-game results
└── TeamResultsPage.css     # Results styles
```

## Routes Added

```javascript
/team-lobby      → TeamGameLobby
/team-game       → TeamGamePage
/team-results    → TeamResultsPage
```

## Usage Flow

### Starting a Team Game:

1. **Navigate to Team Lobby**
   - Click "Team Game" button on Landing Page
   - Or navigate to `/team-lobby`

2. **Set Up Teams**
   - View generated game code
   - Select difficulty level
   - Players join Team A or Team B
   - Wait for both teams to have players

3. **Start Game**
   - Host clicks "Start Team Game"
   - All players navigate to game page
   - Game begins with Round 1

4. **Play 10 Rounds**
   - Each player plays individually
   - Scores tracked automatically
   - Rounds progress seamlessly
   - No interruptions

5. **View Results**
   - After Round 10, automatic redirect
   - See team comparison
   - View winner announcement
   - Check individual performance

6. **Play Again or Exit**
   - Play Again → Return to lobby
   - Back to Home → Return to dashboard

## Technical Implementation

### State Management

**TeamGameLobby:**
```javascript
const [gameCode, setGameCode] = useState('');
const [teamAPlayers, setTeamAPlayers] = useState([]);
const [teamBPlayers, setTeamBPlayers] = useState([]);
const [selectedTeam, setSelectedTeam] = useState(null);
const [difficulty, setDifficulty] = useState('MEDIUM');
```

**TeamGamePage:**
```javascript
const MAX_ROUNDS = 10;
const [roundCount, setRoundCount] = useState(0);
const [teamAScores, setTeamAScores] = useState([]);
const [teamBScores, setTeamBScores] = useState([]);
const [currentPlayerScores, setCurrentPlayerScores] = useState([]);
```

### Data Flow

**Lobby → Game:**
```javascript
navigate('/team-game', {
    state: {
        gameCode,
        teamA,
        teamB,
        difficulty,
        currentPlayer,
        selectedTeam
    }
});
```

**Game → Results:**
```javascript
navigate('/team-results', {
    state: {
        gameCode,
        teamA,
        teamB,
        teamAScores,
        teamBScores,
        currentPlayerScores,
        difficulty
    }
});
```

### Score Tracking

**Round Score Object:**
```javascript
{
    round: 1,
    score: 8.5,
    total_correct: 7,
    time_bonus: 1.5,
    accuracy: 87.5,
    player: "Player Name",
    team: "A"
}
```

## Key Features

### ✅ Implemented:
- Team selection lobby
- Game code generation
- 10-round gameplay structure
- Individual score tracking
- Team score aggregation
- Winner determination
- MVP identification
- Responsive design
- Team-colored UI
- Smooth transitions
- Results page with comparison

### 🔄 Future Enhancements:
- Real-time multiplayer sync (WebSocket)
- Live team score updates during gameplay
- Team chat functionality
- Spectator mode
- Custom round counts
- Team statistics history
- Achievements and badges
- Tournament mode
- Team rankings/leaderboard

## Compatibility

- ✅ Works on web and mobile views
- ✅ Integrates with existing game logic
- ✅ Uses existing game components (Timer, WordTile, TargetZone)
- ✅ Maintains fair gameplay
- ✅ Responsive across all screen sizes

## Notes

**Current Implementation:**
- Single-player simulation (each player plays independently)
- Scores are client-side tracked
- No real-time sync between players
- Suitable for local/turn-based team play

**For Full Multiplayer:**
- Requires backend WebSocket support
- Real-time score synchronization
- Lobby management system
- Player session handling
- Database for team game history

This implementation provides a solid foundation for team-based gameplay that can be extended with real-time features as needed.
