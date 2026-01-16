# API Migration Guide: Path-Based to Header-Based Versioning

## Overview

The Compliant Platform API has migrated from **path-based versioning** to **header-based versioning** to provide a more flexible and modern API versioning approach.

## What Changed?

### Before (Path-Based Versioning)
- **Base URL**: `http://localhost:3001/api/v1`
- **Version**: Included in URL path (e.g., `/api/v1/users`)
- **Example**: `GET http://localhost:3001/api/v1/users`

### After (Header-Based Versioning)
- **Base URL**: `http://localhost:3001/api`
- **Version**: Specified via `X-API-Version` header
- **Default Version**: `1` (if header is not provided)
- **Example**: `GET http://localhost:3001/api/users` with header `X-API-Version: 1`

## Migration Steps

### 1. Update Base URL

**Change your API client base URL:**

```diff
- const API_URL = 'http://localhost:3001/api/v1';
+ const API_URL = 'http://localhost:3001/api';
```

### 2. Add Version Header

**Add the `X-API-Version` header to all API requests:**

#### Using Axios

```javascript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Version': '1',
  },
});

// For requests that need the header added dynamically
apiClient.interceptors.request.use(
  (config) => {
    config.headers['X-API-Version'] = '1';
    return config;
  },
  (error) => Promise.reject(error),
);
```

#### Using Fetch

```javascript
fetch('http://localhost:3001/api/users', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Version': '1',
  },
});
```

#### Using cURL

```bash
# Old way
curl http://localhost:3001/api/v1/users

# New way
curl -H "X-API-Version: 1" http://localhost:3001/api/users

# Or without header (defaults to version 1)
curl http://localhost:3001/api/users
```

### 3. Environment Variables

**Update your environment configuration files:**

```diff
# .env or .env.local
- NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
+ NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Benefits of Header-Based Versioning

1. **Cleaner URLs**: API endpoints are more readable without version numbers
2. **Flexibility**: Easy to request different versions for different endpoints
3. **Future-Proof**: Adding new versions doesn't require URL changes
4. **Better Caching**: Same URL can serve different versions based on headers
5. **Industry Standard**: Follows best practices used by major APIs (GitHub, Stripe, etc.)

## Backward Compatibility

- **Version 1 is the default**: If you don't include the `X-API-Version` header, the API will default to version 1
- **No breaking changes to endpoints**: All endpoints remain the same, only the base URL and versioning mechanism changed

## Example Endpoint Changes

### Authentication Endpoints

```bash
# Login
Old: POST http://localhost:3001/api/v1/auth/login
New: POST http://localhost:3001/api/auth/login (with X-API-Version: 1 header)

# Get Current User
Old: GET http://localhost:3001/api/v1/auth/me
New: GET http://localhost:3001/api/auth/me (with X-API-Version: 1 header)

# Refresh Token
Old: POST http://localhost:3001/api/v1/auth/refresh
New: POST http://localhost:3001/api/auth/refresh (with X-API-Version: 1 header)
```

### Contractor Endpoints

```bash
# List Contractors
Old: GET http://localhost:3001/api/v1/contractors
New: GET http://localhost:3001/api/contractors (with X-API-Version: 1 header)

# Get Contractor
Old: GET http://localhost:3001/api/v1/contractors/:id
New: GET http://localhost:3001/api/contractors/:id (with X-API-Version: 1 header)

# Create Contractor
Old: POST http://localhost:3001/api/v1/contractors
New: POST http://localhost:3001/api/contractors (with X-API-Version: 1 header)
```

### User Endpoints

```bash
# List Users
Old: GET http://localhost:3001/api/v1/users
New: GET http://localhost:3001/api/users (with X-API-Version: 1 header)

# Get User
Old: GET http://localhost:3001/api/v1/users/:id
New: GET http://localhost:3001/api/users/:id (with X-API-Version: 1 header)
```

## Testing Your Migration

### 1. Test Basic Connectivity

```bash
# Test health endpoint
curl http://localhost:3001/api/health

# Test with explicit version header
curl -H "X-API-Version: 1" http://localhost:3001/api/health
```

### 2. Test Authentication

```bash
# Login and save cookies
curl -c cookies.txt -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-API-Version: 1" \
  -d '{"email": "admin@compliant.com", "password": "Admin123!@#"}'

# Test authenticated request
curl -b cookies.txt -H "X-API-Version: 1" http://localhost:3001/api/auth/me
```

### 3. Verify All Endpoints

Check that all your critical endpoints work with the new base URL and header:

- [ ] Authentication endpoints (`/api/auth/*`)
- [ ] User endpoints (`/api/users/*`)
- [ ] Contractor endpoints (`/api/contractors/*`)
- [ ] Project endpoints (`/api/projects/*`)
- [ ] Any custom endpoints specific to your integration

## Troubleshooting

### Issue: Getting 404 errors

**Solution**: Make sure you've updated the base URL from `/api/v1` to `/api` in all API calls.

### Issue: API not responding as expected

**Solution**: Verify that you're sending the `X-API-Version` header with value `1` in your requests.

### Issue: Authentication not working

**Solution**: Check that your refresh token endpoint is also using the new base URL:
```javascript
// Make sure this is updated
const response = await axios.post(`${API_URL}/auth/refresh`, {
  refreshToken,
});
```

## Support

For questions or issues with the migration:
- Check the API documentation at: `http://localhost:3001/api/docs`
- Review the backend README: `packages/backend/README.md`
- Open an issue in the repository

## Timeline

- **Effective Date**: January 16, 2026
- **Old API Support**: The old `/api/v1` paths are no longer supported
- **Migration Required**: All API consumers must migrate to header-based versioning

## Additional Resources

- [Backend README](../packages/backend/README.md) - Complete API documentation
- [Swagger/OpenAPI Documentation](http://localhost:3001/api/docs) - Interactive API docs
- [NestJS Versioning Documentation](https://docs.nestjs.com/techniques/versioning) - Official NestJS versioning guide
