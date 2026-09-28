-- CreateEnum
CREATE TYPE "role" AS ENUM ('INSTRUCTEUR', 'ADMIN', 'SUPER_ADMIN');

-- CreateTable
CREATE TABLE "habilitation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "account_id" UUID NOT NULL,
    "role" "role" NOT NULL,
    "region_id" TEXT,
    "date_attribution" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_revocation" TIMESTAMPTZ(3),

    CONSTRAINT "habilitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "habilitation_account_id_idx" ON "habilitation"("account_id");

-- CreateIndex
CREATE INDEX "habilitation_role_region_id_idx" ON "habilitation"("role", "region_id");

-- AddForeignKey
ALTER TABLE "habilitation" ADD CONSTRAINT "habilitation_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
