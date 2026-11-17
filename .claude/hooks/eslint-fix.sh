#!/usr/bin/env bash
# Corrige ce qui est corrigeable après une écriture de l'agent, et lui renvoie
# le reste.
#
# Branché sur PostToolUse (Edit|Write) dans .claude/settings.json. Reçoit sur
# son entrée standard la charge JSON du hook, dont `tool_input.file_path`.
#
# Ne bloque jamais : sort toujours en 0. Quand des erreurs restent après
# `--fix`, il les écrit sur sa sortie en JSON (`decision: "block"`) : Claude Code
# les montre alors à l'agent, qui les corrige dans la foulée au lieu de les
# découvrir en CI. L'écriture du fichier, elle, a déjà eu lieu.
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

# ESLint tourne depuis la racine du workspace du fichier : chaque app et chaque
# package a son propre eslint.config.mjs, et la règle typée
# `etape/no-hardcoded-literal` ne trouve le tsconfig que depuis ce dossier.
workspace=$(dirname "$fichier")
until [ -f "$workspace/eslint.config.mjs" ] || [ "$workspace" = "/" ]; do
  workspace=$(dirname "$workspace")
done
[ -f "$workspace/eslint.config.mjs" ] || exit 0
cd "$workspace" || exit 0
erreurs=$(pnpm exec eslint --fix --quiet "$fichier" 2>/dev/null)
statut=$?

# 1 : il reste des erreurs de lint. 2 et au-delà : ESLint n'a pas pu tourner,
# ce n'est pas à l'agent de le réparer — `pnpm run lint` le dira.
if [ "$statut" -eq 1 ] && [ -n "$erreurs" ]; then
  printf '%s' "ESLint signale des erreurs que --fix ne corrige pas. Corrige-les avant de continuer (règles : docs/conventions/).
$erreurs" |
    node -e 'let s = ""; process.stdin.on("data", (d) => (s += d)).on("end", () => process.stdout.write(JSON.stringify({ decision: "block", reason: s })));'
fi

exit 0
