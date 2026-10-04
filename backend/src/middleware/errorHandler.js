import { randomUUID } from 'node:crypto';

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  const requestId = randomUUID();
  const isFileUploadError = typeof err.code === 'string' && err.code.startsWith('LIMIT_');
  const isInvalidJson = err.type === 'entity.parse.failed';
  const isPayloadTooLarge = err.type === 'entity.too.large' || err.status === 413;
  const suppliedStatus = Number(err.statusCode);
  const statusCode = err.code === 'LIMIT_FILE_SIZE' || isPayloadTooLarge
    ? 413
    : (isFileUploadError || isInvalidJson ? 400 : (
      Number.isInteger(suppliedStatus)
      && suppliedStatus >= 400
      && suppliedStatus < 600
      && (suppliedStatus < 500 || err.expose === true)
        ? suppliedStatus
        : 500
    ));
  const message = err.code === 'LIMIT_FILE_SIZE'
    ? 'The resume must be 10 MB or smaller.'
    : (isFileUploadError
      ? 'The upload contains an invalid number of files or fields.'
      : (isInvalidJson
        ? 'Request body must contain valid JSON.'
        : (isPayloadTooLarge
          ? 'The request is too large.'
          : (err.expose === true && suppliedStatus === statusCode
            ? err.message
            : (statusCode >= 500 ? 'Something went wrong. Please try again.' : 'The request could not be completed.')))));

  res.setHeader('X-Request-Id', requestId);
  if (statusCode >= 500) {
    console.error('Request failed', { requestId, method: req.method, path: req.path, error: err.name || 'Error' });
  }

  return res.status(statusCode).json({ success: false, message, requestId });
};
