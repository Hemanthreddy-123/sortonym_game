import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { startGame, submitGame } from "../api/gameApi.js";
import { toPng } from 'html-to-image';
import userAvatar from '../assets/user_avatar.png';
import "./GamePage.css";
import { useTheme } from "../hooks/useTheme";

function GamePage() {
  const navigate = useNavigate();
  const { token, user, member, signOut, updateMember } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [gameState, setGameState] = useState("loading"); // loading | playing | completed | error
  const [gameData, setGameData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [level, setLevel] = useState((localStorage.getItem('sortonym_level') || 'easy').toLowerCase()); // Level State

  // Dropdown & Edit State
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(member?.name || '');
  const menuRef = useRef(null);

  useEffect(() => {
    function onDocMouseDown(e) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  // Sync level from localStorage if it changes elsewhere (optional but good for consistency)
  useEffect(() => {
    const savedLevel = (localStorage.getItem('sortonym_level') || 'easy').toLowerCase();
    if (savedLevel !== level) {
      setLevel(savedLevel);
    }
  }, []);

  async function onLogout() {
    await signOut();
    navigate('/auth'); // Redirect to auth/login
  }

  function handleEditToggle() {
    if (isEditing) {
      updateMember({ name: editName });
      setIsEditing(false);
    } else {
      setEditName(member?.name || '');
      setIsEditing(true);
    }
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setEditName(member?.name || '');
  }

  const [synonymBox, setSynonymBox] = useState([]);
  const [antonymBox, setAntonymBox] = useState([]);
  const [availableWords, setAvailableWords] = useState([]);
  const [finalSynonyms, setFinalSynonyms] = useState([]);
  const [finalAntonyms, setFinalAntonyms] = useState([]);

  const [draggedWord, setDraggedWord] = useState(null);
  const [dragOverBox, setDragOverBox] = useState(null); // 'synonyms' | 'antonyms' | 'available' | null
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [timeExpired, setTimeExpired] = useState(false);

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const resultsRef = useRef(null);
  const certificateRef = useRef(null);
  const submittedRef = useRef(false); // prevents double submit
  const currentRoundIdRef = useRef(null); // Store round_id separately

  /* ================= INITIALIZE GAME ================= */

  useEffect(() => {
    initializeGame();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [level]); // Re-run when level changes

  const initializeGame = async () => {
    try {
      if (timerRef.current) clearInterval(timerRef.current);

      // RESET STATE IMMEDIATELY (Before Async Call)
      setGameState("loading");
      setError("");
      setTimeExpired(false);
      submittedRef.current = false;
      setResults(null);
      setSynonymBox([]);
      setAntonymBox([]);
      setFinalSynonyms([]);
      setFinalAntonyms([]);
      setGameData(null);
      setDraggedWord(null);
      setDragOverBox(null);
      currentRoundIdRef.current = null;

      const data = await startGame({ token, level }); // Pass level

      setGameData(data);
      currentRoundIdRef.current = data.round_id; // Store round_id in ref
      setTimeLeft(data.time_limit);
      setAvailableWords(data.words);

      startTimeRef.current = Date.now();
      setGameState("playing");

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            // Only trigger auto-submit if not already submitted manually
            if (!submittedRef.current) {
              submitOnTimeUp();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Initialize Game Error:", err);
      setError("Failed to start game: " + (err.message || "Unknown error"));
      setGameState("error");
    }
  };

  /* ================= TIME UP SUBMISSION ================= */

  const submitOnTimeUp = async () => {
    if (submittedRef.current) return;

    submittedRef.current = true;
    setTimeExpired(true);

    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const timeTaken = (Date.now() - startTimeRef.current) / 1000;

      // store final answers for result UI
      setFinalSynonyms(
        synonymBox.map((w) => ({
          ...w,
          correct: w.id.startsWith("syn_"),
        })),
      );

      setFinalAntonyms(
        antonymBox.map((w) => ({
          ...w,
          correct: w.id.startsWith("ant_"),
        })),
      );

      // Get round_id from ref to ensure it's always available
      const roundId = currentRoundIdRef.current || gameData?.round_id;

      if (!roundId) {
        console.warn("Skipping submission: No round ID available (game likely reset)");
        return;
      }

      // Submit with whatever progress they have
      const result = await submitGame({
        token,
        roundId: roundId,
        synonyms: synonymBox.map((w) => w.id),
        antonyms: antonymBox.map((w) => w.id),
        timeTaken,
        reason: "TIME_EXPIRED",
        level, // Pass level for scoring
      });

      setResults(result);
      setGameState("completed");
    } catch (err) {
      console.error("Submit error on time up:", err);
      setError("Failed to submit game after time expired: " + err.message);
      setGameState("error");
    }
  };

  /* ================= DRAG & DROP ================= */

  const handleDragStart = (e, word) => {
    if (timeExpired || submittedRef.current) return;
    setDraggedWord(word);

    // REQUIRED for some browsers to initiate drag properly
    e.dataTransfer.setData("text/plain", word.id);
    e.dataTransfer.effectAllowed = "move";

    // Add a small delay to prevent the drag image from being affected by the class change immediately
    setTimeout(() => {
      e.target.classList.add('dragging');
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('dragging');
    setDraggedWord(null);
    setDragOverBox(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e, targetBox) => {
    e.preventDefault();
    if (timeExpired || submittedRef.current) return;
    setDragOverBox(targetBox);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    // Only clear if we are leaving the current container (not entering a child)
    // Actually, simple state management is often cleaner for these UI cues
  };

  const handleDrop = (e, targetBox) => {
    e.preventDefault();
    if (!draggedWord || timeExpired || submittedRef.current) return;

    const maxPerBox = gameData?.words.length / 2 || 4;
    // ❌ block overflow
    if (targetBox === "synonyms" && synonymBox.length >= maxPerBox) return;
    if (targetBox === "antonyms" && antonymBox.length >= maxPerBox) return;

    // remove word from all boxes
    setAvailableWords((p) => p.filter((w) => w.id !== draggedWord.id));
    setSynonymBox((p) => p.filter((w) => w.id !== draggedWord.id));
    setAntonymBox((p) => p.filter((w) => w.id !== draggedWord.id));

    // add to target box
    if (targetBox === "synonyms") {
      setSynonymBox((p) => [...p, draggedWord]);
    } else if (targetBox === "antonyms") {
      setAntonymBox((p) => [...p, draggedWord]);
    } else {
      setAvailableWords((p) => [...p, draggedWord]);
    }

    setDraggedWord(null);
    setDragOverBox(null);
  };

  /* ================= MANUAL SUBMIT ================= */

  const handleSubmit = async () => {
    if (submittedRef.current || timeExpired) return;

    const maxPerBox = gameData?.words.length / 2 || 4;
    if (synonymBox.length !== maxPerBox || antonymBox.length !== maxPerBox) {
      alert(`You must place exactly ${maxPerBox} words in Synonyms and ${maxPerBox} in Antonyms.`);
      return;
    }

    submittedRef.current = true;
    // Do NOT setTimeExpired(true) here, it's a manual submit

    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const timeTaken = (Date.now() - startTimeRef.current) / 1000;

      // store final answers for result UI
      setFinalSynonyms(
        synonymBox.map((w) => ({
          ...w,
          correct: w.id.startsWith("syn_"),
        })),
      );

      setFinalAntonyms(
        antonymBox.map((w) => ({
          ...w,
          correct: w.id.startsWith("ant_"),
        })),
      );

      // Get round_id from ref to ensure it's always available
      const roundId = currentRoundIdRef.current || gameData?.round_id;

      if (!roundId) {
        throw new Error("No round ID available for submission");
      }

      const result = await submitGame({
        token,
        roundId: roundId,
        synonyms: synonymBox.map((w) => w.id),
        antonyms: antonymBox.map((w) => w.id),
        timeTaken,
        level, // Pass level for scoring
      });

      setResults(result);
      setGameState("completed");
    } catch (err) {
      console.error("Submit error:", err);
      setError("Failed to submit game: " + err.message);
      setGameState("error");
    }
  };

  /* ================= HELPERS ================= */

  const handlePlayAgain = () => {
    initializeGame();
  };

  const handleExit = () => navigate("/landing");

  const handleCertificate = async () => {
    if (certificateRef.current === null) return;
    try {
      const dataUrl = await toPng(certificateRef.current, { cacheBust: true, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `Certificate-${member?.name || 'Player'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Certificate download error:', err);
    }
  };

  const handleShare = async () => {
    if (resultsRef.current === null) return;
    try {
      const dataUrl = await toPng(resultsRef.current, { cacheBust: true, backgroundColor: '#ffffff' });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'sortonym-score.png', { type: blob.type });

      if (navigator.share) {
        await navigator.share({
          title: 'Sortonym Score',
          text: `I just scored ${results?.score.toFixed(1)} on Sortonym Challenge!`,
          files: [file],
        });
      } else {
        // Fallback: Just copy link or something (here we just alert or do nothing)
        alert("Sharing not supported on this browser. You can download the image instead.");
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  /* ================= UI STATES ================= */

  if (gameState === "loading") {
    return (
      <div className="game-page">
        <div className="game-loading">
          <h2>Loading Game...</h2>
        </div>
      </div>
    );
  }

  if (gameState === "error") {
    return (
      <div className="game-page">
        <div className="game-error">
          <h2>Game Error</h2>
          <p>{error}</p>
          <div className="game-actions">
            <button className="btn-primary" onClick={handlePlayAgain}>
              Try Again
            </button>
            <button className="btn-secondary" onClick={handleExit}>
              Exit Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "completed") {
    // Generate the full solution view based on the 8 words provided during the round
    const solutionSynonyms = gameData?.words.filter(w => w.id.startsWith('syn_')) || [];
    const solutionAntonyms = gameData?.words.filter(w => w.id.startsWith('ant_')) || [];

    const getWordStatus = (word, targetBox) => {
      const isInSynonyms = synonymBox.some(w => w.id === word.id);
      const isInAntonyms = antonymBox.some(w => w.id === word.id);

      if (targetBox === 'synonyms') {
        if (isInSynonyms) return "correct";
        if (isInAntonyms) return "incorrect";
        return "missed";
      } else {
        if (isInAntonyms) return "correct";
        if (isInSynonyms) return "incorrect";
        return "missed";
      }
    };

    return (
      <div className="game-page results-mode">
        {/* Celebration Container */}
        <div className="results-celebration-container" ref={resultsRef}>

          {/* 1. TOP: Title & Trophy */}
          <header className="results-header">
            <div className="trophy-icon-wrapper">
              <i className="bi bi-trophy-fill"></i>
            </div>
            <h1 className="results-title-main">LEVEL COMPLETED!</h1>
            <p className="results-subtitle">{level} Challenge Conquered</p>
          </header>

          {/* 2. CENTER: Circular Score */}
          <section className="results-score-section">
            {(() => {
              const score = results ? results.score : 0;
              const size = 220; // Bigger
              const center = size / 2;
              const radius = 90;
              const circumference = 2 * Math.PI * radius;
              const maxScoreVis = 20;
              const progress = Math.min(score / maxScoreVis, 1);
              const dashOffset = circumference * (1 - progress);

              let strokeColor = "#ef4444"; // Red
              let levelLabel = "Keep Going!";

              if (score >= 12) {
                strokeColor = "#10b981"; // Green
                levelLabel = "Amazing!";
              } else if (score >= 5) {
                strokeColor = "#f59e0b"; // Yellow
                levelLabel = "Good Job!";
              }

              return (
                <div className="score-meter-wrapper">
                  <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="score-ring-svg">
                    {/* Background Circle */}
                    <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="16" />
                    {/* Progress Circle */}
                    <circle cx={center} cy={center} r={radius} fill="none" stroke={strokeColor} strokeWidth="16"
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                      strokeLinecap="round"
                      transform={`rotate(-90 ${center} ${center})`}
                      style={{ transition: 'stroke-dashoffset 1.5s ease-out', filter: `drop-shadow(0 0 10px ${strokeColor})` }}
                    />
                  </svg>
                  <div className="score-text-overlay">
                    <span className="score-big-num" style={{ color: 'white' }}>{score.toFixed(1)}</span>
                    <span className="score-msg" style={{ color: '#e2e8f0' }}>{levelLabel}</span>
                  </div>
                </div>
              );
            })()}
          </section>

          {/* 3. BOTTOM: Stats & Buttons */}
          <section className="results-stats-section">

            {/* Stats Cards */}
            <div className="stats-cards-row">
              <div className="stat-card">
                <div className="stat-icon"><i className="bi bi-crosshair"></i></div>
                <div className="stat-info">
                  <span className="stat-label">Accuracy</span>
                  <span className="stat-value">{results ? results.total_correct : "0"}/{gameData?.words.length}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><i className="bi bi-lightning-fill"></i></div>
                <div className="stat-info">
                  <span className="stat-label">Bonus</span>
                  <span className="stat-value">+{results ? results.time_bonus.toFixed(1) : "0"}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><i className="bi bi-star-fill"></i></div>
                <div className="stat-info">
                  <span className="stat-label">Total</span>
                  <span className="stat-value">{results?.score.toFixed(1)}</span>
                </div>
              </div>
            </div>

            {/* Game Action Buttons */}
            <div className="game-action-buttons">
              <button className="btn-game-primary btn-play-again" onClick={handlePlayAgain}>
                <i className="bi bi-arrow-repeat"></i> Play Again
              </button>

              <div className="btn-row-secondary">
                <button className="btn-game-secondary" onClick={handleCertificate}>
                  <i className="bi bi-award"></i> Cert
                </button>
                <button className="btn-game-secondary" onClick={handleShare}>
                  <i className="bi bi-share"></i> Share
                </button>
                <button className="btn-game-secondary" onClick={handleExit}>
                  <i className="bi bi-x-lg"></i> Exit
                </button>
              </div>
            </div>
          </section>

        </div>

        {/* Hidden Certificate Template - Fixed position ensures it renders for capture */}
        <div style={{ position: "fixed", top: "0", left: "-10000px", opacity: 0, pointerEvents: "none" }}>
          <div ref={certificateRef} className="certificate-container">
            <div className="cert-frame-outer">
              <div className="cert-frame-inner">
                {/* Watermark Background */}
                <div className="cert-watermark">SORTONYM</div>

                {/* Header: Brand & Logo */}
                <div className="cert-header-brand">
                  <div className="cert-logo-circle">S</div>
                  <span className="cert-brand-text">SORTONYM SUPER ({level.toUpperCase()})</span>
                </div>

                {/* Main Body */}
                <div className="cert-body-content">
                  <h1 className="cert-main-title">CERTIFICATE</h1>
                  <h2 className="cert-sub-title">OF ACHIEVEMENT</h2>

                  <div className="cert-decoration-line">
                    <span className="line-left"></span>
                    <span className="star-icon">★</span>
                    <span className="line-right"></span>
                  </div>

                  <p className="cert-presented-to">THIS CERTIFICATE IS PROUDLY PRESENTED TO</p>

                  <h3 className="cert-player-name">{member?.name || 'Valued Player'}</h3>

                  <p className="cert-achievement-text">
                    For demonstrating exceptional linguistic proficiency and successfully completing
                    the <strong>{level}</strong> level challenges of the <strong>Sortonym Challenge</strong>.
                  </p>
                </div>

                {/* Footer Grid: Date, Seal, Signature */}
                <div className="cert-footer-grid">
                  <div className="footer-column date-col">
                    <span className="footer-label">DATE OF COMPLETION</span>
                    <strong className="footer-value">{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                    <div className="footer-underline"></div>
                  </div>

                  <div className="footer-column seal-col">
                    <div className="official-seal">
                      <div className="seal-text">VERIFIED</div>
                      <div className="seal-star">★</div>
                    </div>
                  </div>

                  <div className="footer-column signature-col">
                    <span className="footer-label">AUTHORIZED SIGNATURE</span>
                    <div className="signature-script">Sortonym Official</div>
                    <div className="footer-underline"></div>
                    <span className="footer-role">Director of Linguistics</span>
                  </div>
                </div>

                {/* Bottom Strip */}
                <div className="cert-bottom-id">
                  CERTIFICATE ID: SCN-{Math.floor(100000 + Math.random() * 900000)} • STATION-S OFFICIAL DOCUMENT
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ================= GAME UI ================= */

  /* ================= GAME UI ================= */

  return (
    <div className="game-page playing-mode">

      {/* 1. Top Header: Name & Timer */}
      <header className="game-header-compact">
        <div className="header-player">
          <i className="bi bi-person-fill"></i> {member?.name}
        </div>
        <div className={`header-timer ${timeLeft <= 10 ? 'critical' : ''}`}>
          {formatTime(timeLeft)}
        </div>
        <div className="header-level">
          Lvl: {level}
          <button className="theme-toggle-game" onClick={toggleTheme}>
            {theme === 'light' ? <i className="bi bi-moon-fill" /> : <i className="bi bi-sun-fill" />}
          </button>
        </div>
      </header>

      {/* 2. Anchor Word (Title) */}
      <div className="anchor-word-section">
        <span className="anchor-label">SORT FOR:</span>
        <h1 className="anchor-word-text">{gameData?.anchor_word}</h1>
      </div>

      <main className="game-board">
        {/* Key forces fresh DOM re-render on each new game, fixing sticky D&D issues */}
        <div className="game-play-area" key={startTimeRef.current || 'initial-game'}>

          {/* TOP: Targets (Synonyms & Antonyms) */}
          <div className="target-zones-container">

            {/* Synonyms Target */}
            <div
              className={`drop-zone synonym-zone ${dragOverBox === 'synonyms' ? 'drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, "synonyms")}
              onDrop={(e) => handleDrop(e, "synonyms")}
            >
              <div className="zone-header">
                <span className="zone-title">Synonyms</span>
                <span className="zone-count">{synonymBox.length}</span>
              </div>
              <div className="zone-content">
                {synonymBox.map((word) => (
                  <div
                    key={word.id}
                    className={`word-chip synonym-chip ${draggedWord?.id === word.id ? 'dragging' : ''}`}
                    draggable={!timeExpired}
                    onDragStart={(e) => handleDragStart(e, word)}
                    onDragEnd={handleDragEnd}
                  >
                    {word.word}
                  </div>
                ))}
                {synonymBox.length === 0 && <div className="zone-placeholder">Drop Here</div>}
              </div>
            </div>

            {/* Antonyms Target */}
            <div
              className={`drop-zone antonym-zone ${dragOverBox === 'antonyms' ? 'drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, "antonyms")}
              onDrop={(e) => handleDrop(e, "antonyms")}
            >
              <div className="zone-header">
                <span className="zone-title">Antonyms</span>
                <span className="zone-count">{antonymBox.length}</span>
              </div>
              <div className="zone-content">
                {antonymBox.map((word) => (
                  <div
                    key={word.id}
                    className={`word-chip antonym-chip ${draggedWord?.id === word.id ? 'dragging' : ''}`}
                    draggable={!timeExpired}
                    onDragStart={(e) => handleDragStart(e, word)}
                    onDragEnd={handleDragEnd}
                  >
                    {word.word}
                  </div>
                ))}
                {antonymBox.length === 0 && <div className="zone-placeholder">Drop Here</div>}
              </div>
            </div>
          </div>

          {/* BOTTOM: Source Words */}
          <div className="source-zone-container">
            {/* <h3 className="source-heading">Words to Sort</h3> */}
            <div
              className={`source-pool ${dragOverBox === 'available' ? 'drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, "available")}
              onDrop={(e) => handleDrop(e, "available")}
            >
              {availableWords.map((word) => (
                <div
                  key={word.id}
                  className={`word-card ${draggedWord?.id === word.id ? 'dragging' : ''}`}
                  draggable={!timeExpired}
                  onDragStart={(e) => handleDragStart(e, word)}
                  onDragEnd={handleDragEnd}
                >
                  {word.word}
                </div>
              ))}
            </div>
          </div>

        </div>

        <footer className="game-footer-controls">
          <button
            className="btn btn-submit"
            onClick={handleSubmit}
            disabled={timeExpired || synonymBox.length + antonymBox.length === 0}
          >
            Submit
          </button>
          <button className="btn btn-exit" onClick={handleExit}>
            Exit
          </button>
        </footer>
      </main>
    </div>
  );
}

export default GamePage;
