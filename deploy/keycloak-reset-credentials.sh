#!/usr/bin/env bash
#
# Remplace l'envoi du lien natif par celui d'ETAPE dans le « mot de passe oublié »
# du realm. Suppose le flow créé par `keycloak-altcha.sh`.

set -euo pipefail

KCADM=${KCADM:-/opt/keycloak/bin/kcadm.sh}
REALM=${REALM:-etape}

RESET_CREDENTIALS_FLOW=etape-reset-credentials
RESET_EMAIL_PROVIDER=etape-reset-credential-email
BUILTIN_RESET_EMAIL_PROVIDER=reset-credential-email

execution_of() {
  $KCADM get "authentication/flows/$1/executions" -r "$REALM" \
    --fields id,providerId,priority --format csv --noquotes \
    | { grep -F ",$2," || true; } | cut -d, -f1,3
}

require_execution() {
  local execution=$1 priority=$2
  $KCADM update "authentication/flows/${RESET_CREDENTIALS_FLOW}/executions" -r "$REALM" \
    -b "{\"id\": \"${execution%%,*}\", \"requirement\": \"REQUIRED\", \"priority\": ${priority}}"
}

BUILTIN_EXECUTION=$(execution_of "$RESET_CREDENTIALS_FLOW" "$BUILTIN_RESET_EMAIL_PROVIDER")

if [ -z "$(execution_of "$RESET_CREDENTIALS_FLOW" "$RESET_EMAIL_PROVIDER")" ]; then
  $KCADM create "authentication/flows/${RESET_CREDENTIALS_FLOW}/executions/execution" \
    -r "$REALM" -s "provider=${RESET_EMAIL_PROVIDER}"
fi

RESET_EMAIL_EXECUTION=$(execution_of "$RESET_CREDENTIALS_FLOW" "$RESET_EMAIL_PROVIDER")

if [ -n "$BUILTIN_EXECUTION" ]; then
  require_execution "$RESET_EMAIL_EXECUTION" "${BUILTIN_EXECUTION##*,}"
  $KCADM delete "authentication/executions/${BUILTIN_EXECUTION%%,*}" -r "$REALM"
else
  require_execution "$RESET_EMAIL_EXECUTION" "${RESET_EMAIL_EXECUTION##*,}"
fi

echo "→ ${REALM} — mot de passe oublié : écran « e-mail envoyé », renvoi après 2 minutes"
