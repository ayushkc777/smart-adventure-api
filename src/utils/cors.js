export const parseAllowedOrigins = (value = '') =>
  String(value)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

export const isOriginAllowed = (origin, allowedOrigins) =>
  !origin || allowedOrigins.includes(origin);
