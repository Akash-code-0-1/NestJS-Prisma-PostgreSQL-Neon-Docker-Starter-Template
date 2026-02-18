/*
  Warnings:

  - You are about to drop the column `initialPlan` on the `Salon` table. All the data in the column will be lost.
  - You are about to drop the column `trialPeriod` on the `Salon` table. All the data in the column will be lost.
  - Changed the type of `employeeCount` on the `Salon` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "SalonStatus" AS ENUM ('ACTIVE', 'TRIAL', 'CANCELLED', 'LEADS', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('BASIC', 'PREMIUM', 'ENTERPRISE');

-- AlterTable
ALTER TABLE "Salon" DROP COLUMN "initialPlan",
DROP COLUMN "trialPeriod",
ADD COLUMN     "lastActiveAt" TIMESTAMP(3),
ADD COLUMN     "ltv" DECIMAL(12,2),
ADD COLUMN     "plan" "PlanType" NOT NULL DEFAULT 'BASIC',
ADD COLUMN     "revenue" DECIMAL(12,2),
ADD COLUMN     "status" "SalonStatus" NOT NULL DEFAULT 'TRIAL',
ADD COLUMN     "supportCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "trialEndsAt" TIMESTAMP(3),
DROP COLUMN "employeeCount",
ADD COLUMN     "employeeCount" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "Salon_status_idx" ON "Salon"("status");

-- CreateIndex
CREATE INDEX "Salon_plan_idx" ON "Salon"("plan");

-- CreateIndex
CREATE INDEX "Salon_country_idx" ON "Salon"("country");

-- CreateIndex
CREATE INDEX "Salon_province_idx" ON "Salon"("province");

-- CreateIndex
CREATE INDEX "Salon_city_idx" ON "Salon"("city");

-- CreateIndex
CREATE INDEX "Salon_createdAt_idx" ON "Salon"("createdAt");

-- CreateIndex
CREATE INDEX "Salon_country_province_idx" ON "Salon"("country", "province");
