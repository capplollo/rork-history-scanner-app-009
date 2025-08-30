export function getApiBaseUrl(): string {
  const base = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (!base || base.trim().length === 0) {
    throw new Error('Missing EXPO_PUBLIC_RORK_API_BASE_URL');
  }
  return base;
}
