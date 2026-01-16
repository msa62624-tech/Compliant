# Frontend Migration Guide - localStorage to httpOnly Cookies

## Overview

This guide explains how to migrate the frontend from localStorage-based token storage to secure httpOnly cookies.

---

## Why This Change?

### Security Issues with localStorage:
- ❌ Vulnerable to XSS attacks
- ❌ Accessible via JavaScript (any script can read tokens)
- ❌ No CSRF protection
- ❌ No automatic expiration

### Benefits of httpOnly Cookies:
- ✅ Not accessible via JavaScript (XSS protection)
- ✅ CSRF protection with SameSite attribute
- ✅ Automatic expiration
- ✅ Secure flag for HTTPS-only transmission

---

## Changes Required

### 1. Update API Client Configuration

**Current (`packages/frontend/lib/api/client.ts`):**
```typescript
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);
```

**Updated (Cookie-based):**
```typescript
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // ✅ Enable cookie transmission
});

// ✅ No longer need to manually add Authorization header
// Cookies are automatically sent with each request

// Response interceptor for token refresh (still needed)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // ✅ Cookies are automatically sent with refresh request
        await axios.post(`${API_URL}/auth/refresh`, {}, {
          withCredentials: true,
        });

        // ✅ New tokens are set in cookies automatically
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Redirect to login
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
```

---

### 2. Update Authentication Context

**Current (`packages/frontend/lib/auth/AuthContext.tsx`):**
```typescript
useEffect(() => {
  // Check if user is logged in
  const checkAuth = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        const userData = await authApi.getMe();
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  };

  checkAuth();
}, []);

const login = async (credentials: LoginDto) => {
  try {
    const response = await authApi.login(credentials);
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    setUser(response.user as User);
    router.push('/dashboard');
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

const logout = async () => {
  try {
    await authApi.logout();
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    router.push('/login');
  }
};
```

**Updated (Cookie-based):**
```typescript
useEffect(() => {
  // Check if user is logged in
  const checkAuth = async () => {
    try {
      // ✅ No need to check localStorage
      // Just try to fetch user data (cookie will be sent automatically)
      const userData = await authApi.getMe();
      setUser(userData);
    } catch (error) {
      console.error('Auth check failed:', error);
      // ✅ No localStorage to clear
    } finally {
      setLoading(false);
    }
  };

  checkAuth();
}, []);

const login = async (credentials: LoginDto) => {
  try {
    const response = await authApi.login(credentials);
    // ✅ No localStorage - cookies are set by backend
    setUser(response.user as User);
    router.push('/dashboard');
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

const logout = async () => {
  try {
    await authApi.logout(); // ✅ Backend will clear cookies
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // ✅ No localStorage to clear
    setUser(null);
    router.push('/login');
  }
};
```

---

### 3. Update Authentication API

**Current (`packages/frontend/lib/api/auth.ts`):**
```typescript
export const authApi = {
  login: async (credentials: LoginDto): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  refresh: async (refreshToken: string): Promise<{ accessToken: string }> => {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};
```

**Updated (Cookie-based):**
```typescript
export const authApi = {
  login: async (credentials: LoginDto): Promise<{ user: User }> => {
    // ✅ Backend returns only user data (tokens in cookies)
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
    // ✅ Backend clears cookies
  },

  refresh: async (): Promise<{ success: boolean }> => {
    // ✅ No need to pass refresh token (it's in cookie)
    const response = await apiClient.post('/auth/refresh');
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};
```

---

### 4. Update Environment Variables

Add CORS configuration to `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# For production:
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
```

Ensure backend has correct CORS settings in `.env`:

```env
CORS_ORIGIN=http://localhost:3000

# For production:
# CORS_ORIGIN=https://yourdomain.com
```

---

### 5. Remove localStorage Usage

**Search for and remove all localStorage token operations:**

```bash
# Find all localStorage usage
grep -r "localStorage.getItem\|localStorage.setItem\|localStorage.removeItem" packages/frontend/

# Files to update:
# - lib/api/client.ts
# - lib/auth/AuthContext.tsx
# - Any other files that access tokens
```

---

## Testing the Migration

### 1. Development Testing:

```bash
# Start backend
cd packages/backend
pnpm dev

# Start frontend
cd packages/frontend
pnpm dev
```

### 2. Test Login Flow:

1. Open browser DevTools → Network tab
2. Navigate to login page
3. Enter credentials and submit
4. Check Response Headers for `Set-Cookie`:
   ```
   Set-Cookie: access_token=...; HttpOnly; SameSite=Strict; Path=/
   Set-Cookie: refresh_token=...; HttpOnly; SameSite=Strict; Path=/
   ```
5. Navigate to authenticated page
6. Verify cookie is sent in Request Headers:
   ```
   Cookie: access_token=...; refresh_token=...
   ```

### 3. Test Token Refresh:

1. Wait 15 minutes (access token expires)
2. Make an API request
3. Check Network tab:
   - First request: 401 Unauthorized
   - Refresh request: 200 OK with new cookies
   - Retry request: 200 OK

### 4. Test Logout:

1. Click logout
2. Check Response Headers:
   ```
   Set-Cookie: access_token=; HttpOnly; Max-Age=0
   Set-Cookie: refresh_token=; HttpOnly; Max-Age=0
   ```
3. Verify redirect to login page
4. Verify cannot access protected routes

---

## Browser Compatibility

### Cookie Support:
- ✅ All modern browsers support httpOnly cookies
- ✅ Chrome, Firefox, Safari, Edge
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### Known Issues:
- ⚠️ Cookies require same-site or proper CORS
- ⚠️ Third-party cookie restrictions (use first-party domain)

---

## Production Deployment

### 1. Backend Configuration:

```env
NODE_ENV=production
COOKIE_SECURE=true  # HTTPS only
CORS_ORIGIN=https://yourdomain.com
```

### 2. Frontend Configuration:

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
```

### 3. Domain Configuration:

**Option A: Same domain (recommended):**
- Frontend: https://yourdomain.com
- Backend: https://yourdomain.com/api
- No CORS issues, cookies work automatically

**Option B: Subdomain:**
- Frontend: https://app.yourdomain.com
- Backend: https://api.yourdomain.com
- Set cookie domain to `.yourdomain.com`

**Option C: Different domains:**
- Frontend: https://frontend.com
- Backend: https://api.backend.com
- Requires proper CORS configuration
- May have third-party cookie restrictions

---

## Rollback Plan

If issues arise, the backend still supports the old Bearer token method:

### Temporary Rollback (Frontend only):

1. Revert frontend changes
2. Keep using localStorage
3. Backend will accept both cookies and Authorization header

### Complete Rollback:

1. Revert both frontend and backend changes
2. Remove cookie-related code
3. Return to localStorage implementation

---

## Security Checklist

Before deploying to production:

- [ ] HTTPS enabled on both frontend and backend
- [ ] Cookie `secure` flag enabled in production
- [ ] CORS properly configured
- [ ] SameSite attribute set to 'strict' or 'lax'
- [ ] Tested token refresh flow
- [ ] Tested logout and cookie clearing
- [ ] Verified no token exposure in URLs or logs
- [ ] Tested on multiple browsers
- [ ] Tested on mobile devices

---

## Troubleshooting

### Problem: Cookies not being set

**Solution:**
- Check CORS configuration
- Verify `withCredentials: true` in axios
- Ensure backend has `credentials: true` in CORS
- Check cookie domain matches

### Problem: 401 Unauthorized on every request

**Solution:**
- Check cookies in DevTools → Application → Cookies
- Verify cookies are being sent in Request Headers
- Check backend JWT strategy is extracting from cookies
- Verify JWT_SECRET is configured

### Problem: Refresh not working

**Solution:**
- Check refresh endpoint response
- Verify new cookies are being set
- Check cookie expiration times
- Verify axios interceptor logic

### Problem: CORS errors

**Solution:**
- Add frontend URL to CORS_ORIGIN
- Enable credentials in CORS config
- Check preflight OPTIONS requests
- Verify headers are allowed

---

## Migration Checklist

- [ ] Update `lib/api/client.ts` with `withCredentials: true`
- [ ] Remove localStorage token operations from `AuthContext.tsx`
- [ ] Update `lib/api/auth.ts` API signatures
- [ ] Remove token from request interceptor
- [ ] Update auth response types
- [ ] Test login flow
- [ ] Test logout flow
- [ ] Test token refresh
- [ ] Test protected routes
- [ ] Update documentation
- [ ] Deploy to staging
- [ ] Test on multiple browsers
- [ ] Deploy to production

---

## Support

For issues or questions:
1. Check browser DevTools Network tab for cookie headers
2. Check backend logs for authentication errors
3. Review CORS configuration
4. Consult security documentation: `docs/SECURITY_IMPROVEMENTS.md`

---

**Last Updated**: 2026-01-16
**Version**: 1.0.0
**Status**: Ready for Implementation
