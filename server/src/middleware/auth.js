import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Missing auth token' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select('_id username').lean();

    if (!user) {
      return res.status(401).json({ error: 'Invalid auth token' });
    }

    req.user = user;
    next();
  } catch (_error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
