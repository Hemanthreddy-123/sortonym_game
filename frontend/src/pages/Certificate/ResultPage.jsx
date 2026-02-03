import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import CertificatePage from './CertificatePage';
import { toPng } from 'html-to-image';
import './ResultPage.css';
import { useTheme } from '../../hooks/useTheme';

const ResultPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { member, level } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const certificateRef = useRef(null);

    // Get data from navigation state (passed from GamePage)
    // Get data from navigation state (passed from GamePage) OR sessionStorage (from standalone fallback)
    let {
        results = null,
        gameData = null,
        synonymBox = [],
        antonymBox = []
    } = location.state || {};

    if (!results) {
        const storedData = sessionStorage.getItem('gameResults');
        if (storedData) {
            try {
                const parsed = JSON.parse(storedData);
                // Map standalone format back to React format if needed
                results = {
                    score: parsed.score,
                    total_correct: parsed.totalCorrect,
                    time_bonus: parsed.timeBonus
                };
                gameData = {
                    words: new Array(parsed.totalWords).fill(null), // Dummy array for length
                };
                synonymBox = parsed.synonymBox || [];
                antonymBox = parsed.antonymBox || [];
            } catch (e) {
                console.error("Failed to parse stored results", e);
            }
        }
    }

    // Default values if still missing
    results = results || { score: 0, total_correct: 0, time_bonus: 0 };
    gameData = gameData || { words: [] };

    const [animatedScore, setAnimatedScore] = useState(0);



    const score = results?.score || 0;
    const maxScore = 20;
    const accuracyNum = results?.total_correct || 0;
    const totalWords = gameData?.words?.length || 8;
    const bonusTime = results?.time_bonus || 0;

    // --- Animation Logic ---
    useEffect(() => {
        let startTime;
        const duration = 1500;

        const animateScore = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);

            const easedProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            setAnimatedScore(easedProgress * score);

            if (progress < 1) requestAnimationFrame(animateScore);
        };
        requestAnimationFrame(animateScore);
    }, [score]);

    // --- SCROLL LOCK & LAYOUT FIX ---
    // Force body overflow and display based on device type to ensure mobile scrolling works
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 900) {
                document.body.style.overflow = 'auto'; // Enable scroll on mobile
                document.body.style.position = 'static';
                document.body.style.display = 'block'; // Disable flex centering from index.css
                document.body.style.height = 'auto';
            } else {
                document.body.style.overflow = 'hidden'; // Lock on desktop
                // We can leave display as is or reset, but usually desktop relies on the flex center
                document.body.style.display = 'flex';
                document.body.style.height = '100vh';
            }
        };

        // Run on mount
        handleResize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            // Cleanup: reset to defaults (likely index.css values)
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.display = '';
            document.body.style.height = '';
        };
    }, []);

    // --- Ring Logic ---
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(animatedScore, maxScore) / maxScore) * circumference;

    let ringColor = "#ef4444"; // Red default
    let titleText = "Keep Practicing";

    if (score >= 15) {
        ringColor = "#10b981"; // Green
        titleText = "Great Job!";
    } else if (score >= 10) {
        ringColor = "#3b82f6"; // Blue
        titleText = "Good Job!";
    } else if (score >= 5) {
        ringColor = "#f59e0b"; // Orange
        titleText = "Well Done!";
    }

    // Button Handlers
    const handlePlayAgain = () => navigate('/game');

    const handleDownloadCert = async () => {
        if (!certificateRef.current) return;
        try {
            const dataUrl = await toPng(certificateRef.current, { width: 1000, height: 700 });
            const link = document.createElement('a');
            link.download = `${member?.name || 'Player'}_Certificate.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Certificate generation failed:', err);
        }
    };

    const handleShare = () => {
        const text = `I scored ${score.toFixed(1)}/20 in the Sortonym Challenge! 🎯`;
        if (navigator.share) {
            navigator.share({ title: 'Sortonym Challenge', text });
        } else {
            navigator.clipboard.writeText(text);
            alert('Score copied to clipboard!');
        }
    };

    const handleExit = () => navigate('/home');

    return (
        <div className="results-page-game">
            <button className="theme-toggle-result" onClick={toggleTheme}>
                {theme === 'light' ? <i className="bi bi-moon-fill" /> : <i className="bi bi-sun-fill" />}
            </button>
            <div className="victory-card">

                {/* --- LEFT COLUMN: SYNONYMS --- */}
                <div className="side-column left-panel">
                    <div className="panel-header theme-green">
                        <i className="bi bi-check-circle-fill"></i> SYNONYMS
                    </div>
                    <div className="word-list-scroll">
                        {synonymBox.map((w, i) => {
                            const isCorrect = w.id.startsWith('syn_');
                            return (
                                <div key={i} className={`word-row ${isCorrect ? 'row-green' : 'row-red'}`}>
                                    {isCorrect && <i className="bi bi-check-lg"></i>}
                                    {!isCorrect && <i className="bi bi-x-lg"></i>}
                                    <span>{w.word}</span>
                                </div>
                            );
                        })}
                        {synonymBox.length === 0 && <span className="empty-text">No words placed</span>}
                    </div>
                </div>

                {/* --- CENTER COLUMN: SCORE & ACTIONS --- */}
                <div className="center-panel">

                    <div className="level-badge">{level} CHALLENGE</div>
                    <h1 className="victory-title">{titleText}</h1>

                    {/* CIRCULAR SCORE */}
                    <div className="score-meter-wrapper">
                        <div className="score-meter-container">
                            <svg className="score-svg" viewBox="0 0 200 200">
                                <circle cx="100" cy="100" r={radius} className="meter-bg" />
                                <circle
                                    cx="100" cy="100" r={radius}
                                    className="meter-progress"
                                    stroke={ringColor}
                                    strokeDasharray={circumference}
                                    style={{ strokeDashoffset: offset }}
                                />
                            </svg>
                            <div className="score-value-wrapper">
                                <span className="score-label-small">TOTAL SCORE</span>
                                <span className="score-number-big" style={{ color: ringColor }}>{animatedScore.toFixed(1)}</span>
                            </div>
                        </div>
                    </div>

                    {/* STATS */}
                    <div className="stats-row">
                        <div className="stat-mini">
                            <span className="stat-mini-label">ACCURACY</span>
                            <span className="stat-mini-value">{accuracyNum}/{totalWords}</span>
                        </div>
                        <div className="stat-mini">
                            <span className="stat-mini-label">BONUS</span>
                            <span className="stat-mini-value">+{bonusTime.toFixed(1)}</span>
                        </div>
                    </div>

                    {/* BUTTONS */}
                    <button className="btn-main-action" onClick={handlePlayAgain}>
                        Play Again
                    </button>
                    <div className="sub-actions">
                        <button className="btn-sub-action" onClick={handleDownloadCert}>Certificate</button>
                        <button className="btn-sub-action" onClick={handleShare}>Share</button>
                    </div>
                    <button className="btn-link-exit" onClick={handleExit}>Exit</button>
                </div>

                {/* --- RIGHT COLUMN: ANTONYMS --- */}
                <div className="side-column right-panel">
                    <div className="panel-header theme-red">
                        <i className="bi bi-x-circle-fill"></i> ANTONYMS
                    </div>
                    <div className="word-list-scroll">
                        {antonymBox.map((w, i) => {
                            const isCorrect = w.id.startsWith('ant_');
                            return (
                                <div key={i} className={`word-row ${isCorrect ? 'row-green' : 'row-red'}`}>
                                    {isCorrect && <i className="bi bi-check-lg"></i>}
                                    {!isCorrect && <i className="bi bi-x-lg"></i>}
                                    <span>{w.word}</span>
                                </div>
                            );
                        })}
                        {antonymBox.length === 0 && <span className="empty-text">No words placed</span>}
                    </div>
                </div>

            </div>

            {/* Hidden Certificate Component for Capture */}
            <div style={{ position: "fixed", top: "0", left: "-10000px", opacity: 0 }}>
                <CertificatePage
                    ref={certificateRef}
                    member={member}
                    level={level}
                />
            </div>
        </div>
    );
};

export default ResultPage;
