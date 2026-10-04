import { Router } from 'express';
import multer from 'multer';
import { getResumePreview, listResumes, uploadResume } from '../controllers/resumeController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateUuidParams } from '../middleware/validateUuidParams.js';

const router = Router();
const maximumFileSize = 10 * 1024 * 1024;
const acceptedMimeTypes = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/octet-stream',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maximumFileSize, files: 1 },
  fileFilter(req, file, callback) {
    const extension = file.originalname.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx'].includes(extension) || !acceptedMimeTypes.has(file.mimetype)) {
      const error = new Error('Only PDF and DOCX resumes are supported.');
      error.statusCode = 400;
      error.expose = true;
      return callback(error);
    }
    return callback(null, true);
  },
});

router.get('/', requireAuth, listResumes);
router.get('/:resumeId/view', requireAuth, validateUuidParams('resumeId'), getResumePreview);
router.post('/upload', requireAuth, upload.single('resume'), uploadResume);

export default router;