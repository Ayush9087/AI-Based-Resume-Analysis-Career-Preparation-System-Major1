import { isUuid } from '../utils/validation.js';

export function validateUuidParams(...keys) {
  return (req, res, next) => {
    const invalidKey = keys.find((key) => !isUuid(req.params[key]));
    if (invalidKey) {
      return res.status(400).json({
        success: false,
        message: 'The requested identifier is invalid.',
      });
    }
    return next();
  };
}
