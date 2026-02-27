-- DropIndex
DROP INDEX `Business_companyId_fkey` ON `business`;

-- DropIndex
DROP INDEX `Reward_wheelId_fkey` ON `reward`;

-- DropIndex
DROP INDEX `Scan_wheelId_fkey` ON `scan`;

-- DropIndex
DROP INDEX `Wheel_businessId_fkey` ON `wheel`;

-- AlterTable
ALTER TABLE `reward` ADD COLUMN `emoji` VARCHAR(191) NOT NULL DEFAULT '🎁';

-- AlterTable
ALTER TABLE `wheel` ADD COLUMN `codeSecret` VARCHAR(191) NOT NULL DEFAULT '';

-- AddForeignKey
ALTER TABLE `Business` ADD CONSTRAINT `Business_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Wheel` ADD CONSTRAINT `Wheel_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `Business`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reward` ADD CONSTRAINT `Reward_wheelId_fkey` FOREIGN KEY (`wheelId`) REFERENCES `Wheel`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Scan` ADD CONSTRAINT `Scan_wheelId_fkey` FOREIGN KEY (`wheelId`) REFERENCES `Wheel`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
