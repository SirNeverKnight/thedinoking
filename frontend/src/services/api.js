const API_BASE = import.meta.env.VITE_API_URL || '';

export async function registerGuest(username, colorId = 0) {
  const res = await fetch(`${API_BASE}/api/auth/guest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, color_id: colorId }),
  });
  if (!res.ok) throw new Error('Failed to register user session');
  return await res.json();
}

export async function createRoom(userId, username, colorId = 0) {
  const res = await fetch(`${API_BASE}/api/rooms/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, username, color_id: colorId }),
  });
  if (!res.ok) throw new Error('Failed to create game room');
  return await res.json();
}

export async function joinRoom(roomCode, userId, username, colorId = 0) {
  const res = await fetch(`${API_BASE}/api/rooms/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ room_code: roomCode, user_id: userId, username, color_id: colorId }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || 'Failed to join room');
  }
  return await res.json();
}

export async function fetchLeaderboard() {
  const res = await fetch(`${API_BASE}/api/leaderboard?limit=10`);
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return await res.json();
}

export async function fetchActiveRooms() {
  const res = await fetch(`${API_BASE}/api/rooms/active`);
  if (!res.ok) throw new Error('Failed to fetch active rooms');
  return await res.json();
}
