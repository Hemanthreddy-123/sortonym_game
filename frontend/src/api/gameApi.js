import { httpJson } from './http.js'

export async function startGame({ level, excludeWords }) {
  const body = { level }
  if (excludeWords && excludeWords.length > 0) {
    body.excludeWords = excludeWords
  }

  return await httpJson('/api/game/start', {
    method: 'POST',
    body
  })
}

export async function submitGame({ roundId, synonyms, antonyms, timeTaken, reason, level, gameCode, roundNumber, displayName }) {
  return await httpJson('/api/game/submit', {
    method: 'POST',
    body: {
      roundId,
      synonyms,
      antonyms,
      timeTaken,
      reason,
      level,
      gameCode, // Optional: for Team Game Sync
      roundNumber, // Optional: for tracking round progress 
      displayName // Crucial for guest player identification in multiplayer
    },
  })
}

export async function getGameScore() {
  return await httpJson('/api/game/score', {
    method: 'GET',
  })
}

export async function getLeaderboard({ period }) {
  let url = '/api/leaderboard';
  if (period) {
    url += `?period=${encodeURIComponent(period)}`;
  }
  return await httpJson(url, {
    method: 'GET',
  })
}
