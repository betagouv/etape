#!/usr/bin/env bash
#
# Applique au realm ce qu'un fichier d'import ne peut pas porter.
#
# `keycloak/realms/etape-realm.json` décrit le poste de développement, et lui
# seul : URL en `localhost`, secret de client public, `sslRequired: none`. Ce
# n'est pas une facilité mais une contrainte — **l'import de realm ne substitue
# aucune variable**, ni d'environnement ni de propriété système (vérifié sur
# Keycloak 26.7, cf. `keycloak/realms/README.md`). Tout ce qui varie d'un
# environnement à l'autre passe donc par `kcadm`, après l'import.
#
# Le script est idempotent : il est rejoué à chaque déploiement, y compris sur
# un realm déjà configuré.

set -euo pipefail

KCADM=/opt/keycloak/bin/kcadm.sh
REALM=etape
INTERNE="${KEYCLOAK_INTERNAL_URL:-http://keycloak:8080}"

: "${PUBLIC_URL:?PUBLIC_URL est obligatoire (URL publique du front, sans slash final)}"
: "${KEYCLOAK_ADMIN_PASSWORD:?KEYCLOAK_ADMIN_PASSWORD est obligatoire}"
: "${KEYCLOAK_CLIENT_SECRET:?KEYCLOAK_CLIENT_SECRET est obligatoire}"

# ---------------------------------------------------------------------------
# Attente de Keycloak.
#
# L'API d'administration n'ouvre qu'une fois l'import de realm terminé : tant
# que l'authentification échoue, c'est que le serveur n'est pas prêt. Cinq
# minutes de patience, puis abandon — sans plafond, un Keycloak en échec
# laisserait le conteneur tourner indéfiniment sans que rien ne le signale.
# ---------------------------------------------------------------------------
echo "→ attente de Keycloak sur ${INTERNE}"
for tentative in $(seq 1 100); do
  if $KCADM config credentials --server "$INTERNE" --realm master \
      --user "${KEYCLOAK_ADMIN_USER:-admin}" --password "$KEYCLOAK_ADMIN_PASSWORD" >/dev/null 2>&1; then
    echo "  connecté (tentative ${tentative})"
    break
  fi
  if [ "$tentative" -eq 100 ]; then
    echo "✗ Keycloak injoignable après 5 minutes." >&2
    exit 1
  fi
  sleep 3
done

# ---------------------------------------------------------------------------
# Realm : HTTPS exigé.
#
# Le fichier d'import porte `sslRequired: none`, nécessaire en local où Keycloak
# écoute en clair. Ici, TLS est terminé par le proxy et le réglage doit repasser
# en `EXTERNAL` — les adresses privées restent autorisées en clair, ce qui est
# exactement le cas du réseau interne entre l'API et Keycloak.
# ---------------------------------------------------------------------------
if ! $KCADM get "realms/$REALM" --fields realm >/dev/null 2>&1; then
  echo "✗ le realm ${REALM} n'existe pas." >&2
  echo "  L'import a échoué, ou l'image ne contient pas keycloak/realms/etape-realm.json." >&2
  exit 1
fi

$KCADM update "realms/$REALM" -s sslRequired=EXTERNAL
echo "→ realm ${REALM} : sslRequired=EXTERNAL"

# ---------------------------------------------------------------------------
# Client `etape-api`.
#
# `redirectUris` doit correspondre au caractère près à la `redirect_uri` que
# l'API construit (`${API_BASE_URL}/auth/callback`). `post.logout.redirect.uris`
# n'en est pas déduit : oublié, la déconnexion échoue alors même que la
# connexion fonctionne.
# ---------------------------------------------------------------------------
ID_CLIENT=$($KCADM get clients -r "$REALM" -q clientId=etape-api --fields id --format csv --noquotes)
if [ -z "$ID_CLIENT" ]; then
  echo "✗ client etape-api absent du realm ${REALM} — l'import a-t-il eu lieu ?" >&2
  exit 1
fi

$KCADM update "clients/$ID_CLIENT" -r "$REALM" -f - <<JSON
{
  "secret": "${KEYCLOAK_CLIENT_SECRET}",
  "redirectUris": ["${PUBLIC_URL}/api/auth/callback"],
  "webOrigins": [],
  "attributes": {
    "pkce.code.challenge.method": "S256",
    "post.logout.redirect.uris": "${PUBLIC_URL}/*"
  }
}
JSON
echo "→ client etape-api : secret, redirect_uri et post-logout alignés sur ${PUBLIC_URL}"

# ---------------------------------------------------------------------------
# FranceConnect.
#
# Les identifiants sont facultatifs : sans eux tout le reste fonctionne, seul le
# parcours FranceConnect reste indisponible. La `redirect_uri` à déclarer côté
# FranceConnect est celle du broker, pas celle de l'API.
# ---------------------------------------------------------------------------
# Migration du fournisseur générique vers celui de l'extension INSEE.
#
# `providerId` ne se modifie pas sur une instance existante, et l'import de
# realm est en `IGNORE_EXISTING` : sur un environnement déjà déployé, le
# fichier ne sera jamais relu. Le fournisseur est donc recréé — sans quoi la
# bascule ne prendrait que sur une base neuve, et l'erreur Y030007 persisterait
# là où elle a été constatée.
PROVIDER_ATTENDU=franceconnect-particulier
PROVIDER_ACTUEL=$($KCADM get identity-provider/instances/franceconnect -r "$REALM" \
  --fields providerId --format csv --noquotes 2>/dev/null || true)

if [ -n "$PROVIDER_ACTUEL" ] && [ "$PROVIDER_ACTUEL" != "$PROVIDER_ATTENDU" ]; then
  echo "→ franceconnect : migration de ${PROVIDER_ACTUEL} vers ${PROVIDER_ATTENDU}"
  $KCADM delete identity-provider/instances/franceconnect -r "$REALM"
  PROVIDER_ACTUEL=""
fi

if [ -z "$PROVIDER_ACTUEL" ]; then
  $KCADM create identity-provider/instances -r "$REALM" -f - <<JSON
{
  "alias": "franceconnect",
  "displayName": "FranceConnect",
  "providerId": "${PROVIDER_ATTENDU}",
  "enabled": true,
  "storeToken": false,
  "linkOnly": false,
  "addReadTokenRoleOnCreate": false,
  "trustEmail": false,
  "firstBrokerLoginFlowAlias": "first broker login",
  "config": {
    "fc_environment": "${FRANCECONNECT_ENVIRONNEMENT:-INTEGRATION_STANDARD_V2}",
    "eidas_values": "${FRANCECONNECT_EIDAS:-EIDAS1}",
    "defaultScope": "openid given_name family_name birthdate birthplace birthcountry gender email",
    "clientAuthMethod": "client_secret_post",
    "syncMode": "FORCE"
  }
}
JSON
fi

# Réappliqué à chaque démarrage, et pas seulement à la création : sans cela,
# changer d'environnement FranceConnect n'aurait aucun effet sur un realm déjà
# en place, et la variable donnerait l'illusion d'être prise en compte.
$KCADM update identity-provider/instances/franceconnect -r "$REALM" \
  -s "config.fc_environment=${FRANCECONNECT_ENVIRONNEMENT:-INTEGRATION_STANDARD_V2}" \
  -s "config.eidas_values=${FRANCECONNECT_EIDAS:-EIDAS1}"
echo "→ franceconnect : environnement ${FRANCECONNECT_ENVIRONNEMENT:-INTEGRATION_STANDARD_V2}"

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

# ---------------------------------------------------------------------------
# Serveur d'envoi.
#
# Sans SMTP, `verifyEmail` doit rester désactivé : l'inscription s'arrêterait
# sur un message qui n'arriverait jamais. C'est un pis-aller assumé pour une
# recette — la vérification d'adresse est ce qui rend sûre la liaison d'un
# compte local à une identité FranceConnect (cf. `docs/authentification.md`).
# ---------------------------------------------------------------------------
if [ -n "${SMTP_HOST:-}" ]; then
  $KCADM update "realms/$REALM" -f - <<JSON
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
  echo "→ smtp : configuré, verifyEmail activé"
else
  echo "⚠ smtp : non configuré — verifyEmail reste désactivé."
  echo "  Inscription et « mot de passe oublié » ne sont pas jouables sans lui."
fi

# ---------------------------------------------------------------------------
# Compte de test.
#
# Le fichier de realm en crée un dont le mot de passe est écrit en clair dans un
# dépôt public : le laisser tel quel sur une instance joignable depuis Internet
# reviendrait à publier un accès. Il est donc soit doté d'un mot de passe fourni
# par l'environnement, soit supprimé.
# ---------------------------------------------------------------------------
ID_TEST=$($KCADM get users -r "$REALM" -q username=test@etape.local --fields id --format csv --noquotes)

if [ -n "$ID_TEST" ]; then
  if [ -n "${KEYCLOAK_TEST_USER_PASSWORD:-}" ]; then
    # Le realm porte `passwordHistory(3)` : rejouer le script avec le même mot
    # de passe fait échouer `set-password`. Ce n'est pas une erreur — le compte
    # est déjà dans l'état voulu — et cela ne doit pas interrompre un
    # redéploiement.
    if erreur=$($KCADM set-password -r "$REALM" --userid "$ID_TEST" \
        --new-password "$KEYCLOAK_TEST_USER_PASSWORD" 2>&1); then
      echo "→ compte de test test@etape.local : mot de passe remplacé"
    elif [[ "$erreur" == *invalidPasswordHistoryMessage* ]]; then
      echo "→ compte de test test@etape.local : mot de passe déjà en place"
    else
      echo "✗ compte de test : ${erreur}" >&2
      exit 1
    fi
  else
    $KCADM delete "users/$ID_TEST" -r "$REALM"
    echo "→ compte de test test@etape.local : supprimé"
    echo "  (renseigner KEYCLOAK_TEST_USER_PASSWORD — 12 caractères minimum — pour le conserver)"
  fi
fi

echo "✅ realm ${REALM} configuré pour ${PUBLIC_URL}"
