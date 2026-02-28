import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const db = new Database('database.sqlite');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    context TEXT,
    result TEXT,
    recommendations TEXT, -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );
`);

export const createUser = (username, password) => {
  const hash = bcrypt.hashSync(password, 10);
  try {
    const stmt = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
    const info = stmt.run(username, hash);
    return { id: info.lastInsertRowid, username };
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new Error('Username already exists');
    }
    throw err;
  }
};

export const getUser = (username) => {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  return stmt.get(username);
};

export const createSession = (userId, title, context, result, recommendations) => {
  const stmt = db.prepare('INSERT INTO sessions (user_id, title, context, result, recommendations) VALUES (?, ?, ?, ?, ?)');
  const info = stmt.run(userId, title, context, result, JSON.stringify(recommendations));
  return { id: info.lastInsertRowid, title, created_at: new Date().toISOString() };
};

export const getSessions = (userId) => {
  const stmt = db.prepare('SELECT id, title, created_at FROM sessions WHERE user_id = ? ORDER BY created_at DESC');
  return stmt.all(userId);
};

export const getUserStats = (userId) => {
  const sessions = db.prepare('SELECT recommendations, created_at FROM sessions WHERE user_id = ?').all(userId);
  
  let totalRecommendations = 0;
  const priorityCounts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  const monthlyActivity = {};

  sessions.forEach(session => {
    const recs = JSON.parse(session.recommendations || '[]');
    totalRecommendations += recs.length;
    
    recs.forEach(r => {
      if (r.priority in priorityCounts) {
        priorityCounts[r.priority]++;
      }
    });

    const month = new Date(session.created_at).toLocaleString('default', { month: 'short' });
    monthlyActivity[month] = (monthlyActivity[month] || 0) + 1;
  });

  return {
    totalSessions: sessions.length,
    totalRecommendations,
    priorityCounts,
    monthlyActivity: Object.entries(monthlyActivity).map(([name, count]) => ({ name, count }))
  };
};

export const getSession = (id, userId) => {
  const stmt = db.prepare('SELECT * FROM sessions WHERE id = ? AND user_id = ?');
  const session = stmt.get(id, userId);
  if (session) {
    session.recommendations = JSON.parse(session.recommendations);
  }
  return session;
};

export const deleteSession = (id, userId) => {
  const stmt = db.prepare('DELETE FROM sessions WHERE id = ? AND user_id = ?');
  stmt.run(id, userId);
};

export default db;
