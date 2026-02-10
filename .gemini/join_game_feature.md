# Join Game with Code - Feature Documentation

## Overview
The Join Game feature allows users to join an existing multiplayer/team game by entering a unique 6-character Game Code. This provides a seamless way for players to connect and play together.

---

## 🎯 Features

### 1. **Dedicated Join Game Page**
- Clean, modern, professional UI
- Card-style centered layout
- Gradient green header with icon
- Clear visual hierarchy

### 2. **Game Code Input**
- Large, prominent input field
- 6-character limit
- Auto-uppercase conversion
- Letter spacing for readability
- Character counter (X/6)
- Focus state with green border and shadow

### 3. **Validation & Error Handling**
- Empty submission prevention
- 6-character length validation
- Invalid code error messages
- Visual error states (red border, error message)
- Real-time validation feedback

### 4. **User Experience**
- Auto-focus on input field
- Enter key support
- Loading state with spinner
- Disabled state during submission
- Clear error messages with icons

### 5. **Alternative Actions**
- Back button to return home
- "Create New Game" option for users without a code
- Helper text explaining how to get a code

---

## 📱 UI Components

### Header Section
```
┌─────────────────────────────────┐
│ ← [Back]                        │
│                                 │
│         🎮 (Icon)               │
│                                 │
│       Join Game                 │
│ Enter the game code to join     │
│       your team                 │
└─────────────────────────────────┘
```

### Input Section
```
┌─────────────────────────────────┐
│ GAME CODE                       │
│ ┌─────────────────────────────┐ │
│ │       ABC123                │ │
│ └─────────────────────────────┘ │
│ 6/6 characters                  │
│                                 │
│ ┌─────────────────────────────┐ │
│ │  🔑 Join Game               │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### Footer Section
```
┌─────────────────────────────────┐
│ ℹ️ Ask your game host for the   │
│   6-character game code         │
└─────────────────────────────────┘
```

---

## 🎨 Design Specifications

### Colors (Brand Style Guide)
- **Header Background**: Linear gradient `#00A63F` → `#0E5F3A`
- **Card Background**: `#FFFFFF`
- **Input Border**: `#E5E7EB` (default), `#00A63F` (focus), `#DC2626` (error)
- **Button**: `#00A63F` with green shadow
- **Text**: `#000000` (primary), `#53565A` (secondary)

### Typography
- **Heading**: 30px, bold, white
- **Helper Text**: 16px, white with 90% opacity
- **Input**: 24px, bold, centered, uppercase, 4px letter-spacing
- **Button**: 18px, bold

### Spacing
- **Card Padding**: 32px
- **Input Padding**: 24px
- **Button Padding**: 24px 32px
- **Border Radius**: 16px (card), 12px (input/button)

### Shadows
- **Card**: `0 20px 25px rgba(0, 0, 0, 0.15)`
- **Button**: `0 4px 12px rgba(0, 166, 63, 0.25)`
- **Input Focus**: `0 0 0 4px rgba(0, 166, 63, 0.1)`

---

## 🔧 Technical Implementation

### Component Structure
```jsx
JoinGamePage
├── join-game-container
│   ├── join-game-card
│   │   ├── join-game-header
│   │   │   ├── back-button
│   │   │   ├── header-icon
│   │   │   ├── h1 (title)
│   │   │   └── helper-text
│   │   ├── join-game-body
│   │   │   ├── input-group
│   │   │   │   ├── input-label
│   │   │   │   ├── game-code-input
│   │   │   │   ├── input-hint
│   │   │   │   └── error-message (conditional)
│   │   │   └── btn-join-game
│   │   └── join-game-footer
│   │       └── info-box
│   └── alternative-actions
│       ├── alt-text
│       └── btn-create-game
```

### State Management
```javascript
const [gameCode, setGameCode] = useState('');      // Current input value
const [error, setError] = useState('');            // Error message
const [isLoading, setIsLoading] = useState(false); // Loading state
```

### Validation Logic
```javascript
// Auto-format: uppercase, alphanumeric only, max 6 chars
const handleGameCodeChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length <= 6) {
        setGameCode(value);
        setError('');
    }
};

// Validation on submit
if (!gameCode.trim()) {
    setError('Please enter a game code');
    return;
}

if (gameCode.length !== 6) {
    setError('Game code must be 6 characters');
    return;
}
```

### Navigation Flow
```
Landing Page → Join Game Page → Team Lobby
     ↓              ↓                ↓
  /home        /join-game      /team-lobby
```

---

## 🚀 User Flow

### Happy Path
1. User clicks "Join with Code" on Landing Page
2. Navigates to Join Game Page (`/join-game`)
3. Input field is auto-focused
4. User types game code (e.g., "ABC123")
5. Code is auto-formatted to uppercase
6. Character counter updates (6/6)
7. User clicks "Join Game" or presses Enter
8. Loading spinner appears
9. Code is validated (simulated API call)
10. User is redirected to Team Lobby with game code
11. User joins the existing game

### Error Paths

**Empty Submission:**
```
User clicks "Join Game" without entering code
→ Error: "Please enter a game code"
→ Input border turns red
→ Error message appears below input
```

**Incomplete Code:**
```
User enters "ABC" (only 3 characters)
→ Error: "Game code must be 6 characters"
→ Input border turns red
→ Character counter shows 3/6
```

**Invalid Code:**
```
User enters "XYZ999" (code doesn't exist)
→ Loading spinner appears
→ API returns error
→ Error: "Invalid game code. Please check and try again."
→ Input border turns red
```

---

## 📋 Validation Rules

| Rule | Description | Error Message |
|------|-------------|---------------|
| **Required** | Code cannot be empty | "Please enter a game code" |
| **Length** | Must be exactly 6 characters | "Game code must be 6 characters" |
| **Format** | Alphanumeric only (A-Z, 0-9) | Auto-filtered, no error |
| **Case** | Auto-converted to uppercase | N/A |
| **Exists** | Code must exist in database | "Invalid game code. Please check and try again." |

---

## 🎯 Accessibility Features

### Keyboard Navigation
- ✅ Tab to input field
- ✅ Enter to submit
- ✅ Escape to go back (future enhancement)

### Screen Readers
- ✅ Proper label for input (`htmlFor="gameCode"`)
- ✅ Error messages announced
- ✅ Loading state announced
- ✅ Button states (disabled) announced

### Visual Accessibility
- ✅ High contrast text (21:1 for black on white)
- ✅ Clear focus states
- ✅ Large, readable input (24px font)
- ✅ Icon + text for buttons

### Motion
- ✅ Respects `prefers-reduced-motion`
- ✅ Animations can be disabled

---

## 📱 Responsive Design

### Desktop (> 768px)
- Card width: 500px max
- Input font: 24px
- Button font: 18px
- Centered vertically and horizontally

### Mobile (≤ 768px)
- Card width: 100% with 16px margin
- Input font: 20px
- Button font: 16px
- Aligned to top with padding
- Smaller icon (64px vs 80px)

---

## 🔗 Integration Points

### Landing Page
```jsx
<button onClick={() => navigate('/join-game')}>
    <i className="bi bi-key-fill"></i> Join with Code
</button>
```

### Team Lobby
```jsx
// Receives game code from Join Game page
const { gameCode, isJoining } = location.state || {};

if (isJoining) {
    // Fetch game data using gameCode
    // Join existing game
}
```

---

## 🧪 Testing Scenarios

### Unit Tests
- [ ] Input accepts alphanumeric characters only
- [ ] Input auto-converts to uppercase
- [ ] Input limits to 6 characters
- [ ] Empty submission shows error
- [ ] Incomplete code shows error
- [ ] Valid code navigates to lobby
- [ ] Enter key triggers submission
- [ ] Loading state disables input and button

### Integration Tests
- [ ] Navigation from Landing Page works
- [ ] Navigation to Team Lobby works
- [ ] Game code is passed correctly
- [ ] Back button returns to home
- [ ] Create New Game button works

### E2E Tests
- [ ] Complete flow: Landing → Join → Lobby
- [ ] Error handling for invalid codes
- [ ] Loading states display correctly
- [ ] Mobile responsive layout works

---

## 🎨 Visual States

### Input States
| State | Border | Background | Shadow |
|-------|--------|------------|--------|
| **Default** | Light gray | White | None |
| **Focus** | Green | White | Green glow |
| **Error** | Red | Light red | None |
| **Disabled** | Light gray | White | None (opacity 60%) |

### Button States
| State | Background | Text | Transform |
|-------|------------|------|-----------|
| **Default** | Green | White | None |
| **Hover** | Dark green | White | translateY(-2px) |
| **Active** | Dark green | White | translateY(0) |
| **Loading** | Green | White + Spinner | None |
| **Disabled** | Green (50% opacity) | White | None |

---

## 🚀 Future Enhancements

### Phase 2
- [ ] QR code scanning for game codes
- [ ] Recent game codes history
- [ ] Auto-fill from clipboard
- [ ] Game code suggestions

### Phase 3
- [ ] Real-time code validation (as you type)
- [ ] Game preview before joining
- [ ] Friend invites via code
- [ ] Custom code generation

---

## 📊 Analytics Events

Track the following events:
- `join_game_page_viewed`
- `game_code_entered`
- `game_code_submitted`
- `game_code_valid`
- `game_code_invalid`
- `join_game_success`
- `join_game_error`
- `create_new_game_clicked`
- `back_button_clicked`

---

## 🐛 Known Issues & Limitations

### Current Limitations
1. **No Real-time Validation**: Code is only validated on submit
2. **Simulated API**: Currently uses setTimeout for demo
3. **No Code Format Hints**: Doesn't show format like "XXX-XXX"
4. **No Auto-complete**: Doesn't save recent codes

### Future Fixes
- Add real-time API validation
- Implement code format with dashes
- Add local storage for recent codes
- Add copy-paste detection and formatting

---

## 📝 Code Examples

### Using the Component
```jsx
import JoinGamePage from './pages/TeamGame/JoinGamePage';

// In App.jsx
<Route path="/join-game" element={<JoinGamePage />} />
```

### Navigating to Join Game
```jsx
// From any component
navigate('/join-game');

// With state (optional)
navigate('/join-game', {
    state: { returnTo: '/home' }
});
```

### Handling Join Success
```jsx
// In Team Lobby
const { gameCode, isJoining } = location.state || {};

if (isJoining && gameCode) {
    // Fetch game data
    const gameData = await fetchGameByCode(gameCode);
    // Join the game
    joinGame(gameData);
}
```

---

**Last Updated:** February 2026  
**Version:** 1.0  
**Feature Status:** ✅ Implemented  
**Maintained by:** Sortonym Challenge Team
