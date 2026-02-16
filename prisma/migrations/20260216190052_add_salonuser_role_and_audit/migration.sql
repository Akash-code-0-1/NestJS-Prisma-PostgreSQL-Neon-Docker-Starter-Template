/*
  Warnings:

  - You are about to alter the column `salary` on the `EmployeeProfile` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE "AccountantProfile" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "EmployeeProfile" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ALTER COLUMN "salary" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "OwnerProfile" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Salon" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "updatedBy" TEXT;

-- AlterTable
ALTER TABLE "SalonUser" ADD COLUMN     "role" "Role";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "SalonUser_salonId_role_idx" ON "SalonUser"("salonId", "role");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");
