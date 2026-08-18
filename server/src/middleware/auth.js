import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = 'owner_session';

export function signOwnerToken(username) {
  return jwt.sign({ username, role: 'owner' }, JWT_SECRET, { expiresIn: '12h' });
}

export function setSessionCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 12 * 60 * 60 * 1000
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME);
}

// Protects every /api/admin/* route. Accepts either the httpOnly cookie
// (browser owner-panel flow) or a Bearer token (useful for curl/Postman
// during review).
export function requireOwnerAuth(req, res, next) {
  const bearer = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;
  const token = req.cookies?.[COOKIE_NAME] || bearer;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.owner = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session.' });
  }
}
