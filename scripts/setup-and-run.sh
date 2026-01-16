#!/bin/bash
# Compliant Platform - Automated Setup Script
set -e
echo "🚀 Starting Compliant Platform Setup..."
pnpm install
cd packages/shared && pnpm build && cd ../..
cp packages/backend/.env.example packages/backend/.env
docker run --name compliant-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=compliant_dev -p 5432:5432 -d postgres:15 || docker start compliant-postgres
sleep 5
cd packages/backend && npx prisma generate && npx prisma db push --skip-generate && npx prisma db seed && cd ../..
echo "✨ Setup complete! Starting servers..."
pnpm dev
