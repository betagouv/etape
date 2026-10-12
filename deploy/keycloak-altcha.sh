#!/usr/bin/env bash
#
# Branche ALTCHA sur l'inscription et le « mot de passe oublié » du realm.

set -euo pipefail

KCADM=${KCADM:-/opt/keycloak/bin/kcadm.sh}
REALM=${REALM:-etape}

REGISTRATION_FLOW=etape-registration
RESET_CREDENTIALS_FLOW=etape-reset-credentials
REGISTRATION_PROVIDER=etape-altcha-registration
RESET_CREDENTIALS_PROVIDER=etape-altcha-reset-credentials
CHOOSE_USER_PROVIDER=reset-credentials-choose-user

urlencode() {
  echo "${1// /%20}"
}

flow_exists() {
  $KCADM get authentication/flows -r "$REALM" --fields alias --format csv --noquotes | grep -qxF "$1"
}

execution_of() {
  $KCADM get "authentication/flows/$(urlencode "$1")/executions" -r "$REALM" \
    --fields id,providerId,priority --format csv --noquotes \
    | { grep -F ",$2," || true; } | cut -d, -f1,3
}

require_execution() {
  local flow=$1 execution=$2 priority=$3
  $KCADM update "authentication/flows/$(urlencode "$flow")/executions" -r "$REALM" \
    -b "{\"id\": \"${execution%%,*}\", \"requirement\": \"REQUIRED\", \"priority\": ${priority}}"
}

if ! flow_exists "$REGISTRATION_FLOW"; then
  $KCADM create authentication/flows/registration/copy -r "$REALM" -s "newName=${REGISTRATION_FLOW}"
fi

if [ -z "$(execution_of "$REGISTRATION_FLOW" "$REGISTRATION_PROVIDER")" ]; then
  $KCADM create "authentication/flows/$(urlencode "${REGISTRATION_FLOW} registration form")/executions/execution" \
    -r "$REALM" -s "provider=${REGISTRATION_PROVIDER}"
fi

REGISTRATION_EXECUTION=$(execution_of "$REGISTRATION_FLOW" "$REGISTRATION_PROVIDER")
require_execution "$REGISTRATION_FLOW" "$REGISTRATION_EXECUTION" "${REGISTRATION_EXECUTION##*,}"

if ! flow_exists "$RESET_CREDENTIALS_FLOW"; then
  $KCADM create "authentication/flows/$(urlencode "reset credentials")/copy" -r "$REALM" \
    -s "newName=${RESET_CREDENTIALS_FLOW}"
fi

CHOOSE_USER_EXECUTION=$(execution_of "$RESET_CREDENTIALS_FLOW" "$CHOOSE_USER_PROVIDER")

if [ -z "$(execution_of "$RESET_CREDENTIALS_FLOW" "$RESET_CREDENTIALS_PROVIDER")" ]; then
  $KCADM create "authentication/flows/${RESET_CREDENTIALS_FLOW}/executions/execution" \
    -r "$REALM" -s "provider=${RESET_CREDENTIALS_PROVIDER}"
fi

RESET_CREDENTIALS_EXECUTION=$(execution_of "$RESET_CREDENTIALS_FLOW" "$RESET_CREDENTIALS_PROVIDER")

if [ -n "$CHOOSE_USER_EXECUTION" ]; then
  require_execution "$RESET_CREDENTIALS_FLOW" "$RESET_CREDENTIALS_EXECUTION" "${CHOOSE_USER_EXECUTION##*,}"
  $KCADM delete "authentication/executions/${CHOOSE_USER_EXECUTION%%,*}" -r "$REALM"
else
  require_execution "$RESET_CREDENTIALS_FLOW" "$RESET_CREDENTIALS_EXECUTION" "${RESET_CREDENTIALS_EXECUTION##*,}"
fi

$KCADM update "realms/$REALM" \
  -s "registrationFlow=${REGISTRATION_FLOW}" \
  -s "resetCredentialsFlow=${RESET_CREDENTIALS_FLOW}" \
  -s "browserSecurityHeaders.contentSecurityPolicy=frame-src 'self'; frame-ancestors 'self'; object-src 'none';"
echo "→ altcha : exigé à l'inscription et au « mot de passe oublié »"
