import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import './JoinGamePage.css';

const JoinGamePage = () => {
    const navigate = useNavigate();
    const { member } = useAuth();

    const [teamCode, setTeamCode] = useState('');
    const [displayName, setDisplayName] = useState(member?.name || '');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Stats (Mock data for UI match)
    const activeTeams = 24;
    const teamMembers = 156;

    const handleTeamCodeChange = (e) => {
        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (value.length <= 6) {
            setTeamCode(value);
            setError('');
        }
    };

    const handleJoinTeam = async () => {
        if (!teamCode) {
            setError('Please enter a team code');
            return;
        }
        if (teamCode.length !== 6) {
            setError('Team code must be 6 characters');
            return;
        }
        if (!displayName.trim()) {
            setError('Please enter a display name');
            return;
        }

        setIsLoading(true);
        // Simulate API check
        setTimeout(() => {
            setIsLoading(false);
            navigate('/team-lobby', {
                state: {
                    gameCode: teamCode,
                    isJoining: true,
                    displayName
                }
            });
        }, 800);
    };

    return (
        <div className="join-team-page">
            <div className="join-team-container">
                {/* Header Section */}
                <header className="page-header">
                    <div className="header-content">
                        <h1>Join Team</h1>
                        <p>Enter your team code to join and start playing</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-history">
                            <i className="bi bi-clock-history"></i> History
                        </button>
                        <button className="btn-create-team" onClick={() => navigate('/create-team')}>
                            <i className="bi bi-plus-lg"></i> Create Team
                        </button>
                    </div>
                </header>

                {/* Stats Cards Row */}
                <div className="stats-row">
                    <div className="stat-card">
                        <div className="stat-icon team-icon">
                            <i className="bi bi-people-fill"></i>
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Active Teams</span>
                            <span className="stat-value">{activeTeams}</span>
                        </div>
                        <span className="stat-badge positive">+12%</span>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon member-icon">
                            <i className="bi bi-person-plus-fill"></i>
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Team Members</span>
                            <span className="stat-value">{teamMembers}</span>
                        </div>
                        <span className="stat-badge positive">+8%</span>
                    </div>
                </div>

                {/* Main Join Card */}
                <div className="join-card">
                    <div className="card-icon-wrapper">
                        <div className="card-icon">
                            <i className="bi bi-controller"></i>
                        </div>
                    </div>

                    <h2 className="card-title">Enter Team Code</h2>
                    <p className="card-subtitle">Ask your team leader for the unique team code</p>

                    <div className="form-group">
                        <label>Team Code</label>
                        <div className="code-input-wrapper">
                            <input
                                type="text"
                                className="code-input"
                                placeholder="ENTER 6-DIGIT TEAM CODE"
                                value={teamCode}
                                onChange={handleTeamCodeChange}
                                maxLength={6}
                            />
                            {teamCode && teamCode.length === 6 && (
                                <i className="bi bi-check-circle-fill success-icon"></i>
                            )}
                        </div>
                        <small className="helper-text">
                            <i className="bi bi-info-circle-fill"></i> Code is case-insensitive and contains 6 characters
                        </small>
                    </div>

                    <div className="form-group">
                        <label>Your Display Name</label>
                        <input
                            type="text"
                            className="text-input"
                            placeholder="Enter your display name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <div className="form-actions">
                        <button className="btn-cancel" onClick={() => navigate('/home')}>Cancel</button>
                        <button
                            className="btn-join"
                            onClick={handleJoinTeam}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Joining...' : (
                                <>
                                    <i className="bi bi-box-arrow-in-right"></i> Join Team
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JoinGamePage;
