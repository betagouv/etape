-- Un realm Keycloak par front : un compte est identifié par son realm et son
-- `sub`, une session par le front sur lequel elle a été ouverte.
--
-- Les lignes existantes viennent toutes du seul realm d'avant, `etape`, celui
-- du front-office. La valeur par défaut ne sert qu'à les reprendre, puis elle
-- est retirée : toute nouvelle ligne doit dire d'où elle vient.

-- AlterTable
ALTER TABLE "account" ADD COLUMN "keycloak_realm" TEXT NOT NULL DEFAULT 'etape';
ALTER TABLE "account" ALTER COLUMN "keycloak_realm" DROP DEFAULT;

-- AlterTable
ALTER TABLE "session" ADD COLUMN "front" TEXT NOT NULL DEFAULT 'front-office';
ALTER TABLE "session" ALTER COLUMN "front" DROP DEFAULT;

-- DropIndex
DROP INDEX "account_keycloak_sub_key";

-- CreateIndex
CREATE UNIQUE INDEX "account_keycloak_realm_keycloak_sub_key" ON "account"("keycloak_realm", "keycloak_sub");
