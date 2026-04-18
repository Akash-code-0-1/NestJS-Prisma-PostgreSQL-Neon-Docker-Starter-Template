#!/bin/sh
set -e

# Load environment variables from .env file (for local Neon/Redis access)
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# 1. Generate Prisma 6 client
echo "⏳ Generating Prisma client..."
npx prisma generate

# 2. Compile project to create dist/src/main.js
echo "🏗️ Building project..."
npm run build

# 3. Apply Neon migrations
echo "⏳ Applying migrations..."
npx prisma migrate deploy || echo "No migrations to apply"

# 4. Start the application
# This will execute the "pm2-runtime" command defined in the Dockerfile
echo "🚀 Starting app with PM2..."
exec "$@"