import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import './TeamResultsPage.css';

const TeamResultsPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { member, token } = useAuth();

    const [resultData, setResultData] = useState(() => {
        const saved = localStorage.getItem('lastTeamResults');
        return location.state || (saved ? JSON.parse(saved) : {});
    });

    useEffect(() => {
        if (location.state) {
            localStorage.setItem('lastTeamResults', JSON.stringify(location.state));
            setResultData(location.state);
        }
    }, [location.state]);

    const {
        gameCode,
        teamA = [],
        teamB = [],
        difficulty
    } = resultData;

    // Live Score States
    const [teamAScores, setTeamAScores] = useState(resultData.teamAScores || []);
    const [teamBScores, setTeamBScores] = useState(resultData.teamBScores || []);
    const [teamAList, setTeamAList] = useState(resultData.teamA || []);
    const [teamBList, setTeamBList] = useState(resultData.teamB || []);
    const [currentPlayerScores, setCurrentPlayerScores] = useState(resultData.currentPlayerScores || []);

    // Poll for Real-Time Updates
    useEffect(() => {
        if (!gameCode || !token) return;

        const fetchLiveScores = async () => {
            try {
                const res = await fetch(`/api/lobby/status?code=${gameCode}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.teams) {
                        setTeamAList(data.teams.A || []);
                        setTeamBList(data.teams.B || []);
                    }

                    if (data.results && Array.isArray(data.results)) {
                        const newA = data.results.filter(r => r.team === 'A');
                        const newB = data.results.filter(r => r.team === 'B');

                        // Merge with existing or override? Override is safer for sync.
                        if (newA.length > 0 || newB.length > 0) {
                            setTeamAScores(newA);
                            setTeamBScores(newB);

                            if (member?.email) {
                                const myScores = data.results.filter(r => r.player_email === member.email);
                                if (myScores.length > 0) setCurrentPlayerScores(myScores);
                            }
                        }
                    }
                }
            } catch (e) {
                console.error("Score sync error", e);
            }
        };

        fetchLiveScores();
        const interval = setInterval(fetchLiveScores, 2000);
        return () => clearInterval(interval);
    }, [gameCode, token, member]);

    const getTeamMemberScores = (scores, members) => {
        const stats = {};
        // Initialize with members
        members.forEach(m => {
            const key = m.id || m.email;
            if (key) {
                stats[key] = {
                    id: key,
                    name: m.name || (m.display_name) || key.split('@')[0],
                    totalScore: 0
                };
            }
        });

        // Sum scores
        scores.forEach(s => {
            const email = s.player_email;
            if (!stats[email]) {
                // Player not in member list (fallback)
                stats[email] = {
                    id: email,
                    name: s.player_name || s.player || email.split('@')[0],
                    totalScore: 0
                };
            }
            stats[email].totalScore += (s.score || 0);
        });

        return Object.values(stats).sort((a, b) => b.totalScore - a.totalScore);
    };

    // Calculate team totals
    const calculateTeamTotal = (scores) => {
        return scores.reduce((sum, score) => sum + score.score, 0);
    };

    // Calculate team average
    const calculateTeamAverage = (scores, teamSize) => {
        if (teamSize === 0) return 0;
        const total = calculateTeamTotal(scores);
        return (total / (teamSize * 5)).toFixed(2); // Average per round per player
    };

    // Find overall MVP across both teams
    const findOverallMVP = () => {
        const allScores = [...teamAScores, ...teamBScores];
        if (allScores.length === 0) return null;

        const playerTotals = {};
        allScores.forEach(score => {
            if (!score.player) return;
            if (!playerTotals[score.player]) {
                playerTotals[score.player] = 0;
            }
            playerTotals[score.player] += score.score;
        });

        let mvpName = null;
        let mvpScore = -1;

        Object.entries(playerTotals).forEach(([player, total]) => {
            if (total > mvpScore) {
                mvpScore = total;
                mvpName = player;
            }
        });

        return mvpName ? { name: mvpName, score: mvpScore } : null;
    };


    const teamATotal = calculateTeamTotal(teamAScores);
    const teamBTotal = calculateTeamTotal(teamBScores);
    const teamAAverage = calculateTeamAverage(teamAScores, teamAList.length);
    const teamBAverage = calculateTeamAverage(teamBScores, teamBList.length);

    const overallMVP = findOverallMVP();

    const winningTeam = teamATotal > teamBTotal ? 'A' : teamBTotal > teamATotal ? 'B' : 'TIE';
    const winningTeamName = winningTeam === 'A' ? "Team A" : winningTeam === 'B' ? "Team B" : "It's a Tie";

    const playerTotal = currentPlayerScores.reduce((sum, score) => sum + score.score, 0);
    const playerAverage = (playerTotal / 5).toFixed(2);

    return (
        <div className="team-results-page-v2">
            <div className="results-container-v2">

                {/* Header Section */}
                <div className="header-v2">
                    <h1>Team Game Results</h1>
                    <div className="meta-info-row">
                        <span><i className="bi bi-hash"></i> Game Code: <strong>{gameCode}</strong></span>
                        <span className="divider">|</span>
                        <span><i className="bi bi-speedometer2"></i> Difficulty: <strong>{difficulty}</strong></span>
                        <span className="divider">|</span>
                        <span><i className="bi bi-arrow-repeat"></i> Rounds: <strong>5/5</strong></span>
                    </div>
                </div>

                {/* Winner Banner */}
                <div className="winner-banner-v2">
                    <h2><i className="bi bi-trophy-fill"></i> {winningTeamName} Wins! <i className="bi bi-trophy-fill"></i></h2>
                    <p>Congratulations on your victory!</p>
                </div>

                {/* Comparison Section */}
                <div className="comparison-section-v2">

                    {/* Team A Card */}
                    <div className={`team-card-v2 ${winningTeam === 'A' ? 'winner-card' : ''}`}>
                        <div className="team-name-header">
                            <h3>Team A</h3>
                            <div className="underline"></div>
                            {winningTeam === 'A' && <div className="winner-pill"><i className="bi bi-trophy-fill"></i> WINNER</div>}
                        </div>

                        <div className="stat-box-large">
                            <span className="label">Total Score</span>
                            <span className="value">{teamATotal.toFixed(1)}</span>
                        </div>

                        <div className="stat-box-medium">
                            <span className="label">Average/Round</span>
                            <span className="value">{teamAAverage}</span>
                        </div>

                        <div className="stat-box-players">
                            <div className="icon-circle"><i className="bi bi-people-fill"></i></div>
                            <div className="text-info">
                                <span className="label">Players</span>
                                <span className="value">{teamAList.length}</span>
                            </div>
                        </div>

                        <div className="player-results-list">
                            {getTeamMemberScores(teamAScores, teamAList).map(p => (
                                <div key={p.id} className="player-result-row">
                                    <div className="player-result-name">
                                        {p.name}
                                        {p.id === member?.email && <span className="you-badge">YOU</span>}
                                    </div>
                                    <div className="player-result-score">
                                        {p.totalScore.toFixed(1)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* VS Circle */}
                    <div className="vs-circle-v2">VS</div>

                    {/* Team B Card */}
                    <div className={`team-card-v2 ${winningTeam === 'B' ? 'winner-card' : ''}`}>
                        <div className="team-name-header">
                            <h3>Team B</h3>
                            <div className="underline"></div>
                            {winningTeam === 'B' && <div className="winner-pill"><i className="bi bi-trophy-fill"></i> WINNER</div>}
                        </div>

                        <div className="stat-box-large">
                            <span className="label">Total Score</span>
                            <span className="value">{teamBTotal.toFixed(1)}</span>
                        </div>

                        <div className="stat-box-medium">
                            <span className="label">Average/Round</span>
                            <span className="value">{teamBAverage}</span>
                        </div>

                        <div className="stat-box-players">
                            <div className="icon-circle"><i className="bi bi-people-fill"></i></div>
                            <div className="text-info">
                                <span className="label">Players</span>
                                <span className="value">{teamBList.length}</span>
                            </div>
                        </div>

                        <div className="player-results-list">
                            {getTeamMemberScores(teamBScores, teamBList).map(p => (
                                <div key={p.id} className="player-result-row">
                                    <div className="player-result-name">
                                        {p.name}
                                        {p.id === member?.email && <span className="you-badge">YOU</span>}
                                    </div>
                                    <div className="player-result-score">
                                        {p.totalScore.toFixed(0)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* MVP Banner */}
                {overallMVP && (
                    <div className="mvp-banner-v2">
                        <div className="mvp-icon-circle">
                            <i className="bi bi-star-fill"></i>
                        </div>
                        <div className="mvp-info">
                            <span className="mvp-label"><i className="bi bi-award-fill"></i> MVP OF THE GAME</span>
                            <h3 className="mvp-name">{overallMVP.name}</h3>
                            <span className="mvp-subtext">Outstanding Performance!</span>
                        </div>
                        <div className="mvp-score">
                            <div className="label">Total Score</div>
                            <div className="value">{overallMVP.score.toFixed(1)}</div>
                        </div>
                    </div>
                )}

                {/* User Performance Card */}
                <div className="user-performance-card-v2">
                    <div className="card-header">
                        <i className="bi bi-bar-chart-line-fill"></i> Your Performance
                    </div>
                    <div className="stats-grid">
                        <div className="stat-green-box">
                            <i className="bi bi-trophy-fill icon"></i>
                            <span className="label">Total Score</span>
                            <span className="value">{playerTotal.toFixed(1)}</span>
                        </div>
                        <div className="stat-white-box">
                            <i className="bi bi-bar-chart-fill icon"></i>
                            <span className="label">Average/Round</span>
                            <span className="value">{playerAverage}</span>
                        </div>
                        <div className="stat-green-box">
                            <i className="bi bi-arrow-repeat icon"></i>
                            <span className="label">Rounds Played</span>
                            <span className="value">5</span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="actions-footer-v2">
                    <button className="btn-home-v2" onClick={() => navigate('/home')}>
                        <i className="bi bi-house-fill"></i> Back to Home
                    </button>
                    <button className="btn-play-again-v2" onClick={() => navigate('/team-lobby', { state: { gameCode, isJoining: true } })}>
                        <i className="bi bi-arrow-clockwise"></i> Play Again
                    </button>
                </div>

            </div>
        </div>
    );
};

export default TeamResultsPage;
