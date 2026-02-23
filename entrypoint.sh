#!/bin/sh
set -e

# Load environment variables from .env if it exists
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

echo "⏳ Generating Prisma client..."
npx prisma generate

echo "⏳ Applying migrations (if any)..."
npx prisma migrate deploy || echo "No migrations to apply"

echo "🚀 Starting app..."
exec "$@"