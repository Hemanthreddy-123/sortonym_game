# Team Game Flow - Strict Game Code System

## Overview
The Team Game feature implements a strict, controlled flow using a Game Code system. This ensures organized, fair gameplay where all players must go through a proper lobby before starting the game.

---

## 🎯 Core Principles

### 1. **Game Code is Mandatory**
- ✅ All team games MUST use a Game Code
- ✅ No direct game access without a code
- ✅ Code is generated automatically when creating a game
- ✅ Code must be shared with other players

### 2. **Lobby is Required**
- ✅ All players must join the lobby first
- ✅ Game does NOT start automatically
- ✅ Host must explicitly click "Start Game"
- ✅ Players cannot bypass the lobby

### 3. **Host Control**
- ✅ Only the host can start the game
- ✅ Host can set difficulty level
- ✅ Host waits for players to join
- ✅ Host confirms teams are ready

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Landing Page                           │
│                                                             │
│  [Start Playing]  [Create Team Game]  [Join with Code]     │
└─────────────────────────────────────────────────────────────┘
                 │                           │
                 │                           │
        ┌────────▼────────┐         ┌────────▼────────┐
        │  Create Flow    │         │   Join Flow     │
        │  (Host)         │         │   (Player)      │
        └────────┬────────┘         └────────┬────────┘
                 │                           │
                 │                           │
        ┌────────▼────────────────────────────▼────────┐
        │          Team Game Lobby                     │
        │  - Display Game Code                         │
        │  - Show Teams (A & B)                        │
        │  - Players join teams                        │
        │  - Host sets difficulty                      │
        │  - Wait for all players                      │
        │  - Host clicks "Start Game"                  │
        └────────┬─────────────────────────────────────┘
                 │
                 │ (Only when host starts)
                 │
        ┌────────▼────────┐
        │   Team Game     │
        │   (10 Rounds)   │
        └────────┬────────┘
                 │
                 │
        ┌────────▼────────┐
        │  Team Results   │
        │  (Winner)       │
        └─────────────────┘
```

---

## 📋 Detailed Flows

### **Flow 1: Create Team Game (Host)**

**Step 1: Landing Page**
```
User clicks "Create Team Game" button
→ Navigate to /team-lobby
```

**Step 2: Lobby Creation**
```
System generates unique 6-character Game Code (e.g., "QH4TP7")
User becomes the Host
Lobby is created with:
  - Empty Team A
  - Empty Team B
  - Default difficulty: MEDIUM
  - Status: Waiting for players
```

**Step 3: Host Actions**
```
Host can:
  ✅ View and copy Game Code
  ✅ Share code with other players
  ✅ Join Team A or Team B
  ✅ Change difficulty level
  ✅ Wait for other players to join
  ✅ Click "Start Game" when ready
```

**Step 4: Validation Before Start**
```
System checks:
  ✅ Both teams have at least 1 player
  ✅ Host has joined a team
  ✅ All players are in lobby

If validation fails:
  ❌ Show error message
  ❌ Disable "Start Game" button

If validation passes:
  ✅ Navigate to /team-game
  ✅ Pass team data to game
```

---

### **Flow 2: Join Team Game (Player)**

**Step 1: Landing Page**
```
User clicks "Join with Code" button
→ Navigate to /join-game
```

**Step 2: Enter Game Code**
```
User enters 6-character code
System validates:
  ✅ Code is not empty
  ✅ Code is exactly 6 characters
  ✅ Code exists in database
  ✅ Game is still in lobby (not started)

If invalid:
  ❌ Show error message
  ❌ Keep user on /join-game

If valid:
  ✅ Navigate to /team-lobby
  ✅ Pass gameCode and isJoining=true
```

**Step 3: Join Lobby**
```
User arrives at lobby with:
  - Existing Game Code
  - isJoining = true
  - isHost = false

User can:
  ✅ View Game Code
  ✅ See existing players
  ✅ Join Team A or Team B
  ✅ Wait for host to start

User CANNOT:
  ❌ Change difficulty
  ❌ Start the game
  ❌ Kick players
```

**Step 4: Wait for Host**
```
Display message: "Waiting for host to start the game..."
User waits in lobby until:
  - Host clicks "Start Game"
  - All players navigate to /team-game together
```

---

## 🚫 Restrictions & Validations

### **Cannot Start Game If:**
1. ❌ Team A has 0 players
2. ❌ Team B has 0 players
3. ❌ Current user hasn't joined a team
4. ❌ User is not the host
5. ❌ Game code is invalid

### **Cannot Join Lobby If:**
1. ❌ Game code is empty
2. ❌ Game code is invalid
3. ❌ Game has already started
4. ❌ Game has ended

### **Cannot Bypass Lobby:**
1. ❌ No direct navigation to /team-game
2. ❌ Must go through lobby first
3. ❌ Must wait for host to start
4. ❌ All players must be in lobby

---

## 🎮 Lobby Features

### **For Host:**
```jsx
<div className="lobby-status">
  - Players in Lobby: {count}
  - Your Role: Host
  - Difficulty: {difficulty}
</div>

<div className="difficulty-selector">
  <select onChange={setDifficulty}>
    <option>Easy</option>
    <option>Medium</option>
    <option>Hard</option>
  </select>
</div>

<button onClick={handleStartGame}>
  Start Team Game
</button>
```

### **For Players:**
```jsx
<div className="lobby-status">
  - Players in Lobby: {count}
  - Your Role: Player
  - Difficulty: {difficulty}
</div>

<div className="waiting-message">
  Waiting for host to start the game...
</div>
```

### **For Everyone:**
```jsx
<div className="teams-container">
  <div className="team-a">
    <h2>Team A</h2>
    <PlayerList />
    <button onClick={() => joinTeam('A')}>
      Join Team A
    </button>
  </div>

  <div className="vs-divider">VS</div>

  <div className="team-b">
    <h2>Team B</h2>
    <PlayerList />
    <button onClick={() => joinTeam('B')}>
      Join Team B
    </button>
  </div>
</div>
```

---

## 📊 State Management

### **Lobby State:**
```javascript
const [gameCode, setGameCode] = useState('');          // 6-char code
const [teamAPlayers, setTeamAPlayers] = useState([]); // Team A members
const [teamBPlayers, setTeamBPlayers] = useState([]); // Team B members
const [selectedTeam, setSelectedTeam] = useState(null); // User's team
const [difficulty, setDifficulty] = useState('MEDIUM'); // Game difficulty
const [isHost, setIsHost] = useState(false);          // Is user the host?
const [isJoining, setIsJoining] = useState(false);    // Is user joining?
```

### **Navigation State:**
```javascript
// Creating new game
navigate('/team-lobby');

// Joining existing game
navigate('/team-lobby', {
    state: {
        gameCode: 'ABC123',
        isJoining: true
    }
});

// Starting game (host only)
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

---

## ✅ Validation Rules

### **Game Code Validation:**
| Rule | Check | Error Message |
|------|-------|---------------|
| Required | `code.length > 0` | "Please enter a game code" |
| Length | `code.length === 6` | "Game code must be 6 characters" |
| Format | `/^[A-Z0-9]{6}$/` | Auto-filtered |
| Exists | Database lookup | "Invalid game code" |
| Active | Game status check | "Game has already started" |

### **Start Game Validation:**
| Rule | Check | Error Message |
|------|-------|---------------|
| Team A | `teamA.length > 0` | "Team A must have at least one player" |
| Team B | `teamB.length > 0` | "Team B must have at least one player" |
| User Team | `selectedTeam !== null` | "Please join a team before starting" |
| Is Host | `isHost === true` | "Only the host can start the game" |

---

## 🎨 UI Components

### **Game Code Display:**
```jsx
<div className="game-code-display">
  <span className="code-label">Game Code:</span>
  <div className="code-box">
    <strong className="code-value">{gameCode}</strong>
    <button onClick={handleCopyCode}>
      <i className="bi bi-clipboard"></i>
    </button>
  </div>
</div>
```

### **Team Card:**
```jsx
<div className="team-card team-a">
  <div className="team-header">
    <h2>Team A</h2>
    <span className="team-count">{count} players</span>
  </div>
  
  <div className="team-players">
    {players.map(player => (
      <div className="player-item">
        <img src={player.picture} />
        <span>{player.name}</span>
        {isCurrentUser && <span className="you-badge">You</span>}
      </div>
    ))}
  </div>
  
  {selectedTeam === 'A' ? (
    <button onClick={handleLeaveTeam}>Leave Team</button>
  ) : (
    <button onClick={() => handleJoinTeam('A')}>Join Team A</button>
  )}
</div>
```

### **Instructions:**
```jsx
<div className="lobby-instructions">
  <div className="instruction-card">
    <i className="bi bi-info-circle-fill"></i>
    <div className="instruction-content">
      <h4>How to Play</h4>
      <ol>
        <li>Share the game code with other players</li>
        <li>Wait for players to join and select teams</li>
        <li>Ensure both teams have at least one player</li>
        <li>{isHost ? 'Click "Start Game" when ready' : 'Wait for host'}</li>
      </ol>
    </div>
  </div>
</div>
```

---

## 🔐 Security & Fairness

### **Prevents:**
1. ✅ Accidental game starts
2. ✅ Unbalanced teams (0 players on one side)
3. ✅ Players joining without codes
4. ✅ Non-hosts starting games
5. ✅ Bypassing the lobby
6. ✅ Joining started/ended games

### **Ensures:**
1. ✅ All players go through lobby
2. ✅ Host has full control
3. ✅ Fair team distribution
4. ✅ Organized game flow
5. ✅ Clear player roles
6. ✅ Proper validation at each step

---

## 📱 Responsive Design

### **Desktop:**
- Teams side-by-side
- VS divider in center
- Wide layout (1200px max)
- Large buttons

### **Mobile:**
- Teams stacked vertically
- VS divider between teams
- Full-width buttons
- Optimized spacing

---

## 🧪 Testing Scenarios

### **Create Flow:**
- [ ] Click "Create Team Game" generates code
- [ ] User is marked as host
- [ ] Lobby displays correctly
- [ ] Can set difficulty
- [ ] Can join team
- [ ] Can copy game code
- [ ] Start button disabled until valid
- [ ] Start button works when valid

### **Join Flow:**
- [ ] Click "Join with Code" opens input page
- [ ] Invalid code shows error
- [ ] Valid code navigates to lobby
- [ ] User is marked as player (not host)
- [ ] Cannot change difficulty
- [ ] Cannot start game
- [ ] Can join team
- [ ] Sees "waiting for host" message

### **Lobby:**
- [ ] Game code displays correctly
- [ ] Teams update in real-time
- [ ] Join/Leave team works
- [ ] Player count updates
- [ ] "You" badge shows correctly
- [ ] Instructions display properly

### **Validation:**
- [ ] Cannot start with empty Team A
- [ ] Cannot start with empty Team B
- [ ] Cannot start without joining team
- [ ] Non-host cannot start
- [ ] Error messages display correctly

---

## 🚀 Future Enhancements

### **Phase 2:**
- [ ] Real-time lobby sync (WebSocket)
- [ ] Kick player functionality (host only)
- [ ] Team chat in lobby
- [ ] Player ready status
- [ ] Auto-balance teams option

### **Phase 3:**
- [ ] Private/Public game modes
- [ ] Game code expiration
- [ ] Lobby time limit
- [ ] Spectator mode
- [ ] Tournament brackets

---

## 📊 User Journey

### **Host Journey:**
```
1. Land on homepage
2. Click "Create Team Game"
3. See lobby with generated code
4. Copy and share code
5. Join Team A or B
6. Set difficulty
7. Wait for players
8. See players join teams
9. Click "Start Game"
10. Play 10 rounds
11. See team results
```

### **Player Journey:**
```
1. Land on homepage
2. Click "Join with Code"
3. Enter 6-character code
4. Validate and join lobby
5. See existing players
6. Join Team A or B
7. Wait for host to start
8. Game starts automatically
9. Play 10 rounds
10. See team results
```

---

**Last Updated:** February 2026  
**Version:** 2.0  
**Feature Status:** ✅ Strict Flow Implemented  
**Maintained by:** Sortonym Challenge Team
