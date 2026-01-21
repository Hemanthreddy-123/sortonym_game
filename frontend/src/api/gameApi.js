import { httpJson } from './http.js'

export async function startGame({ token }) {
  return await httpJson('/api/game/start', {
    method: 'POST',
    token,
  })
}

export async function submitGame({ token, roundId, synonyms, antonyms, timeTaken }) {
  return await httpJson('/api/game/submit', {
    method: 'POST',
    token,
    body: {
      round_id: roundId,
      synonyms,
      antonyms,
      time_taken: timeTaken,
    },
  })
}

export async function getGameScore({ token }) {
  return await httpJson('/api/game/score', {
    method: 'GET',
    token,
  })
}

export async function getLeaderboard({ token }) {
  return await httpJson('/api/leaderboard', {
    method: 'GET',
    token,
  })
}
