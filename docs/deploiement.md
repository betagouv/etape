# Déploiement

Environnement de recette, sur Coolify : <https://etape.beta.ordesoft.com>.

Tout part de [`docker-compose.prod.yml`](../docker-compose.prod.yml), qui
construit ses images depuis le [`Dockerfile`](../Dockerfile) du dépôt. Rien à
préparer sur la machine : Coolify clone, construit, démarre.

## Ce qui tourne

| Service       | Rôle                                       | Exposé           |
| ------------- | ------------------------------------------ | ---------------- |
| `web`         | nginx : exports statiques + `/api/` → API  | domaine du site  |
| `api`         | NestJS, client OIDC confidentiel           | non              |
| `auth`        | nginx : filtre l'administration → Keycloak | son sous-domaine |
| `keycloak`    | IAM, broker FranceConnect, thème ETAPE     | non              |
| `keycloak-db` | PostgreSQL de Keycloak                     | non              |

Deux origines, et c'est voulu :

**Le front et l'API partagent la leur**, derrière nginx. Pas de CORS, pas de
`SameSite=None` : le cookie de session reste en `Lax`, et le préfixe `/api` est
porté par l'application elle-même plutôt que réécrit par le proxy — les chemins
vus par Nest sont ceux vus par le navigateur, donc la `redirect_uri` déclarée
dans Keycloak reste valable des deux côtés.

**Keycloak a la sienne.** Ni le même domaine ni un préfixe de chemin : l'adresse
du broker est celle que FranceConnect met en liste blanche, et la faire changer
demande de repasser par le portail partenaires. Sur un sous-domaine dédié, elle
survit à un déménagement du front comme à un changement d'hébergeur.

## Configurer Coolify

1. Nouvelle ressource **Docker Compose**, dépôt `betagouv/etape`, branche
   `feat/franceconnect`.
2. **Docker Compose Location** : `/docker-compose.prod.yml`.
3. Domaines, sur les deux seuls services exposés :
   - `web` → `https://etape.beta.ordesoft.com`
   - `auth` → `https://auth.etape.beta.ordesoft.com` (port 80)

   Le sous-domaine va bien sur **`auth`**, et non sur `keycloak` : c'est le
   proxy qui refuse l'administration. Sur une pile déjà déployée, c'est un
   domaine à déplacer d'un service à l'autre. `keycloak` n'expose plus aucun
   port, ce qui rend l'erreur visible tout de suite plutôt que silencieuse.

4. Variables d'environnement : voir ci-dessous.
5. Déployer.

Les cinq conteneurs doivent rester `Up`. Keycloak configure son realm
lui-même au démarrage, en tâche de fond : les lignes préfixées `→` puis
`✅ realm etape configuré` apparaissent dans ses journaux quelques secondes
après le démarrage. Aucun conteneur ne doit s'arrêter — un conteneur sorti,
même en code 0, fait échouer le `docker compose up --wait` de l'hébergeur et
emporte toute la pile.

## Variables d'environnement

Modèle complet et commenté : [`deploy/.env.example`](../deploy/.env.example).

| Variable                      | Obligatoire | Rôle                                                      |
| ----------------------------- | ----------- | --------------------------------------------------------- |
| `PUBLIC_URL`                  | oui         | `https://etape.beta.ordesoft.com`, sans slash final       |
| `KEYCLOAK_PUBLIC_URL`         | oui         | `https://auth.etape.beta.ordesoft.com`, sans slash final  |
| `KEYCLOAK_ADMIN_USER`         | non         | `admin` par défaut                                        |
| `KEYCLOAK_ADMIN_PASSWORD`     | oui         | Administration de Keycloak (`kcadm`)                      |
| `KEYCLOAK_DB_PASSWORD`        | oui         | Base de Keycloak                                          |
| `KEYCLOAK_CLIENT_SECRET`      | oui         | Secret du client `etape-api`, partagé API ↔ Keycloak      |
| `FRANCECONNECT_CLIENT_ID`     | non         | Identifiant du client FranceConnect                       |
| `FRANCECONNECT_CLIENT_SECRET` | non         | Secret du client FranceConnect                            |
| `KEYCLOAK_TEST_USER_PASSWORD` | non         | Conserve `test@etape.local` avec ce mot de passe          |
| `SMTP_*`                      | non         | Serveur d'envoi ; sans lui, pas de vérification d'adresse |

Trois pièges tiennent au moment où ces valeurs sont lues :

- `KEYCLOAK_ADMIN_PASSWORD` ne crée le compte qu'au **tout premier** démarrage.
  Le modifier ensuite n'a aucun effet — il faut passer par la console.
- `KEYCLOAK_DB_PASSWORD` est figé quand PostgreSQL initialise son volume. Le
  changer plus tard empêche Keycloak de se connecter, sans que rien n'indique
  pourquoi.
- `KEYCLOAK_CLIENT_SECRET`, à l'inverse, est réappliqué à chaque démarrage de
  Keycloak : c'est la seule des trois qui se corrige en redéployant.

`KEYCLOAK_TEST_USER_PASSWORD` mérite un mot. Le fichier de realm crée
`test@etape.local` avec un mot de passe écrit en clair dans un dépôt public :
laissé tel quel sur une instance joignable depuis Internet, c'est un accès
publié. Sans cette variable, le compte est donc **supprimé** au déploiement ;
avec elle (12 caractères minimum, politique du realm), il est conservé et
reçoit ce mot de passe-là.

## FranceConnect

Les identifiants viennent du portail partenaires, environnement d'intégration.
Renseignés dans Coolify, ils sont posés sur l'identity provider au démarrage
de Keycloak — jamais dans le fichier de realm, qui est versionné.

Les URL à déclarer côté FranceConnect sont celles du **broker**, pas celles de
l'API :

```
redirect_uri       https://auth.etape.beta.ordesoft.com/realms/etape/broker/franceconnect/endpoint
post_logout_uri    https://auth.etape.beta.ordesoft.com/realms/etape/broker/franceconnect/endpoint/logout_response
```

C'est tout l'intérêt du brokerage : FranceConnect ne voit qu'une adresse, fixe
par environnement, là où des URL de preview mouvantes seraient impossibles à
mettre en liste blanche.

Les URL d'intégration présentes dans le fichier de realm (`fcp-low.integ01`)
sont à confronter au portail, qui fait foi.

## Vérifier après déploiement

```bash
# Le front et l'API répondent (401 sans cookie, c'est la bonne réponse)
curl -sI https://etape.beta.ordesoft.com/ | head -1
curl -s -o /dev/null -w '%{http_code}\n' https://etape.beta.ordesoft.com/api/auth/session

# Keycloak annonce le bon émetteur — s'il annonce autre chose, l'API refusera
# l'échange de jetons
curl -s https://auth.etape.beta.ordesoft.com/realms/etape/.well-known/openid-configuration \
  | grep -o '"issuer":"[^"]*"'

# L'administration n'est pas joignable : les trois doivent répondre 404.
# Un 200 ou un 401 ici signale un sous-domaine encore branché sur `keycloak`.
for chemin in /admin/master/console/ /admin/realms /realms/master/protocol/openid-connect/token; do
  printf '%s -> ' "$chemin"
  curl -s -o /dev/null -w '%{http_code}\n' "https://auth.etape.beta.ordesoft.com$chemin"
done
```

Puis, dans le navigateur : « Se connecter » dans l'en-tête du site part vers
Keycloak, et le retour dépose sur l'accueil.

Si l'API répond « Le fournisseur d'identité est injoignable », c'est qu'elle
n'arrive pas à joindre l'URL publique de Keycloak depuis l'intérieur du réseau
Docker : certains hôtes ne routent pas vers eux-mêmes une requête adressée à
leur propre adresse publique. `docker-compose.prod.yml` porte le correctif en
commentaire, sur le service `api` (`extra_hosts` vers `host-gateway`).

## Limites connues de cet environnement

- **Les sessions vivent en mémoire** (`InMemorySessionStore`) : un redéploiement
  déconnecte tout le monde, et une seconde instance d'`api` déconnecterait une
  requête sur deux. Suffisant pour une recette, à remplacer avant toute mise en
  production — c'est déjà au programme dans
  [`docs/authentification.md`](authentification.md).
- **Sans `SMTP_*`, `verifyEmail` reste désactivé** : ni inscription ni « mot de
  passe oublié ». Or c'est la vérification d'adresse qui rend sûre la liaison
  d'un compte local à une identité FranceConnect. À régler avant d'ouvrir
  l'inscription à qui que ce soit.
- **L'administration de Keycloak ne passe plus par le navigateur.** La console
  est retirée de l'image (`--features-disabled=admin`) et `auth` refuse `/admin`
  ainsi que `/realms/master` : ni la console ni l'API qui va avec ne sont
  joignables depuis Internet. Ce qui reste public, c'est le realm `etape` —
  écrans de connexion, points OIDC, endpoint du broker.

  Pour administrer, depuis la machine :

  ```bash
  docker exec -it <conteneur-keycloak> /opt/keycloak/bin/kcadm.sh \
    config credentials --server http://127.0.0.1:8080 --realm master \
    --user "$KEYCLOAK_ADMIN_USER" --password "$KEYCLOAK_ADMIN_PASSWORD"
  docker exec -it <conteneur-keycloak> /opt/keycloak/bin/kcadm.sh get realms/etape
  ```

  Le mot de passe administrateur reste à choisir sérieusement : `/realms/master`
  n'est refusé que par le proxy, et la protection contre la force brute posée
  par `deploy/keycloak-init.sh` ralentit sans interdire.
