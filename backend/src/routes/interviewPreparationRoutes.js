import { Router } from 'express';
import {
  getInterviewSession,
  listInterviewRoles,
  listInterviewSessions,
  startInterviewSession,
  submitInterviewAnswer,
} from '../controllers/interviewPreparationController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateUuidParams } from '../middleware/validateUuidParams.js';

const router = Router();

router.get('/roles', requireAuth, listInterviewRoles);
router.get('/sessions', requireAuth, listInterviewSessions);
router.post('/sessions', requireAuth, startInterviewSession);
router.get('/sessions/:sessionId', requireAuth, validateUuidParams('sessionId'), getInterviewSession);
router.post('/sessions/:sessionId/answers', requireAuth, validateUuidParams('sessionId'), submitInterviewAnswer);

export default router;