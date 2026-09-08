#!/usr/bin/env bash
#
# Configuration du realm en tâche de fond, puis Keycloak au premier plan.
#
# Le conteneur d'initialisation séparé a disparu : un conteneur qui s'arrête,
# même en code 0, est traité comme un échec par les hébergeurs qui attendent
# `docker compose up --wait`, et toute la pile redescendait avec lui.
#
# Son échec ne compromet pas le démarrage : Keycloak reste debout, l'erreur dans
# les journaux.

set -uo pipefail

/opt/keycloak/bin/etape-init.sh &

exec /opt/keycloak/bin/kc.sh start --optimized --import-realm
