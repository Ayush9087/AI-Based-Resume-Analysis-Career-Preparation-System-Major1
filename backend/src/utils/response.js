export const sendSuccess = (res, statusCode = 200, payload = {}) => {
  return res.status(statusCode).json({ success: true, ...payload });
};
