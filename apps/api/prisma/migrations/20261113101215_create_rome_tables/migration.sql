-- CreateEnum
CREATE TYPE "ClassificationAppellationRome" AS ENUM ('PRINCIPALE', 'SYNONYME');

-- CreateTable
CREATE TABLE "metier_rome" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "is_obsolete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metier_rome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appellation_rome" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "metier_rome_id" UUID NOT NULL,
    "libelle" TEXT NOT NULL,
    "libelle_court" TEXT NOT NULL,
    "classification" "ClassificationAppellationRome" NOT NULL,
    "is_obsolete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appellation_rome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "version_rome" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "version" TEXT NOT NULL,
    "date_modification" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "version_rome_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "metier_rome_code_key" ON "metier_rome"("code");

-- CreateIndex
CREATE UNIQUE INDEX "appellation_rome_code_key" ON "appellation_rome"("code");

-- CreateIndex
CREATE INDEX "appellation_rome_metier_rome_id_idx" ON "appellation_rome"("metier_rome_id");

-- CreateIndex
CREATE UNIQUE INDEX "version_rome_version_key" ON "version_rome"("version");

-- AddForeignKey
ALTER TABLE "appellation_rome" ADD CONSTRAINT "appellation_rome_metier_rome_id_fkey" FOREIGN KEY ("metier_rome_id") REFERENCES "metier_rome"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
