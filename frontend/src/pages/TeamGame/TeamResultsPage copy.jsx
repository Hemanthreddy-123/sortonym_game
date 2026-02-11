import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import "./TeamResultsPage.css";

const TeamResultsPage = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { member } = useAuth();

    if (!state) {
        navigate("/");
        return null;
    }

    const {
        gameCode,
        difficulty,
        teams,
        teamTotals,
        mvp,
        rounds
    } = state;

    const teamAPlayers = teams?.A || [];
    const teamBPlayers = teams?.B || [];

    const teamAScore = teamTotals?.A || 0;
    const teamBScore = teamTotals?.B || 0;

    const winnerTeam =
        teamAScore > teamBScore
            ? "A"
            : teamBScore > teamAScore
                ? "B"
                : "DRAW";

    const winnerScore =
        winnerTeam === "A" ? teamAScore : teamBScore;

    const winnerPlayers =
        winnerTeam === "A" ? teamAPlayers : teamBPlayers;

    const averageA = rounds ? (teamAScore / rounds).toFixed(2) : 0;
    const averageB = rounds ? (teamBScore / rounds).toFixed(2) : 0;

    const isMe = (name) =>
        name === member?.name;

    return (
        <div className="team-results-page-v2">
            <div className="results-container-v2">

                {/* HEADER */}
                <div className="header-v2">
                    <h1>Team Game Results</h1>
                    <div className="meta-info-row">
                        <span># Game Code: {gameCode}</span>
                        <span className="divider">|</span>
                        <span>Difficulty: {difficulty}</span>
                        <span className="divider">|</span>
                        <span>Rounds: {rounds}/{rounds}</span>
                    </div>
                </div>

                {/* WINNER BANNER */}
                {winnerTeam !== "DRAW" && (
                    <div className="winner-banner-v2">
                        <h2>🏆 Team {winnerTeam} Wins! 🏆</h2>
                        <p>Congratulations on your victory!</p>
                    </div>
                )}

                {/* TEAM COMPARISON */}
                <div className="comparison-section-v2">

                    {/* TEAM A */}
                    <div className={`team-card-v2 ${winnerTeam === "A" ? "winner winner-card" : ""}`}>
                        <div className="team-name-header">
                            <h3>Team A</h3>
                            <div className="underline"></div>
                        </div>

                        {winnerTeam === "A" && (
                            <div className="winner-pill">👑 Winner</div>
                        )}

                        <div className="stat-box-large">
                            <span className="label">Total Score</span>
                            <span className="value">{teamAScore.toFixed(1)}</span>
                        </div>

                        <div className="stat-box-medium">
                            <span className="label">Average / Round</span>
                            <span className="value">{averageA}</span>
                        </div>

                        <div className="stat-box-players">
                            <div className="icon-circle">
                                <i className="bi bi-people-fill"></i>
                            </div>
                            <div className="text-info">
                                <span className="label">Players</span>
                                <span className="value">{teamAPlayers.length}</span>
                            </div>
                        </div>

                        {/* Player Breakdown */}
                        <div className="player-results-list">
                            {teamAPlayers.map((player, idx) => (
                                <div key={idx} className="player-result-row">
                                    <div className="player-result-name">
                                        {player}
                                        {isMe(player) && (
                                            <span className="you-badge">You</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* VS */}
                    <div className="vs-circle-v2">VS</div>

                    {/* TEAM B */}
                    <div className={`team-card-v2 ${winnerTeam === "B" ? "winner winner-card" : ""}`}>
                        <div className="team-name-header">
                            <h3>Team B</h3>
                            <div className="underline"></div>
                        </div>

                        {winnerTeam === "B" && (
                            <div className="winner-pill">👑 Winner</div>
                        )}

                        <div className="stat-box-large">
                            <span className="label">Total Score</span>
                            <span className="value">{teamBScore.toFixed(1)}</span>
                        </div>

                        <div className="stat-box-medium">
                            <span className="label">Average / Round</span>
                            <span className="value">{averageB}</span>
                        </div>

                        <div className="stat-box-players">
                            <div className="icon-circle">
                                <i className="bi bi-people-fill"></i>
                            </div>
                            <div className="text-info">
                                <span className="label">Players</span>
                                <span className="value">{teamBPlayers.length}</span>
                            </div>
                        </div>

                        {/* Player Breakdown */}
                        <div className="player-results-list">
                            {teamBPlayers.map((player, idx) => (
                                <div key={idx} className="player-result-row">
                                    <div className="player-result-name">
                                        {player}
                                        {isMe(player) && (
                                            <span className="you-badge">You</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* MVP SECTION */}
                {mvp && (
                    <div className="mvp-banner-v2">
                        <div className="mvp-icon-circle">⭐</div>

                        <div className="mvp-info">
                            <span className="mvp-label">Most Valuable Player</span>
                            <h3 className="mvp-name">{mvp.display_name || mvp.player_id}</h3>
                            <div className="mvp-subtext">
                                Team {mvp.team}
                            </div>
                        </div>

                        <div className="mvp-score">
                            <div className="label">Score</div>
                            <div className="value">{mvp.score.toFixed(1)}</div>
                        </div>
                    </div>
                )}

                {/* ACTIONS */}
                <div className="actions-footer-v2">
                    <button
                        className="btn-home-v2"
                        onClick={() => navigate("/")}
                    >
                        ⬅ Home
                    </button>

                    <button
                        className="btn-play-again-v2"
                        onClick={() => navigate("/team-lobby")}
                    >
                        🔄 Play Again
                    </button>
                </div>

            </div>
        </div>
    );
};

export default TeamResultsPage;
