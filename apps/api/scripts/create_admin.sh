#!/usr/bin/env bash
# Creates the BestDoors admin user in Neon. Asks for everything; nothing is saved to disk.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "Neon: Dashboard -> project bestdoors -> Connect -> turn OFF 'Connection pooling' -> copy the string."
read -r -s -p "Neon DIRECT connection string (hidden): " DB_URL; echo
case "$DB_URL" in
  postgres://*|postgresql://*) ;;
  *) echo "This does not look like a Postgres connection string."; exit 1 ;;
esac
if [[ "$DB_URL" == *"-pooler"* ]]; then
  echo "Warning: this is the POOLED string (-pooler). The direct one is better, but it should still work."
fi

read -r -p "Admin email: " ADMIN_EMAIL
read -r -s -p "Admin password (min 10 chars, hidden): " P1; echo
read -r -s -p "Repeat password: " P2; echo
if [[ "$P1" != "$P2" ]]; then echo "Passwords do not match."; exit 1; fi

DATABASE_URL="$DB_URL" ADMIN_EMAIL="$ADMIN_EMAIL" ADMIN_PASSWORD="$P1" \
  ../../node_modules/.bin/tsx prisma/create-admin.ts

echo "Now log in at https://bestdoors-web.vercel.app/admin"
