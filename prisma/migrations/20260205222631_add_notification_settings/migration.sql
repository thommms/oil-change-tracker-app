-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notificationDaysThreshold" INTEGER NOT NULL DEFAULT 14,
ADD COLUMN     "notificationMileageThreshold" INTEGER NOT NULL DEFAULT 200,
ADD COLUMN     "smsNotificationsEnabled" BOOLEAN NOT NULL DEFAULT false;
