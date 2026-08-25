#!/usr/bin/env bash
#
# Point d'entrée du conteneur Keycloak.
#
# Lance la configuration du realm en tâche de fond, puis Keycloak au premier
# plan. Le conteneur d'initialisation séparé qui faisait ce travail a disparu :
# un conteneur qui s'arrête, même en code 0, est traité comme un échec par les
# hébergeurs qui attendent que la pile soit « prête » (`docker compose up
# --wait`), et toute la pile redescendait avec lui.
#
# Le parcours de configuration attend de lui-même que le serveur réponde, et son
# échec ne compromet pas le démarrage : Keycloak reste debout, l'erreur reste
# dans les journaux.

set -uo pipefail

/opt/keycloak/bin/etape-init.sh &

exec /opt/keycloak/bin/kc.sh start --optimized --import-realm
