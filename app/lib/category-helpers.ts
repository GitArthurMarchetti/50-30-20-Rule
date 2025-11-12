import { prisma } from "@/prisma/db";
import { defaultCategories } from "@/app/api/categories";

/**
 * Initializes default categories for a user
 * This function creates all default categories if they don't already exist for the user
 * @param userId - The user ID to create categories for
 * @returns Promise with the number of categories created
 */
export async function initializeDefaultCategories(userId: number): Promise<number> {
  let createdCount = 0;

  for (const category of defaultCategories) {
    try {
      await prisma.category.upsert({
        where: {
          userId_name_type: {
            userId,
            name: category.name,
            type: category.type,
          },
        },
        update: {}, // Don't update if it already exists
        create: {
          userId,
          name: category.name,
          type: category.type,
        },
      });
      createdCount++;
    } catch (error) {
      // If there's a unique constraint error, the category already exists, skip it
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
        continue;
      }
      // Log other errors but continue creating other categories
      console.error(`Error creating category ${category.name} for user ${userId}:`, error);
    }
  }

  return createdCount;
}

