import axios from 'axios';

const API_VERSION = '1';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

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

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh token - cookies are sent automatically
        // Use apiClient to ensure X-API-Version header is included
        await apiClient.post('/auth/refresh');

        // Retry the original request
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
