import { getSessionUser } from "@/app/lib/auth-server";
import { prisma } from "@/prisma/db";
import { NextRequest, NextResponse } from "next/server";
import { TransactionType, Prisma } from "@/app/generated/prisma"; 
import { defaultCategories } from "../categories";



export async function GET(request: NextRequest) { 
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ message: "Not Authorized" }, { status: 401 });
    }

    const count = await prisma.category.count({
      where: { userId: session.userId },
    });

    if (count === 0) {
      const categoryData = defaultCategories.map(category => ({
        ...category,
        userId: session.userId,
      }));
      
      await prisma.category.createMany({
        data: categoryData,
        skipDuplicates: true,
      });
    }

    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type");

    const whereClause: Prisma.CategoryWhereInput = {
      userId: session.userId,
    };

    if (typeParam && Object.values(TransactionType).includes(typeParam as TransactionType)) {
      whereClause.type = typeParam as TransactionType;
    }

    const categories = await prisma.category.findMany({
      where: whereClause,
      orderBy: {
        name: "asc", 
      },
    });

    return NextResponse.json(categories);

  } catch (error) {
    console.error("Error searching for:", error);
    return NextResponse.json(
      { message: "Internal error" },
      { status: 500 }
    );
  }
}
