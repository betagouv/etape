#!/usr/bin/env bash
#
# Applique aux deux realms ce qu'un fichier d'import ne peut pas porter :
# `etape` pour le front-office, `etape-back-office` pour le back-office. Deux
# realms et non deux clients : la session de Keycloak est commune à tout un
# realm, et un compte du front-office se retrouverait connecté au back-office
# sans rien saisir.
#
# **L'import de realm ne substitue aucune variable**, ni d'environnement ni de
# propriété système (vérifié sur Keycloak 26.7). Le fichier décrit donc le poste
# de développement et lui seul, et tout ce qui varie d'un environnement à l'autre
# passe par `kcadm`, après l'import.
#
# Idempotent : rejoué à chaque déploiement, y compris sur un realm configuré.

set -euo pipefail

KCADM=/opt/keycloak/bin/kcadm.sh
REALM=etape
BACK_OFFICE_REALM=etape-back-office
INTERNAL_URL="${KEYCLOAK_INTERNAL_URL:-http://keycloak:8080}"

: "${KEYCLOAK_ADMIN_PASSWORD:?KEYCLOAK_ADMIN_PASSWORD est obligatoire}"
: "${FRONT_OFFICE_PUBLIC_URL:?FRONT_OFFICE_PUBLIC_URL est obligatoire (URL publique du front-office, sans slash final)}"
: "${FRONT_OFFICE_KEYCLOAK_CLIENT_SECRET:?FRONT_OFFICE_KEYCLOAK_CLIENT_SECRET est obligatoire}"
: "${BACK_OFFICE_PUBLIC_URL:?BACK_OFFICE_PUBLIC_URL est obligatoire (URL publique du back-office, sans slash final)}"
: "${BACK_OFFICE_KEYCLOAK_CLIENT_SECRET:?BACK_OFFICE_KEYCLOAK_CLIENT_SECRET est obligatoire}"

# L'API d'administration n'ouvre qu'une fois l'import terminé : tant que
# l'authentification échoue, le serveur n'est pas prêt. Cinq minutes puis
# abandon, sinon un Keycloak en échec tournerait sans que rien ne le signale.
echo "→ attente de Keycloak sur ${INTERNAL_URL}"
for attempt in $(seq 1 100); do
  if $KCADM config credentials --server "$INTERNAL_URL" --realm master \
      --user "${KEYCLOAK_ADMIN_USER:-admin}" --password "$KEYCLOAK_ADMIN_PASSWORD" >/dev/null 2>&1; then
    echo "  connecté (tentative ${attempt})"
    break
  fi
  if [ "$attempt" -eq 100 ]; then
    echo "✗ Keycloak injoignable après 5 minutes." >&2
    exit 1
  fi
  sleep 3
done


# `sslRequired: none` est nécessaire en local ; ici TLS est terminé par le proxy
# et le réglage repasse en `EXTERNAL`, qui laisse le réseau interne en clair.
configure_realm_security() {
  local realm=$1

  if ! $KCADM get "realms/$realm" --fields realm >/dev/null 2>&1; then
    echo "✗ le realm ${realm} n'existe pas." >&2
    echo "  L'import a échoué, ou l'image ne contient pas keycloak/realms/${realm}-realm.json." >&2
    exit 1
  fi

  $KCADM update "realms/$realm" -s sslRequired=EXTERNAL
  echo "→ realm ${realm} : sslRequired=EXTERNAL"

  $KCADM update "realms/$realm" -s actionTokenGeneratedByUserLifespan=900
  echo "→ realm ${realm} : lien de réinitialisation valable 15 minutes"

  $KCADM update "realms/$realm" -s accessCodeLifespanLogin=600
  echo "→ realm ${realm} : session d'authentification valable 10 minutes"

  $KCADM update "realms/$realm" -s "passwordPolicy=length(12) and upperCase(1) and lowerCase(1) and digits(1) and specialChars(1) and notUsername(undefined) and passwordHistory(3)"
  echo "→ realm ${realm} : politique de mot de passe appliquée"

  local admin_cli_uuid
  admin_cli_uuid=$($KCADM get clients -r "$realm" -q clientId=admin-cli --fields id --format csv --noquotes)
  if [ -n "$admin_cli_uuid" ]; then
    $KCADM update "clients/$admin_cli_uuid" -r "$realm" -s directAccessGrantsEnabled=false
    echo "→ realm ${realm} : direct access grants d'admin-cli désactivés"
  fi
}

# `redirectUris` doit correspondre au caractère près à ce que l'API construit.
# `post.logout.redirect.uris` n'en est pas déduit : oublié, la déconnexion échoue
# alors que la connexion fonctionne.
configure_api_client() {
  local realm=$1 secret=$2 public_url=$3

  local client_uuid
  client_uuid=$($KCADM get clients -r "$realm" -q clientId=etape-api --fields id --format csv --noquotes)
  if [ -z "$client_uuid" ]; then
    echo "✗ client etape-api absent du realm ${realm} — l'import a-t-il eu lieu ?" >&2
    exit 1
  fi

  $KCADM update "clients/$client_uuid" -r "$realm" -f - <<JSON
{
  "secret": "${secret}",
  "redirectUris": ["${public_url}/api/auth/callback"],
  "baseUrl": "${public_url}/api/auth/login?returnTo=%2F",
  "webOrigins": [],
  "attributes": {
    "pkce.code.challenge.method": "S256",
    "post.logout.redirect.uris": "${public_url}/*"
  }
}
JSON
  echo "→ realm ${realm} : client etape-api aligné sur ${public_url}"
}

# Sans SMTP, `verifyEmail` reste désactivé : l'inscription s'arrêterait sur un
# message qui n'arriverait jamais. Pis-aller assumé — c'est la vérification
# d'adresse qui rend sûre la liaison d'un compte local à une identité.
configure_smtp() {
  local realm=$1

  if [ -n "${SMTP_HOST:-}" ]; then
    $KCADM update "realms/$realm" -f - <<JSON
{
  "verifyEmail": true,
  "smtpServer": {
    "host": "${SMTP_HOST}",
    "port": "${SMTP_PORT:-587}",
    "from": "${SMTP_FROM:-no-reply@etape.beta.gouv.fr}",
    "fromDisplayName": "ETAPE",
    "starttls": "${SMTP_STARTTLS:-true}",
    "ssl": "${SMTP_SSL:-false}",
    "auth": "${SMTP_AUTH:-true}",
    "user": "${SMTP_USER:-}",
    "password": "${SMTP_PASSWORD:-}"
  }
}
JSON
    echo "→ realm ${realm} : smtp ${SMTP_HOST} configuré, verifyEmail activé"
  else
    $KCADM update "realms/$realm" -s verifyEmail=false -s 'smtpServer={}'
    echo "⚠ realm ${realm} : smtp non configuré — verifyEmail désactivé, envoi effacé."
    echo "  « Mot de passe oublié » n'est pas jouable sans lui."
  fi
}

configure_test_user() {
  local realm=$1

  local test_user_id
  test_user_id=$($KCADM get users -r "$realm" -q username=test@etape.local -q exact=true --fields id --format csv --noquotes)

  if [ -n "${KEYCLOAK_TEST_USER_PASSWORD:-}" ]; then
    if [ -z "$test_user_id" ]; then
      $KCADM create users -r "$realm" \
        -s username=test@etape.local \
        -s email=test@etape.local \
        -s emailVerified=true \
        -s enabled=false \
        -s firstName=Test \
        -s lastName=ETAPE
      test_user_id=$($KCADM get users -r "$realm" -q username=test@etape.local -q exact=true --fields id --format csv --noquotes)
      echo "→ realm ${realm} : compte de test test@etape.local créé"
    fi

    # `passwordHistory(3)` fait échouer `set-password` si le script est rejoué
    # avec le même mot de passe : le compte est déjà dans l'état voulu.
    local error
    if error=$($KCADM set-password -r "$realm" --userid "$test_user_id" \
        --new-password "$KEYCLOAK_TEST_USER_PASSWORD" 2>&1); then
      echo "→ realm ${realm} : mot de passe du compte de test posé"
    elif [[ "$error" == *invalidPasswordHistoryMessage* ]]; then
      echo "→ realm ${realm} : mot de passe du compte de test déjà en place"
    else
      echo "⚠ realm ${realm} : mot de passe du compte de test refusé, compte laissé désactivé"
      echo "  ${error}"
      echo "  KEYCLOAK_TEST_USER_PASSWORD doit respecter la politique du realm :"
      echo "  12 caractères, une majuscule, une minuscule, un chiffre, un caractère spécial."
      test_user_id=""
    fi

    if [ -n "$test_user_id" ]; then
      $KCADM update "users/$test_user_id" -r "$realm" -s enabled=true
    fi
  elif [ -n "$test_user_id" ]; then
    $KCADM delete "users/$test_user_id" -r "$realm"
    echo "→ realm ${realm} : compte de test supprimé (KEYCLOAK_TEST_USER_PASSWORD absent)"
  fi
}

configure_realm_security "$REALM"
configure_realm_security "$BACK_OFFICE_REALM"

# Le realm `master` naît sans protection contre la force brute, là où les realms
# applicatifs la portent, et c'est pourtant lui qui délivre le jeton
# d'administration. `permanentLockout=false` : verrouiller le seul
# administrateur se retourne contre nous, l'attente croissante suffit.
$KCADM update realms/master \
  -s bruteForceProtected=true \
  -s permanentLockout=false \
  -s failureFactor=10 \
  -s waitIncrementSeconds=60 \
  -s maxFailureWaitSeconds=900
echo "→ realm master : protection contre la force brute activée"

configure_api_client "$REALM" "$FRONT_OFFICE_KEYCLOAK_CLIENT_SECRET" "$FRONT_OFFICE_PUBLIC_URL"
configure_api_client "$BACK_OFFICE_REALM" "$BACK_OFFICE_KEYCLOAK_CLIENT_SECRET" "$BACK_OFFICE_PUBLIC_URL"

# Identifiants facultatifs : sans eux, seul ce parcours est indisponible.
# FranceConnect n'existe que dans le realm du front-office : le back-office n'en
# a pas, ce qui l'y rend impossible par construction.
#
# `providerId` ne se modifie pas sur une instance existante, et l'import est en
# `IGNORE_EXISTING` : le fournisseur est recréé, sans quoi la bascule vers
# l'extension INSEE ne prendrait que sur une base neuve.
EXPECTED_PROVIDER_ID=franceconnect-particulier
CURRENT_PROVIDER_ID=$($KCADM get identity-provider/instances/franceconnect -r "$REALM" \
  --fields providerId --format csv --noquotes 2>/dev/null || true)

if [ -n "$CURRENT_PROVIDER_ID" ] && [ "$CURRENT_PROVIDER_ID" != "$EXPECTED_PROVIDER_ID" ]; then
  echo "→ franceconnect : migration de ${CURRENT_PROVIDER_ID} vers ${EXPECTED_PROVIDER_ID}"
  $KCADM delete identity-provider/instances/franceconnect -r "$REALM"
  CURRENT_PROVIDER_ID=""
fi

if [ -z "$CURRENT_PROVIDER_ID" ]; then
  $KCADM create identity-provider/instances -r "$REALM" -f - <<JSON
{
  "alias": "franceconnect",
  "displayName": "FranceConnect",
  "providerId": "${EXPECTED_PROVIDER_ID}",
  "enabled": true,
  "storeToken": false,
  "linkOnly": false,
  "addReadTokenRoleOnCreate": false,
  "trustEmail": false,
  "firstBrokerLoginFlowAlias": "first broker login",
  "config": {
    "fc_environment": "${FRANCECONNECT_ENVIRONMENT:-INTEGRATION_STANDARD_V2}",
    "eidas_values": "${FRANCECONNECT_EIDAS:-EIDAS1}",
    "defaultScope": "openid given_name family_name birthdate birthplace birthcountry gender email",
    "clientAuthMethod": "client_secret_post",
    "syncMode": "FORCE"
  }
}
JSON
fi

# Réappliqué à chaque démarrage, sinon changer d'environnement n'aurait aucun
# effet sur un realm déjà en place.
$KCADM update identity-provider/instances/franceconnect -r "$REALM" \
  -s "config.fc_environment=${FRANCECONNECT_ENVIRONMENT:-INTEGRATION_STANDARD_V2}" \
  -s "config.eidas_values=${FRANCECONNECT_EIDAS:-EIDAS1}"
echo "→ franceconnect : environnement ${FRANCECONNECT_ENVIRONMENT:-INTEGRATION_STANDARD_V2}"

if [ -n "${FRANCECONNECT_CLIENT_ID:-}" ]; then
  $KCADM update identity-provider/instances/franceconnect -r "$REALM" \
    -s "config.clientId=${FRANCECONNECT_CLIENT_ID}" \
    -s "config.clientSecret=${FRANCECONNECT_CLIENT_SECRET:-}"
  echo "→ franceconnect : identifiants injectés"
  echo "  à déclarer côté FranceConnect :"
  echo "    redirect_uri  ${KEYCLOAK_PUBLIC_URL:-<url keycloak>}/realms/${REALM}/broker/franceconnect/endpoint"
  echo "    post_logout   ${KEYCLOAK_PUBLIC_URL:-<url keycloak>}/realms/${REALM}/broker/franceconnect/endpoint/logout_response"
else
  echo "→ franceconnect : aucun identifiant fourni, le fournisseur restera inutilisable"
fi

RECAPTCHA_EXECUTION=$($KCADM get authentication/flows/registration/executions -r "$REALM" \
  --fields id,providerId,priority,authenticationConfig --format csv --noquotes \
  | grep '^[^,]*,registration-recaptcha-action,' || true)
RECAPTCHA_EXECUTION_ID=$(echo "$RECAPTCHA_EXECUTION" | cut -d, -f1)
RECAPTCHA_PRIORITY=$(echo "$RECAPTCHA_EXECUTION" | cut -d, -f3)
RECAPTCHA_CONFIG_ID=$(echo "$RECAPTCHA_EXECUTION" | cut -d, -f4)

if [ -z "$RECAPTCHA_EXECUTION_ID" ]; then
  echo "✗ étape reCAPTCHA absente du flow registration du realm ${REALM}." >&2
  exit 1
fi

if [ -n "${KEYCLOAK_RECAPTCHA_SITE_KEY:-}" ] && [ -n "${KEYCLOAK_RECAPTCHA_SECRET_KEY:-}" ]; then
  RECAPTCHA_CONFIG="{
    \"alias\": \"etape-recaptcha\",
    \"config\": {
      \"site.key\": \"${KEYCLOAK_RECAPTCHA_SITE_KEY}\",
      \"secret.key\": \"${KEYCLOAK_RECAPTCHA_SECRET_KEY}\",
      \"action\": \"register\",
      \"useRecaptchaNet\": \"true\",
      \"recaptcha.v3\": \"${KEYCLOAK_RECAPTCHA_V3:-false}\"
    }
  }"
  if [ -z "$RECAPTCHA_CONFIG_ID" ]; then
    echo "$RECAPTCHA_CONFIG" | $KCADM create "authentication/executions/$RECAPTCHA_EXECUTION_ID/config" -r "$REALM" -f -
  else
    echo "$RECAPTCHA_CONFIG" | $KCADM update "authentication/config/$RECAPTCHA_CONFIG_ID" -r "$REALM" -f -
  fi

  $KCADM update authentication/flows/registration/executions -r "$REALM" \
    -b "{\"id\": \"${RECAPTCHA_EXECUTION_ID}\", \"requirement\": \"REQUIRED\", \"priority\": ${RECAPTCHA_PRIORITY}}"
  $KCADM update "realms/$REALM" \
    -s registrationAllowed=true \
    -s "browserSecurityHeaders.contentSecurityPolicy=frame-src 'self' https://www.recaptcha.net; frame-ancestors 'self'; object-src 'none';"
  echo "→ inscription : ouverte, reCAPTCHA exigé"
else
  $KCADM update authentication/flows/registration/executions -r "$REALM" \
    -b "{\"id\": \"${RECAPTCHA_EXECUTION_ID}\", \"requirement\": \"DISABLED\", \"priority\": ${RECAPTCHA_PRIORITY}}"
  $KCADM update "realms/$REALM" \
    -s "browserSecurityHeaders.contentSecurityPolicy=frame-src 'self'; frame-ancestors 'self'; object-src 'none';"

  if [ -n "${SMTP_HOST:-}" ]; then
    $KCADM update "realms/$REALM" -s registrationAllowed=false
    echo "⚠ inscription : fermée — SMTP configuré sans KEYCLOAK_RECAPTCHA_SITE_KEY"
    echo "  ni KEYCLOAK_RECAPTCHA_SECRET_KEY."
  else
    $KCADM update "realms/$REALM" -s registrationAllowed=true
    echo "→ inscription : ouverte, sans reCAPTCHA (aucun email envoyé sans SMTP)"
  fi
fi

# Pas d'inscription au back-office : les comptes des instructeurs sont créés par
# un administrateur. Réaffirmé ici pour qu'un réglage fait à la main ne survive
# pas au déploiement suivant.
$KCADM update "realms/$BACK_OFFICE_REALM" \
  -s registrationAllowed=false \
  -s "browserSecurityHeaders.contentSecurityPolicy=frame-src 'self'; frame-ancestors 'self'; object-src 'none';"
echo "→ realm ${BACK_OFFICE_REALM} : inscription fermée"

configure_smtp "$REALM"
configure_smtp "$BACK_OFFICE_REALM"

configure_test_user "$REALM"
configure_test_user "$BACK_OFFICE_REALM"

echo "✅ realm ${REALM} configuré pour ${FRONT_OFFICE_PUBLIC_URL}"
echo "✅ realm ${BACK_OFFICE_REALM} configuré pour ${BACK_OFFICE_PUBLIC_URL}"
