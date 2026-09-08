-- Deux observations que personne d'autre ne garde : par quel fournisseur
-- d'identité le compte est apparu, et par lequel il est passé la dernière fois.
-- Keycloak sait à quels fournisseurs un compte est *lié* aujourd'hui, pas par
-- lequel il a commencé — et le lien peut être défait.
--
-- `default 'local'` le temps de l'ajout, retiré juste après : il remplit les
-- lignes déjà présentes, toutes antérieures au branchement de FranceConnect,
-- sans laisser une valeur par défaut qui masquerait plus tard un oubli
-- d'écriture côté application.
ALTER TABLE "utilisateur"
    ADD COLUMN "cree_via" TEXT NOT NULL DEFAULT 'local',
    ADD COLUMN "derniere_connexion_via" TEXT NOT NULL DEFAULT 'local';

ALTER TABLE "utilisateur"
    ALTER COLUMN "cree_via" DROP DEFAULT,
    ALTER COLUMN "derniere_connexion_via" DROP DEFAULT;

-- Le booléen devient l'alias du fournisseur, même vocabulaire que ci-dessus :
-- ajouter ProConnect ne demandera alors plus aucune migration.
--
-- Ajoutée et remplie avant que l'ancienne colonne ne parte, plutôt que
-- remplacée d'un bloc : les sessions ouvertes traversent la migration au lieu
-- d'être fermées par elle.
ALTER TABLE "session" ADD COLUMN "fournisseur_identite" TEXT NOT NULL DEFAULT 'local';

-- L'alias par défaut du realm. Il est configurable
-- (`KEYCLOAK_FRANCECONNECT_ALIAS`), mais une migration ne lit pas
-- l'environnement : un déploiement qui l'aurait renommé doit corriger ici.
UPDATE "session" SET "fournisseur_identite" = 'franceconnect' WHERE "via_france_connect";

ALTER TABLE "session" ALTER COLUMN "fournisseur_identite" DROP DEFAULT;
ALTER TABLE "session" DROP COLUMN "via_france_connect";
