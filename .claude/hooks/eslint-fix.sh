#!/usr/bin/env bash
# Corrige ce qui est corrigeable après une écriture de l'agent.
#
# Branché sur PostToolUse (Edit|Write) dans .claude/settings.json. Reçoit sur
# son entrée standard la charge JSON du hook, dont `tool_input.file_path`.
#
# Ne bloque jamais : sort toujours en 0. Les erreurs non corrigeables restent
# visibles au `npm run lint` et en CI — ce hook évite seulement de laisser
# derrière soi des écarts que `--fix` sait régler.
set -u

fichier=$(cat | sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)

case "$fichier" in
  *.ts | *.tsx) ;;
  *) exit 0 ;;
esac

[ -f "$fichier" ] || exit 0

# ESLint est résolu depuis le workspace du fichier : chaque app et chaque
# package a son propre eslint.config.mjs.
cd "$(dirname "$fichier")" || exit 0
npx --no-install eslint --fix "$fichier" >/dev/null 2>&1

exit 0
