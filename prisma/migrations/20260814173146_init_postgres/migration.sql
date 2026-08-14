-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'ASISTENTE');

-- CreateEnum
CREATE TYPE "EstadoPasajero" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "DiaSemana" AS ENUM ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO');

-- CreateEnum
CREATE TYPE "TipoViaje" AS ENUM ('IDA', 'VUELTA', 'IDA_VUELTA');

-- CreateEnum
CREATE TYPE "EstadoServicio" AS ENUM ('ACTIVO', 'INACTIVO', 'CONFIRMADO', 'PENDIENTE', 'CANCELADO', 'REALIZADO');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'PARCIAL', 'PAGADO');

-- CreateEnum
CREATE TYPE "TipoPuntoRuta" AS ENUM ('ORIGEN', 'DESTINO', 'OTRO');

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'ASISTENTE',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Barrio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Barrio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pasajero" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "contactoExtra" TEXT,
    "estado" "EstadoPasajero" NOT NULL DEFAULT 'ACTIVO',
    "notasGenerales" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pasajero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Servicio" (
    "id" TEXT NOT NULL,
    "pasajeroId" TEXT NOT NULL,
    "diaSemana" "DiaSemana" NOT NULL,
    "barrioId" TEXT,
    "direccion" TEXT,
    "destino" TEXT,
    "tipoViaje" "TipoViaje" NOT NULL DEFAULT 'IDA_VUELTA',
    "horaIda" TEXT,
    "horaVuelta" TEXT,
    "cantidadTramos" INTEGER NOT NULL DEFAULT 1,
    "estado" "EstadoServicio" NOT NULL DEFAULT 'ACTIVO',
    "fechaInicio" TIMESTAMP(3),
    "fechaFin" TIMESTAMP(3),
    "montoAbonado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estadoPago" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "metodoPago" TEXT,
    "montoPendiente" DOUBLE PRECISION,
    "notasPago" TEXT,
    "precioContratado" DOUBLE PRECISION,
    "tramosComprados" INTEGER,
    "tramosUtilizados" INTEGER,
    "notas" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Servicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nota" (
    "id" TEXT NOT NULL,
    "pasajeroId" TEXT NOT NULL,
    "servicioId" TEXT,
    "creadorId" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revisada" BOOLEAN NOT NULL DEFAULT false,
    "revisadaEn" TIMESTAMP(3),
    "revisorId" TEXT,

    CONSTRAINT "Nota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tarifa" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL DEFAULT 'Tarifa general',
    "precio" DOUBLE PRECISION NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tarifa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistorialPrecio" (
    "id" TEXT NOT NULL,
    "tarifaId" TEXT NOT NULL,
    "precioAnterior" DOUBLE PRECISION NOT NULL,
    "precioNuevo" DOUBLE PRECISION NOT NULL,
    "porcentaje" DOUBLE PRECISION,
    "usuarioId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistorialPrecio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracionAlertas" (
    "id" TEXT NOT NULL,
    "advertencia" INTEGER NOT NULL DEFAULT 10,
    "alerta" INTEGER NOT NULL DEFAULT 5,
    "critica" INTEGER NOT NULL DEFAULT 2,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracionAlertas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistorialCambio" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "campo" TEXT,
    "valorAnterior" TEXT,
    "valorNuevo" TEXT,
    "descripcion" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistorialCambio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoriaCopy" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CategoriaCopy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Copy" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "categoriaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Copy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PuntoRuta" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoPuntoRuta" NOT NULL DEFAULT 'OTRO',
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "barrioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PuntoRuta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recorrido" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "origenId" TEXT,
    "destinoId" TEXT,
    "puntosRuta" JSONB,
    "duracionMin" INTEGER,
    "distanciaKm" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recorrido_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Barrio_nombre_key" ON "Barrio"("nombre");

-- CreateIndex
CREATE INDEX "Pasajero_archivedAt_idx" ON "Pasajero"("archivedAt");

-- CreateIndex
CREATE INDEX "Servicio_diaSemana_idx" ON "Servicio"("diaSemana");

-- CreateIndex
CREATE INDEX "Servicio_pasajeroId_idx" ON "Servicio"("pasajeroId");

-- CreateIndex
CREATE INDEX "Servicio_archivedAt_idx" ON "Servicio"("archivedAt");

-- CreateIndex
CREATE INDEX "Nota_servicioId_idx" ON "Nota"("servicioId");

-- CreateIndex
CREATE INDEX "Nota_pasajeroId_idx" ON "Nota"("pasajeroId");

-- CreateIndex
CREATE INDEX "Nota_revisada_idx" ON "Nota"("revisada");

-- CreateIndex
CREATE INDEX "HistorialPrecio_tarifaId_idx" ON "HistorialPrecio"("tarifaId");

-- CreateIndex
CREATE INDEX "HistorialCambio_entidad_entidadId_idx" ON "HistorialCambio"("entidad", "entidadId");

-- CreateIndex
CREATE INDEX "HistorialCambio_usuarioId_idx" ON "HistorialCambio"("usuarioId");

-- CreateIndex
CREATE INDEX "HistorialCambio_creadoEn_idx" ON "HistorialCambio"("creadoEn");

-- CreateIndex
CREATE UNIQUE INDEX "CategoriaCopy_nombre_key" ON "CategoriaCopy"("nombre");

-- CreateIndex
CREATE INDEX "Copy_categoriaId_idx" ON "Copy"("categoriaId");

-- AddForeignKey
ALTER TABLE "Servicio" ADD CONSTRAINT "Servicio_pasajeroId_fkey" FOREIGN KEY ("pasajeroId") REFERENCES "Pasajero"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Servicio" ADD CONSTRAINT "Servicio_barrioId_fkey" FOREIGN KEY ("barrioId") REFERENCES "Barrio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nota" ADD CONSTRAINT "Nota_pasajeroId_fkey" FOREIGN KEY ("pasajeroId") REFERENCES "Pasajero"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nota" ADD CONSTRAINT "Nota_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nota" ADD CONSTRAINT "Nota_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nota" ADD CONSTRAINT "Nota_revisorId_fkey" FOREIGN KEY ("revisorId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialPrecio" ADD CONSTRAINT "HistorialPrecio_tarifaId_fkey" FOREIGN KEY ("tarifaId") REFERENCES "Tarifa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialPrecio" ADD CONSTRAINT "HistorialPrecio_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialCambio" ADD CONSTRAINT "HistorialCambio_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Copy" ADD CONSTRAINT "Copy_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "CategoriaCopy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuntoRuta" ADD CONSTRAINT "PuntoRuta_barrioId_fkey" FOREIGN KEY ("barrioId") REFERENCES "Barrio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recorrido" ADD CONSTRAINT "Recorrido_origenId_fkey" FOREIGN KEY ("origenId") REFERENCES "PuntoRuta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recorrido" ADD CONSTRAINT "Recorrido_destinoId_fkey" FOREIGN KEY ("destinoId") REFERENCES "PuntoRuta"("id") ON DELETE SET NULL ON UPDATE CASCADE;
