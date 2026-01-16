/**
 * Get the API URL from environment variables
 * Fallback to localhost for development if not set
 */
export const getApiUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
};
