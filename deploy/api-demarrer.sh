#!/bin/sh
# Migrations puis service, dans le même conteneur. Pas de conteneur
# d'initialisation séparé : un conteneur qui s'arrête est compté comme un échec
# par les hébergeurs qui attendent `docker compose up --wait` — même raison que
# `keycloak-demarrer.sh`.
set -e

# `deploy` et non `dev` : il n'applique que des migrations déjà écrites et
# versionnées, n'en génère aucune, et ne touche à rien si tout est déjà appliqué.
# Il prend un verrou, deux instances qui démarrent ensemble ne s'y marchent pas
# dessus.
#
# Chemin explicite : les binaires des espaces de travail sont remontés à la
# racine de l'installation, hors du `WORKDIR` de l'API.
/app/node_modules/.bin/prisma migrate deploy

# `exec` : Node prend la place du script et reçoit lui-même le SIGTERM de
# l'arrêt, au lieu de le laisser à un shell qui ne le transmettrait pas.
exec node dist/main.js
