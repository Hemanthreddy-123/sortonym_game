// =====================================================
// SCORE PAGE: JavaScript Functionality
// =====================================================

// Get real game data from sessionStorage (passed from React)
const storedData = sessionStorage.getItem('gameResults');
const gameResults = storedData ? JSON.parse(storedData) : {
    score: 9.5,
    maxScore: 20,
    totalCorrect: 6,
    totalWords: 8,
    timeBonus: 0.5,
    level: 'EASY',
    synonymBox: [
        { id: 'syn_1', word: 'Happy', isCorrect: true },
        { id: 'syn_2', word: 'Joyful', isCorrect: true },
        { id: 'ant_3', word: 'Sad', isCorrect: false },
        { id: 'syn_4', word: 'Cheerful', isCorrect: true }
    ],
    antonymBox: [
        { id: 'ant_1', word: 'Angry', isCorrect: true },
        { id: 'syn_5', word: 'Peaceful', isCorrect: false },
        { id: 'ant_2', word: 'Hostile', isCorrect: true },
        { id: 'ant_3', word: 'Furious', isCorrect: true }
    ]
};

// Initialize page on load
window.addEventListener('DOMContentLoaded', () => {
    initializePage();
});

function initializePage() {
    // Set level badge
    document.getElementById('level-badge').textContent = `${gameResults.level} CHALLENGE`;

    // Set title based on score
    const titleText = getTitleText(gameResults.score);
    document.getElementById('title-text').textContent = titleText;

    // Set ring color based on score
    const ringColor = getRingColor(gameResults.score);
    document.getElementById('progress-ring').setAttribute('stroke', ringColor);
    document.getElementById('score-display').style.color = ringColor;

    // Animate score
    animateScore(gameResults.score, gameResults.maxScore);

    // Set stats
    document.getElementById('accuracy-stat').textContent =
        `${gameResults.totalCorrect}/${gameResults.totalWords}`;
    document.getElementById('bonus-stat').textContent =
        `+${gameResults.timeBonus.toFixed(1)}`;

    // Populate word lists
    populateWordList('synonyms-list', gameResults.synonymBox, 'syn_');
    populateWordList('antonyms-list', gameResults.antonymBox, 'ant_');

    // Attach button event listeners
    attachEventListeners();
}

function getTitleText(score) {
    if (score >= 17) return "Amazing Work!";
    if (score >= 10) return "Great Job!";
    if (score >= 5) return "Well Done!";
    return "Keep Practicing";
}

function getRingColor(score) {
    if (score >= 15) return "#10b981"; // Green
    if (score >= 10) return "#3b82f6"; // Blue
    if (score >= 5) return "#f59e0b";  // Orange
    return "#ef4444"; // Red
}

function animateScore(targetScore, maxScore) {
    const scoreDisplay = document.getElementById('score-display');
    const progressRing = document.getElementById('progress-ring');

    const radius = 80;
    const circumference = 2 * Math.PI * radius;

    // Set initial state
    progressRing.style.strokeDasharray = circumference;
    progressRing.style.strokeDashoffset = circumference;

    let currentScore = 0;
    const duration = 1500; // ms
    const startTime = performance.now();

    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-out exponential)
        const easedProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

        currentScore = easedProgress * targetScore;
        scoreDisplay.textContent = currentScore.toFixed(1);

        // Update ring
        const offset = circumference - (currentScore / maxScore) * circumference;
        progressRing.style.strokeDashoffset = offset;

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    requestAnimationFrame(animate);
}

function populateWordList(containerId, words, correctPrefix) {
    const container = document.getElementById(containerId);

    if (words.length === 0) {
        container.innerHTML = '<span class="empty-text">No words placed</span>';
        return;
    }

    container.innerHTML = words.map(word => {
        const isCorrect = word.id.startsWith(correctPrefix);
        const iconClass = isCorrect ? 'bi-check-lg' : 'bi-x-lg';
        const rowClass = isCorrect ? 'row-green' : 'row-red';

        return `
            <div class="word-row ${rowClass}">
                <i class="bi ${iconClass}"></i>
                <span>${word.word}</span>
            </div>
        `;
    }).join('');
}

function attachEventListeners() {
    // Play Again button
    document.getElementById('btn-play-again').addEventListener('click', () => {
        console.log('Play Again clicked');
        sessionStorage.removeItem('gameResults'); // Clear data
        window.location.href = '/game'; // Navigate to React game page
    });

    // Certificate button
    document.getElementById('btn-certificate').addEventListener('click', () => {
        console.log('Certificate clicked - Redirecting to React for generation');
        // Navigate to React route which now handles reading from sessionStorage
        window.location.href = '/result';
    });

    // Share button
    document.getElementById('btn-share').addEventListener('click', () => {
        const text = `I scored ${gameResults.score.toFixed(1)}/20 in the Sortonym Challenge! 🎯`;

        if (navigator.share) {
            navigator.share({
                title: 'Sortonym Challenge',
                text: text
            }).catch(err => console.log('Share failed:', err));
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(text).then(() => {
                alert('Score copied to clipboard!');
            }).catch(err => {
                console.error('Copy failed:', err);
                alert(text);
            });
        }
    });

    // Exit button
    document.getElementById('btn-exit').addEventListener('click', () => {
        console.log('Exit clicked');
        sessionStorage.removeItem('gameResults'); // Clear data
        window.location.href = '/home'; // Navigate to home page
    });
}

// Export functions for potential use in React conversion
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializePage,
        animateScore,
        populateWordList,
        getTitleText,
        getRingColor
    };
}
