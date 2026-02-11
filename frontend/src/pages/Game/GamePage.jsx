import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import { startGame, submitGame } from "../../api/gameApi.js";
import { getPrefetchedData, prefetchLevelData } from "../../utils/gamePrefetch.js";
import { toPng } from 'html-to-image';
import SoftPopup from "../../components/SoftPopup/SoftPopup.jsx";
import "./GamePage.css";

// Components
import Timer from "./GameComponents/Timer.jsx";
import WordTile from "./GameComponents/WordTile.jsx";
import TargetZone from "./GameComponents/TargetZone.jsx";
import GameButton from "./GameComponents/GameButton.jsx";
import RoundScoreCard from "./GameComponents/RoundScoreCard.jsx";


import { useSearchParams } from "react-router-dom";

// ... existing imports

function GamePage() {
    const { user, member } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isDaily = searchParams.get('mode') === 'daily';

    // Reference for capturing result screen image
    const resultsRef = useRef(null);
    const certificateRef = useRef(null);

    // Game States: 'idle', 'loading', 'playing', 'completed', 'error'
    const [gameState, setGameState] = useState('idle');
    const [gameData, setGameData] = useState(null);
    const [level, setLevel] = useState('EASY');

    // Word Collections
    const [availableWords, setAvailableWords] = useState([]);
    const [synonymBox, setSynonymBox] = useState([]);
    const [antonymBox, setAntonymBox] = useState([]);

    // UI States
    const [draggedWord, setDraggedWord] = useState(null);
    const [dragOverBox, setDragOverBox] = useState(null);

    // Touch States (Mobile)
    const [touchedWord, setTouchedWord] = useState(null);
    const touchStartPos = useRef(null);

    // Timer States
    const [timeLeft, setTimeLeft] = useState(0);
    const [timeExpired, setTimeExpired] = useState(false);
    const startTimeRef = useRef(null);

    // Final Results Data
    const [results, setResults] = useState(null);

    // Continuous Gameplay States (10 rounds per difficulty)
    const MAX_ROUNDS = 10;
    const [roundHistory, setRoundHistory] = useState([]);
    const [bestPerformance, setBestPerformance] = useState(null);
    const [roundCount, setRoundCount] = useState(0);
    const [usedTargetWords, setUsedTargetWords] = useState(new Set()); // Track used words

    // Hint State
    const [hintsRemaining, setHintsRemaining] = useState(0);

    // Round Results States
    const [showRoundResults, setShowRoundResults] = useState(false);
    const [currentRoundResults, setCurrentRoundResults] = useState(null);

    // Soft Popup States
    const [popupConfig, setPopupConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });

    /* ================= CORE LOGIC ================= */

    const showPopup = useCallback((title, message, type = 'info', autoClose = false, autoCloseDelay = 3000) => {
        setPopupConfig({
            isOpen: true,
            title,
            message,
            type,
            autoClose,
            autoCloseDelay
        });
    }, []);

    const closePopup = () => {
        setPopupConfig(prev => ({ ...prev, isOpen: false }));
    };

    const initializeGame = useCallback(async (selectedLevel) => {
        setGameState('loading');
        setSynonymBox([]);
        setAntonymBox([]);
        setTimeExpired(false);

        // precise level from argument or fall back to state
        const currentLevel = selectedLevel || level;

        try {
            let data = getPrefetchedData(currentLevel);
            if (!data) {
                // Request a new word, avoiding previously used words
                data = await startGame({ 
                    level: currentLevel,
                    excludeWords: Array.from(usedTargetWords) // Send used words to backend
                });
            }

            // Check if we got a duplicate word (fallback check)
            if (usedTargetWords.has(data.anchor_word)) {
                // If duplicate, try again up to 3 times
                for (let attempt = 0; attempt < 3; attempt++) {
                    try {
                        const newData = await startGame({ 
                            level: currentLevel,
                            excludeWords: Array.from(usedTargetWords)
                        });
                        if (!usedTargetWords.has(newData.anchor_word)) {
                            data = newData;
                            break;
                        }
                    } catch (e) {
                        console.warn(`Retry ${attempt + 1} failed for unique word`);
                    }
                }
            }

            // Add the new target word to used words set
            setUsedTargetWords(prev => new Set([...prev, data.anchor_word]));

            setGameData(data);
            setAvailableWords(data.words || []);
            setTimeLeft(data.time_limit || 60);
            // Updating state again just to be safe
            const finalLevel = data.level ? data.level.toUpperCase() : (selectedLevel || 'EASY').toUpperCase();
            setLevel(finalLevel);

            // Initialize Hints based on Difficulty
            const limits = { 'EASY': 3, 'MEDIUM': 2, 'HARD': 1, 'DAILY': 1 };
            setHintsRemaining(limits[finalLevel] || 1);

            startTimeRef.current = Date.now();
            setGameState('playing');

            // Prefetch next round in background for seamless "Next Round" click
            prefetchLevelData(currentLevel);
        } catch (err) {
            setGameState('error');
            console.error("Game Start Failed:", err);
        }
    }, [level, usedTargetWords]);

    const handleSubmit = useCallback(async () => {
        if (gameState !== 'playing' && !timeExpired) return;

        setGameState('loading');

        const timeTaken = gameData?.time_limit ? (gameData.time_limit - timeLeft) : 0;

        const submissionData = {
            roundId: gameData?.score_id || gameData?.round_id,
            synonyms: synonymBox.map(w => w.word),
            antonyms: antonymBox.map(w => w.word),
            timeTaken,
            level
        };

        try {
            const res = await submitGame(submissionData);

            if (isDaily) {
                setShowSubmissionModal(true);
                setGameState('completed');
            } else {
                // Continuous Gameplay: Track this round's performance
                const currentRound = {
                    score: res.score || 0,
                    total_correct: res.total_correct || 0,
                    time_bonus: res.time_bonus || 0,
                    accuracy: res.accuracy || 0,
                    timeTaken,
                    synonyms: synonymBox,
                    antonyms: antonymBox,
                    gameData,
                    timestamp: Date.now()
                };

                // Add to round history
                const updatedHistory = [...roundHistory, currentRound];
                setRoundHistory(updatedHistory);
                const newRoundCount = roundCount + 1;
                setRoundCount(newRoundCount);

                // Update best performance if this round is better
                const newBestPerformance = (!bestPerformance || currentRound.score > bestPerformance.score)
                    ? currentRound
                    : bestPerformance;
                setBestPerformance(newBestPerformance);

                // Prepare results for scorecard
                const scorecardResults = {
                    roundNumber: newRoundCount,
                    synonyms: synonymBox.map(w => ({
                        word: w.word,
                        isCorrect: w.id.startsWith('syn_')
                    })),
                    antonyms: antonymBox.map(w => ({
                        word: w.word,
                        isCorrect: w.id.startsWith('ant_')
                    })),
                    totalXP: Math.round(res.score || 0),
                    isLastRound: newRoundCount >= MAX_ROUNDS,
                    updatedHistory,
                    newBestPerformance
                };

                setCurrentRoundResults(scorecardResults);
                setShowRoundResults(true);
                setGameState('idle'); // Stop gameplay until user clicks Next
            }
        } catch (err) {
            console.error("Submission Failed:", err);
            if (!isDaily) {
                // If submission fails, just initialize next game to avoid getting stuck
                initializeGame(level);
            } else {
                setGameState('error');
                showPopup(
                    'Submission Failed',
                    'Submission failed. Please try again.',
                    'error'
                );
            }
        }
    }, [gameState, timeExpired, gameData, timeLeft, synonymBox, antonymBox, level, isDaily, roundHistory, bestPerformance, roundCount, initializeGame, showPopup]);

    const initializeDailyGame = useCallback(async () => {
        setGameState('loading');
        setSynonymBox([]);
        setAntonymBox([]);
        setTimeExpired(false);
        setLevel('DAILY');
        setHintsRemaining(1); // Hard/Daily limit

        try {
            let data = getPrefetchedData('DAILY');
            if (!data) {
                data = await startGame({ level: 'DAILY' });
            }

            setGameData(data);
            setAvailableWords(data.words || []);
            setTimeLeft(data.time_limit || 45); // Hard default
            startTimeRef.current = Date.now();
            setGameState('playing');

            // Prefetch next daily (just in case) or next round
            prefetchLevelData('DAILY');
        } catch (err) {
            console.error("Daily Game Start Failed:", err);
            // Check if error is 403 (Already played)
            if (err.status === 403 || err.message?.includes('already played')) {
                showPopup(
                    'Daily Challenge Already Played',
                    'You have already played the Daily Challenge today. Check back tomorrow!',
                    'warning'
                );
                setTimeout(() => {
                    navigate('/daily-challenge-results'); // Redirect to results instead of home
                }, 1000);
            } else {
                setGameState('error');
            }
        }
    }, [showPopup, navigate]);

    // Effect: Initialize based on mode
    useEffect(() => {
        if (!gameData && gameState === 'idle') {
            if (isDaily) {
                initializeDailyGame();
            } else {
                setGameState('level-selection');
            }
        }
    }, [gameState, gameData, isDaily, initializeDailyGame]);

    // Effect: Timer Logic
    useEffect(() => {
        let timer;
        if (gameState === 'playing' && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setTimeExpired(true);
                        // Call handleSubmit after setting timeExpired
                        setTimeout(handleSubmit, 0);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [gameState, timeLeft, handleSubmit]);

    const handleLevelSelect = (selectedLevel) => {
        setLevel(selectedLevel);
        initializeGame(selectedLevel);
    };

    const submitOnTimeUp = async () => {
        setTimeExpired(true);
        // Auto-calculate score with what's placed so far
        handleSubmit();
    };

    /* ================= DRAG & DROP HANDLERS ================= */

    const handleDragStart = (e, word) => {
        if (timeExpired) return;
        setDraggedWord(word);

        // Add visual class to the ghost image or original item
        e.dataTransfer.setData("wordId", word.id);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragEnd = () => {
        setDraggedWord(null);
        setDragOverBox(null);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        return false;
    };

    const handleDragEnter = (e, targetBox) => {
        e.preventDefault();
        setDragOverBox(targetBox);
    };

    const handleDrop = (e, targetBox) => {
        e.preventDefault();
        if (!draggedWord) return;

        // Movement Logic
        const word = draggedWord;

        // 1. Remove from all existing boxes
        setAvailableWords(prev => prev.filter(w => w.id !== word.id));
        setSynonymBox(prev => prev.filter(w => w.id !== word.id));
        setAntonymBox(prev => prev.filter(w => w.id !== word.id));

        // 2. Add to target box
        if (targetBox === "available") setAvailableWords(prev => [...prev, word]);
        else if (targetBox === "synonyms") setSynonymBox(prev => [...prev, word]);
        else if (targetBox === "antonyms") setAntonymBox(prev => [...prev, word]);

        setDraggedWord(null);
        setDragOverBox(null);
    };

    /* ================= TOUCH HANDLERS (Mobile Drag) ================= */

    const handleTouchStart = (e, word) => {
        if (timeExpired) return;
        setTouchedWord(word);
        setDraggedWord(word); // Visual feedback
        touchStartPos.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };
    };

    const handleTouchMove = (e) => {
        if (!touchedWord) return;
        // CSS 'touch-action: none' prevents scrolling during drag

        const touch = e.touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);

        // Find which zone we're over
        const zone = element?.closest('[data-zone]');
        if (zone) {
            const zoneName = zone.getAttribute('data-zone');
            setDragOverBox(zoneName);
        } else {
            setDragOverBox(null);
        }
    };

    const handleTouchEnd = (e) => {
        if (!touchedWord) return;

        const touch = e.changedTouches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);

        // Find which zone we dropped on
        const zone = element?.closest('[data-zone]');
        if (zone) {
            const targetBox = zone.getAttribute('data-zone');

            // Move the word
            const word = touchedWord;
            setAvailableWords(prev => prev.filter(w => w.id !== word.id));
            setSynonymBox(prev => prev.filter(w => w.id !== word.id));
            setAntonymBox(prev => prev.filter(w => w.id !== word.id));

            if (targetBox === "available") setAvailableWords(prev => [...prev, word]);
            else if (targetBox === "synonyms") setSynonymBox(prev => [...prev, word]);
            else if (targetBox === "antonyms") setAntonymBox(prev => [...prev, word]);
        }

        // Reset
        setTouchedWord(null);
        setDraggedWord(null);
        setDragOverBox(null);
        touchStartPos.current = null;
    };

    const [showSubmissionModal, setShowSubmissionModal] = useState(false);

    /* ================= HINT HANDLER ================= */

    const handleHint = () => {
        if (hintsRemaining <= 0 || availableWords.length === 0 || timeExpired) return;

        // Pick a random word from available pool
        const randomIndex = Math.floor(Math.random() * availableWords.length);
        const wordToMove = availableWords[randomIndex];

        // Determine correct box based on ID prefix
        const isSynonym = wordToMove.id.startsWith('syn_');
        const targetBox = isSynonym ? 'synonyms' : 'antonyms';

        // Move the word
        setAvailableWords(prev => prev.filter(w => w.id !== wordToMove.id));
        if (isSynonym) {
            setSynonymBox(prev => [...prev, wordToMove]);
        } else {
            setAntonymBox(prev => [...prev, wordToMove]);
        }

        // Decrement hints and Apply Time Penalty (5s) to reduce score slightly
        setHintsRemaining(prev => prev - 1);
        setTimeLeft(prev => Math.max(1, prev - 5));
    };

    /* ================= ACTIONS ================= */

    const handleNextRoundAction = () => {
        setShowRoundResults(false);
        const results = currentRoundResults;

        if (results.isLastRound) {
            // Game session complete - show final results
            navigate('/result', {
                state: {
                    results: {
                        score: results.newBestPerformance.score,
                        total_correct: results.newBestPerformance.total_correct,
                        time_bonus: results.newBestPerformance.time_bonus,
                        accuracy: results.newBestPerformance.accuracy
                    },
                    gameData: results.newBestPerformance.gameData,
                    synonymBox: results.newBestPerformance.synonyms,
                    antonymBox: results.newBestPerformance.antonyms,
                    roundsPlayed: results.roundNumber,
                    isBestPerformance: true,
                    isSessionComplete: true,
                    allRounds: results.updatedHistory
                }
            });
        } else {
            initializeGame(level);
        }
    };

    const handleCloseSubmissionModal = () => {
        setShowSubmissionModal(false);
        navigate('/home');
    };

    const handlePlayAgain = () => {
        // Reset continuous gameplay states
        setRoundHistory([]);
        setBestPerformance(null);
        setRoundCount(0);
        setUsedTargetWords(new Set()); // Reset used words for new game session
        initializeGame();
    };

    const handleExit = () => {
        // If user has played rounds, show best performance on results page
        if (bestPerformance) {
            navigate('/result', {
                state: {
                    results: {
                        score: bestPerformance.score,
                        total_correct: bestPerformance.total_correct,
                        time_bonus: bestPerformance.time_bonus,
                        accuracy: bestPerformance.accuracy
                    },
                    gameData: bestPerformance.gameData,
                    synonymBox: bestPerformance.synonyms,
                    antonymBox: bestPerformance.antonyms,
                    roundsPlayed: roundCount,
                    isBestPerformance: true
                }
            });
        } else {
            // No rounds played, just go home
            navigate('/home');
        }
    };

    const handleCertificate = async () => {
        if (certificateRef.current === null) return;
        try {
            const dataUrl = await toPng(certificateRef.current, { cacheBust: true });
            const link = document.createElement('a');
            link.download = `Sortonym_Certificate_${member?.name || 'Player'}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to generate certificate:', err);
        }
    };

    const handleShare = async () => {
        if (resultsRef.current === null) return;
        try {
            const dataUrl = await toPng(resultsRef.current, { cacheBust: true });
            // In a real mobile app, we'd use navigator.share
            // For web, we'll download it
            const link = document.createElement('a');
            link.download = `My_Sortonym_Score.png`;
            link.href = dataUrl;
            link.click();
            showPopup(
                'Performance Saved',
                'Performance Summary saved! You can now share it.',
                'success',
                true,
                2000
            );
        } catch (err) {
            console.error('Failed to share results:', err);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    /* Note: Result page now navigates to /result route */

    /* ================= GAME UI (Playing Mode) ================= */

    // SKELETON LOADING STATE
    const isLoading = gameState === 'loading';
    const displayWords = isLoading
        ? Array(8).fill({ id: 'skel', word: 'Loading...' })
        : availableWords;
    const displayAnchor = isLoading ? 'LOADING...' : gameData?.anchor_word;

    // Only block completely if error or level selection
    if (gameState === 'error') {
        return (
            <div className="game-page error-mode" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '20px', background: '#f8fafc' }}>
                <h2 style={{ color: '#ef4444' }}>Oops! Failed to load game.</h2>
                <p style={{ color: '#64748b' }}>Check your connection or try again.</p>
                <button className="btn btn-submit" style={{ width: '200px' }} onClick={() => initializeGame()}>Try Again</button>
                <button className="btn btn-exit" style={{ width: '200px' }} onClick={handleExit}>Back to Home</button>
            </div>
        );
    }

    if (gameState === 'level-selection') {
        return (
            <div className="game-page level-selection-mode" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: '#f8fafc',
                padding: '20px',
                fontFamily: "'Outfit', sans-serif"
            }}>
                <h1 style={{
                    color: '#1e293b',
                    fontSize: '2rem',
                    marginBottom: '10px',
                    fontWeight: '900'
                }}>Select Difficulty</h1>
                <p style={{ color: '#64748b', marginBottom: '30px' }}>Choose your challenge level</p>

                <div className="level-cards" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {/* EASY LEVEL */}
                    <div
                        onClick={() => handleLevelSelect('EASY')}
                        style={{
                            background: 'white',
                            padding: '24px',
                            borderRadius: '16px',
                            width: '200px',
                            cursor: 'pointer',
                            border: '2px solid #e2e8f0',
                            textAlign: 'center',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                    >
                        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🌱</div>
                        <h3 style={{ color: '#10b981', fontWeight: '800', marginBottom: '8px' }}>EASY</h3>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: '1.4' }}>
                            Simple words<br />
                            More time<br />
                            <strong>Beginner-friendly</strong>
                        </p>
                    </div>

                    {/* MEDIUM LEVEL */}
                    <div
                        onClick={() => handleLevelSelect('MEDIUM')}
                        style={{
                            background: 'white',
                            padding: '24px',
                            borderRadius: '16px',
                            width: '200px',
                            cursor: 'pointer',
                            border: '2px solid #e2e8f0',
                            textAlign: 'center',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                    >
                        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⚖️</div>
                        <h3 style={{ color: '#3b82f6', fontWeight: '800', marginBottom: '8px' }}>MEDIUM</h3>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: '1.4' }}>
                            Moderate vocabulary<br />
                            Balanced timing<br />
                            <strong>Intermediate challenge</strong>
                        </p>
                    </div>

                    {/* HARD LEVEL */}
                    <div
                        onClick={() => handleLevelSelect('HARD')}
                        style={{
                            background: 'white',
                            padding: '24px',
                            borderRadius: '16px',
                            width: '200px',
                            cursor: 'pointer',
                            border: '2px solid #e2e8f0',
                            textAlign: 'center',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                    >
                        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🔥</div>
                        <h3 style={{ color: '#ef4444', fontWeight: '800', marginBottom: '8px' }}>HARD</h3>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: '1.4' }}>
                            Advanced words<br />
                            Less time<br />
                            <strong>High scoring potential</strong>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`game-page playing-mode ${isLoading ? 'is-loading' : ''}`}>

            <header className="game-header-compact">
                <div className="header-left">
                    <div className="header-player">
                        <i className="bi bi-person-fill"></i>
                        <span className={`player-name-text ${isLoading ? 'skeleton' : ''}`}>{isLoading ? '' : member?.name}</span>
                    </div>
                    {roundCount > 0 && !isDaily && (
                        <span className="round-count-badge">
                            R{roundCount + 1}/{MAX_ROUNDS}
                        </span>
                    )}
                </div>

                <div className="header-center">
                    <div className={`header-timer ${isLoading ? 'skeleton' : ''} ${timeLeft <= 10 && !isLoading ? 'critical' : ''}`}>
                        {isLoading ? '' : formatTime(timeLeft)}
                    </div>
                </div>

                <div className="header-right">
                    <div className="header-right-group">
                        <div
                            onClick={!isLoading ? handleHint : undefined}
                            className="hint-control-btn"
                            style={{
                                cursor: (hintsRemaining > 0 && !timeExpired && availableWords.length > 0 && !isLoading) ? 'pointer' : 'default',
                                opacity: (hintsRemaining > 0 && !timeExpired && availableWords.length > 0 && !isLoading) ? 1 : 0.4
                            }}
                        >
                            <i className="bi bi-lightbulb-fill"></i>
                            {level === 'EASY' ? <span>Assist ({hintsRemaining})</span> : <span>{hintsRemaining}</span>}
                        </div>
                    </div>
                </div>
            </header>

            <main className="game-board">
                <div className="game-play-area" key={startTimeRef.current || 'initial-game'}>

                    {/* LEFT COLUMN - Word Bank */}
                    <div className="source-zone-container">
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '16px',
                            paddingBottom: '12px',
                            borderBottom: '1px solid rgba(0,0,0,0.05)'
                        }}>
                            <h3 style={{
                                fontSize: '14px',
                                fontWeight: '800',
                                textTransform: 'uppercase',
                                color: 'var(--brand-black)',
                                margin: 0
                            }}>Word Bank</h3>
                            <span className={`zone-count ${isLoading ? 'skeleton' : ''}`} style={{
                                fontSize: '12px',
                                fontWeight: '700',
                                color: 'var(--slate-gray)'
                            }}>{isLoading ? '' : `${availableWords.length} words`}</span>
                        </div>
                        <div
                            className={`source-pool ${dragOverBox === 'available' ? 'drag-over' : ''}`}
                            onDragOver={handleDragOver}
                            onDragEnter={(e) => handleDragEnter(e, "available")}
                            onDrop={(e) => handleDrop(e, "available")}
                            data-zone="available"
                        >
                            {displayWords.map((word, index) => (
                                isLoading ? (
                                    <div key={index} className="word-card skeleton"></div>
                                ) : (
                                    <WordTile
                                        key={word.id}
                                        word={word}
                                        isDragging={draggedWord?.id === word.id}
                                        onDragStart={handleDragStart}
                                        onDragEnd={handleDragEnd}
                                        onTouchStart={handleTouchStart}
                                        onTouchMove={handleTouchMove}
                                        onTouchEnd={handleTouchEnd}
                                    />
                                )
                            ))}
                        </div>
                    </div>

                    {/* CENTER COLUMN - Anchor Word */}
                    <div className="anchor-zone-container" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '10px'
                    }}>
                        <span style={{
                            fontSize: '11px',
                            color: 'var(--slate-gray)',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '1.2px',
                            marginBottom: '8px'
                        }}>Target Word</span>
                        <h1 className={`anchor-word-text ${isLoading ? 'skeleton' : ''}`} style={{
                            fontSize: '40px',
                            fontWeight: '900',
                            color: 'var(--brand-black)',
                            margin: '0 0 12px 0',
                            textTransform: 'uppercase',
                            letterSpacing: '-1px',
                            textAlign: 'center'
                        }}>{displayAnchor}</h1>
                        <p style={{
                            fontSize: '12px',
                            color: 'var(--slate-gray)',
                            textAlign: 'center',
                            maxWidth: '240px',
                            lineHeight: '1.4'
                        }}>Find synonyms and antonyms for this word</p>
                    </div>

                    {/* RIGHT COLUMN - Drop Zones (Stacked) */}
                    <div className="target-zones-container">
                        <TargetZone
                            title="Synonyms"
                            words={synonymBox}
                            boxKey="synonyms"
                            onDragOver={handleDragOver}
                            onDragEnter={handleDragEnter}
                            onDrop={handleDrop}
                            dragOverBox={dragOverBox}
                            draggedWord={draggedWord}
                            handleDragStart={handleDragStart}
                            handleDragEnd={handleDragEnd}
                            isTimeExpired={timeExpired}
                            handleTouchStart={handleTouchStart}
                            handleTouchMove={handleTouchMove}
                            handleTouchEnd={handleTouchEnd}
                        />

                        <TargetZone
                            title="Antonyms"
                            words={antonymBox}
                            boxKey="antonyms"
                            onDragOver={handleDragOver}
                            onDragEnter={handleDragEnter}
                            onDrop={handleDrop}
                            dragOverBox={dragOverBox}
                            draggedWord={draggedWord}
                            handleDragStart={handleDragStart}
                            handleDragEnd={handleDragEnd}
                            isTimeExpired={timeExpired}
                            handleTouchStart={handleTouchStart}
                            handleTouchMove={handleTouchMove}
                            handleTouchEnd={handleTouchEnd}
                        />
                    </div>

                </div>
            </main>

            <footer className="game-footer-controls ">
                <GameButton
                    label="Next Round"
                    onClick={handleSubmit}
                    disabled={timeExpired || synonymBox.length + antonymBox.length === 0}
                    variant="submit"
                />
                <GameButton
                    label="Exit"
                    onClick={handleExit}
                    variant="exit"
                />
            </footer>

            {/* DAILY SUBMISSION MODAL */}
            {showSubmissionModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        background: 'white',
                        padding: '30px',
                        borderRadius: '16px',
                        textAlign: 'center',
                        maxWidth: '400px',
                        width: '90%',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                        border: '2px solid #00A63F',
                        animation: 'popIn 0.3s ease-out'
                    }}>
                        <h2 style={{ color: '#111827', fontSize: '1.5rem', marginBottom: '1rem' }}>
                            ✅ Challenge Submitted!
                        </h2>
                        <div style={{
                            padding: '15px',
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: '8px',
                            color: '#166534',
                            marginBottom: '20px',
                            fontSize: '0.95rem'
                        }}>
                            <strong>Good job!</strong><br />
                            Results will be revealed after 24 hours.
                        </div>
                        <p style={{ color: '#6B7280', marginBottom: '24px', fontSize: '0.9rem' }}>
                            Come back tomorrow for a new global word set.
                        </p>
                        <button
                            onClick={handleCloseSubmissionModal}
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '12px' }}
                        >
                            Back to Home
                        </button>
                    </div>
                </div>
            )}

            {/* ROUND RESULTS OVERLAY */}
            {showRoundResults && currentRoundResults && (
                <RoundScoreCard
                    roundNumber={currentRoundResults.roundNumber}
                    synonyms={currentRoundResults.synonyms}
                    antonyms={currentRoundResults.antonyms}
                    totalXP={currentRoundResults.totalXP}
                    isLastRound={currentRoundResults.isLastRound}
                    onNextRound={handleNextRoundAction}
                    onExit={handleExit}
                />
            )}

            {/* SOFT POPUP */}
            <SoftPopup
                isOpen={popupConfig.isOpen}
                onClose={closePopup}
                title={popupConfig.title}
                message={popupConfig.message}
                type={popupConfig.type}
                autoClose={popupConfig.autoClose}
                autoCloseDelay={popupConfig.autoCloseDelay}
            />
        </div>

    );
}

export default GamePage;
