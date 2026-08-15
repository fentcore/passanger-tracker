/*
  Warnings:

  - You are about to drop the column `estadoPago` on the `Servicio` table. All the data in the column will be lost.
  - You are about to drop the column `metodoPago` on the `Servicio` table. All the data in the column will be lost.
  - You are about to drop the column `montoAbonado` on the `Servicio` table. All the data in the column will be lost.
  - You are about to drop the column `montoPendiente` on the `Servicio` table. All the data in the column will be lost.
  - You are about to drop the column `notasPago` on the `Servicio` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TurnoRecorrido" AS ENUM ('MANANA', 'TARDE');

-- AlterTable
ALTER TABLE "Pasajero" ADD COLUMN     "estadoPago" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
ADD COLUMN     "metodoPago" TEXT,
ADD COLUMN     "montoAbonado" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "notasPago" TEXT;

-- AlterTable
ALTER TABLE "Recorrido" ADD COLUMN     "turno" "TurnoRecorrido";

-- DataMigration: el pago pasa a ser del contacto (Pasajero), no de cada día
-- (Servicio). Volcamos, por cada pasajero, los datos de pago del servicio no
-- archivado con mayor montoAbonado (el más representativo de lo efectivamente
-- pagado), antes de tirar esas columnas de Servicio.
UPDATE "Pasajero" p
SET
  "montoAbonado" = s."montoAbonado",
  "estadoPago" = s."estadoPago",
  "metodoPago" = s."metodoPago",
  "notasPago" = s."notasPago"
FROM (
  SELECT DISTINCT ON ("pasajeroId") "pasajeroId", "montoAbonado", "estadoPago", "metodoPago", "notasPago"
  FROM "Servicio"
  WHERE "archivedAt" IS NULL
  ORDER BY "pasajeroId", "montoAbonado" DESC
) s
WHERE p.id = s."pasajeroId";

-- AlterTable
ALTER TABLE "Servicio" DROP COLUMN "estadoPago",
DROP COLUMN "metodoPago",
DROP COLUMN "montoAbonado",
DROP COLUMN "montoPendiente",
DROP COLUMN "notasPago";
