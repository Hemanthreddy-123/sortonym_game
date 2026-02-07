import { httpJson } from './http.js'

export async function startGame({ token, level }) {
  return await httpJson('/api/game/start', {
    method: 'POST',
    token,
    body: { level }
  })
}

export async function submitGame({ token, roundId, synonyms, antonyms, timeTaken, reason, level }) {
  return await httpJson('/api/game/submit', {
    method: 'POST',
    token,
    body: {
      roundId,
      synonyms,
      antonyms,
      timeTaken,
      reason,
      level,
    },
  })
}

export async function getGameScore({ token }) {
  return await httpJson('/api/game/score', {
    method: 'GET',
    token,
  })
}

export async function getLeaderboard({ token, period }) {
  let url = '/api/leaderboard';
  if (period) {
    url += `?period=${encodeURIComponent(period)}`;
  }
  return await httpJson(url, {
    method: 'GET',
    token,
  })
}
