import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import './TeamGameLobby.css';

const TeamGameLobby = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { member, token } = useAuth();

    // Retrieve state passed from CreateTeamPage or JoinGamePage
    const initialState = location.state || {}; // { gameCode: '...', isHost: true/false, isJoining: true/false }
    const [gameCode, setGameCode] = useState(initialState.gameCode || new URLSearchParams(location.search).get('code') || '');
    const [isHost, setIsHost] = useState(initialState.isHost || false);

    // Identification Helper (Derived in render scope for JSX accessibility)
    const myName = initialState.displayName || member?.name;
    const myUid = (!member?.email || member.email === 'guest@sortonym.com')
        ? `guest_${myName?.toLowerCase().trim().replace(/[^a-z0-9]/g, '_')}`
        : member.email;
    const isMe = (p) => p.id === myUid;

    // Lobby Data States
    const [teamAPlayers, setTeamAPlayers] = useState([]);
    const [teamBPlayers, setTeamBPlayers] = useState([]);
    const [unassignedPlayers, setUnassignedPlayers] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [difficulty, setDifficulty] = useState('MEDIUM');
    const [teamSize, setTeamSize] = useState('10'); // Default or from API
    const [rawPlayers, setRawPlayers] = useState([]); // Store raw player list for identification in render

    // Redirect if no gameCode (prevent direct access)
    useEffect(() => {
        if (!gameCode) {
            // Check if code is in URL params as a fallback
            const params = new URLSearchParams(location.search);
            const codeFromUrl = params.get('code');
            if (codeFromUrl) {
                setGameCode(codeFromUrl);
            } else {
                console.warn("No game code found, redirecting to home");
                navigate('/home');
            }
        }
    }, [gameCode, navigate, location.search]);

    // --- API HELPERS ---
    const authenticatedFetch = async (url, options = {}) => {
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers
        };

        try {
            const response = await fetch(url, { ...options, headers });

            // Check content type or size before parsing JSON
            const contentType = response.headers.get("content-type");
            let data = null;

            if (contentType && contentType.includes("application/json")) {
                const text = await response.text();
                try {
                    data = text ? JSON.parse(text) : {};
                } catch (e) {
                    console.error("JSON Parse Error:", e, text);
                    data = {};
                }
            } else {
                data = {};
            }

            if (!response.ok) {
                const errorMessage = data.error || data.message || `API Error: ${response.status}`;
                throw new Error(errorMessage);
            }

            return data;
        } catch (error) {
            console.error("Fetch Error:", error);
            throw error;
        }
    };

    // 1. Join Lobby on Mount - REMOVED (Handled in JoinGamePage)
    // We rely on previous page to have completed the Join action.
    // If user refreshes, the token/session should be enough for the backend to recognize them in /status.


    // 2. Poll Lobby Status (Real-time Sync)
    useEffect(() => {
        if (!gameCode) return;

        const fetchStatus = async () => {
            try {
                const data = await authenticatedFetch(`/api/lobby/status?code=${gameCode}`);

                // Update State from API
                const players = data.players || [];
                setRawPlayers(players);
                setTeamAPlayers(data.teams.A || []);
                setTeamBPlayers(data.teams.B || []);
                setUnassignedPlayers(data.teams.unassigned || []);
                setDifficulty(data.difficulty || 'MEDIUM');
                setTeamSize(data.teamSize || '10');

                // Check host status correctly
                const meInLobby = players.find(isMe);
                if (meInLobby?.isHost || data.host === myUid) {
                    setIsHost(true);
                }

                // Check my team
                const inA = (data.teams.A || []).find(isMe);
                const inB = (data.teams.B || []).find(isMe);

                if (inA) setSelectedTeam('A');
                else if (inB) setSelectedTeam('B');
                else setSelectedTeam(null);

                // If game started
                if (data.status === 'STARTED') {
                    // REQUIREMENT: Do not allow user to enter the Game Page without selecting a team
                    if (!inA && !inB) {
                        console.warn("Game started but user not on a team yet!");
                        // Ideally show a toast/alert here
                        return;
                    }

                    navigate('/team-game', {
                        state: {
                            gameCode,
                            teamA: data.teams.A,
                            teamB: data.teams.B,
                            difficulty: data.difficulty,
                            currentPlayer: member || { name: myName }, // Fallback if no member object
                            selectedTeam: inA ? 'A' : 'B',
                            teamName: data.teamName
                        }
                    });
                }

            } catch (err) {
                console.error("Polling error:", err);
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 800); // Poll every 800ms for real-time feel
        return () => clearInterval(interval);

    }, [gameCode, member, token, navigate]);


    const handleJoinTeam = async (team) => {
        try {
            const data = await authenticatedFetch('/api/lobby/update', {
                method: 'POST',
                body: JSON.stringify({
                    code: gameCode,
                    action: 'join_team',
                    team,
                    displayName: myName // Critical for guest user identification
                })
            });
            // Instant local update
            setTeamAPlayers(data.teams.A || []);
            setTeamBPlayers(data.teams.B || []);
            setSelectedTeam(team);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleStartGame = async () => {
        if (!isHost) return;

        const totalPlayers = teamAPlayers.length + teamBPlayers.length;

        // REQUIREMENT: Host must be assigned (Host participates)
        if (!selectedTeam) {
            alert("⚠️ Host must join a team (Team A or Team B) before starting the game.");
            return;
        }

        // REQUIREMENT: Minimum 2 users, One in each team
        if (totalPlayers < 2) {
            alert("⚠️ At least 2 players are required to start the game.");
            return;
        }

        if (teamAPlayers.length === 0 || teamBPlayers.length === 0) {
            alert("⚠️ Both teams must have at least one player to start!");
            return;
        }

        try {
            await authenticatedFetch('/api/lobby/update', {
                method: 'POST',
                body: JSON.stringify({
                    code: gameCode,
                    action: 'start_game',
                    displayName: myName
                })
            });
            // Navigation will be handled by polling on the next tick
        } catch (err) {
            alert(err.message);
        }
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(gameCode);
        alert('Game code copied to clipboard!');
    };

    const handleLeaveTeam = async () => {
        try {
            const data = await authenticatedFetch('/api/lobby/update', {
                method: 'POST',
                body: JSON.stringify({
                    code: gameCode,
                    action: 'leave_team',
                    displayName: myName
                })
            });
            // Instant local update
            setTeamAPlayers(data.teams.A || []);
            setTeamBPlayers(data.teams.B || []);
            setSelectedTeam(null);
        } catch (err) {
            alert(err.message);
        }
    };

    // Lobby View
    return (
        <div className="team-lobby-page">
            <main className="team-lobby-main">

                {/* 1. Navigation & Header Card */}
                <div className="lobby-header-section">
                    <div className="lobby-nav" style={{ marginBottom: '1rem' }}>
                        <button className="back-nav-btn" onClick={() => navigate('/home')}>
                            <i className="bi bi-arrow-left"></i> Back to Home
                        </button>
                    </div>

                    <div className="modern-lobby-header">
                        <div className="host-info">
                            {/* Logic: If no team selected, show "Select Team". Else show Lobby. */}
                            <h1>{!selectedTeam ? 'Step 2: Select Your Team' : (isHost ? 'Your Lobby' : 'Team Game Lobby')}</h1>

                            <div className="player-identity-badge" style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div className="host-badge">
                                    <i className="bi bi-person-circle"></i> {initialState.displayName || member?.name || 'Player'}
                                </div>
                                <div className={`host-badge ${!selectedTeam ? 'warning' : ''}`} style={{ backgroundColor: !selectedTeam ? '#fff3cd' : '', color: !selectedTeam ? '#856404' : '' }}>
                                    <i className={`bi bi-${!selectedTeam ? 'exclamation-circle' : 'shield-fill-check'}`}></i>
                                    {!selectedTeam ? ' Select Team Required' : ` Team ${selectedTeam}`}
                                </div>
                            </div>
                        </div>

                        <div className="game-code-container">
                            <div className="code-wrapper">
                                <span className="code-display">{gameCode}</span>
                                <button
                                    className="copy-code-btn"
                                    onClick={handleCopyCode}
                                    title="Copy Game Code"
                                >
                                    <i className="bi bi-clipboard"></i>
                                </button>
                            </div>
                            <span className="share-hint">Share code with friends to join</span>
                        </div>
                    </div>
                </div>

                {/* 2. Stats & Settings Bar */}
                <div className="lobby-stats-bar">
                    <div className="stat-item">
                        <div className="stat-icon-box">
                            <i className="bi bi-people-fill"></i>
                        </div>
                        <div className="stat-details">
                            <span className="stat-label-s">Players</span>
                            <span className="stat-value-l">{teamAPlayers.length + teamBPlayers.length} / {teamSize === 'custom' ? 'Custom' : teamSize}</span>
                        </div>
                    </div>

                    <div className="stat-item">
                        <div className="stat-icon-box">
                            <i className="bi bi-person-badge"></i>
                        </div>
                        <div className="stat-details">
                            <span className="stat-label-s">Your Role</span>
                            <span className="stat-value-l">{isHost ? 'Lobby Host' : 'Player'}</span>
                        </div>
                    </div>

                    <div className="stat-item">
                        <div className="stat-icon-box">
                            <i className="bi bi-speedometer2"></i>
                        </div>
                        <div className="stat-details">
                            <span className="stat-label-s">Difficulty</span>
                            {isHost ? (
                                <select
                                    className="modern-select"
                                    value={difficulty}
                                    onChange={async (e) => {
                                        const newVal = e.target.value;
                                        setDifficulty(newVal); // Instant feedback
                                        try {
                                            const data = await authenticatedFetch('/api/lobby/update', {
                                                method: 'POST',
                                                body: JSON.stringify({
                                                    code: gameCode,
                                                    action: 'set_difficulty',
                                                    difficulty: e.target.value,
                                                    displayName: myName
                                                })
                                            });
                                            setDifficulty(data.difficulty);
                                        } catch (err) {
                                            console.error(err);
                                        }
                                    }}
                                >
                                    <option value="EASY">Easy</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HARD">Hard</option>
                                </select>
                            ) : (
                                <span className="stat-value-l">{difficulty}</span>
                            )}
                            <div className="time-preview" style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px', fontWeight: '600' }}>
                                <i className="bi bi-clock" style={{ marginRight: '4px' }}></i>
                                {difficulty === 'EASY' ? '7.5 Mins' : difficulty === 'HARD' ? '3.75 Mins' : '5 Mins'} Total
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Team Battle Arena */}
                <div className="teams-battle-arena">

                    {/* Team A Card */}
                    <div className="modern-team-card">
                        <div className="team-a-header">
                            <div className="team-header-content">
                                <h2>Team A</h2>
                                <span className="player-count-badge">{teamAPlayers.length} Players</span>
                            </div>
                            <i className="bi bi-shield-fill-check" style={{ fontSize: '1.5rem', opacity: 0.8 }}></i>
                        </div>

                        <div className="player-list-area">
                            {teamAPlayers.length === 0 ? (
                                <div className="empty-state">
                                    <i className="bi bi-person-plus"></i>
                                    <p>No players yet</p>
                                </div>
                            ) : (
                                teamAPlayers.map(player => (
                                    <div key={player.id} className="player-row">
                                        <img
                                            src={player.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`}
                                            alt="avatar"
                                            className="player-avatar"
                                        />
                                        <span className="player-name">{player.name}</span>
                                        {isMe(player) && <span className="you-pill">YOU</span>}
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="team-action-footer">
                            {selectedTeam === 'A' ? (
                                <button className="btn-leave-team" onClick={handleLeaveTeam}>
                                    Leave Team
                                </button>
                            ) : (
                                <button
                                    className="btn-join-team join-blue"
                                    onClick={() => handleJoinTeam('A')}
                                    disabled={selectedTeam === 'B'}
                                >
                                    Join Team A
                                </button>
                            )}
                        </div>
                    </div>

                    {/* VS Badge */}
                    <div className="vs-divider-modern">
                        <div className="vs-circle">VS</div>
                    </div>

                    {/* Team B Card */}
                    <div className="modern-team-card">
                        <div className="team-b-header">
                            <div className="team-header-content">
                                <h2>Team B</h2>
                                <span className="player-count-badge">{teamBPlayers.length} Players</span>
                            </div>
                            <i className="bi bi-lightning-charge-fill" style={{ fontSize: '1.5rem', opacity: 0.8 }}></i>
                        </div>

                        <div className="player-list-area">
                            {teamBPlayers.length === 0 ? (
                                <div className="empty-state">
                                    <i className="bi bi-person-plus"></i>
                                    <p>No players yet</p>
                                </div>
                            ) : (
                                teamBPlayers.map(player => (
                                    <div key={player.id} className="player-row">
                                        <img
                                            src={player.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`}
                                            alt="avatar"
                                            className="player-avatar"
                                        />
                                        <span className="player-name">{player.name}</span>
                                        {player.id === member?.email && <span className="you-pill">YOU</span>}
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="team-action-footer">
                            {selectedTeam === 'B' ? (
                                <button className="btn-leave-team" onClick={handleLeaveTeam}>
                                    Leave Team
                                </button>
                            ) : (
                                <button
                                    className="btn-join-team join-red"
                                    onClick={() => handleJoinTeam('B')}
                                    disabled={selectedTeam === 'A'}
                                >
                                    Join Team B
                                </button>
                            )}
                        </div>
                    </div>

                </div>

                {/* 4. Unassigned Players Section (Added for visibility) */}
                <div className="unassigned-players-section" style={{
                    marginTop: '2rem',
                    padding: '1.5rem',
                    background: 'rgba(255,255,255,0.7)',
                    borderRadius: '16px',
                    border: '1px dashed #cbd5e1'
                }}>
                    <h3 style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Waiting to join a team ({unassignedPlayers.length})
                    </h3>
                    <div className="unassigned-list" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {unassignedPlayers.length === 0 ? (
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>Everyone has picked a team</span>
                        ) : (
                            unassignedPlayers.map(player => (
                                <div key={player.id} className="player-badge-mini" style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '6px 12px',
                                    background: '#fff',
                                    borderRadius: '999px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                    border: isMe(player) ? '1px solid #3b82f6' : '1px solid #e2e8f0'
                                }}>
                                    <img
                                        src={player.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`}
                                        alt=""
                                        style={{ width: '20px', height: '20px', borderRadius: '50%' }}
                                    />
                                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{player.name}</span>
                                    {isMe(player) && <span style={{ fontSize: '0.65rem', background: '#3b82f6', color: '#fff', padding: '1px 6px', borderRadius: '4px' }}>YOU</span>}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 5. Footer & Start Game */}
                <div className="lobby-footer-actions">
                    {!selectedTeam ? (
                        <div className="select-team-banner" style={{
                            width: '100%',
                            textAlign: 'center',
                            padding: '1rem',
                            background: '#fff3cd',
                            color: '#856404',
                            borderRadius: '12px',
                            fontWeight: '600',
                            border: '1px solid #ffeeba'
                        }}>
                            <i className="bi bi-arrow-up-circle-fill" style={{ marginRight: '8px' }}></i>
                            Please join Team A or Team B above to enter the lobby
                        </div>
                    ) : (
                        isHost ? (
                            <button
                                className="btn-start-game-large"
                                onClick={handleStartGame}
                                disabled={teamAPlayers.length === 0 || teamBPlayers.length === 0 || (teamAPlayers.length + teamBPlayers.length) < 2}
                                title={
                                    teamAPlayers.length === 0 || teamBPlayers.length === 0
                                        ? "Wait for at least 1 player in each team"
                                        : (teamAPlayers.length + teamBPlayers.length) < 2
                                            ? "Wait for at least 2 players total"
                                            : "Start Game"
                                }
                                style={{ opacity: (teamAPlayers.length === 0 || teamBPlayers.length === 0 || (teamAPlayers.length + teamBPlayers.length) < 2) ? 0.6 : 1 }}
                            >
                                <i className="bi bi-play-circle-fill"></i>
                                Start Team Battle
                            </button>
                        ) : (
                            <div className="waiting-pulse">
                                <div className="pulse-dot"></div>
                                Waiting for host to start...
                            </div>
                        )
                    )}
                </div>

            </main>
        </div>
    );
};

export default TeamGameLobby;
