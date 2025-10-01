/*
  Warnings:

  - You are about to drop the column `monthly_total_income` on the `users` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "public"."TransactionType" ADD VALUE 'ROLLOVER';

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "monthly_total_income";
