# Realms Keycloak

Un realm par front, importés au démarrage de Keycloak (`docker compose up` lance
le conteneur avec `--import-realm`) :

- `etape-realm.json` — le front-office : client `etape-api`, identity provider
  FranceConnect, inscription ;
- `etape-back-office-realm.json` — le back-office : client `etape-api`, ni
  FranceConnect ni inscription libre.

Deux realms et non deux clients : la session de Keycloak est commune à tout un
realm, et un compte du front-office se retrouverait connecté au back-office sans
rien saisir. Voir [docs/authentification.md](../../docs/authentification.md).

## Ces fichiers décrivent l'environnement de développement, et lui seul

Les URL qu'ils contiennent sont celles du poste local (`localhost:5173` pour le
front-office, `localhost:5174` pour le back-office), et ils portent
`sslRequired: none`. Rien de tout cela n'a sa place ailleurs qu'en local. Ils ne
portent en revanche **aucun secret** — Keycloak en tire un au sort à l'import, et
`keycloak-init` le remplace par celui du `.env` à la racine — et ne créent aucun
compte : le compte de test vient de `KEYCLOAK_TEST_USER_PASSWORD`, jamais d'un
mot de passe versionné.

Il ne porte pas non plus de `smtpServer`, et laisse donc `verifyEmail` désactivé :
la clé Brevo n'a rien à faire dans un dépôt public. L'envoi est posé après
l'import, et c'est lui qui active la vérification d'adresse — dont dépend la
sûreté de la liaison de comptes FranceConnect.

C'est un choix subi, pas une facilité : **l'import de realm ne substitue aucune
variable.** Ni les variables d'environnement, ni les propriétés système Java.
Vérifié sur Keycloak 26.7 :

| Écriture dans le JSON  | Résultat                               |
| ---------------------- | -------------------------------------- |
| `${env.MA_VAR}`        | conservé littéralement, tel quel       |
| `${env.MA_VAR:defaut}` | vaut `defaut`, la variable est ignorée |
| `${MA_VAR}`            | conservé littéralement, tel quel       |

La deuxième ligne est la plus dangereuse : le fichier _paraît_ configurable et
ne l'est pas. Un `${env.FRANCECONNECT_AUTHORIZATION_URL:https://…integ01…}` aurait
expédié l'URL d'intégration en production sans le moindre avertissement.

Tout ce qui varie d'un environnement à l'autre est donc appliqué **après**
l'import, par `kcadm` — c'est ce que fait le service `keycloak-init` du
`docker-compose.yml` pour les secrets des clients, leurs adresses et les
identifiants FranceConnect. La configuration des
autres environnements suivra la même voie, jamais ce fichier.

## Les modifications du fichier ne sont pas reprises au redémarrage

L'import tourne en stratégie `IGNORE_EXISTING` : si le realm existe déjà, son
fichier est ignoré en silence. Seul ce que `keycloak-init` réapplique (secrets
et adresses des clients) suit sans effort. Un `docker compose restart` après modification
ne produit donc **aucun effet** — piège classique, qui se traduit par de longues
minutes à se demander pourquoi un réglage ne prend pas.

Pour repartir du fichier, il faut détruire le volume :

```bash
docker compose down -v && docker compose up -d
```

## Exporter le realm après l'avoir modifié dans la console

```bash
docker compose exec keycloak /opt/keycloak/bin/kc.sh export \
  --dir /tmp/export --realm etape --users skip

docker compose cp keycloak:/tmp/export/etape-realm.json keycloak/realms/
```

`--users skip` n'est pas un détail : sans lui, l'export embarque les comptes de
test du poste, et le fichier finit par contenir des données personnelles que
personne n'a l'intention de versionner.

Même chose avec `--realm etape-back-office` pour le realm du back-office.

Le secret du client n'est pas exporté, et ne doit pas l'être : c'est
`keycloak-init` qui le pose, depuis `FRONT_OFFICE_KEYCLOAK_CLIENT_SECRET` et
`BACK_OFFICE_KEYCLOAK_CLIENT_SECRET` du `.env` à la racine.
