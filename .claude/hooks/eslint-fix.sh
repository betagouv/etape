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

# `grep -o` puis `head -1` : on retient la PREMIÈRE occurrence. Un `sed` avec un
# `.*` en tête serait glouton et retiendrait la dernière, alors que la charge
# JSON tient sur une seule ligne et peut contenir plusieurs `file_path`.
fichier=$(cat |
  grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' |
  head -1 |
  sed 's/.*"\([^"]*\)"$/\1/')

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
