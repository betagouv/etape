#!/usr/bin/env bash
#
# Première connexion par FranceConnect : « Finaliser la création de votre espace »
# (ticket 204). Copie le flow natif `first broker login`, y remplace la revue de
# profil par celle d'ETAPE, et l'attache au fournisseur `franceconnect`.
#
# La revue native passe avant la détection d'un compte existant : forcée, elle
# montrerait « Finaliser » à qui a déjà un compte. Celle d'ETAPE ne s'affiche
# qu'à une création, exige les conditions générales et garde l'identité transmise.

set -euo pipefail

KCADM=${KCADM:-/opt/keycloak/bin/kcadm.sh}
REALM=${REALM:-etape}

BUILTIN_FLOW="first broker login"
FLOW=etape-first-broker-login
IDP_ALIAS=franceconnect
REVIEW_PROVIDER=etape-idp-review-profile
BUILTIN_REVIEW_PROVIDER=idp-review-profile

urlencode() {
  echo "${1// /%20}"
}

execution_of() {
  $KCADM get "authentication/flows/${FLOW}/executions" -r "$REALM" \
    --fields id,providerId,priority --format csv --noquotes \
    | { grep -F ",$1," || true; } | cut -d, -f1,3
}

if ! $KCADM get authentication/flows -r "$REALM" --fields alias --format csv --noquotes \
  | grep -qx "$FLOW"; then
  $KCADM create "authentication/flows/$(urlencode "$BUILTIN_FLOW")/copy" -r "$REALM" \
    -s "newName=${FLOW}"
fi

BUILTIN_EXECUTION=$(execution_of "$BUILTIN_REVIEW_PROVIDER")

if [ -z "$(execution_of "$REVIEW_PROVIDER")" ]; then
  $KCADM create "authentication/flows/${FLOW}/executions/execution" -r "$REALM" \
    -s "provider=${REVIEW_PROVIDER}"
fi

REVIEW_EXECUTION=$(execution_of "$REVIEW_PROVIDER")
PRIORITY=${REVIEW_EXECUTION##*,}
if [ -n "$BUILTIN_EXECUTION" ]; then
  PRIORITY=${BUILTIN_EXECUTION##*,}
fi

$KCADM update "authentication/flows/${FLOW}/executions" -r "$REALM" \
  -b "{\"id\": \"${REVIEW_EXECUTION%%,*}\", \"requirement\": \"REQUIRED\", \"priority\": ${PRIORITY}}"

if [ -n "$BUILTIN_EXECUTION" ]; then
  $KCADM delete "authentication/executions/${BUILTIN_EXECUTION%%,*}" -r "$REALM"
fi

if $KCADM get "identity-provider/instances/${IDP_ALIAS}" -r "$REALM" >/dev/null 2>&1; then
  $KCADM update "identity-provider/instances/${IDP_ALIAS}" -r "$REALM" \
    -s "firstBrokerLoginFlowAlias=${FLOW}"
  echo "→ ${REALM} — FranceConnect : « Finaliser la création de votre espace » à la première connexion"
else
  echo "→ ${REALM} — FranceConnect absent : flow ${FLOW} prêt, mais attaché à aucun fournisseur"
fi
