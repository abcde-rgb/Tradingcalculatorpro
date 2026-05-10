export function getBackendBaseUrl() {
  const raw = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL || '';
  const trimmed = raw.trim().replace(/\/+$/, '');

  if (!trimmed) return '';
  return trimmed.replace(/\/api$/i, '');
}

export function getApiBaseUrl() {
  const backend = getBackendBaseUrl();
  return backend ? `${backend}/api` : '/api';
}
