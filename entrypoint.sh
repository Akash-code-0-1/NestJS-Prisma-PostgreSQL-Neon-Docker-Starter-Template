#!/bin/sh
set -e

# Load environment variables from .env file
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Generate Prisma client
echo "⏳ Generating Prisma client..."
npx prisma generate

# Apply migrations (if any)
echo "⏳ Applying migrations (if any)..."
npx prisma migrate deploy || echo "No migrations to apply"

# Start the application
echo "🚀 Starting app..."
exec "$@"  # This runs the CMD defined in Dockerfile (node dist/main.js)