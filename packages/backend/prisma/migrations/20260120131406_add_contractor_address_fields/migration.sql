/*
  Warnings:

  - You are about to drop the column `glAggregate` on the `generated_cois` table. All the data in the column will be lost.
  - You are about to drop the column `glPerOccurrence` on the `generated_cois` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "contractors" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "zipCode" TEXT;

-- AlterTable
ALTER TABLE "generated_cois" DROP COLUMN "glAggregate",
DROP COLUMN "glPerOccurrence";
