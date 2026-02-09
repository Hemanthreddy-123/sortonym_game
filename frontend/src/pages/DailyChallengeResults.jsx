import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import '../styles/landing.css'; // Re-using landing styles for now or create a new css

function DailyChallengeResults() {
    const navigate = useNavigate();
    const { user, member } = useAuth();
    const [timeLeft, setTimeLeft] = useState(null);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // MOCK: Set unlock time to next midnight or 24h from now
    // For demo: Let's set it to 10 seconds from now to show transition, or just fixed for 24h.
    // Requirement: "Results will be revealed in 12:34:56"
    // Let's stick to a fixed target time (e.g., outcome depends on whether 24h has passed).
    // I'll simulate a target time of "Tomorrow at 00:00".

    useEffect(() => {
        const isAdmin = member?.email === 'admin.test@sortonym.com' || user?.email === 'admin.test@sortonym.com';

        if (isAdmin) {
            setIsUnlocked(true);
            return;
        }

        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0); // Next midnight

        // Calculate time difference
        const interval = setInterval(() => {
            const currentTime = new Date();
            const difference = tomorrow - currentTime;

            if (difference <= 0) {
                setIsUnlocked(true);
                clearInterval(interval);
            } else {
                // Format hh:mm:ss
                const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((difference / (1000 * 60)) % 60);
                const seconds = Math.floor((difference / 1000) % 60);

                setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [user, member]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [leaderboardData, setLeaderboardData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const response = await fetch('http://127.0.0.1:8000/api/leaderboard?period=today');
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();

                // Process data to match component structure
                const formattedData = data.leaderboard.map((item, index) => ({
                    rank: index + 1,
                    name: item.player_name || item.player_email.split('@')[0],
                    score: Math.round(item.score),
                    time: `${Math.round(item.time_taken)}s`,
                    isUser: user?.email === item.player_email
                }));

                setLeaderboardData(formattedData);
            } catch (error) {
                console.error("Failed to fetch leaderboard", error);
                // Fallback to mock if fetch fails? Or just show empty.
                // Keeping mock data as fallback for now if empty
                if (leaderboardData.length === 0) {
                    setLeaderboardData([
                        { rank: 1, name: "WordMaster99", score: 980, time: "45s" },
                        { rank: 2, name: "LexiconKing", score: 950, time: "48s" },
                        { rank: 3, name: "SyntaxSage", score: 920, time: "52s" },
                        { rank: 4, name: "You (Hemanth)", score: 890, time: "58s", isUser: true },
                        { rank: 5, name: "VocabViper", score: 850, time: "60s" }
                    ]);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaderboard();
    }, [user, member]);

    // Helper for Rank Icon
    const getRankDisplay = (rank) => {
        if (rank === 1) return <span style={{ fontSize: '1.5rem' }}>🥇</span>;
        if (rank === 2) return <span style={{ fontSize: '1.5rem' }}>🥈</span>;
        if (rank === 3) return <span style={{ fontSize: '1.5rem' }}>🥉</span>;
        return <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#64748b', width: '24px', display: 'inline-block', textAlign: 'center' }}>{rank}</span>;
    };

    return (
        <div className="landing-shell">
            <div className="bg-pattern" style={{ position: 'fixed' }}></div>

            <header className="landing-topbar">
                <div className="landing-container">
                    <div className="topbar-inner">
                        <div className="topbar-brand" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
                            <span className="topbar-logo-text">Sortonym Challenge</span>
                        </div>
                        <button className="btn btn-outline-dark btn-sm" onClick={() => navigate('/home')}>
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </header>

            <main className="landing-center" style={{
                paddingTop: '60px',
                minHeight: '100vh',
                height: isMobile ? 'auto' : '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: isMobile ? 'flex-start' : 'center',
                overflow: isMobile ? 'auto' : 'hidden'
            }}>

                {!isUnlocked ? (
                    /* LOCKED STATE */
                    <div className="daily-locked-container" style={{ width: '100%', maxWidth: '600px', marginBottom: isMobile ? '40px' : '0' }}>
                        <div className="results-card locked" style={{
                            background: 'white',
                            borderRadius: '20px',
                            padding: '40px',
                            textAlign: 'center',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                            border: '1px solid #e2e8f0'
                        }}>
                            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🔒</div>
                            <h1 style={{ color: '#1e293b', marginBottom: '10px', fontWeight: '800' }}>Results Locked</h1>
                            <p style={{ color: '#64748b', marginBottom: '30px' }}>
                                The global leaderboard for today's challenge is currently hidden to ensure fair play.
                            </p>

                            <div className="countdown-box" style={{
                                background: '#f8fafc',
                                padding: '20px',
                                borderRadius: '12px',
                                border: '2px dashed #cbd5e1',
                                marginBottom: '30px'
                            }}>
                                <div style={{ fontSize: '0.9rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Revealed In</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#00A63F', fontFamily: 'monospace' }}>
                                    {timeLeft || "--:--:--"}
                                </div>
                            </div>

                            <div className="locked-info" style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                                Play again tomorrow for a new challenge!
                            </div>
                        </div>
                    </div>
                ) : (
                    /* UNLOCKED STATE - DESKTOP & MOBILE */
                    <div className="daily-results-container" style={{
                        width: '100%',
                        maxWidth: isMobile ? '100%' : '1000px',
                        padding: isMobile ? '20px 16px' : '0',
                        height: isMobile ? 'auto' : '100%',
                        display: isMobile ? 'block' : 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                    }}>

                        <div className="results-card unlocked" style={{
                            background: 'white',
                            borderRadius: '20px',
                            overflow: 'hidden',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                            border: '1px solid #e2e8f0',
                            maxHeight: isMobile ? 'none' : '85vh',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            {/* Header */}
                            <div className="results-header" style={{
                                background: '#00A63F',
                                padding: isMobile ? '24px' : '30px',
                                textAlign: 'center',
                                color: 'white',
                                position: 'relative',
                                flexShrink: 0
                            }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.1, backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 10px 10px' }}></div>
                                <div style={{ position: 'relative', zIndex: 1 }}>
                                    <h1 style={{ margin: 0, fontSize: isMobile ? '1.8rem' : '2.2rem', fontWeight: '800', letterSpacing: '-0.5px' }}>🏆 Daily Leaderboard</h1>
                                    <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: isMobile ? '1rem' : '1rem' }}>Today's Top Performers</p>
                                </div>
                            </div>

                            {/* Body - Scrollable Area */}
                            <div className="results-body" style={{
                                padding: isMobile ? '0' : '0',
                                overflowY: 'auto',
                                flex: 1
                            }}>

                                {isMobile ? (
                                    /* --- Mobile View (Card List) --- */
                                    <div>
                                        {leaderboardData.map((player, index) => (
                                            <div key={index} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                padding: '16px 20px',
                                                borderBottom: '1px solid #f1f5f9',
                                                backgroundColor: player.isUser ? '#f0fdf4' : 'white',
                                                borderLeft: player.isUser ? '4px solid #00A63F' : '4px solid transparent'
                                            }}>
                                                <div style={{ marginRight: '16px', minWidth: '32px', textAlign: 'center' }}>
                                                    {getRankDisplay(player.rank)}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: '700', color: '#1e293b' }}>
                                                        {player.name} {player.isUser && <span style={{ fontSize: '0.75rem', background: '#00A63F', color: 'white', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px', verticalAlign: 'middle' }}>YOU</span>}
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontWeight: '800', color: '#00A63F', fontSize: '1.1rem' }}>{player.score} <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'normal' }}>pts</span></div>
                                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{player.time}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    /* --- Desktop View (Table) --- */
                                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                                        <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                            <tr>
                                                <th style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', width: '10%', borderBottom: '1px solid #e2e8f0' }}>Rank</th>
                                                <th style={{ textAlign: 'left', padding: '16px', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', width: '50%', borderBottom: '1px solid #e2e8f0' }}>Player Name</th>
                                                <th style={{ textAlign: 'right', padding: '16px', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', width: '20%', borderBottom: '1px solid #e2e8f0' }}>Time Taken</th>
                                                <th style={{ textAlign: 'right', padding: '16px', paddingRight: '30px', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', width: '20%', borderBottom: '1px solid #e2e8f0' }}>Score</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {leaderboardData.map((player, index) => (
                                                <tr key={index} style={{
                                                    background: player.isUser ? '#f0fdf4' : '#ffffff',
                                                    borderLeft: player.isUser ? '4px solid #00A63F' : '4px solid transparent',
                                                    cursor: 'default'
                                                }}>
                                                    <td style={{
                                                        textAlign: 'center', padding: '16px',
                                                        borderBottom: '1px solid #f1f5f9', borderLeft: player.isUser ? '4px solid #00A63F' : 'none'
                                                    }}>
                                                        {getRankDisplay(player.rank)}
                                                    </td>
                                                    <td style={{
                                                        textAlign: 'left', padding: '16px', fontWeight: '600', color: '#1e293b', fontSize: '1.1rem',
                                                        borderBottom: '1px solid #f1f5f9'
                                                    }}>
                                                        {player.name}
                                                        {player.isUser && (
                                                            <span style={{
                                                                background: '#dcfce7', color: '#166534',
                                                                fontSize: '0.75rem', padding: '4px 8px', borderRadius: '12px',
                                                                marginLeft: '10px', fontWeight: '700', border: '1px solid #bbf7d0'
                                                            }}>
                                                                YOU
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td style={{
                                                        textAlign: 'right', padding: '16px', color: '#64748b', fontFamily: 'monospace', fontSize: '1.1rem',
                                                        borderBottom: '1px solid #f1f5f9'
                                                    }}>
                                                        {player.time}
                                                    </td>
                                                    <td style={{
                                                        textAlign: 'right', padding: '16px', paddingRight: '30px', fontWeight: '800', color: '#00A63F', fontSize: '1.25rem',
                                                        borderBottom: '1px solid #f1f5f9'
                                                    }}>
                                                        {player.score}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {/* Performance Summary / Footer */}
                            <div className="results-footer" style={{ padding: '24px', textAlign: 'center', background: '#f8fafc', borderTop: '1px solid #e2e8f0', flexShrink: 0 }}>
                                <div className="performance-summary" style={{ marginBottom: '20px' }}>
                                    <h4 style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px' }}>Your Performance Overview</h4>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? '20px' : '60px' }}>
                                        <div className="stat-box">
                                            <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#1e293b' }}>
                                                {leaderboardData.find(p => p.isUser)?.score || '-'}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '500' }}>Score</div>
                                        </div>
                                        <div className="stat-box">
                                            <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#1e293b' }}>
                                                {leaderboardData.find(p => p.isUser) ? `#${leaderboardData.find(p => p.isUser).rank}` : '-'}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '500' }}>Rank</div>
                                        </div>
                                        <div className="stat-box">
                                            <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#1e293b' }}>
                                                {leaderboardData.find(p => p.isUser)
                                                    ? `Top ${Math.ceil((leaderboardData.find(p => p.isUser).rank / leaderboardData.length) * 100)}%`
                                                    : '-'}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '500' }}>Percentile</div>
                                        </div>
                                    </div>
                                </div>
                                <button className="btn btn-primary" style={{ padding: '10px 30px', fontSize: '1rem', borderRadius: '50px' }} onClick={() => navigate('/home')}>
                                    Return to Dashboard
                                </button>
                            </div>
                        </div>

                    </div>
                )}

            </main>
        </div>
    );
}

export default DailyChallengeResults;
