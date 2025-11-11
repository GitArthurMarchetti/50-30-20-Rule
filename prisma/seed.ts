/**
 * Prisma Seed File
 * Run with: npm run db:seed
 * 
 * This file seeds your database with initial data for development and testing.
 */

// Load environment variables from .env files
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

const envPath = resolve(process.cwd(), '.env');
const envLocalPath = resolve(process.cwd(), '.env.local');

// Load .env first, then .env.local (which overrides, matching Next.js behavior)
if (existsSync(envPath)) {
  config({ path: envPath });
}

// Load .env.local after .env (it will override .env values, like Next.js)
if (existsSync(envLocalPath)) {
  config({ path: envLocalPath });
}

import { PrismaClient, TransactionType } from '../app/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // Create a test user
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      username: 'testuser',
      password_hash: hashedPassword,
    },
  });

  console.log('✅ Created user:', user.email);

  // Create some categories for the user
  const categories = [
    { name: 'Salary', type: TransactionType.INCOME },
    { name: 'Freelance', type: TransactionType.INCOME },
    { name: 'Groceries', type: TransactionType.NEEDS },
    { name: 'Rent', type: TransactionType.NEEDS },
    { name: 'Entertainment', type: TransactionType.WANTS },
    { name: 'Emergency Fund', type: TransactionType.RESERVES },
    { name: 'Stocks', type: TransactionType.INVESTMENTS },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: {
        userId_name_type: {
          userId: user.id,
          name: category.name,
          type: category.type,
        },
      },
      update: {},
      create: {
        ...category,
        userId: user.id,
      },
    });
  }

  console.log(`✅ Created ${categories.length} categories`);

  // Create some sample transactions
  const now = new Date();
  const transactions = [
    {
      description: 'Monthly Salary',
      amount: 5000,
      type: TransactionType.INCOME,
      date: new Date(now.getFullYear(), now.getMonth(), 1),
      userId: user.id,
    },
    {
      description: 'Rent Payment',
      amount: 1500,
      type: TransactionType.NEEDS,
      date: new Date(now.getFullYear(), now.getMonth(), 1),
      userId: user.id,
    },
    {
      description: 'Grocery Shopping',
      amount: 300,
      type: TransactionType.NEEDS,
      date: new Date(now.getFullYear(), now.getMonth(), 5),
      userId: user.id,
    },
    {
      description: 'Movie Night',
      amount: 50,
      type: TransactionType.WANTS,
      date: new Date(now.getFullYear(), now.getMonth(), 10),
      userId: user.id,
    },
    {
      description: 'Emergency Fund Deposit',
      amount: 500,
      type: TransactionType.RESERVES,
      date: new Date(now.getFullYear(), now.getMonth(), 15),
      userId: user.id,
    },
  ];

  for (const transaction of transactions) {
    await prisma.transaction.create({
      data: transaction,
    });
  }

  console.log(`✅ Created ${transactions.length} sample transactions`);
  console.log('\n✨ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

