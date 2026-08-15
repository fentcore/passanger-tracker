-- AlterTable
ALTER TABLE "Barrio" ADD COLUMN     "color" TEXT;

-- CreateTable
CREATE TABLE "PaqueteTarifa" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tramos" INTEGER NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaqueteTarifa_pkey" PRIMARY KEY ("id")
);
