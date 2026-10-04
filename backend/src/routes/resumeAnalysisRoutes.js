import { Router } from 'express';
import { analyzeResume } from '../controllers/resumeAnalysisController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.post('/analyze', requireAuth, analyzeResume);

export default router;