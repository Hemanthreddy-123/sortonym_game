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
    const [gameCode, setGameCode] = useState(initialState.gameCode || '');
    const [isHost, setIsHost] = useState(initialState.isHost || false);

    // Lobby Data States
    const [teamAPlayers, setTeamAPlayers] = useState([]);
    const [teamBPlayers, setTeamBPlayers] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [difficulty, setDifficulty] = useState('MEDIUM');
    const [teamSize, setTeamSize] = useState('10'); // Default or from API

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

    // 1. Join Lobby on Mount (Only if explicitly joining via flow)
    useEffect(() => {
        const { isJoining } = initialState;

        if (isJoining && gameCode) {
            // API Join call
            authenticatedFetch('/api/lobby/join', {
                method: 'POST',
                body: JSON.stringify({ code: gameCode })
            }).catch(err => {
                console.error("Join error:", err);
                alert(err.message);
                navigate('/home');
            });
        }
    }, []); // Run once on mount

    // 2. Poll Lobby Status (Real-time Sync)
    useEffect(() => {
        if (!gameCode) return;

        const fetchStatus = async () => {
            try {
                const data = await authenticatedFetch(`/api/lobby/status?code=${gameCode}`);

                // Update State from API
                setTeamAPlayers(data.teams.A || []);
                setTeamBPlayers(data.teams.B || []);
                setDifficulty(data.difficulty || 'MEDIUM');
                setTeamSize(data.teamSize || '10');

                // Check if I am host
                if (data.host === member?.email) {
                    setIsHost(true);
                }

                // Check my team
                const inA = (data.teams.A || []).find(p => p.id === member?.email);
                const inB = (data.teams.B || []).find(p => p.id === member?.email);
                if (inA) setSelectedTeam('A');
                else if (inB) setSelectedTeam('B');
                else setSelectedTeam(null);

                // If game started
                if (data.status === 'STARTED') {
                    navigate('/team-game', {
                        state: {
                            gameCode,
                            teamA: data.teams.A,
                            teamB: data.teams.B,
                            difficulty: data.difficulty,
                            currentPlayer: member,
                            selectedTeam: inA ? 'A' : 'B',
                            teamName: data.teamName
                        }
                    });
                }

            } catch (err) {
                console.error("Polling error:", err);
                // potentially handle "Lobby not found" by redirecting home
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 1000); // Poll every 1s
        return () => clearInterval(interval);

    }, [gameCode, member, token, navigate]);


    const handleJoinTeam = async (team) => {
        if (!member) return;
        try {
            await authenticatedFetch('/api/lobby/update', {
                method: 'POST',
                body: JSON.stringify({ code: gameCode, action: 'join_team', team })
            });
            // Polling will update UI
        } catch (err) {
            alert(err.message);
        }
    };

    const handleStartGame = async () => {
        if (!isHost) return;
        try {
            await authenticatedFetch('/api/lobby/update', {
                method: 'POST',
                body: JSON.stringify({ code: gameCode, action: 'start_game' })
            });
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
            await authenticatedFetch('/api/lobby/update', {
                method: 'POST',
                body: JSON.stringify({ code: gameCode, action: 'leave_team' })
            });
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
                            <h1>{isHost ? 'Your Lobby' : 'Team Game Lobby'}</h1>
                            <div className="host-badge">
                                <i className="bi bi-person-fill-gear"></i> HOST: {isHost ? 'You' : 'Game Host'}
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
                                    onChange={(e) => {
                                        const newVal = e.target.value;
                                        setDifficulty(newVal);
                                        authenticatedFetch('/api/lobby/update', {
                                            method: 'POST',
                                            body: JSON.stringify({ code: gameCode, action: 'set_difficulty', difficulty: newVal })
                                        }).catch(console.error);
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
                                        {player.id === member?.email && <span className="you-pill">YOU</span>}
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

                {/* 4. Footer & Start Game */}
                <div className="lobby-footer-actions">
                    {isHost ? (
                        <button
                            className="btn-start-game-large"
                            onClick={handleStartGame}
                            disabled={teamAPlayers.length === 0 || teamBPlayers.length === 0}
                        >
                            <i className="bi bi-play-circle-fill"></i>
                            Start Team Battle
                        </button>
                    ) : (
                        <div className="waiting-pulse">
                            <div className="pulse-dot"></div>
                            Waiting for host to start...
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
};

export default TeamGameLobby;
