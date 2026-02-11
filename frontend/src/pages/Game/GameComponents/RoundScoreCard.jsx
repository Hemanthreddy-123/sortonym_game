import React from 'react';
import './RoundScoreCard.css';

const RoundScoreCard = ({
    roundNumber,
    synonyms,
    antonyms,
    onNextRound,
    onExit,
    totalXP,
    maxRounds,
    isLastRound
}) => {
    return (
        <div className="round-score-overlay">
            <div className="round-score-card">
                <div className="score-card-header">
                    <h2>Round {roundNumber} Results</h2>
                    <div className="total-xp-badge">+{totalXP} XP</div>
                </div>

                <div className="score-card-grid">
                    {/* Synonyms Section */}
                    <div className="score-section synonyms">
                        <div className="section-header">
                            <div>
                                <h3>Synonyms</h3>
                                <span>Similar meanings</span>
                            </div>
                            <div className="count-badge">
                                {synonyms.filter(w => w.isCorrect).length}/{synonyms.length}
                            </div>
                        </div>
                        <div className="word-list">
                            {synonyms.map((word, idx) => (
                                <div key={idx} className={`word-row ${word.isCorrect ? 'correct' : 'incorrect'}`}>
                                    <div className="status-icon">
                                        <i className={`bi ${word.isCorrect ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`}></i>
                                    </div>
                                    <div className="word-info">
                                        <span className="word-text">{word.word}</span>
                                        <span className="status-text">
                                            {word.isCorrect ? 'Correct answer' : 'Incorrect selection'}
                                        </span>
                                    </div>
                                    {word.isCorrect && (
                                        <div className="xp-pill">+10 XP</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Antonyms Section */}
                    <div className="score-section antonyms">
                        <div className="section-header">
                            <div>
                                <h3>Antonyms</h3>
                                <span>Opposite meanings</span>
                            </div>
                            <div className="count-badge">
                                {antonyms.filter(w => w.isCorrect).length}/{antonyms.length}
                            </div>
                        </div>
                        <div className="word-list">
                            {antonyms.map((word, idx) => (
                                <div key={idx} className={`word-row ${word.isCorrect ? 'correct' : 'incorrect'}`}>
                                    <div className="status-icon">
                                        <i className={`bi ${word.isCorrect ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`}></i>
                                    </div>
                                    <div className="word-info">
                                        <span className="word-text">{word.word}</span>
                                        <span className="status-text">
                                            {word.isCorrect ? 'Correct answer' : 'Incorrect selection'}
                                        </span>
                                    </div>
                                    {word.isCorrect && (
                                        <div className="xp-pill">+10 XP</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="score-card-footer">
                    <button className="btn-next-round active" onClick={onNextRound}>
                        {isLastRound ? 'VIEW FINAL RESULTS' : 'NEXT ROUND'}
                    </button>
                    <button className="btn-exit-game" onClick={onExit}>
                        EXIT
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoundScoreCard;
