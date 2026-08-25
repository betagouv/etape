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
# Dépendances du monorepo.
#
# Seuls les manifestes sont copiés avant `npm ci` : la couche d'installation
# n'est alors invalidée que lorsqu'une dépendance change, et non à chaque
# modification du code. Chaque espace de travail doit y figurer — `npm ci`
# refuse de résoudre le verrou s'il en manque un, et le dit clairement.
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
# Compilation.
#
# `NODE_ENV` reste non défini : `next build` le positionne lui-même, et le
# forcer ici ferait retomber `next.config.ts` du site sur la mauvaise valeur
# d'API. En production celle-ci vaut `/api`, chemin relatif, parce que le front
# et l'API partagent l'origine derrière nginx.
# ---------------------------------------------------------------------------
FROM deps AS build
WORKDIR /app
COPY . .

RUN npx turbo run build --filter=@etape/site --filter=@etape/simulateur --filter=@etape/api
RUN node scripts/assembler-statique.mjs /srv/static

# ---------------------------------------------------------------------------
# Dépendances d'exécution de l'API, sans les outils de compilation.
#
# Réinstallation complète plutôt qu'un élagage : `npm ci` restaure exactement ce
# que décrit le verrou, là où `npm prune` laisse derrière lui ce qu'il ne sait
# pas rattacher. `--workspace` limite l'arbre à celui de l'API — ni Next, ni
# Vite, ni Keycloakify n'ont à voyager dans l'image finale.
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

# Reprend l'arborescence de l'espace de travail — manifestes compris. Le
# `"type": "module"` d'`apps/api/package.json` n'est pas décoratif : sans lui
# Node lirait le code émis comme du CommonJS et refuserait le premier `import`.
COPY --from=api-deps /app ./
COPY --from=build /app/apps/api/dist ./apps/api/dist

WORKDIR /app/apps/api
USER node
EXPOSE 3002
CMD ["node", "dist/main.js"]

# ---------------------------------------------------------------------------
# Front statique : les deux exports assemblés, servis par nginx.
#
# nginx transmet aussi `/api/` à l'API, ce qui donne au front et à l'API la même
# origine : ni CORS, ni `SameSite=None` sur le cookie de session.
# ---------------------------------------------------------------------------
FROM nginx:1.29-alpine AS web
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /srv/static /usr/share/nginx/html
EXPOSE 80

# ---------------------------------------------------------------------------
# Thème Keycloak, construit à part.
#
# C'est le build le plus fragile de la chaîne : Keycloakify délègue l'empaquetage
# du JAR à Maven, absent de l'image Node. Il faut donc l'installer — avec le JDK
# qu'il entraîne — et le laisser télécharger ses propres dépendances. L'isoler
# dans sa propre étape évite que tout cela pèse sur les images du front et de
# l'API, et qu'un échec de sa part les emporte.
# ---------------------------------------------------------------------------
FROM build AS theme
WORKDIR /app

RUN apk add --no-cache maven

# Sans cache monté sur le dépôt Maven local, volontairement : deux services
# construisent cette cible, et un cache partagé les ferait écrire à deux dans le
# même dossier. Le temps regagné ne vaut pas ce mode de panne.
RUN npx turbo run build --filter=@etape/keycloak-theme

# ---------------------------------------------------------------------------
# Keycloak.
#
# `kc.sh build` est exécuté ici plutôt qu'au démarrage : c'est ce qui autorise
# `start --optimized` côté conteneur, et ce qui fait entrer le thème dans le
# registre des extensions. Les options figées à ce moment-là — la base de
# données, les sondes de santé — ne peuvent plus varier à l'exécution.
# ---------------------------------------------------------------------------
FROM quay.io/keycloak/keycloak:26.7 AS keycloak

COPY --from=theme /app/apps/keycloak-theme/dist_keycloak/etape-keycloak-theme.jar /opt/keycloak/providers/

# Tout fichier de realm déposé ici est importé au premier démarrage. Il décrit le
# poste de développement — URL en `localhost`, secret public — et n'est qu'un
# point de départ : `etape-init.sh` le corrige ensuite pour cet environnement.
COPY keycloak/realms/etape-realm.json /opt/keycloak/data/import/

ENV KC_DB=postgres
ENV KC_HEALTH_ENABLED=true

RUN /opt/keycloak/bin/kc.sh build
