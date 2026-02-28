import express from 'express';
import session from 'express-session';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import * as db from './server/db.js';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(session({
    secret: 'super-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using https
  }));

  // --- API Routes ---

  // Auth
  app.post('/api/auth/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
    try {
      const user = db.createUser(username, password);
      req.session.userId = user.id;
      res.json({ user });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.getUser(username);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    req.session.userId = user.id;
    res.json({ user: { id: user.id, username: user.username } });
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(() => res.json({ success: true }));
  });

  app.get('/api/auth/me', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
    // In a real app, fetch user details from DB to ensure they still exist
    res.json({ user: { id: req.session.userId } });
  });

  // Sessions
  app.get('/api/sessions', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
    const sessions = db.getSessions(req.session.userId);
    res.json(sessions);
  });

  app.post('/api/sessions', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
    const { title, context, result, recommendations } = req.body;
    const session = db.createSession(req.session.userId, title, context, result, recommendations);
    res.json(session);
  });

  app.get('/api/sessions/:id', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
    const session = db.getSession(req.params.id, req.session.userId);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  });

  app.delete('/api/sessions/:id', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
    db.deleteSession(req.params.id, req.session.userId);
    res.json({ success: true });
  });

  app.get('/api/analytics', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
    const stats = db.getUserStats(req.session.userId);
    res.json(stats);
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
