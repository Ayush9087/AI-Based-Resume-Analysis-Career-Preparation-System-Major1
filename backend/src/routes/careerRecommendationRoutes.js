import { Router } from 'express';
import {
  generateCareerRecommendations,
  getCareerRoleDetails,
  getRecommendationHistory,
} from '../controllers/careerRecommendationController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateUuidParams } from '../middleware/validateUuidParams.js';

const router = Router();

router.get('/history', requireAuth, getRecommendationHistory);
router.get('/roles/:roleId', requireAuth, validateUuidParams('roleId'), getCareerRoleDetails);
router.post('/generate', requireAuth, generateCareerRecommendations);

export default router;