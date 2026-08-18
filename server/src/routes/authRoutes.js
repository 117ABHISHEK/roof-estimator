import { Router } from 'express';
import { login, logout, me } from '../controllers/authController.js';
import { requireOwnerAuth } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', requireOwnerAuth, me);

export default router;
