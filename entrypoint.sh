#!/bin/sh
set -e

# Load env variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Generate Prisma client
echo "⏳ Generating Prisma client..."
npx prisma generate

# Apply migrations (if any)
echo "⏳ Applying migrations (if any)..."
npx prisma migrate deploy || echo "No migrations to apply"

# Start the app
echo "🚀 Starting app..."
exec "$@"  # runs CMD from Dockerfile (npm run start:dev or node dist/main.js)