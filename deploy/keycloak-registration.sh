#!/usr/bin/env bash
#
# Inscription du front-office : l'adresse dans le profil, et les conditions
# générales exigées. Suppose le flow créé par `keycloak-altcha.sh`.
#
# Les attributs d'adresse ne sont pas `required` : Keycloak redemanderait alors à
# chaque compte existant, et à chaque arrivée par FranceConnect, de les remplir
# sur un écran non dessiné. C'est l'écran d'inscription qui les exige.
#
# Les options de `region` sont la liste des régions pilotes : le thème la lit
# dans le profil, Keycloak refuse toute autre valeur non vide. Une valeur vide
# passe : c'est encore l'écran qui l'exige.
#
# Ce script est la seule description du profil : `update users/profile` le
# remplace en entier à chaque démarrage. Un attribut ajouté depuis la console est
# perdu au redémarrage suivant.

set -euo pipefail

KCADM=${KCADM:-/opt/keycloak/bin/kcadm.sh}
REALM=${REALM:-etape}

REGISTRATION_FLOW=etape-registration
TERMS_PROVIDER=registration-terms-and-conditions
# Même place que dans `etape-realm.json` : avant la case ALTCHA.
TERMS_PRIORITY=60

urlencode() {
  echo "${1// /%20}"
}

execution_of() {
  $KCADM get "authentication/flows/$(urlencode "$REGISTRATION_FLOW")/executions" -r "$REALM" \
    --fields id,providerId,priority --format csv --noquotes \
    | { grep -F ",$1," || true; } | cut -d, -f1,3
}

if [ -z "$(execution_of "$TERMS_PROVIDER")" ]; then
  $KCADM create "authentication/flows/$(urlencode "${REGISTRATION_FLOW} registration form")/executions/execution" \
    -r "$REALM" -s "provider=${TERMS_PROVIDER}"
fi

# Sans cette action active, Keycloak vérifie la case mais n'enregistre pas la date
# d'acceptation (`terms_and_conditions`). Pas `defaultAction` : elle ne doit rien
# redemander aux comptes existants.
$KCADM update authentication/required-actions/TERMS_AND_CONDITIONS -r "$REALM" \
  -s enabled=true -s defaultAction=false

TERMS_EXECUTION=$(execution_of "$TERMS_PROVIDER")
$KCADM update "authentication/flows/$(urlencode "$REGISTRATION_FLOW")/executions" -r "$REALM" \
  -b "{\"id\": \"${TERMS_EXECUTION%%,*}\", \"requirement\": \"REQUIRED\", \"priority\": ${TERMS_PRIORITY}}"

# En dernier : si une étape du flow échoue, le profil reste celui d'avant.
$KCADM update users/profile -r "$REALM" -n -f - <<'JSON'
{
  "attributes": [
    {
      "name": "username",
      "displayName": "${username}",
      "validations": {
        "length": { "min": 3, "max": 255 },
        "username-prohibited-characters": {},
        "up-username-not-idn-homograph": {}
      },
      "permissions": { "view": ["admin", "user"], "edit": ["admin", "user"] },
      "multivalued": false
    },
    {
      "name": "email",
      "displayName": "${email}",
      "validations": { "email": {}, "length": { "max": 255 } },
      "required": { "roles": ["user"] },
      "permissions": { "view": ["admin", "user"], "edit": ["admin", "user"] },
      "multivalued": false
    },
    {
      "name": "firstName",
      "displayName": "${firstName}",
      "validations": { "length": { "max": 255 }, "person-name-prohibited-characters": {} },
      "required": { "roles": ["user"] },
      "permissions": { "view": ["admin", "user"], "edit": ["admin", "user"] },
      "multivalued": false
    },
    {
      "name": "lastName",
      "displayName": "${lastName}",
      "validations": { "length": { "max": 255 }, "person-name-prohibited-characters": {} },
      "required": { "roles": ["user"] },
      "permissions": { "view": ["admin", "user"], "edit": ["admin", "user"] },
      "multivalued": false
    },
    {
      "name": "adresse",
      "displayName": "Adresse",
      "validations": { "length": { "max": 255 } },
      "permissions": { "view": ["admin", "user"], "edit": ["admin", "user"] },
      "multivalued": false
    },
    {
      "name": "complement_adresse",
      "displayName": "Complément d'adresse",
      "validations": { "length": { "max": 255 } },
      "permissions": { "view": ["admin", "user"], "edit": ["admin", "user"] },
      "multivalued": false
    },
    {
      "name": "code_postal",
      "displayName": "Code postal",
      "validations": { "pattern": { "pattern": "^[0-9]{5}$" } },
      "permissions": { "view": ["admin", "user"], "edit": ["admin", "user"] },
      "multivalued": false
    },
    {
      "name": "commune",
      "displayName": "Commune",
      "validations": { "length": { "max": 255 } },
      "permissions": { "view": ["admin", "user"], "edit": ["admin", "user"] },
      "multivalued": false
    },
    {
      "name": "code_commune",
      "displayName": "Code commune",
      "validations": { "pattern": { "pattern": "^[0-9][0-9AB][0-9]{3}$" } },
      "permissions": { "view": ["admin", "user"], "edit": ["admin", "user"] },
      "multivalued": false
    },
    {
      "name": "region",
      "displayName": "Région",
      "validations": { "options": { "options": ["75"] } },
      "permissions": { "view": ["admin", "user"], "edit": ["admin", "user"] },
      "multivalued": false
    }
  ],
  "groups": [
    {
      "name": "user-metadata",
      "displayHeader": "User metadata",
      "displayDescription": "Attributes, which refer to user metadata"
    }
  ]
}
JSON

echo "→ ${REALM} — inscription : adresse dans le profil, conditions générales exigées"
