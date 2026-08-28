# syntax=docker/dockerfile:1
#
# Images du déploiement : le front statique servi par nginx, l'API NestJS, et un
# Keycloak porteur du thème ETAPE.
#
# Un seul Dockerfile pour les trois, parce qu'ils partagent la même installation
# de dépendances : le monorepo n'a qu'un `package-lock.json`, et trois contextes
# de build séparés le réinstalleraient trois fois. Les cibles se choisissent
# depuis `docker-compose.prod.yml` (`target:`).
#
#   docker build --target api .
#   docker build --target web .
#   docker build --target keycloak .

# ---------------------------------------------------------------------------
# Dépendances du monorepo. Seuls les manifestes sont copiés avant `npm ci` : la
# couche n'est invalidée qu'au changement d'une dépendance. Chaque espace de
# travail doit y figurer, `npm ci` refusant sinon de résoudre le verrou.
# ---------------------------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/site/package.json apps/site/
COPY apps/simulateur/package.json apps/simulateur/
COPY apps/keycloak-theme/package.json apps/keycloak-theme/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/prettier-config/package.json packages/prettier-config/
COPY packages/ui/package.json packages/ui/

RUN npm ci

# ---------------------------------------------------------------------------
# Compilation. `NODE_ENV` reste non défini : `next build` le positionne lui-même,
# et le forcer ici ferait retomber `next.config.ts` sur la mauvaise URL d'API.
# ---------------------------------------------------------------------------
FROM deps AS build
WORKDIR /app
COPY . .

RUN npx turbo run build --filter=@etape/site --filter=@etape/simulateur --filter=@etape/api
RUN node scripts/assembler-statique.mjs /srv/static

# ---------------------------------------------------------------------------
# Dépendances d'exécution de l'API. Réinstallation plutôt qu'élagage : `npm ci`
# restaure exactement le verrou, là où `npm prune` laisse ce qu'il ne sait pas
# rattacher. `--workspace` tient Next, Vite et Keycloakify hors de l'image.
# ---------------------------------------------------------------------------
FROM deps AS api-deps
WORKDIR /app
RUN npm ci --omit=dev --workspace=@etape/api --include-workspace-root

# ---------------------------------------------------------------------------
# API NestJS.
# ---------------------------------------------------------------------------
FROM node:22-alpine AS api
ENV NODE_ENV=production
WORKDIR /app

# Manifestes compris : le `"type": "module"` d'`apps/api/package.json` n'est pas
# décoratif, sans lui Node lirait le code émis comme du CommonJS.
COPY --from=api-deps /app ./
COPY --from=build /app/apps/api/dist ./apps/api/dist

WORKDIR /app/apps/api
USER node
EXPOSE 3002
CMD ["node", "dist/main.js"]

# ---------------------------------------------------------------------------
# Front statique : les deux exports assemblés, servis par nginx, qui transmet
# aussi `/api/` — d'où une origine commune, ni CORS ni `SameSite=None`.
# ---------------------------------------------------------------------------
FROM nginx:1.29-alpine AS web
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /srv/static /usr/share/nginx/html
EXPOSE 80

# ---------------------------------------------------------------------------
# Proxy du sous-domaine de Keycloak : c'est lui qui porte le domaine `auth.…`,
# et il refuse tout sauf le realm applicatif. Keycloak n'a plus à être joignable
# depuis l'extérieur.
# ---------------------------------------------------------------------------
FROM nginx:1.29-alpine AS auth
COPY deploy/nginx-auth.conf /etc/nginx/conf.d/default.conf
COPY deploy/nginx-auth-proxy.inc /etc/nginx/snippets/keycloak-proxy.inc
EXPOSE 80

# ---------------------------------------------------------------------------
# Thème Keycloak, construit à part : Keycloakify délègue l'empaquetage du JAR à
# Maven, absent de l'image Node. Une étape dédiée évite que le JDK pèse sur les
# images du front et de l'API, et qu'un échec de sa part les emporte.
# ---------------------------------------------------------------------------
FROM build AS theme
WORKDIR /app

RUN apk add --no-cache maven

# Sans cache Maven, volontairement : deux services construisent cette cible, et
# un cache partagé les ferait écrire à deux dans le même dossier.
RUN npx turbo run build --filter=@etape/keycloak-theme

# ---------------------------------------------------------------------------
# Extension FranceConnect (INSEE). Le broker OIDC générique ne suffit pas :
# FranceConnect v2 exige un `nonce` d'au moins 32 caractères alphanumériques là
# où Keycloak en émet 22, et rejette tout en `Y030007`. Voir
# `docs/authentification.md`.
# ---------------------------------------------------------------------------
FROM alpine:3.22 AS franceconnect-extension
# Version et empreinte vont par paire : changer l'une sans l'autre fait échouer
# le build. C'est tout ce qui sépare une extension chargée avec les droits du
# serveur d'un binaire quelconque servi par une réponse détournée.
ARG KEYCLOAK_FRANCECONNECT_VERSION=7.7.0
ARG KEYCLOAK_FRANCECONNECT_SHA256=e6a3853ac6fcf5e55e32cead622612ad03a1df034f4ba6be808f6aa7cf2d8fd7
RUN apk add --no-cache curl && \
    curl -fsSL -o /keycloak-franceconnect.jar \
      "https://github.com/InseeFr/Keycloak-FranceConnect/releases/download/${KEYCLOAK_FRANCECONNECT_VERSION}/keycloak-franceconnect-${KEYCLOAK_FRANCECONNECT_VERSION}.jar" && \
    echo "${KEYCLOAK_FRANCECONNECT_SHA256}  /keycloak-franceconnect.jar" | sha256sum -c -

# ---------------------------------------------------------------------------
# Keycloak. `kc.sh build` est exécuté ici plutôt qu'au démarrage : c'est ce qui
# autorise `start --optimized` et fait entrer le thème dans le registre des
# extensions. Les options figées alors ne varient plus à l'exécution.
# ---------------------------------------------------------------------------
FROM quay.io/keycloak/keycloak:26.7 AS keycloak

COPY --from=theme /app/apps/keycloak-theme/dist_keycloak/etape-keycloak-theme.jar /opt/keycloak/providers/
COPY --from=franceconnect-extension /keycloak-franceconnect.jar /opt/keycloak/providers/
COPY deploy/keycloak-init.sh /opt/keycloak/bin/etape-init.sh
COPY deploy/keycloak-demarrer.sh /opt/keycloak/bin/etape-demarrer.sh

# Importé au premier démarrage. Il décrit le poste de développement — URL en
# `localhost`, secret public — et `etape-init.sh` le corrige ensuite.
COPY keycloak/realms/etape-realm.json /opt/keycloak/data/import/

ENV KC_DB=postgres
ENV KC_HEALTH_ENABLED=true

# La console est retirée de l'image et pas seulement masquée par le proxy : ce
# qui n'est pas construit ne peut pas être servi, quel que soit le routage.
# L'API REST, elle, reste en place — `deploy/keycloak-init.sh` en dépend — et
# c'est `deploy/nginx-auth.conf` qui la met hors de portée.
RUN /opt/keycloak/bin/kc.sh build --features-disabled=admin
