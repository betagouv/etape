# syntax=docker/dockerfile:1
#
# Images du déploiement, en un seul fichier : elles partagent la même
# installation de dépendances, et des contextes séparés la referaient chaque
# fois. Cibles choisies depuis `docker-compose.prod.yml` (`target:`) :
#
#   web  site et fronts   api   NestJS
#   auth proxy Keycloak   keycloak  IAM + thème ETAPE

# Seuls les manifestes avant `npm ci` : la couche n'est invalidée qu'au
# changement d'une dépendance. Chaque espace de travail doit y figurer.
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/site/package.json apps/site/
COPY apps/simulateur/package.json apps/simulateur/
COPY apps/front-office/package.json apps/front-office/
COPY apps/back-office/package.json apps/back-office/
COPY apps/keycloak-theme/package.json apps/keycloak-theme/
COPY packages/api-contract/package.json packages/api-contract/
COPY packages/api-client/package.json packages/api-client/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/prettier-config/package.json packages/prettier-config/
COPY packages/ui/package.json packages/ui/

RUN npm ci

FROM deps AS build
WORKDIR /app
COPY . .

# `/api` relatif : chaque front relaie lui-même `/api/` vers l'API, sur sa propre
# origine. Vite fige la valeur dans le bundle.
RUN VITE_API_BASE_URL=/api npx turbo run build \
      --filter=@etape/site --filter=@etape/simulateur \
      --filter=@etape/front-office --filter=@etape/back-office \
      --filter=@etape/api
RUN node scripts/assemble-static.mjs /srv/static

# Réinstallation plutôt qu'élagage : `npm ci` restaure exactement le verrou, là
# où `npm prune` laisse ce qu'il ne sait pas rattacher.
FROM deps AS api-deps
WORKDIR /app
RUN npm ci --omit=dev --workspace=@etape/api --include-workspace-root

FROM node:22-alpine AS api
ENV NODE_ENV=production
WORKDIR /app

# Manifestes compris : sans le `"type": "module"` d'`apps/api/package.json`, Node
# lirait le code émis comme du CommonJS.
COPY --from=api-deps /app ./
COPY --from=build /app/apps/api/dist ./apps/api/dist

COPY apps/api/prisma ./apps/api/prisma
COPY apps/api/prisma.config.ts ./apps/api/
COPY --chmod=0755 deploy/api-start.sh /usr/local/bin/etape-api-start.sh

WORKDIR /app/apps/api
USER node
EXPOSE 3002
CMD ["/usr/local/bin/etape-api-start.sh"]

# Le site et les deux fronts, chacun sur son nom d'hôte. Chaque front relaie
# aussi son propre `/api/` vers l'API — une origine par front.
FROM nginx:1.29-alpine AS web
# Seuls les `${ETAPE_…}` du gabarit sont substitués : `$host` et les autres
# variables de nginx restent intactes.
ENV NGINX_ENVSUBST_FILTER=^ETAPE_
COPY --chmod=0755 deploy/nginx-hostnames.envsh /docker-entrypoint.d/05-etape-hostnames.envsh
COPY deploy/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY deploy/nginx-front.inc /etc/nginx/snippets/front.inc
COPY deploy/nginx-front-headers.inc /etc/nginx/snippets/front-headers.inc
COPY --from=build /srv/static /usr/share/nginx/html
COPY --from=build /app/apps/front-office/dist /usr/share/nginx/front-office
COPY --from=build /app/apps/back-office/dist /usr/share/nginx/back-office
EXPOSE 80

# Porte le domaine `auth.…` à la place de Keycloak, et refuse tout sauf le realm
# applicatif.
FROM nginx:1.29-alpine AS auth
COPY deploy/nginx-auth.conf /etc/nginx/conf.d/default.conf
COPY deploy/nginx-auth-proxy.inc /etc/nginx/snippets/keycloak-proxy.inc
EXPOSE 80

# Keycloakify délègue l'empaquetage du JAR à Maven, absent de l'image Node. Une
# étape dédiée évite que le JDK pèse sur les images du front et de l'API.
FROM build AS theme
WORKDIR /app

RUN apk add --no-cache maven

# Sans cache Maven, volontairement : deux services construisent cette cible, et
# un cache partagé les ferait écrire à deux dans le même dossier.
RUN npx turbo run build --filter=@etape/keycloak-theme

# Extension FranceConnect (INSEE). Le broker OIDC générique ne suffit pas :
# FranceConnect v2 exige un `nonce` d'au moins 32 caractères là où Keycloak en
# émet 22, et rejette tout en `Y030007`.
FROM alpine:3.22 AS franceconnect-extension
# Version et empreinte vont par paire. C'est tout ce qui sépare une extension
# chargée avec les droits du serveur d'un binaire servi par une réponse
# détournée.
ARG KEYCLOAK_FRANCECONNECT_VERSION=7.7.0
ARG KEYCLOAK_FRANCECONNECT_SHA256=e6a3853ac6fcf5e55e32cead622612ad03a1df034f4ba6be808f6aa7cf2d8fd7
RUN apk add --no-cache curl && \
    curl -fsSL -o /keycloak-franceconnect.jar \
      "https://github.com/InseeFr/Keycloak-FranceConnect/releases/download/${KEYCLOAK_FRANCECONNECT_VERSION}/keycloak-franceconnect-${KEYCLOAK_FRANCECONNECT_VERSION}.jar" && \
    echo "${KEYCLOAK_FRANCECONNECT_SHA256}  /keycloak-franceconnect.jar" | sha256sum -c -

# `kc.sh build` ici plutôt qu'au démarrage : c'est ce qui autorise
# `start --optimized`. Les options figées alors ne varient plus à l'exécution.
FROM quay.io/keycloak/keycloak:26.7 AS keycloak

COPY --from=theme /app/apps/keycloak-theme/dist_keycloak/etape-keycloak-theme.jar /opt/keycloak/providers/
COPY --from=franceconnect-extension /keycloak-franceconnect.jar /opt/keycloak/providers/
COPY deploy/keycloak-init.sh /opt/keycloak/bin/etape-init.sh
COPY deploy/keycloak-start.sh /opt/keycloak/bin/etape-keycloak-start.sh

# Importés au premier démarrage, un realm par front. Ils décrivent le poste de
# développement — URL en `localhost`, secrets publics — et `etape-init.sh` les
# corrige ensuite.
COPY keycloak/realms/etape-realm.json keycloak/realms/etape-back-office-realm.json /opt/keycloak/data/import/

ENV KC_DB=postgres
ENV KC_HEALTH_ENABLED=true

# La console est retirée et pas seulement masquée par le proxy : ce qui n'est pas
# construit ne peut pas être servi, quel que soit le routage. L'API REST reste,
# `keycloak-init.sh` en dépend ; c'est `nginx-auth.conf` qui la met hors portée.
RUN /opt/keycloak/bin/kc.sh build --features-disabled=admin
