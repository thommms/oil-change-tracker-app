/*
  Warnings:

  - Added the required column `nextChangeDueDate` to the `OilChange` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OilChange" ADD COLUMN     "nextChangeDueDate" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "oilChangeIntervalMonths" INTEGER NOT NULL DEFAULT 3;
