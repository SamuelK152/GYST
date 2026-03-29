import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import User from '../models/User.js';
import FinanceAccount from '../models/FinanceAccount.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, process.env.JWT_SECRET, { expiresIn: '14d' });
}

router.post('/register', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password || password.length < 6) {
    return res.status(400).json({ error: 'username and password(min 6) are required' });
  }

  const existing = await User.findOne({ username: username.toLowerCase().trim() }).lean();
  if (existing) return res.status(409).json({ error: 'username already exists' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ username: username.toLowerCase().trim(), passwordHash });

  await FinanceAccount.create({ userId: user._id, name: 'Wallet', isDefault: true });

  const token = signToken(user._id);
  res.status(201).json({ token, user: { id: user._id, username: user.username } });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });

  const user = await User.findOne({ username: username.toLowerCase().trim() });
  if (!user) return res.status(401).json({ error: 'invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });

  const token = signToken(user._id);
  res.json({ token, user: { id: user._id, username: user.username } });
});

router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

export default router;
