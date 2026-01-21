import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { startGame, submitGame } from "../api/gameApi.js";
import "./GamePage.css";

function GamePage() {
  const navigate = useNavigate();
  const { token, user, member } = useAuth();

  const [gameState, setGameState] = useState("loading"); // loading | playing | completed | error
  const [gameData, setGameData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const [synonymBox, setSynonymBox] = useState([]);
  const [antonymBox, setAntonymBox] = useState([]);
  const [availableWords, setAvailableWords] = useState([]);
  const [finalSynonyms, setFinalSynonyms] = useState([]);
  const [finalAntonyms, setFinalAntonyms] = useState([]);

  const [draggedWord, setDraggedWord] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [timeExpired, setTimeExpired] = useState(false);

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const submittedRef = useRef(false); // prevents double submit

  /* ================= INITIALIZE GAME ================= */

  useEffect(() => {
    initializeGame();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const initializeGame = async () => {
    try {
      setGameState("loading");
      setError("");
      setTimeExpired(false);
      submittedRef.current = false;
      setResults(null);

      const data = await startGame({ token });

      setGameData(data);
      setTimeLeft(data.time_limit);
      setAvailableWords(data.words);
      setSynonymBox([]);
      setAntonymBox([]);
      setFinalSynonyms([]);
      setFinalAntonyms([]);

      startTimeRef.current = Date.now();
      setGameState("playing");

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            // When time runs out, submit with current progress
            submitOnTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError("Failed to start game");
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
          correct: w.type === "synonym",
        })),
      );

      setFinalAntonyms(
        antonymBox.map((w) => ({
          ...w,
          correct: w.type === "antonym",
        })),
      );

      // Submit with whatever progress they have
      const result = await submitGame({
        token,
        roundId: gameData?.round_id,
        synonyms: synonymBox.map((w) => w.id),
        antonyms: antonymBox.map((w) => w.id),
        timeTaken,
        reason: "TIME_EXPIRED",
      });

      setResults(result);
      setGameState("completed");
    } catch (err) {
      console.error("Submit error on time up:", err);
      setError("Failed to submit game after time expired");
      setGameState("error");
    }
  };

  /* ================= DRAG & DROP ================= */

  const handleDragStart = (e, word) => {
    if (timeExpired) return;
    setDraggedWord(word);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, targetBox) => {
    e.preventDefault();
    if (!draggedWord || timeExpired) return;

    // ❌ block overflow
    if (targetBox === "synonyms" && synonymBox.length >= 4) return;
    if (targetBox === "antonyms" && antonymBox.length >= 4) return;

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
  };

  /* ================= MANUAL SUBMIT ================= */

  const handleSubmit = async () => {
    if (submittedRef.current || timeExpired) return;

    if (synonymBox.length !== 4 || antonymBox.length !== 4) {
      alert("You must place exactly 4 words in Synonyms and 4 in Antonyms.");
      return;
    }

    submittedRef.current = true;
    setTimeExpired(true);

    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const timeTaken = (Date.now() - startTimeRef.current) / 1000;

      // store final answers for result UI
      setFinalSynonyms(
        synonymBox.map((w) => ({
          ...w,
          correct: w.type === "synonym",
        })),
      );

      setFinalAntonyms(
        antonymBox.map((w) => ({
          ...w,
          correct: w.type === "antonym",
        })),
      );

      const result = await submitGame({
        token,
        roundId: gameData?.round_id,
        synonyms: synonymBox.map((w) => w.id),
        antonyms: antonymBox.map((w) => w.id),
        timeTaken,
      });

      setResults(result);
      setGameState("completed");
    } catch (err) {
      console.error("Submit error:", err);
      setError("Failed to submit game");
      setGameState("error");
    }
  };

  /* ================= HELPERS ================= */

  const handlePlayAgain = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    initializeGame();
  };

  const handleExit = () => navigate("/landing");

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
    return (
      <div className="game-page">
        <div className="game-results">
          <h2>Round Complete!</h2>

          {timeExpired && timeLeft === 0 && (
            <div className="time-expired-banner">
              ⏱️ Time Expired — Submitted with Current Progress
            </div>
          )}

          <div className="word-results-container">
            <div className="result-section">
              <h3>
                Synonyms ({finalSynonyms.filter((w) => w.correct).length}/4
                correct)
              </h3>
              <div className="result-words">
                {finalSynonyms.map((word) => (
                  <div
                    key={word.id}
                    className={`result-word-item ${
                      word.correct ? "correct" : "incorrect"
                    }`}
                  >
                    {word.word}
                    <span className="result-indicator">
                      {word.correct ? "✓" : "✗"}
                    </span>
                  </div>
                ))}
                {finalSynonyms.length < 4 && (
                  <div className="result-word-item empty">
                    Empty ({4 - finalSynonyms.length} missing)
                  </div>
                )}
              </div>
            </div>

            <div className="result-section">
              <h3>
                Antonyms ({finalAntonyms.filter((w) => w.correct).length}/4
                correct)
              </h3>
              <div className="result-words">
                {finalAntonyms.map((word) => (
                  <div
                    key={word.id}
                    className={`result-word-item ${
                      word.correct ? "correct" : "incorrect"
                    }`}
                  >
                    {word.word}
                    <span className="result-indicator">
                      {word.correct ? "✓" : "✗"}
                    </span>
                  </div>
                ))}
                {finalAntonyms.length < 4 && (
                  <div className="result-word-item empty">
                    Empty ({4 - finalAntonyms.length} missing)
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="score-summary">
            <div className="score-item">
              <span className="score-label">Total Score:</span>
              <span className="score-value">
                {results ? results.score.toFixed(1) : "0"}
              </span>
            </div>
            <div className="score-item">
              <span className="score-label">Correct Words:</span>
              <span className="score-value">
                {results ? results.total_correct : "0"}/8
              </span>
            </div>
            <div className="score-item">
              <span className="score-label">Base Score:</span>
              <span className="score-value">
                {results ? results.base_score : "0"}
              </span>
            </div>
            <div className="score-item">
              <span className="score-label">Time Bonus:</span>
              <span className="score-value">
                +{(results ? results.time_bonus : 0).toFixed(1)}
              </span>
            </div>
          </div>

          <div className="game-actions">
            <button className="btn-primary" onClick={handlePlayAgain}>
              Play Again
            </button>
            <button className="btn-secondary" onClick={handleExit}>
              Exit Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ================= GAME UI ================= */

  return (
    <div className="game-page">
      <div className="game-header">
        <h1 className="anchor-word">{gameData?.anchor_word}</h1>
        <div className="game-stats">
          <span className="timer">
            Time: {formatTime(timeLeft)}
            {timeLeft <= 10 && <span className="time-warning"> ⚠️ Hurry!</span>}
          </span>
          <span className="player-info">
            Team {user?.team_no} - {member?.name}
          </span>
        </div>
      </div>

      <div className="game-content">
        <div className="word-areas">
          <div className="word-section">
            <h3>Words to Sort ({availableWords.length})</h3>
            <div
              className="word-container"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "available")}
            >
              {availableWords.map((word) => (
                <div
                  key={word.id}
                  className="word-item"
                  draggable={!timeExpired}
                  onDragStart={(e) => handleDragStart(e, word)}
                >
                  {word.word}
                </div>
              ))}
            </div>
          </div>

          <div className="word-section">
            <h3>Synonyms ({synonymBox.length}/4)</h3>
            <div
              className="word-container"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "synonyms")}
            >
              {synonymBox.map((word) => (
                <div
                  key={word.id}
                  className="word-item"
                  draggable={!timeExpired}
                  onDragStart={(e) => handleDragStart(e, word)}
                >
                  {word.word}
                </div>
              ))}
            </div>
          </div>

          <div className="word-section">
            <h3>Antonyms ({antonymBox.length}/4)</h3>
            <div
              className="word-container"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "antonyms")}
            >
              {antonymBox.map((word) => (
                <div
                  key={word.id}
                  className="word-item"
                  draggable={!timeExpired}
                  onDragStart={(e) => handleDragStart(e, word)}
                >
                  {word.word}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="game-actions">
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={
              timeExpired || synonymBox.length !== 4 || antonymBox.length !== 4
            }
          >
            Submit ({synonymBox.length + antonymBox.length}/8)
          </button>
          <button className="btn-secondary" onClick={handleExit}>
            Exit Game
          </button>
        </div>
      </div>
    </div>
  );
}

export default GamePage;
