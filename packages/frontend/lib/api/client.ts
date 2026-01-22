import axios, { type AxiosRequestConfig } from 'axios';

const API_VERSION = '1';

// Use environment variable if set, otherwise use relative path to frontend proxy
// This allows both SSR (with NEXT_PUBLIC_API_URL) and browser (with /api proxy) to work
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Version': API_VERSION,
  },
  // Enable sending cookies with requests
  withCredentials: true,
});

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if this is a 401 error and we haven't already tried to refresh for this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh token - cookies are sent automatically from the axios instance
        // Mark the refresh request itself with _retry to prevent infinite loop if refresh also fails
        const refreshConfig: AxiosRequestConfig & { _retry?: boolean } = {
          _retry: true,
        };
        await apiClient.post('/auth/refresh', {}, refreshConfig);

        // Token refreshed successfully, retry the original request
        // Keep the _retry flag to prevent trying again if this retry also fails
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Redirect to login on refresh failure
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
