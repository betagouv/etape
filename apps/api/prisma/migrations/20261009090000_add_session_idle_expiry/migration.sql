-- Une session expire aussi faute d'activité. Les sessions ouvertes avant cette
-- migration reçoivent le délai le plus court, celui du front-office ; la valeur
-- par défaut ne sert qu'à les reprendre, puis elle est retirée.

-- AlterTable
ALTER TABLE "session" ADD COLUMN "idle_expires_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP + INTERVAL '30 minutes';
ALTER TABLE "session" ALTER COLUMN "idle_expires_at" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "session_idle_expires_at_idx" ON "session"("idle_expires_at");
