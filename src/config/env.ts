/**
 * Type-safe environment variable access
 * All environment variables must be prefixed with NEXT_PUBLIC_ to be exposed to the client
 *
 * Note: Next.js requires literal `process.env.NEXT_PUBLIC_*` access — dynamic
 * bracket notation is not statically replaced by the bundler.
 */

class EnvironmentError extends Error {
  constructor(variable: string) {
    super(`Missing required environment variable: ${variable}`);
    this.name = 'EnvironmentError';
  }
}

export const env = {
  lastfm: {
    get apiKey(): string {
      const value = process.env.NEXT_PUBLIC_LASTFM_API_KEY;
      if (!value || value.trim() === '') throw new EnvironmentError('NEXT_PUBLIC_LASTFM_API_KEY');
      return value;
    },
  },
} as const;

export { EnvironmentError };
