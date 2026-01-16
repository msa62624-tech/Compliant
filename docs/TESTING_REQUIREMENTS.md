# Testing Requirements Documentation

## Overview

This document outlines the comprehensive testing requirements for the Compliant Platform based on the security improvements implemented.

## Phase 1: Frontend Authentication Tests

### 1. Cookie-Based Authentication Tests

**Frontend Tests (to be implemented):**
- Test that login stores authentication in httpOnly cookies
- Test that cookies are automatically sent with API requests
- Test that logout clears authentication cookies
- Test that expired cookies trigger re-authentication
- Test token refresh flow with cookies

**Test Files to Create:**
- `packages/frontend/__tests__/auth/AuthContext.test.tsx`
- `packages/frontend/__tests__/auth/apiClient.test.ts`
- `packages/frontend/__tests__/integration/auth-flow.test.tsx`

### 2. API Client Tests

**Tests Required:**
- Verify `withCredentials: true` is set on axios requests
- Test automatic token refresh on 401 errors
- Test error handling for authentication failures
- Test concurrent requests with token refresh

**Test File:**
- `packages/frontend/__tests__/api/client.test.ts`

## Phase 2: Backend Tests

### 1. Authentication Cookie Tests

**Backend Tests (to be implemented):**
- Test login endpoint sets httpOnly cookies correctly
- Test cookies have correct security flags (httpOnly, secure, sameSite)
- Test refresh endpoint reads from cookies
- Test logout clears cookies
- Test JWT strategy extracts token from cookies first, then Authorization header

**Test Files to Create:**
- `packages/backend/src/modules/auth/__tests__/auth.controller.spec.ts`
- `packages/backend/src/modules/auth/__tests__/jwt.strategy.spec.ts`

### 2. Cache Service Tests

**Tests Required:**
- Test Redis connection and fallback to memory cache
- Test get/set/delete operations
- Test pattern-based deletion
- Test TTL expiration
- Test error handling

**Test File to Create:**
- `packages/backend/src/modules/cache/__tests__/cache.service.spec.ts`

### 3. Encryption Service Tests

**Tests Required:**
- Test encryption/decryption of strings
- Test encryption of object fields
- Test decryption of object fields
- Test handling of unencrypted data
- Test error handling for invalid ciphertext

**Test File to Create:**
- `packages/backend/src/common/encryption/__tests__/encryption.service.spec.ts`

### 4. Contractors Service Tests with Caching

**Tests Required:**
- Test that findAll caches results
- Test that findOne caches results
- Test that create invalidates list cache
- Test that update invalidates individual and list caches
- Test that delete invalidates caches

**Test File to Create:**
- `packages/backend/src/modules/contractors/__tests__/contractors.service.spec.ts`

## Phase 3: Integration Tests

### 1. End-to-End Authentication Flow

**Tests Required:**
- Test complete login flow from frontend to backend
- Test authenticated API calls
- Test token refresh flow
- Test logout flow
- Test session expiration

### 2. Cache Integration Tests

**Tests Required:**
- Test cache hit/miss scenarios
- Test cache invalidation on CRUD operations
- Test concurrent requests with caching

### 3. Encryption Integration Tests

**Tests Required:**
- Test data is encrypted before saving to database
- Test data is decrypted when retrieved
- Test encrypted data in API responses

## Testing Infrastructure Setup

### Frontend Testing Setup (Required)

```bash
cd packages/frontend
npm install --save-dev @testing-library/react @testing-library/jest-dom jest
```

**Configuration Files Needed:**
- `jest.config.js`
- `setupTests.ts`

### Backend Testing Setup (Required)

```bash
cd packages/backend
npm install --save-dev @nestjs/testing jest @types/jest ts-jest
```

**Configuration Files Needed:**
- `jest.config.js` (if not present)
- Test database configuration

## Test Execution Commands

### Frontend Tests
```bash
cd packages/frontend
npm test                    # Run all tests
npm test -- --coverage      # Run with coverage
npm test -- --watch         # Run in watch mode
```

### Backend Tests
```bash
cd packages/backend
npm test                    # Run unit tests
npm run test:e2e           # Run e2e tests
npm run test:cov           # Run with coverage
```

## Coverage Goals

- **Unit Tests**: Minimum 80% coverage
- **Integration Tests**: Critical paths covered
- **E2E Tests**: Main user flows covered

## Priority Testing Areas

1. **High Priority** (Must have):
   - Authentication flows (login, logout, refresh)
   - Cache operations
   - Encryption/decryption

2. **Medium Priority** (Should have):
   - CRUD operations with caching
   - Error handling
   - Edge cases

3. **Low Priority** (Nice to have):
   - Performance tests
   - Load tests
   - UI component tests

## Test Data Management

- Use test fixtures for consistent test data
- Mock external services (Redis, Database)
- Use in-memory database for integration tests
- Clean up test data after each test

## Continuous Integration

Tests should be run:
- On every commit (pre-commit hook)
- On pull request creation
- Before merging to main branch
- On deployment to staging/production

## Notes

- Tests have not been implemented yet due to lack of existing test infrastructure
- This document serves as a guide for implementing comprehensive testing
- Tests should be added incrementally, starting with high-priority areas
- Each new feature should include corresponding tests
