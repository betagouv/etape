# Mise en service des previews : installation et configuration nginx

Objectif final : à chaque PR, une preview accessible sur `https://pr-<n>.dev.certifpro.cegedim.cloud/`,
mise à jour à chaque push, détruite à la fermeture de la PR.

**Montage confirmé le 7/09** (curl sur `pr-0.dev.certifpro.cegedim.cloud`) : le DNS wildcard et le
443 public sont déjà en place, et le TLS est terminé sur le point d'entrée Cegedim (BigIP,
certificat wildcard Let's Encrypt porté et renouvelé par eux). La VM front reçoit donc du trafic
en clair : la configuration à installer est **`infra/nginx/previews.conf`** (port 80, aucun
certificat sur la VM). Aucune étape certificat côté ETAPE.

## État et qui fait quoi

| Élément                                         | Qui                      | État                                                   |
| ----------------------------------------------- | ------------------------ | ------------------------------------------------------ |
| Certificat wildcard, DNS `pr-*`, 443 public     | Cegedim (BigIP)          | En place (constaté 7/09)                               |
| Compte `deploy` + sudo sur FRT01                | Cegedim / repris en main | Fait, validé le 7/09                                   |
| Clé SSH du runner (OPS01 → FRT01)               | ETAPE                    | Fait le 7/09 (clé régénérée)                           |
| nginx : installation, vhost, basic auth         | ETAPE (ce document)      | À faire                                                |
| Pool BigIP → FRT01:80, moniteur sur `/healthz`  | Cegedim                  | À vérifier après l'installation nginx                  |
| En-tête `X-Forwarded-Proto` posé par le BigIP ? | Cegedim                  | Question en suspens (conditionne la redirection HTTPS) |

La voie automatisée équivalente à ce document est le playbook `infra/ansible/front.yml`
(workflow « Setup VM » ou lancement manuel depuis OPS01) ; ce qui suit est la voie manuelle.

## Comment se connecter

VPN Cegedim → RDP (3389) sur le bastion `PEBFCOADMCLI01` → SSH vers la machine cible avec ton
compte Cegedim : `debfcoetapfrt01.fco.cegedim.cloud` (front, root disponible) ou
`debfcoetapops01.fco.cegedim.cloud` (runner). Les commandes évitent le caractère `~` (pénible
via le bastion) : chemins absolus ou `$HOME`.

---

## Sur DEBFCOETAPFRT01 (VM front), en root (`sudo -i`)

### 1. Utilisateur de dépôt et clé du runner (fait le 7/09, à vérifier)

```bash
id deploy && ssh-keygen -l -f /home/deploy/.ssh/authorized_keys
```

Attendu : le compte existe et l'empreinte affichée est
`SHA256:yH0ZvrS4tqVeRngKGo1vlRre3pYmCD40YVelwGV4FwI` (clé du 7/09). Si besoin de reposer :

```bash
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHoH5GiaNbrct6U6k0cxzK1HpGnAQo1JPN9MjmEZjbBb github-runner@debfcoetapops01" > /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys && chown deploy:deploy /home/deploy/.ssh/authorized_keys
mkdir -p /srv/previews && chown deploy:deploy /srv/previews
```

### 2. Paquets

```bash
apt update && apt install -y nginx rsync apache2-utils
```

Si `apt` échoue (dépôts Debian non joignables), demander l'ouverture à Cegedim.

### 3. Installer la configuration nginx

Copier le contenu de **`infra/nginx/previews.conf`** (dépôt) :

```bash
nano /etc/nginx/sites-available/previews.conf     # coller le contenu du fichier du dépôt
ln -sf /etc/nginx/sites-available/previews.conf /etc/nginx/sites-enabled/previews.conf
rm -f /etc/nginx/sites-enabled/default            # sinon nginx -t échoue (default_server en double)
```

### 4. Basic auth (obligatoire : le 443 public est déjà ouvert)

La conf exige le fichier `/etc/nginx/previews.htpasswd` (le bloc auth est actif d'office, rien
à décommenter). Le créer **avant** de recharger nginx, sinon tout accès distant répond 500 :

```bash
htpasswd -c -B /etc/nginx/previews.htpasswd etape   # mot de passe partagé équipe
chown root:www-data /etc/nginx/previews.htpasswd && chmod 640 /etc/nginx/previews.htpasswd
```

Le `satisfy any` + `allow 127.0.0.1` de la conf laisse passer le smoke test du workflow sans
identifiants ; tout accès distant les exige. (Par le playbook, le mot de passe vient du secret
GitHub `PREVIEW_BASIC_AUTH_PASSWORD`.)

### 5. Activer et tester sur place

```bash
nginx -t && systemctl reload nginx && systemctl enable nginx

mkdir -p /srv/previews/pr-0 && echo '<html>ok</html>' > /srv/previews/pr-0/index.html
chown -R deploy:deploy /srv/previews/pr-0
curl -s -o /dev/null -w '%{http_code}\n' -H 'Host: pr-0.dev.certifpro.cegedim.cloud' http://localhost/    # 200 (localhost exempté d'auth)
curl -s -o /dev/null -w '%{http_code}\n' -H 'Host: pr-999.dev.certifpro.cegedim.cloud' http://localhost/  # 404
curl -s http://localhost/healthz    # ok  (sonde pour le moniteur du pool BigIP, sans Host)
```

Garde `pr-0` en place pour l'étape 7, supprime-le ensuite (`rm -rf /srv/previews/pr-0`).

---

## Sur DEBFCOETAPOPS01 (runner), sous `github-runner` (fait le 7/09, à revérifier au besoin)

```bash
ssh -o BatchMode=yes deploy@debfcoetapfrt01.fco.cegedim.cloud 'sudo -n true && echo OK'
```

Attendu : `OK`. La clé (régénérée le 7/09 après l'effacement du home) et le known_hosts sont en
place. ⚠️ Quelque chose a purgé `/home/github-runner` entre le 2 et le 7/09 : si ce test se met
à demander un mot de passe, la clé a encore sauté (voir Dépannage).

---

## Validation de bout en bout

1. Depuis l'extérieur (ton Mac, hors VPN) : `curl -s -o /dev/null -w '%{http_code}\n' -u etape https://pr-0.dev.certifpro.cegedim.cloud/`.
   Attendu : `200`. Si la page de maintenance Cegedim (503, `Server: BigIP`) persiste alors que
   nginx tourne, le pool du BigIP ne pointe pas vers FRT01:80, ou son moniteur de santé
   n'obtient pas de 200 : demander à Cegedim de brancher le pool sur FRT01:80 et de pointer le
   moniteur sur `http://<ip FRT01>/healthz`.
2. Sans identifiants, la même URL doit répondre `401`.
3. Relancer le workflow depuis une PR ouverte : le job « Déployer la preview » va au bout, l'URL
   apparaît en commentaire, et `https://pr-<n>.dev.certifpro.cegedim.cloud/` s'ouvre dans le
   navigateur (identifiants basic auth). Fermer la PR détruit le dossier.

## Dépannage express

| Symptôme                                               | Cause probable                                                                                                                  |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Workflow : `exit 255` en 1 s à l'étape rsync/SSH       | Clé du runner absente (home OPS01 purgé : regénérer, reposer sur FRT01) ou empreinte non enregistrée                            |
| Demande de mot de passe SSH `deploy@…`                 | Clé absente ou abîmée dans `authorized_keys`, ou permissions (700 sur `.ssh`, 600 sur le fichier, propriétaire `deploy`)        |
| `sudo: a password is required`                         | sudo de `deploy` pas en NOPASSWD (`/etc/sudoers.d/`)                                                                            |
| `Connection refused` port 22 soudain                   | Bannissement temporaire (fail2ban) après échecs d'authentification : attendre 10 min                                            |
| `nginx -t` échoue sur `default_server`                 | Site par défaut non retiré (étape 3)                                                                                            |
| 503 page Cegedim depuis l'extérieur, nginx OK en local | Pool BigIP pas branché sur FRT01:80, ou moniteur du pool qui ne reçoit pas 200 (le pointer sur `/healthz`) : demander à Cegedim |
| 500 sur la preview à distance                          | `/etc/nginx/previews.htpasswd` absent ou illisible par `www-data` (étape 4)                                                     |
| 401 sur la preview                                     | Normal à distance : basic auth (`etape` + mot de passe)                                                                         |
| 404 sur `/simulateur/_next/…`                          | `basePath` cassé au build ; `scripts/assemble-static.mjs` refuse normalement de déployer dans ce cas                            |
| 404 sur toute la preview                               | Dossier `/srv/previews/pr-<n>/` absent : le déploiement n'a pas eu lieu                                                         |

## Ce qui a déjà été vérifié

La configuration a été exécutée telle quelle contre l'assemblage réel des deux applications :
200 sur `/`, 308 relative `/simulateur` → `/simulateur/`, 404 servie par la bonne app de chaque
côté, `X-Robots-Tag: noindex` partout, cache immutable sur `_next/static`, 404 pour hostname
inconnu ou preview absente, basic auth (401 distant sans identifiants ou avec un mauvais mot de
passe, 200 avec, 200 localhost sans, ce qui garantit le smoke test du workflow), 200 sur
`/healthz` sans Host, et 301 vers `https://` quand le proxy annonce `X-Forwarded-Proto: http`.
Sur un nginx macOS, le hash bcrypt du htpasswd donne « password mismatch » (le `crypt()` du
système ne le supporte pas) ; Debian le supporte, c'est le format retenu.
