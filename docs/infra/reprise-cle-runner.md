# Reprise après perte de la clé SSH du runner

Procédure de reconstruction complète, environ 10 minutes. À dérouler quand l'un de ces
signaux apparaît : le workflow « Preview » échoue à l'étape rsync/SSH avec `exit 255` en
1 seconde, le run matinal « Preview GC » passe au rouge, ou un SSH manuel vers `deploy@`
demande un mot de passe.

Contexte : la paire de clés vit sur DEBFCOETAPOPS01 (compte `github-runner`) ; sa moitié
publique est la « serrure » posée sur les machines cibles dans l'`authorized_keys` du compte
`deploy`. Perte déjà survenue une fois (purge du home du runner entre le 2 et le 7/09).

## Étape 1 : diagnostic, sur DEBFCOETAPOPS01

Chemin : VPN Cegedim → Windows App (RDP) sur le bastion `PEBFCOADMCLI01` → PowerShell →
`ssh esanchez@debfcoetapops01.fco.cegedim.cloud` → puis :

```bash
sudo su - github-runner
ls -la .ssh/
```

Si `id_ed25519` et `id_ed25519.pub` sont présents, la clé existe encore : passe directement à
l'étape 4 (le problème est ailleurs, probablement côté FRT01). S'ils sont absents, continue.

## Étape 2 : régénérer la paire, sur DEBFCOETAPOPS01 (compte `github-runner`)

```bash
ssh-keygen -t ed25519 -N "" -f .ssh/id_ed25519
cat .ssh/id_ed25519.pub
```

Copie la ligne complète affichée (`ssh-ed25519 … github-runner@debfcoetapops01`).

## Étape 3 : reposer la serrure, sur DEBFCOETAPFRT01

Depuis le bastion : `ssh esanchez@debfcoetapfrt01.fco.cegedim.cloud`, puis :

```bash
sudo -i
echo "COLLER_ICI_LA_LIGNE_COMPLETE_DU_CAT" > /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys && chown deploy:deploy /home/deploy/.ssh/authorized_keys
exit
```

(Si le dossier `.ssh` de deploy manque aussi :
`install -d -m 700 -o deploy -g deploy /home/deploy/.ssh` avant le `echo`.)

Même geste sur DEBFCOETAPAPP01 le jour où la machine back est enrôlée.

## Étape 4 : valider, sur DEBFCOETAPOPS01 (compte `github-runner`)

```bash
ssh -o BatchMode=yes deploy@debfcoetapfrt01.fco.cegedim.cloud 'sudo -n true && echo "tout est pret"'
```

Si une question d'empreinte apparaît (le known_hosts a pu être purgé aussi), relance la même
commande sans `-o BatchMode=yes`, réponds `yes`, puis revalide avec BatchMode. Attendu :
`tout est pret`.

## Étape 5 : mettre le dépôt à jour, sur ton Mac

Les playbooks Ansible ne contiennent pas la clé : ils la lisent sur OPS01 à l'exécution
(`infra/ansible/group_vars/all.yml`), donc rien à changer de ce côté. Un seul endroit la cite,
pour la voie manuelle : `docs/infra/installation-previews.md` (étape 1 : la commande `echo` et
l'empreinte attendue). Remplace l'ancienne ligne par la nouvelle, puis commit + push.
(Demander à Claude de le faire en lui collant la nouvelle clé publique est le plus rapide.)

Variante sans passer par le bastion pour l'étape 3 : si la clé d'administration Cegedim te
donne encore accès à FRT01, relancer le workflow « Setup VM » sur `front` repose la nouvelle
clé (elle est ajoutée à l'`authorized_keys`, les autres lignes sont conservées).

## Étape 6 : confirmer en conditions réelles

Relancer le job « Déployer la preview » sur une PR ouverte (bouton « Re-run jobs ») : il doit
passer l'étape rsync. Fin de l'incident.

## Éviter la récidive

- Question posée à Cegedim : qu'est-ce qui a purgé `/home/github-runner`, et exclure `.ssh`
  de tout nettoyage automatique.
- Détection automatique déjà en place : le run planifié « Preview GC » (chaque matin de
  semaine) échoue dès que la clé saute ; activer les notifications GitHub d'échec de workflow
  suffit comme alarme, aucune vérification manuelle périodique n'est nécessaire.
