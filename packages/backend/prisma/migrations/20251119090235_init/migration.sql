-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "vehicleManufacturer" TEXT NOT NULL,
    "vehicleModel" TEXT NOT NULL,
    "vehicleYear" INTEGER NOT NULL,
    "vehiclePlatform" TEXT,
    "vehicleRegion" TEXT[],
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "asilRating" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "modifiedBy" TEXT NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecus" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "partNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "supplierCode" TEXT,
    "physical" JSONB,
    "electrical" JSONB,
    "software" JSONB,
    "procurement" JSONB,
    "safety" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "modifiedBy" TEXT NOT NULL,

    CONSTRAINT "ecus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connectors" (
    "id" TEXT NOT NULL,
    "ecuId" TEXT,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "partNumber" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "pinCount" INTEGER NOT NULL,
    "physical" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "modifiedBy" TEXT NOT NULL,

    CONSTRAINT "connectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pins" (
    "id" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "pinNumber" TEXT NOT NULL,
    "label" TEXT,
    "capabilities" JSONB,
    "assignment" JSONB,
    "physical" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "modifiedBy" TEXT NOT NULL,

    CONSTRAINT "pins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wires" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT,
    "fromPinId" TEXT,
    "toPinId" TEXT,
    "endpoints" JSONB,
    "viaPoints" JSONB,
    "physical" JSONB,
    "electrical" JSONB,
    "routing" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "modifiedBy" TEXT NOT NULL,

    CONSTRAINT "wires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "splices" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT,
    "type" TEXT NOT NULL,
    "wireIds" TEXT[],
    "physical" JSONB,
    "location" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "modifiedBy" TEXT NOT NULL,

    CONSTRAINT "splices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "features" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "requirements" JSONB,
    "implementation" JSONB,
    "dependencies" JSONB,
    "safety" JSONB,
    "metadata" JSONB,
    "availableIn" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "modifiedBy" TEXT NOT NULL,

    CONSTRAINT "features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "components" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT,
    "partNumber" TEXT,
    "electrical" JSONB,
    "physical" JSONB,
    "connection" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "modifiedBy" TEXT NOT NULL,

    CONSTRAINT "components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "networks" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "configuration" JSONB,
    "physical" JSONB,
    "load" JSONB,
    "messages" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "modifiedBy" TEXT NOT NULL,

    CONSTRAINT "networks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "network_members" (
    "id" TEXT NOT NULL,
    "networkId" TEXT NOT NULL,
    "ecuId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "wakeupCapable" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "network_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "change_requests" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "changes" JSONB,
    "impact" JSONB,
    "approvals" JSONB,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "modifiedBy" TEXT NOT NULL,

    CONSTRAINT "change_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ecus_projectId_idx" ON "ecus"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ecus_projectId_partNumber_key" ON "ecus"("projectId", "partNumber");

-- CreateIndex
CREATE INDEX "connectors_ecuId_idx" ON "connectors"("ecuId");

-- CreateIndex
CREATE INDEX "pins_connectorId_idx" ON "pins"("connectorId");

-- CreateIndex
CREATE UNIQUE INDEX "pins_connectorId_pinNumber_key" ON "pins"("connectorId", "pinNumber");

-- CreateIndex
CREATE INDEX "wires_projectId_idx" ON "wires"("projectId");

-- CreateIndex
CREATE INDEX "wires_fromPinId_idx" ON "wires"("fromPinId");

-- CreateIndex
CREATE INDEX "wires_toPinId_idx" ON "wires"("toPinId");

-- CreateIndex
CREATE INDEX "splices_projectId_idx" ON "splices"("projectId");

-- CreateIndex
CREATE INDEX "features_projectId_idx" ON "features"("projectId");

-- CreateIndex
CREATE INDEX "components_projectId_idx" ON "components"("projectId");

-- CreateIndex
CREATE INDEX "networks_projectId_idx" ON "networks"("projectId");

-- CreateIndex
CREATE INDEX "network_members_networkId_idx" ON "network_members"("networkId");

-- CreateIndex
CREATE INDEX "network_members_ecuId_idx" ON "network_members"("ecuId");

-- CreateIndex
CREATE UNIQUE INDEX "network_members_networkId_ecuId_key" ON "network_members"("networkId", "ecuId");

-- CreateIndex
CREATE INDEX "change_requests_projectId_idx" ON "change_requests"("projectId");

-- CreateIndex
CREATE INDEX "change_requests_status_idx" ON "change_requests"("status");

-- AddForeignKey
ALTER TABLE "ecus" ADD CONSTRAINT "ecus_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connectors" ADD CONSTRAINT "connectors_ecuId_fkey" FOREIGN KEY ("ecuId") REFERENCES "ecus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pins" ADD CONSTRAINT "pins_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "connectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wires" ADD CONSTRAINT "wires_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wires" ADD CONSTRAINT "wires_fromPinId_fkey" FOREIGN KEY ("fromPinId") REFERENCES "pins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wires" ADD CONSTRAINT "wires_toPinId_fkey" FOREIGN KEY ("toPinId") REFERENCES "pins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "splices" ADD CONSTRAINT "splices_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "features" ADD CONSTRAINT "features_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "components" ADD CONSTRAINT "components_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "networks" ADD CONSTRAINT "networks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "network_members" ADD CONSTRAINT "network_members_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "networks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "network_members" ADD CONSTRAINT "network_members_ecuId_fkey" FOREIGN KEY ("ecuId") REFERENCES "ecus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_requests" ADD CONSTRAINT "change_requests_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
