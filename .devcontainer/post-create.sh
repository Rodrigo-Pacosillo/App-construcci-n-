#!/usr/bin/env bash
set -euo pipefail

echo "▶ post-create: configurando entorno"

# 1. Identidad de git (avisa, no sobreescribe)
if [ -z "$(git config --global user.email)" ]; then
  echo "⚠️  Falta identidad de git:"
  echo "   git config --global user.name  \"Tu Nombre\""
  echo "   git config --global user.email \"tu@mail.com\""
fi

# 2. ⬅️ NUEVO: sanidad de ~/.local/share (el bug del volumen montado como root).
# post-create corre como vscode: si NO puede escribir ahí, algo creó la
# jerarquía como root. Se autocorrige una sola vez y avisa.
if [ ! -w "${HOME}/.local/share" ]; then
  echo "⚠️  ~/.local/share no es escribible (dueño root) → corrigiendo..."
  sudo mkdir -p "${HOME}/.local/share"
  sudo chown -R vscode:vscode "${HOME}/.local"
  echo "   ✔ corregido. Si esto se repite en cada rebuild, falta el paso 2.5 del Dockerfile."
fi

# 3. ⬅️ NUEVO: opencode responde
if ! command -v opencode >/dev/null 2>&1; then
  echo "⚠️  opencode no está en el PATH → revisá el symlink /usr/local/bin/opencode"
else
  echo "   ✔ opencode instalado: $(opencode -v 2>/dev/null || echo versión?)"
fi

# 4. Dependencias del proyecto (cuando exista)
if [ -f package.json ]; then
  pnpm install
fi

# 5. Prisma Client (cuando exista el schema)
if [ -f prisma/schema.prisma ]; then
  pnpm exec prisma generate
fi

# 6. Sanity check de secrets
if [ -z "${DATABASE_URL:-}" ]; then
  echo "⚠️  DATABASE_URL sin definir → GitHub → Settings → Codespaces → Secrets (y luego rebuild)"
fi
if [ -z "${AUTH_SECRET:-}" ]; then
  echo "⚠️  AUTH_SECRET sin definir"
fi

echo "✔ Entorno listo."
