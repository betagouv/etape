set -e

/app/node_modules/.bin/prisma migrate deploy

exec node dist/main.js
