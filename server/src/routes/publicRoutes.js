import { Router } from 'express';
import { getPublicConfig } from '../controllers/configController.js';
import { submitEstimate } from '../controllers/leadController.js';

const router = Router();

router.get('/config', getPublicConfig);
router.post('/estimate', submitEstimate);

export default router;
