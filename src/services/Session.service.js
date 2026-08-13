// In-memory session store (replace with DB in production)
const sessions = new Map();

const createSession = async (userId, refreshToken, deviceInfo) => {
  const sessionId = `${userId}:${deviceInfo.deviceId || 'default'}`;
  sessions.set(sessionId, {
    userId,
    refreshToken,
    deviceInfo,
    createdAt: new Date(),
    lastActive: new Date(),
  });
  return sessions.get(sessionId);
};

const findByRefreshToken = async (refreshToken) => {
  for (const session of sessions.values()) {
    if (session.refreshToken === refreshToken) return session;
  }
  return null;
};

const updateLastActive = async (sessionId) => {
  if (sessions.has(sessionId)) {
    sessions.get(sessionId).lastActive = new Date();
  }
};

const deleteSession = async (userId, deviceId) => {
  const sessionId = `${userId}:${deviceId || 'default'}`;
  sessions.delete(sessionId);
};

const deleteAllSessions = async (userId) => {
  for (const key of sessions.keys()) {
    if (key.startsWith(`${userId}:`)) sessions.delete(key);
  }
};

module.exports = { createSession, findByRefreshToken, updateLastActive, deleteSession, deleteAllSessions };