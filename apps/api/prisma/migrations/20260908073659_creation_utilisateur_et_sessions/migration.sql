-- CreateTable
CREATE TABLE "utilisateur" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "keycloak_sub" TEXT NOT NULL,
    "email" TEXT,
    "prenom" TEXT,
    "nom" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "utilisateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "via_france_connect" BOOLEAN NOT NULL,
    "claims" JSONB NOT NULL,
    "id_token" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_connexion" (
    "id" UUID NOT NULL,
    "state" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "code_verifier" TEXT NOT NULL,
    "return_to" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "transaction_connexion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateur_keycloak_sub_key" ON "utilisateur"("keycloak_sub");

-- CreateIndex
CREATE INDEX "session_expires_at_idx" ON "session"("expires_at");

-- CreateIndex
CREATE INDEX "session_utilisateur_id_idx" ON "session"("utilisateur_id");

-- CreateIndex
CREATE INDEX "transaction_connexion_expires_at_idx" ON "transaction_connexion"("expires_at");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
