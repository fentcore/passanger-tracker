/*
  Warnings:

  - The `revisorId` column on the `Nota` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `profiles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `usuarioId` on the `HistorialCambio` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `usuarioId` on the `HistorialPrecio` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `creadorId` on the `Nota` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `profiles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "HistorialCambio" DROP CONSTRAINT "HistorialCambio_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "HistorialPrecio" DROP CONSTRAINT "HistorialPrecio_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "Nota" DROP CONSTRAINT "Nota_creadorId_fkey";

-- DropForeignKey
ALTER TABLE "Nota" DROP CONSTRAINT "Nota_revisorId_fkey";

-- AlterTable
ALTER TABLE "HistorialCambio" DROP COLUMN "usuarioId",
ADD COLUMN     "usuarioId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "HistorialPrecio" DROP COLUMN "usuarioId",
ADD COLUMN     "usuarioId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Nota" DROP COLUMN "creadorId",
ADD COLUMN     "creadorId" UUID NOT NULL,
DROP COLUMN "revisorId",
ADD COLUMN     "revisorId" UUID;

-- AlterTable
ALTER TABLE "profiles" DROP CONSTRAINT "profiles_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "HistorialCambio_usuarioId_idx" ON "HistorialCambio"("usuarioId");

-- AddForeignKey
ALTER TABLE "Nota" ADD CONSTRAINT "Nota_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nota" ADD CONSTRAINT "Nota_revisorId_fkey" FOREIGN KEY ("revisorId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialPrecio" ADD CONSTRAINT "HistorialPrecio_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialCambio" ADD CONSTRAINT "HistorialCambio_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
