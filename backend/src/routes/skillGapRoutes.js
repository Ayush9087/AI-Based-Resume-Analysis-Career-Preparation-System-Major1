import { Router } from 'express';
import { analyzeSkillGap, listCareerRoles } from '../controllers/skillGapController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.get('/roles', requireAuth, listCareerRoles);
router.post('/analyze', requireAuth, analyzeSkillGap);

export default router;