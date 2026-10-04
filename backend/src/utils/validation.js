export function isUuid(value) {
  return typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function isMissingRow(error) {
  return error?.code === 'PGRST116';
}

export function invalidRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  error.expose = true;
  return error;
}
