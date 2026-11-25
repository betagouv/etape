-- CreateEnum
CREATE TYPE "RepertoireCertification" AS ENUM ('RNCP', 'RS');

-- CreateEnum
CREATE TYPE "StatutCertification" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "certification" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "numero_fiche" TEXT NOT NULL,
    "repertoire" "RepertoireCertification" NOT NULL,
    "intitule" TEXT NOT NULL,
    "abrege" TEXT,
    "niveau" SMALLINT,
    "statut" "StatutCertification" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificateur" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "certification_id" UUID NOT NULL,
    "siret" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certificateur_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "certification_numero_fiche_key" ON "certification"("numero_fiche");

-- CreateIndex
CREATE UNIQUE INDEX "certificateur_certification_id_siret_key" ON "certificateur"("certification_id", "siret");

-- AddForeignKey
ALTER TABLE "certificateur" ADD CONSTRAINT "certificateur_certification_id_fkey" FOREIGN KEY ("certification_id") REFERENCES "certification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
