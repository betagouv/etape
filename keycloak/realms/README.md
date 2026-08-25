# Realms Keycloak

`etape-realm.json` est importé au démarrage de Keycloak (`docker compose up`
lance le conteneur avec `--import-realm`). Il décrit le client `etape-api`,
l'identity provider FranceConnect, la politique de mot de passe et la protection
contre le bruteforce. Voir [docs/authentification.md](../../docs/authentification.md).

## Ce fichier décrit l'environnement de développement, et lui seul

Les URL qu'il contient sont celles du poste local (`localhost:3000`,
`localhost:3001`, `localhost:3002`), il porte `sslRequired: none`, il fige le
secret du client `etape-api` à une valeur connue, il désactive `verifyEmail`
faute de serveur SMTP en local, et il crée un compte de test au mot de passe
connu. Rien de tout cela n'a sa place ailleurs qu'en local — `verifyEmail` en
particulier, dont dépend la sûreté de la liaison de comptes FranceConnect.

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
`docker-compose.yml` pour les identifiants FranceConnect. La configuration des
autres environnements suivra la même voie, jamais ce fichier.

## Les modifications du fichier ne sont pas reprises au redémarrage

L'import tourne en stratégie `IGNORE_EXISTING` : si le realm `etape` existe déjà,
le fichier est ignoré en silence. Un `docker compose restart` après modification
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
personne n'a l'intention de versionner. Il faudra en revanche remettre à la main
le compte de test défini dans `users`, que cette option écarte aussi.

Le secret du client n'est pas exporté — il est régénéré à chaque import et se
récupère dans la console (**Clients → etape-api → Credentials**) pour alimenter
`KEYCLOAK_CLIENT_SECRET`.
