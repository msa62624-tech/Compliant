# Frontend - Next.js 14 App

Modern Next.js frontend with App Router, TypeScript, Tailwind CSS, and React Query.

## Features

- ✅ Next.js 14 with App Router
- ✅ TypeScript for type safety
- ✅ Tailwind CSS for styling
- ✅ React Query for data fetching
- ✅ JWT authentication with auto-refresh
- ✅ Zustand for state management
- ✅ Responsive design

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your API URL
```

3. Start development server:
```bash
pnpm dev
```

## Available Scripts

- `pnpm dev` - Start development server (http://localhost:3000)
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## Project Structure

```
app/
├── (auth)/            # Auth routes (login, register)
├── (dashboard)/       # Protected routes (dashboard, contractors, projects)
├── layout.tsx         # Root layout
├── page.tsx           # Home page
├── providers.tsx      # React Query & Auth providers
└── globals.css        # Global styles

components/
├── ui/                # Reusable UI components
├── layout/            # Layout components (header, sidebar)
└── forms/             # Form components

lib/
├── api/               # API client & endpoints
├── auth/              # Authentication context
└── utils.ts           # Utility functions
```

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Authentication

The app uses JWT tokens with automatic refresh:
- Access tokens expire in 15 minutes
- Refresh tokens are used to get new access tokens
- Tokens are stored in localStorage
- Automatic redirect to login on auth failure
