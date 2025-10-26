import { TransactionType } from "../generated/prisma";

export const defaultCategories = [
  { name: "Previous Month Balance", type: TransactionType.ROLLOVER },
  
  // Income
  { name: "Salary", type: TransactionType.INCOME },
  { name: "Freelance", type: TransactionType.INCOME },
  { name: "Pension", type: TransactionType.INCOME },
  { name: "Extra Income", type: TransactionType.INCOME },
  { name: "Investments (Dividends/Yields)", type: TransactionType.INCOME },
  { name: "Gifts (Received)", type: TransactionType.INCOME },
  
  // Needs
  { name: "Rent/Mortgage", type: TransactionType.NEEDS }, 
  { name: "Groceries", type: TransactionType.NEEDS }, 
  { name: "Utilities (Water, Electricity, Gas)", type: TransactionType.NEEDS },
  { name: "Internet", type: TransactionType.NEEDS },
  { name: "Phone Bill", type: TransactionType.NEEDS },
  { name: "Transportation", type: TransactionType.NEEDS },
  { name: "Health (Insurance, Medicine)", type: TransactionType.NEEDS },
  { name: "Insurances (Car, Home)", type: TransactionType.NEEDS },
  
  // Wants
  { name: "Restaurants/Takeaway", type: TransactionType.WANTS }, 
  { name: "Coffee", type: TransactionType.WANTS }, 
  { name: "Snacks/Convenience Store", type: TransactionType.WANTS }, 
  { name: "Shopping (Clothes & Goods)", type: TransactionType.WANTS },
  { name: "Games", type: TransactionType.WANTS },
  { name: "Subscriptions (Netflix, Apple, Gym)", type: TransactionType.WANTS },
  { name: "Personal Care (Haircut, Deodorant)", type: TransactionType.WANTS }, 
  { name: "Leisure/Hobbies", type: TransactionType.WANTS },
  { name: "Gifts (Given)", type: TransactionType.WANTS },
  { name: "Travel", type: TransactionType.WANTS },
  
  // Reserves
  { name: "Emergency Fund", type: TransactionType.RESERVES },
  { name: "General Savings", type: TransactionType.RESERVES },
  { name: "Travel Fund", type: TransactionType.RESERVES },
  { name: "Major Purchase Fund (Car, House)", type: TransactionType.RESERVES },
  
  // Investments
  { name: "Cryptocurrency", type: TransactionType.INVESTMENTS }, 
  { name: "Stocks", type: TransactionType.INVESTMENTS },
  { name: "Real Estate Funds", type: TransactionType.INVESTMENTS },
  { name: "Fixed Income", type: TransactionType.INVESTMENTS },
  { name: "Retirement Fund", type: TransactionType.INVESTMENTS },
];