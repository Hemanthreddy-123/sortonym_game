# Sortonym Challenge Game - Documentation

## Project Overview
**Sortonym Challenge** is a fast-paced, educational vocabulary game designed to test and improve a player's knowledge of synonyms and antonyms. Players are presented with an "Anchor Word" and a set of candidate words which they must correctly categorize into "Synonyms" or "Antonyms" boxes before the timer runs out.

## High-Level Architecture
The project follows a standard full-stack architecture:
- **Frontend**: A modern React application built with Vite, utilizing React Router for navigation and Vanilla CSS for a premium, custom UI.
- **Backend**: A Django-based REST API that manages word data, user authentication, game logic, and leaderboard rankings.
- **Database**: SQLite is used for local development, storing word pairs and user performance records.

---

## Core Features

### 1. User Authentication
The system supports a robust authentication flow:
- **Standard Login/Register**: Users can create accounts with email, phone, and password.
- **OTP Verification**: Supports One-Time Passwords via WhatsApp or Email for secure access.
- **Admin Override**: A specialized test account (`admin.test@sortonym.com`) for development and testing.
- **Session Management**: Secure signed tokens are used to maintain user sessions across the frontend and backend.

### 2. Game Mechanics
- **Anchor Word**: Every round revolves around a central word.
- **Word Selection**: The backend randomly selects synonyms and antonyms from the database based on the chosen difficulty.
- **Difficulty Levels**:
    - **Easy**: 90 seconds, 3 pairs (6 words total), 1.0x multiplier.
    - **Medium**: 60 seconds, 4 pairs (8 words total), 1.2x multiplier.
    - **Hard**: 45 seconds, 5 pairs (10 words total), 1.5x multiplier.
- **Daily Challenge**: A special mode where all players face the same word set once per day, competing for the top spot on the daily leaderboard.

### 3. Scoring System
The final score is calculated using three factors:
1. **Base Score**: 1.0 point for every word correctly categorized.
2. **Time Bonus**: Points awarded for speed, calculated as:
   `Bonus = (Remaining Time * 0.1) * (Accuracy Ratio)`
3. **Difficulty Multiplier**: The subtotal is multiplied by the level's multiplier (e.g., 1.5x for Hard).

### 4. Leaderboard & Results
- **Global Leaderboard**: Tracks the all-time top performers.
- **Daily Leaderboard**: Ranks players based on their performance in the Daily Challenge.
- **Performance Analytics**: After each game, players see a detailed breakdown of their score, base points, and time bonus.

---

## Technical Implementation

### Backend (Django)
- **Models**:
    - `SortonymWord`: Stores the anchor word with comma-separated lists of synonyms and antonyms.
    - `GameResult`: Records player details, score, accuracy, and time taken.
- **API Endpoints**:
    - `POST /api/game/start/`: Initializes a new game round.
    - `POST /api/game/submit/`: Validates answers and saves the score.
    - `GET /api/leaderboard/`: Retrieves ranked performance data.

### Frontend (React)
- **State Management**: Uses React Hooks (`useState`, `useEffect`) and Context API for authentication state.
- **Interaction**: Implements a drag-and-drop (or click-to-sort) interface for word classification.
- **Animations**: Subtle transitions and micro-animations for a premium feel.
- **Theme Support**: Integrated Dark Mode/Light Mode toggle.

---

## Getting Started

### Backend Setup
1. Navigate to the `backend` directory.
2. Create a virtual environment: `python -m venv venv`.
3. Install dependencies: `pip install -r requirements.txt`.
4. Run migrations: `python manage.py migrate`.
5. Seed the database: `python seed_words.py`.
6. Start the server: `python manage.py runserver`.

### Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies: `npm install`.
3. Start the development server: `npm run dev`.

---

## Future Roadmap
- **Social Sharing**: Enhanced sharing of certificates and scores on social media.
- **Multiplayer Mode**: Real-time head-to-head word battles.
- **Advanced Analytics**: Detailed insights into vocabulary strengths and weaknesses over time.
