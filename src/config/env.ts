/**
 * Type-safe environment variable access
 * All environment variables must be prefixed with VITE_ to be exposed to the client
 */

class EnvironmentError extends Error {
  constructor(variable: string) {
    super(`Missing required environment variable: ${variable}`);
    this.name = 'EnvironmentError';
  }
}

function getEnvVar(key: 'VITE_LASTFM_API_KEY' | 'VITE_YOUTUBE_API_KEY'): string {
  const value = import.meta.env[key];

  if (!value || value.trim() === '') {
    throw new EnvironmentError(key);
  }

  return value;
}

export const env = {
  lastfm: {
    apiKey: getEnvVar('VITE_LASTFM_API_KEY'),
  },
  youtube: {
    apiKey: getEnvVar('VITE_YOUTUBE_API_KEY'),
  },
} as const;

export { EnvironmentError };
