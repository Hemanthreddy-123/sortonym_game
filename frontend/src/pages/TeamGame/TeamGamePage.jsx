import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { startGame, submitGame } from '../../api/gameApi';
import '../Game/GamePage.css'; // Reuse the exact same CSS

// Reuse components from regular game
import Timer from '../Game/GameComponents/Timer';
import WordTile from '../Game/GameComponents/WordTile';
import TargetZone from '../Game/GameComponents/TargetZone';
import GameButton from '../Game/GameComponents/GameButton';

const TeamGamePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { member, token } = useAuth();

    const {
        gameCode,
        teamA = [],
        teamB = [],
        difficulty = 'MEDIUM',
        currentPlayer,
        selectedTeam,
        teamName
    } = location.state || {};

    // Game States
    const [gameState, setGameState] = useState('loading');
    const [gameData, setGameData] = useState(null);
    const [availableWords, setAvailableWords] = useState([]);
    const [synonymBox, setSynonymBox] = useState([]);
    const [antonymBox, setAntonymBox] = useState([]);
    const [timeLeft, setTimeLeft] = useState(0);
    const [timeExpired, setTimeExpired] = useState(false);
    const startTimeRef = useRef(null);

    // Drag and Touch States (matching GamePage)
    const [draggedWord, setDraggedWord] = useState(null);
    const [dragOverBox, setDragOverBox] = useState(null);
    const [touchedWord, setTouchedWord] = useState(null);
    const touchStartPos = useRef(null);

    // Team Game States
    const MAX_ROUNDS = 5;
    const [roundCount, setRoundCount] = useState(0);
    const [teamAScores, setTeamAScores] = useState([]);
    const [teamBScores, setTeamBScores] = useState([]);
    const [currentPlayerScores, setCurrentPlayerScores] = useState([]);

    useEffect(() => {
        if (!gameCode || !selectedTeam) {
            navigate('/team-lobby');
            return;
        }
        initializeRound();
    }, []);

    // Timer Logic
    useEffect(() => {
        let timer;
        if (gameState === 'playing' && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setTimeExpired(true);
                        handleSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [gameState, timeLeft]);

    const initializeRound = async () => {
        setGameState('loading');
        setSynonymBox([]);
        setAntonymBox([]);
        setTimeExpired(false);
        setDraggedWord(null);
        setDragOverBox(null);

        try {
            const data = await startGame({ token, level: difficulty });
            setGameData(data);
            setAvailableWords(data.words || []);

            // Correctly calculate time based on difficulty (Strict Enforcement)
            const roundTimes = { 'EASY': 90, 'MEDIUM': 60, 'HARD': 45 };
            const timeLimit = roundTimes[difficulty] || 60;
            setTimeLeft(timeLimit);

            startTimeRef.current = Date.now();
            setGameState('playing');
        } catch (error) {
            console.error('Failed to initialize round:', error);
            setGameState('error');
        }
    };

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
            level: difficulty,
            gameCode, // Pass game code for real-time lobby updates
            roundNumber: roundCount + 1
        };

        try {
            const res = await submitGame(submissionData);

            const roundScore = {
                round: roundCount + 1,
                score: res.score || 0,
                total_correct: res.total_correct || 0,
                time_bonus: res.time_bonus || 0,
                accuracy: res.accuracy || 0,
                player: currentPlayer?.name || member?.name,
                team: selectedTeam
            };

            const updatedPlayerScores = [...currentPlayerScores, roundScore];
            setCurrentPlayerScores(updatedPlayerScores);

            if (selectedTeam === 'A') {
                setTeamAScores([...teamAScores, roundScore]);
            } else {
                setTeamBScores([...teamBScores, roundScore]);
            }

            const newRoundCount = roundCount + 1;
            setRoundCount(newRoundCount);

            if (newRoundCount >= MAX_ROUNDS) {
                navigate('/team-results', {
                    state: {
                        gameCode,
                        teamA,
                        teamB,
                        teamAScores: selectedTeam === 'A' ? [...teamAScores, roundScore] : teamAScores,
                        teamBScores: selectedTeam === 'B' ? [...teamBScores, roundScore] : teamBScores,
                        currentPlayerScores: updatedPlayerScores,
                        difficulty
                    }
                });
            } else {
                initializeRound();
            }
        } catch (error) {
            console.error('Submission failed:', error);
            initializeRound();
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Drag and Drop Handlers (matching GamePage)
    const handleDragStart = (e, word) => {
        setDraggedWord(word);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnd = () => {
        setDraggedWord(null);
        setDragOverBox(null);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDragEnter = (e, zone) => {
        e.preventDefault();
        setDragOverBox(zone);
    };

    const handleDrop = (e, zone) => {
        e.preventDefault();
        setDragOverBox(null);

        if (!draggedWord) return;

        if (zone === 'synonyms') {
            if (!synonymBox.find(w => w.id === draggedWord.id)) {
                setSynonymBox([...synonymBox, draggedWord]);
                setAvailableWords(availableWords.filter(w => w.id !== draggedWord.id));
                setAntonymBox(antonymBox.filter(w => w.id !== draggedWord.id));
            }
        } else if (zone === 'antonyms') {
            if (!antonymBox.find(w => w.id === draggedWord.id)) {
                setAntonymBox([...antonymBox, draggedWord]);
                setAvailableWords(availableWords.filter(w => w.id !== draggedWord.id));
                setSynonymBox(synonymBox.filter(w => w.id !== draggedWord.id));
            }
        } else if (zone === 'available') {
            setAvailableWords([...availableWords, draggedWord]);
            setSynonymBox(synonymBox.filter(w => w.id !== draggedWord.id));
            setAntonymBox(antonymBox.filter(w => w.id !== draggedWord.id));
        }

        setDraggedWord(null);
    };

    // Touch Handlers (matching GamePage)
    const handleTouchStart = (e, word) => {
        setTouchedWord(word);
        touchStartPos.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };
    };

    const handleTouchMove = (e) => {
        if (!touchedWord) return;
        e.preventDefault();
    };

    const handleTouchEnd = (e) => {
        if (!touchedWord) return;

        const touch = e.changedTouches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        const zone = element?.closest('[data-zone]')?.dataset?.zone;

        if (zone) {
            handleDrop({ preventDefault: () => { }, dataTransfer: {} }, zone);
        }

        setTouchedWord(null);
        touchStartPos.current = null;
    };

    if (gameState === 'loading') {
        return (
            <div className="game-page loading">
                <div className="loading-spinner">Loading...</div>
            </div>
        );
    }

    if (gameState === 'error') {
        return (
            <div className="game-page error">
                <div className="error-message">Failed to load game. Please try again.</div>
            </div>
        );
    }

    return (
        <div className="game-page playing-mode">
            <header className="game-header-compact">
                <div className="header-player">
                    <i className="bi bi-person-circle"></i>
                    <span>{member?.name || currentPlayer?.name}</span>
                    {/* Team Badge - Subtle addition */}
                    <span style={{
                        fontSize: '10px',
                        background: selectedTeam === 'A' ? '#3b82f6' : '#ef4444',
                        color: '#fff',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontWeight: '700',
                        marginLeft: '4px'
                    }}>
                        Team {selectedTeam}
                    </span>
                    {roundCount < MAX_ROUNDS && (
                        <span style={{
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
                <div className="header-level" data-level={difficulty}>
                    Lvl: {difficulty}
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
            </footer>
        </div>
    );
};

export default TeamGamePage;
