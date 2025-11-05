import { TransactionType } from "../generated/prisma";

export const defaultCategories = [
  { name: "Previous Month Balance", type: TransactionType.ROLLOVER },
  
  // Income
  { name: "Salary", type: TransactionType.INCOME },
  { name: "Freelance", type: TransactionType.INCOME },
  { name: "Pension", type: TransactionType.INCOME },
  { name: "Extra Income", type: TransactionType.INCOME },
  { name: "Investments", type: TransactionType.INCOME },
  { name: "Gifts", type: TransactionType.INCOME },
  
  // Needs
  { name: "Rent/Mortgage", type: TransactionType.NEEDS }, 
  { name: "Groceries", type: TransactionType.NEEDS }, 
  { name: "Utilities", type: TransactionType.NEEDS },
  { name: "Internet", type: TransactionType.NEEDS },
  { name: "Phone Bill", type: TransactionType.NEEDS },
  { name: "Transportation", type: TransactionType.NEEDS },
  { name: "Health", type: TransactionType.NEEDS },
  { name: "Insurances", type: TransactionType.NEEDS },
  
  // Wants
  { name: "Restaurants/Takeaway", type: TransactionType.WANTS }, 
  { name: "Coffee", type: TransactionType.WANTS }, 
  { name: "Snacks/Convenience", type: TransactionType.WANTS }, 
  { name: "Shopping", type: TransactionType.WANTS },
  { name: "Games", type: TransactionType.WANTS },
  { name: "Subscriptions", type: TransactionType.WANTS },
  { name: "Personal Care", type: TransactionType.WANTS }, 
  { name: "Leisure/Hobbies", type: TransactionType.WANTS },
  { name: "Gifts (Given)", type: TransactionType.WANTS },
  { name: "Travel", type: TransactionType.WANTS },
  
  // Reserves
  { name: "Emergency Fund", type: TransactionType.RESERVES },
  { name: "General Savings", type: TransactionType.RESERVES },
  { name: "Travel Fund", type: TransactionType.RESERVES },
  { name: "Major Purchase Fund", type: TransactionType.RESERVES },
  { name: "Cryptocurrency", type: TransactionType.RESERVES }, 

  
  // Investments
  { name: "Cryptocurrency", type: TransactionType.INVESTMENTS }, 
  { name: "Stocks", type: TransactionType.INVESTMENTS },
  { name: "Real Estate Funds", type: TransactionType.INVESTMENTS },
  { name: "Fixed Income", type: TransactionType.INVESTMENTS },
  { name: "Retirement Fund", type: TransactionType.INVESTMENTS },
];