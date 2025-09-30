-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('INCOME', 'NEEDS', 'WANTS', 'RESERVES', 'INVESTMENTS');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "monthly_total_income" DECIMAL(10,2),
    "previous_month_balance" DECIMAL(10,2),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."transactions" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "public"."TransactionType" NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."monthly_summaries" (
    "id" SERIAL NOT NULL,
    "month_year" DATE NOT NULL,
    "total_income" DECIMAL(10,2) NOT NULL,
    "needs_expenses" DECIMAL(10,2) NOT NULL,
    "wants_expenses" DECIMAL(10,2) NOT NULL,
    "total_savings" DECIMAL(10,2) NOT NULL,
    "total_investments" DECIMAL(10,2) NOT NULL,
    "final_balance" DECIMAL(10,2) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "monthly_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_summaries_userId_month_year_key" ON "public"."monthly_summaries"("userId", "month_year");

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."monthly_summaries" ADD CONSTRAINT "monthly_summaries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
