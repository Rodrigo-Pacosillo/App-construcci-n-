#!/usr/bin/env bash
set -euo pipefail

echo "▶ post-create: configurando entorno"

# 1. Identidad de git (avisa, no sobreescribe)
if [ -z "$(git config --global user.email)" ]; then
  echo "⚠️  Falta identidad de git:"
  echo "   git config --global user.name  \"Tu Nombre\""
  echo "   git config --global user.email \"tu@mail.com\""
fi

# 2. Dependencias del proyecto (cuando exista)
if [ -f package.json ]; then
  pnpm install
fi

# 3. Prisma Client (cuando exista el schema)
if [ -f prisma/schema.prisma ]; then
  pnpm exec prisma generate
fi

# 4. Sanity check de secrets
if [ -z "${DATABASE_URL:-}" ]; then
  echo "⚠️  DATABASE_URL sin definir → GitHub → Settings → Codespaces → Secrets (y luego rebuild)"
fi
if [ -z "${AUTH_SECRET:-}" ]; then
  echo "⚠️  AUTH_SECRET sin definir"
fi

echo "✔ Entorno listo."
