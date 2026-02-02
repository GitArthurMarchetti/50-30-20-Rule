-- CreateTable
CREATE TABLE "public"."pending_transactions" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "public"."TransactionType" NOT NULL,
    "userId" INTEGER NOT NULL,
    "categoryId" INTEGER,
    "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDuplicate" BOOLEAN,
    "rawData" TEXT,

    CONSTRAINT "pending_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pending_transactions_userId_expiresAt_idx" ON "public"."pending_transactions"("userId", "expiresAt");

-- AddForeignKey
ALTER TABLE "public"."pending_transactions" ADD CONSTRAINT "pending_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pending_transactions" ADD CONSTRAINT "pending_transactions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
