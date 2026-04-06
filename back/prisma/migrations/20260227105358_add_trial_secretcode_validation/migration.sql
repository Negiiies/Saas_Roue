/*
  Warnings:

  - You are about to drop the column `dailyCode` on the `scan` table. All the data in the column will be lost.
  - You are about to drop the column `codeSecret` on the `wheel` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[secretCode]` on the table `Scan` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `Business_companyId_fkey` ON `business`;

-- DropIndex
DROP INDEX `Reward_wheelId_fkey` ON `reward`;

-- DropIndex
DROP INDEX `Scan_wheelId_fkey` ON `scan`;

-- DropIndex
DROP INDEX `Wheel_businessId_fkey` ON `wheel`;

-- AlterTable
ALTER TABLE `company` ADD COLUMN `activatedAt` DATETIME(3) NULL,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `trialEndsAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `reward` MODIFY `emoji` VARCHAR(191) NOT NULL DEFAULT '🎁';

-- AlterTable
ALTER TABLE `scan` DROP COLUMN `dailyCode`,
    ADD COLUMN `expiresAt` DATETIME(3) NULL,
    ADD COLUMN `secretCode` VARCHAR(191) NULL,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    ADD COLUMN `usedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `wheel` DROP COLUMN `codeSecret`;

-- CreateIndex
CREATE UNIQUE INDEX `Scan_secretCode_key` ON `Scan`(`secretCode`);

-- AddForeignKey
ALTER TABLE `Business` ADD CONSTRAINT `Business_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Wheel` ADD CONSTRAINT `Wheel_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `Business`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reward` ADD CONSTRAINT `Reward_wheelId_fkey` FOREIGN KEY (`wheelId`) REFERENCES `Wheel`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Scan` ADD CONSTRAINT `Scan_rewardId_fkey` FOREIGN KEY (`rewardId`) REFERENCES `Reward`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Scan` ADD CONSTRAINT `Scan_wheelId_fkey` FOREIGN KEY (`wheelId`) REFERENCES `Wheel`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
