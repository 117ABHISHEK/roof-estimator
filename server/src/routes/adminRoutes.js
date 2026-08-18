import { Router } from 'express';
import { requireOwnerAuth } from '../middleware/auth.js';
import { getAdminConfig, updateConfig, getConfigHistory } from '../controllers/configController.js';
import { listLeads, exportLeadsCsv } from '../controllers/leadController.js';

const router = Router();

router.use(requireOwnerAuth);

router.get('/config', getAdminConfig);
router.put('/config', updateConfig);
router.get('/config/history', getConfigHistory);

router.get('/leads', listLeads);
router.get('/leads/export.csv', exportLeadsCsv);

export default router;
