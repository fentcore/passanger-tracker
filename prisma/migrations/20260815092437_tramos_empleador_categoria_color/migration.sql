/*
  Warnings:

  - You are about to drop the column `cantidadTramos` on the `Servicio` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CategoriaCopy" ADD COLUMN     "color" TEXT;

-- AlterTable
ALTER TABLE "Pasajero" ADD COLUMN     "empleador" TEXT,
ADD COLUMN     "grupoTramosId" TEXT,
ADD COLUMN     "tramos" INTEGER NOT NULL DEFAULT 0;

-- DataMigration: antes de tirar Servicio.cantidadTramos, volcamos a Pasajero.tramos
-- el máximo entre los servicios no archivados de cada pasajero (nunca de menos).
UPDATE "Pasajero" p
SET "tramos" = COALESCE(
  (SELECT MAX(s."cantidadTramos") FROM "Servicio" s WHERE s."pasajeroId" = p.id AND s."archivedAt" IS NULL),
  0
);

-- AlterTable
ALTER TABLE "Servicio" DROP COLUMN "cantidadTramos";

-- CreateIndex
CREATE INDEX "Pasajero_grupoTramosId_idx" ON "Pasajero"("grupoTramosId");

-- AddForeignKey
ALTER TABLE "Pasajero" ADD CONSTRAINT "Pasajero_grupoTramosId_fkey" FOREIGN KEY ("grupoTramosId") REFERENCES "Pasajero"("id") ON DELETE SET NULL ON UPDATE CASCADE;
