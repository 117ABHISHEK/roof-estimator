import bcrypt from 'bcryptjs';
import { prisma } from '../config/db.js';
import { signOwnerToken, setSessionCookie, clearSessionCookie } from '../middleware/auth.js';

export async function login(req, res) {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const user = await prisma.adminUser.findUnique({ where: { username } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const token = signOwnerToken(user.username);
  setSessionCookie(res, token);
  res.json({ ok: true, token, username: user.username });
}

export function logout(req, res) {
  clearSessionCookie(res);
  res.json({ ok: true });
}

export function me(req, res) {
  res.json({ username: req.owner.username });
}
