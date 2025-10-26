/*
  Warnings:

  - A unique constraint covering the columns `[userId,name,type]` on the table `categories` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `type` to the `categories` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."categories_userId_name_key";

-- AlterTable
ALTER TABLE "public"."categories" ADD COLUMN     "type" "public"."TransactionType" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "categories_userId_name_type_key" ON "public"."categories"("userId", "name", "type");
