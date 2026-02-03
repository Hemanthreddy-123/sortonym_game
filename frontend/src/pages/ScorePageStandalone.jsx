import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ScorePageStandalone = () => {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        // Get game data from navigation state
        const {
            results = { score: 0, total_correct: 0, time_bonus: 0 },
            gameData = { words: [] },
            synonymBox = [],
            antonymBox = []
        } = location.state || {};

        // Inject real data into the standalone page
        const gameResults = {
            score: results.score || 0,
            maxScore: 20,
            totalCorrect: results.total_correct || 0,
            totalWords: gameData.words?.length || 8,
            timeBonus: results.time_bonus || 0,
            level: 'EASY',
            synonymBox: synonymBox.map(w => ({
                id: w.id,
                word: w.word,
                isCorrect: w.id.startsWith('syn_')
            })),
            antonymBox: antonymBox.map(w => ({
                id: w.id,
                word: w.word,
                isCorrect: w.id.startsWith('ant_')
            }))
        };

        // Store data in sessionStorage to pass to standalone page
        sessionStorage.setItem('gameResults', JSON.stringify(gameResults));

        // Redirect to standalone HTML page
        window.location.href = '/score-page-standalone/index.html';

    }, [location.state, navigate]);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            fontFamily: 'Outfit, sans-serif'
        }}>
            <p>Loading score page...</p>
        </div>
    );
};

export default ScorePageStandalone;
