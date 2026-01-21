# GitHub Codespaces Setup Guide

## Project Type: Monorepo (Default Configuration)

This project is a **monorepo** using:
- **pnpm workspaces** for package management
- **Turbo (turborepo)** for build orchestration
- **Node.js 20** runtime environment

> **Note**: The term "runner" you might see in paths like `/home/runner/work/` refers to the GitHub Actions runner user account, not the project type. This is the standard GitHub Actions/Codespaces environment path.

## What is GitHub Codespaces?

GitHub Codespaces is a cloud-based development environment that runs in your browser or VS Code. It's already configured for this project via the `.devcontainer/devcontainer.json` file.

---

## Step-by-Step Guide: Setting Up Codespace

### Step 1: Open the Repository in Codespace

1. **Go to the GitHub repository**: https://github.com/hml-brokerage/Compliant-
2. **Click the green "Code" button** (top right of the file list)
3. **Select the "Codespaces" tab**
4. **Click "Create codespace on main"** (or your branch name)

   ![Create Codespace](https://docs.github.com/assets/cb-77061/mw-1440/images/help/codespaces/new-codespace-button.webp)

5. **Wait for the environment to build** (first time takes 2-3 minutes)

### Step 2: Automatic Setup

When your Codespace opens, the following happens automatically:

1. ✅ **Docker container is created** with Node.js 20
2. ✅ **Dependencies are installed** via `pnpm install` (from `postCreateCommand`)
3. ✅ **Ports are forwarded**:
   - Port 3000: Frontend (Next.js)
   - Port 3001: Backend (NestJS)
   - Port 5432: PostgreSQL database

### Step 3: Configure Environment Variables

```bash
# Copy environment templates
cp packages/backend/.env.example packages/backend/.env
cp packages/frontend/.env.example packages/frontend/.env.local
```

**Edit `packages/backend/.env`:**
```bash
# Database - Use the forwarded PostgreSQL or connect to your database
DATABASE_URL="postgresql://postgres:password@localhost:5432/compliant_dev"

# JWT secrets (generate new ones for security)
JWT_SECRET="your-secret-key-here"
JWT_REFRESH_SECRET="your-refresh-secret-key-here"

# Other configurations...
```

**Edit `packages/frontend/.env.local`:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Step 4: Initialize the Database

```bash
# Push the database schema (creates tables)
pnpm db:push

# Optional: Seed with sample data
cd packages/backend
pnpm prisma db seed
```

### Step 5: Start the Development Servers

```bash
# Start both frontend and backend
pnpm dev
```

Or start them individually in separate terminals:

```bash
# Terminal 1: Backend
pnpm backend

# Terminal 2: Frontend  
pnpm frontend
```

### Step 6: Access Your Application

Codespaces will automatically forward ports and provide URLs:

1. **Click "PORTS" tab** at the bottom of VS Code
2. You'll see:
   - Port 3000: Frontend app
   - Port 3001: Backend API
   - Port 5432: Database

3. **Click the globe icon** 🌐 next to port 3000 to open the frontend
4. **Click the globe icon** 🌐 next to port 3001 to see the backend API docs

---

## Connecting Webhooks to Codespace

### Understanding Webhooks in Codespace

GitHub Codespaces provide **temporary URLs** for your forwarded ports. These URLs change each time you create a new Codespace, so they're not ideal for webhooks from external services.

### Option 1: Local Webhook Testing (Recommended for Development)

Use **GitHub Codespaces port forwarding** with webhook testing tools:

1. **Make your port public**:
   - Right-click on the port in the PORTS tab
   - Select "Port Visibility" → "Public"
   
2. **Get the public URL**:
   - Your port will have a URL like: `https://username-reponame-xyz123.github.dev:3001`

3. **Use the URL in webhook configuration**:
   ```
   Webhook URL: https://your-codespace-url.github.dev:3001/api/webhooks/your-endpoint
   ```

### Option 2: Using Webhook Testing Services

For testing webhooks from services like GitHub, Stripe, etc.:

#### A. Using `smee.io` (Free Webhook Proxy)

1. **Go to https://smee.io** and click "Start a new channel"
2. **Copy your unique webhook URL** (e.g., `https://smee.io/abc123`)
3. **Install smee client in your Codespace**:
   ```bash
   npm install -g smee-client
   ```

4. **Forward webhooks to your local server**:
   ```bash
   smee --url https://smee.io/abc123 --path /api/webhooks/your-endpoint --port 3001
   ```

5. **Configure the external service** to send webhooks to `https://smee.io/abc123`

#### B. Using GitHub CLI (for GitHub Webhooks)

```bash
# Forward GitHub webhooks to your Codespace
gh webhook forward --repo=owner/repo --events=push,pull_request --url=http://localhost:3001/api/webhooks/github
```

### Option 3: Ngrok Alternative (Advanced)

If you need a stable tunnel:

1. **Install ngrok**:
   ```bash
   curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | \
     sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null && \
     echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | \
     sudo tee /etc/apt/sources.list.d/ngrok.list && \
     sudo apt update && sudo apt install ngrok
   ```

2. **Authenticate** (sign up at https://ngrok.com for a free token):
   ```bash
   ngrok config add-authtoken YOUR_TOKEN
   ```

3. **Start tunnel**:
   ```bash
   ngrok http 3001
   ```

4. **Use the ngrok URL** for webhooks:
   ```
   https://abc123.ngrok.io/api/webhooks/your-endpoint
   ```

---

## GitHub Webhook Integration Example

If you're setting up GitHub webhooks specifically:

### 1. Create a Webhook Endpoint (Backend)

```typescript
// packages/backend/src/webhooks/github-webhook.controller.ts
@Controller('webhooks')
export class WebhookController {
  @Post('github')
  async handleGithubWebhook(@Body() payload: any, @Headers() headers: any) {
    // Verify webhook signature
    const signature = headers['x-hub-signature-256'];
    // Process webhook
    console.log('GitHub event:', payload);
    return { received: true };
  }
}
```

### 2. Configure GitHub Repository Webhook

1. **Go to your repo** → Settings → Webhooks → Add webhook
2. **Payload URL**: Your Codespace URL + endpoint
   ```
   https://your-codespace.github.dev:3001/api/webhooks/github
   ```
3. **Content type**: `application/json`
4. **Secret**: Add a secret for security
5. **Events**: Select events you want to receive
6. **Click "Add webhook"**

### 3. Test the Webhook

- Make a change in your repository (commit, PR, etc.)
- Check your Codespace terminal for incoming webhook logs
- Verify in GitHub webhook settings (Recent Deliveries)

---

## Troubleshooting

### Port Not Accessible
- Check if the port is set to **Public** in the PORTS tab
- Restart the server: `pnpm dev`

### Database Connection Issues
- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Try: `pnpm db:push` to reinitialize

### Dependencies Not Installing
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Webhook Not Receiving Data
- Verify the webhook URL is correct and public
- Check your endpoint logs for errors
- Test with a simple curl command:
  ```bash
  curl -X POST https://your-codespace.github.dev:3001/api/webhooks/test \
    -H "Content-Type: application/json" \
    -d '{"test": "data"}'
  ```

---

## Best Practices for Codespaces

1. **Use `.devcontainer/devcontainer.json`** for persistent configuration
2. **Commit `.env.example` files** (never commit actual `.env` files)
3. **Use Codespace secrets** for sensitive data (Settings → Codespaces → Secrets)
4. **Set port visibility** appropriately (Private for development, Public for webhooks)
5. **Stop your Codespace** when not in use to save quota

---

## Additional Resources

- [GitHub Codespaces Documentation](https://docs.github.com/en/codespaces)
- [Port Forwarding Guide](https://docs.github.com/en/codespaces/developing-in-codespaces/forwarding-ports-in-your-codespace)
- [Webhook Testing with smee.io](https://smee.io)
- [Project README](../README.md)
- [Development Guide](./IMPLEMENTATION_GUIDELINES.md)

---

## Quick Reference

### Common Commands
```bash
# Install dependencies
pnpm install

# Start all services
pnpm dev

# Start backend only
pnpm backend

# Start frontend only
pnpm frontend

# Database operations
pnpm db:push        # Apply schema
pnpm db:studio      # Open Prisma Studio
pnpm db:migrate     # Create migration

# Testing
pnpm test           # Run all tests
pnpm lint           # Run linter
pnpm build          # Build for production
```

### Port Mappings
- **3000**: Frontend (Next.js)
- **3001**: Backend (NestJS API)
- **5432**: PostgreSQL
- **5555**: Prisma Studio (when running)

---

**Need Help?** Open an issue or contact the development team.
