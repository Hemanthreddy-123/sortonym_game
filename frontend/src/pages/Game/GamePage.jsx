import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import { startGame, submitGame } from "../../api/gameApi.js";
import "./GamePage.css";

// Components
import Timer from "./GameComponents/Timer.jsx";
import WordTile from "./GameComponents/WordTile.jsx";
import TargetZone from "./GameComponents/TargetZone.jsx";
import GameButton from "./GameComponents/GameButton.jsx";


import { useSearchParams } from "react-router-dom";

// ... existing imports

function GamePage() {
    const { token, user, member } = useAuth();
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

    // Hint State
    const [hintsRemaining, setHintsRemaining] = useState(0);

    // Effect: Initialize based on mode
    useEffect(() => {
        if (!gameData && token && gameState === 'idle') {
            if (isDaily) {
                initializeDailyGame();
            } else {
                setGameState('level-selection');
            }
        }
    }, [token, gameState, gameData, isDaily]);

    // Effect: Timer Logic
    useEffect(() => {
        let timer;
        if (gameState === 'playing' && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        submitOnTimeUp();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [gameState, timeLeft]);

    /* ================= CORE LOGIC ================= */

    const handleLevelSelect = (selectedLevel) => {
        setLevel(selectedLevel);
        initializeGame(selectedLevel);
    };

    const initializeDailyGame = async () => {
        setGameState('loading');
        setSynonymBox([]);
        setAntonymBox([]);
        setTimeExpired(false);
        setLevel('DAILY');
        setHintsRemaining(1); // Hard/Daily limit

        try {
            const data = await startGame({ token, level: 'DAILY' });
            setGameData(data);
            setAvailableWords(data.words || []);
            setTimeLeft(data.time_limit || 45); // Hard default
            startTimeRef.current = Date.now();
            setGameState('playing');
        } catch (err) {
            console.error("Daily Game Start Failed:", err);
            // Check if error is 403 (Already played)
            if (err.status === 403 || err.message?.includes('already played')) {
                alert("You have already played the Daily Challenge today. Check back tomorrow!");
                navigate('/daily-challenge-results'); // Redirect to results instead of home
            } else {
                setGameState('error');
            }
        }
    };

    const initializeGame = async (selectedLevel) => {
        setGameState('loading');
        setSynonymBox([]);
        setAntonymBox([]);
        setTimeExpired(false);

        // precise level from argument or fall back to state
        const currentLevel = selectedLevel || level;

        try {
            const data = await startGame({ token, level: currentLevel });
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
        } catch (err) {
            setGameState('error');
            console.error("Game Start Failed:", err);
        }
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

    const handleSubmit = async () => {
        if (gameState !== 'playing' && !timeExpired) return;

        setGameState('loading');

        const timeTaken = gameData?.time_limit ? (gameData.time_limit - timeLeft) : 0;

        const submissionData = {
            token,
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

                // Check if we've completed all 10 rounds
                if (newRoundCount >= MAX_ROUNDS) {
                    // Game session complete - show final results
                    navigate('/result', {
                        state: {
                            results: {
                                score: newBestPerformance.score,
                                total_correct: newBestPerformance.total_correct,
                                time_bonus: newBestPerformance.time_bonus,
                                accuracy: newBestPerformance.accuracy
                            },
                            gameData: newBestPerformance.gameData,
                            synonymBox: newBestPerformance.synonyms,
                            antonymBox: newBestPerformance.antonyms,
                            roundsPlayed: newRoundCount,
                            isBestPerformance: true,
                            isSessionComplete: true,
                            allRounds: updatedHistory
                        }
                    });
                } else {
                    // Continue to next round
                    initializeGame(level);
                }
            }
        } catch (err) {
            console.error("Submission Failed:", err);
            if (!isDaily) {
                // Even on error, continue gameplay
                initializeGame(level);
            } else {
                setGameState('error');
                alert("Submission failed. Please try again.");
            }
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
            alert("Performance Summary saved! You can now share it.");
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

    if (gameState === 'error') {
        return (
            <div className="game-page error-mode" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '20px', background: '#f8fafc' }}>
                <h2 style={{ color: '#ef4444' }}>Oops! Failed to load game.</h2>
                <p style={{ color: '#64748b' }}>Check your connection or try again.</p>
                <button className="btn btn-submit" style={{ width: '200px' }} onClick={initializeGame}>Try Again</button>
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

    if (gameState === 'loading') {
        return (
            <div className="game-page loading-mode" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc' }}>
                <div className="loader">Loading Challenge...</div>
                <p style={{ marginTop: '10px', color: '#64748b' }}>Getting your words ready...</p>
            </div>
        );
    }

    /* ================= GAME UI (Playing Mode) ================= */

    return (
        <div className="game-page playing-mode">

            <header className="game-header-compact">
                <div className="header-player">
                    <i className="bi bi-person-fill"></i> {member?.name}
                    {roundCount > 0 && !isDaily && (
                        <span style={{
                            marginLeft: '12px',
                            fontSize: '11px',
                            background: 'var(--soft-mint)',
                            color: 'var(--brand-green)',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontWeight: '700'
                        }}>
                            Round {roundCount + 1} of {MAX_ROUNDS}
                        </span>
                    )}
                </div>
                <Timer timeLeft={timeLeft} formatTime={formatTime} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                        onClick={handleHint}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            cursor: (hintsRemaining > 0 && !timeExpired && availableWords.length > 0) ? 'pointer' : 'default',
                            opacity: (hintsRemaining > 0 && !timeExpired && availableWords.length > 0) ? 1 : 0.4,
                            background: '#FEF3C7',
                            color: '#D97706', // Gold-amber
                            padding: '6px 12px',
                            borderRadius: '99px',
                            fontSize: '13px',
                            fontWeight: '700',
                            border: '1px solid #FCD34D'
                        }}
                    >
                        <i className="bi bi-lightbulb-fill"></i>
                        {level === 'EASY' ? <span>Assist ({hintsRemaining})</span> : <span>{hintsRemaining}</span>}
                    </div>

                    <div className="header-level" data-level={level}>
                        {bestPerformance && !isDaily ? (
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '9px', opacity: 0.7 }}>Best</div>
                                <div style={{ fontSize: '13px', fontWeight: '800' }}>{bestPerformance.score.toFixed(1)}</div>
                            </div>
                        ) : (
                            <>Lvl: {level}</>
                        )}
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
                            <span style={{
                                fontSize: '12px',
                                fontWeight: '700',
                                color: 'var(--slate-gray)'
                            }}>{availableWords.length} words</span>
                        </div>
                        <div
                            className={`source-pool ${dragOverBox === 'available' ? 'drag-over' : ''}`}
                            onDragOver={handleDragOver}
                            onDragEnter={(e) => handleDragEnter(e, "available")}
                            onDrop={(e) => handleDrop(e, "available")}
                            data-zone="available"
                        >
                            {availableWords.map((word) => (
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
                        <h1 style={{
                            fontSize: '40px',
                            fontWeight: '900',
                            color: 'var(--brand-black)',
                            margin: '0 0 12px 0',
                            textTransform: 'uppercase',
                            letterSpacing: '-1px',
                            textAlign: 'center'
                        }}>{gameData?.anchor_word}</h1>
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
        </div>

    );
}

export default GamePage;
