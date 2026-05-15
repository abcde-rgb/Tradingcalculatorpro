const trimTrailingSlash = (value) => value.replace(/\/+$/, "");
const hasProtocol = (value) => /^[a-z][a-z\d+\-.]*:\/\//i.test(value);

const normalizeBackendUrl = (value) => {
  const rawValue = (value || "").trim();
  const withProtocol =
    rawValue && !hasProtocol(rawValue) && !rawValue.startsWith("/")
      ? `https://${rawValue}`
      : rawValue;
  const raw = trimTrailingSlash(withProtocol);
  return raw.endsWith("/api") ? raw.slice(0, -4) : raw;
};

const configuredBackendUrl =
  process.env.REACT_APP_BACKEND_URL ||
  process.env.REACT_APP_API_URL ||
  "";

export const BACKEND_URL = normalizeBackendUrl(configuredBackendUrl);
export const API_BASE_URL = BACKEND_URL ? `${BACKEND_URL}/api` : "/api";
export const HAS_CONFIGURED_BACKEND = Boolean(BACKEND_URL);

export const APP_BASE_PATH = trimTrailingSlash(process.env.PUBLIC_URL || "");
export const APP_BASE_URL =
  typeof window !== "undefined"
    ? `${window.location.origin}${APP_BASE_PATH}`
    : APP_BASE_PATH;
