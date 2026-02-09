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

    // Get data
    let {
        results = null,
        gameData = null,
        synonymBox = [],
        antonymBox = [],
        roundsPlayed = 0,
        isBestPerformance = false
    } = location.state || {};

    // Fallback for standalone reload
    if (!results) {
        const storedData = sessionStorage.getItem('gameResults');
        if (storedData) {
            try {
                const parsed = JSON.parse(storedData);
                results = {
                    score: parsed.score,
                    total_correct: parsed.totalCorrect,
                    time_bonus: parsed.timeBonus
                };
                gameData = { words: new Array(parsed.totalWords).fill(null) };
                synonymBox = parsed.synonymBox || [];
                antonymBox = parsed.antonymBox || [];
                roundsPlayed = parsed.roundsPlayed || 0;
                isBestPerformance = parsed.isBestPerformance || false;
            } catch (e) {
                console.error("Failed to parse stored results", e);
            }
        }
    }

    results = results || { score: 0, total_correct: 0, time_bonus: 0 };
    const score = results?.score || 0;
    const maxScore = 20;
    const accuracyNum = results?.total_correct || 0;
    const totalWords = gameData?.words?.length || 8;
    const bonusTime = results?.time_bonus || 0;

    // Animation
    const [animatedScore, setAnimatedScore] = useState(0);
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

    // Scroll handling
    useEffect(() => {
        document.body.style.overflow = 'auto';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    // Handlers
    const handlePlayAgain = () => navigate('/game');
    const handleExit = () => navigate('/home');
    const handleShare = () => {
        const text = `I scored ${score.toFixed(1)}/20 in the Sortonym Challenge! 🎯`;
        if (navigator.share) navigator.share({ title: 'Sortonym Challenge', text });
        else {
            navigator.clipboard.writeText(text);
            alert('Score copied to clipboard!');
        }
    };
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

    // Ring Calc
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(animatedScore, maxScore) / maxScore) * circumference;

    return (
        <div className="result-dashboard-container">
            {/* --- Top Section: Green Header & Stats --- */}
            <div className="result-main-card">

                {/* Green Header */}
                <div className="result-header-green">
                    <div className="header-left">
                        <div className="trophy-icon-box">
                            <i className="bi bi-trophy-fill"></i>
                        </div>
                        <div className="header-text">
                            <span className="subtitle">CHALLENGE COMPLETE</span>
                            <h1>
                                Outstanding Performance!
                                {isBestPerformance && roundsPlayed > 0 && (
                                    <span style={{
                                        marginLeft: '12px',
                                        fontSize: '0.5em',
                                        background: '#fbbf24',
                                        color: '#000',
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontWeight: '800',
                                        verticalAlign: 'middle'
                                    }}>
                                        🏆 Best of {roundsPlayed} Rounds
                                    </span>
                                )}
                            </h1>
                        </div>
                    </div>
                </div>

                {/* Content Body */}
                <div className="result-body-grid">

                    {/* Left: Score Circle */}
                    <div className="score-circle-panel">
                        <div className="score-circle-wrapper">
                            <svg className="score-svg" width="160" height="160" viewBox="0 0 160 160">
                                <circle cx="80" cy="80" r="60" className="meter-bg" />
                                <circle
                                    cx="80" cy="80" r="60"
                                    className="meter-progress"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={offset}
                                />
                            </svg>
                            <div className="score-value-text">
                                <i className="bi bi-award-fill"></i>
                                <span className="score-num">{animatedScore.toFixed(1)}</span>
                                <span className="score-label">TOTAL SCORE</span>
                            </div>
                        </div>
                        <div className="stars-row">
                            <i className="bi bi-star-fill active"></i>
                            <i className="bi bi-star-fill active"></i>
                            <i className="bi bi-star-fill active"></i>
                            <i className="bi bi-star-fill active"></i>
                            <i className="bi bi-star-half active"></i>
                        </div>

                        {/* TIME and RANK badges below circle */}
                        <div className="time-rank-badges">
                            <div className="info-badge">
                                <span className="label">TIME</span>
                                <span className="value">2:34</span>
                            </div>
                            <div className="info-badge">
                                <span className="label">RANK</span>
                                <span className="value">#12</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Stats Grid */}
                    <div className="stats-dashboard-grid">

                        {/* Stat Card 1: Accuracy */}
                        <div className="stat-card">
                            <div className="stat-top">
                                <div className="icon-box green-icon"><i className="bi bi-bullseye"></i></div>
                                <span className="badge-pill light-green">33%</span>
                            </div>
                            <div className="stat-main">
                                <span className="stat-label">ACCURACY</span>
                                <span className="stat-value">{accuracyNum}/{totalWords}</span>
                                <div className="progress-bar-mini">
                                    <div className="fill" style={{ width: `${(accuracyNum / totalWords) * 100}%` }}></div>
                                </div>
                            </div>
                        </div>

                        {/* Stat Card 2: Bonus */}
                        <div className="stat-card">
                            <div className="stat-top">
                                <div className="icon-box green-icon"><i className="bi bi-lightning-fill"></i></div>
                                <span className="badge-pill light-green">Speed</span>
                            </div>
                            <div className="stat-main">
                                <span className="stat-label">BONUS POINTS</span>
                                <span className="stat-value green-text">+{bonusTime.toFixed(1)}</span>
                                <span className="stat-sub">Time bonus earned!</span>
                            </div>
                        </div>

                        {/* Stat Card 3: XP */}
                        <div className="stat-card">
                            <div className="stat-top">
                                <div className="icon-box cyan-icon"><i className="bi bi-graph-up-arrow"></i></div>
                                <span className="badge-pill light-cyan">+15%</span>
                            </div>
                            <div className="stat-main">
                                <span className="stat-label">XP EARNED</span>
                                <span className="stat-value">+{Math.round(score * 12)}</span>
                                <span className="stat-sub">Level up soon!</span>
                            </div>
                        </div>

                        {/* Stat Card 4: Streak */}
                        <div className="stat-card">
                            <div className="stat-top">
                                <div className="icon-box green-icon"><i className="bi bi-stars"></i></div>
                                <span className="badge-pill white-pill">Active</span>
                            </div>
                            <div className="stat-main">
                                <span className="stat-label">WIN STREAK</span>
                                <span className="stat-value green-text">5 Days</span>
                                <span className="stat-sub">Keep it going! 🔥</span>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* --- Action Buttons --- */}
            <div className="action-buttons-row">
                <button className="btn-action primary-green" onClick={handlePlayAgain}>
                    <i className="bi bi-trophy-fill"></i> Play Again
                </button>
                <button className="btn-action white-outline" onClick={handleDownloadCert}>
                    <i className="bi bi-download"></i> Certificate
                </button>
                <button className="btn-action white-outline" onClick={handleShare}>
                    <i className="bi bi-share-fill"></i> Share
                </button>
                <button className="btn-action white-outline" onClick={handleExit}>
                    <i className="bi bi-box-arrow-right"></i> Exit
                </button>
            </div>

            {/* --- Bottom Section: Words Review --- */}
            <div className="words-review-container">

                {/* Synonyms Column */}
                <div className="review-column">
                    <div className="column-header green-header">
                        <div className="icon-check"><i className="bi bi-check-lg"></i></div>
                        <div className="header-details ">
                            <h3 className="text-white">Synonyms</h3>
                            <span className="text-white">Similar meanings</span>
                        </div>
                        <span className="count-badge">{synonymBox.filter(w => w.id.startsWith('syn_')).length}/{synonymBox.length}</span>
                    </div>

                    <div className="review-list">
                        {synonymBox.map((w, i) => (
                            <div key={i} className={`review-item ${w.id.startsWith('syn_') ? 'item-correct' : 'item-wrong'}`}>
                                <div className={`status-icon ${w.id.startsWith('syn_') ? 'icon-success' : 'icon-error'}`}>
                                    <i className={`bi ${w.id.startsWith('syn_') ? 'bi-check-lg' : 'bi-x-lg'}`}></i>
                                </div>
                                <div className="item-text">
                                    <span className="word">{w.word}</span>
                                    <span className="status-label">{w.id.startsWith('syn_') ? 'Correct answer' : 'Incorrect selection'}</span>
                                </div>
                                {w.id.startsWith('syn_') && <span className="xp-badge">+10 XP</span>}
                            </div>
                        ))}
                        {synonymBox.length === 0 && <div className="empty-msg">No words here</div>}
                    </div>
                </div>

                {/* Antonyms Column */}
                <div className="review-column">
                    <div className="column-header red-header">
                        <div className="icon-cross"><i className="bi bi-x-lg"></i></div>
                        <div className="header-details">
                            <h3 className="text-white">Antonyms</h3>
                            <span className="text-white">Opposite meanings</span>
                        </div>
                        <span className="count-badge">{antonymBox.filter(w => w.id.startsWith('ant_')).length}/{antonymBox.length}</span>
                    </div>

                    <div className="review-list">
                        {antonymBox.map((w, i) => (
                            <div key={i} className={`review-item ${w.id.startsWith('ant_') ? 'item-correct' : 'item-wrong'}`}>
                                <div className={`status-icon ${w.id.startsWith('ant_') ? 'icon-success' : 'icon-error'}`}>
                                    <i className={`bi ${w.id.startsWith('ant_') ? 'bi-check-lg' : 'bi-x-lg'}`}></i>
                                </div>
                                <div className="item-text">
                                    <span className="word">{w.word}</span>
                                    <span className="status-label">{w.id.startsWith('ant_') ? 'Correct answer' : 'Incorrect selection'}</span>
                                </div>
                                {w.id.startsWith('ant_') && <span className="xp-badge">+10 XP</span>}
                            </div>
                        ))}
                        {antonymBox.length === 0 && <div className="empty-msg">No words here</div>}
                    </div>
                </div>

            </div>

            {/* Hidden Certificate */}
            <div style={{ position: "fixed", top: "0", left: "-10000px", opacity: 0 }}>
                <CertificatePage ref={certificateRef} member={member} level={level} />
            </div>

        </div>
    );
};

export default ResultPage;
