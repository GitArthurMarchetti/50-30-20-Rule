/**
 * Debug script to check login issues and reset password if needed
 * Usage: npx tsx scripts/debug-login.ts
 */

import { prisma } from "../prisma/db";
import bcrypt from "bcryptjs";

const email = "avinhasmarchetti@gmail.com";
const testPassword = "Conta$100";

async function debugLogin() {
  try {
    console.log("🔍 Debugging login for:", email);
    console.log("");

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        username: true,
        password_hash: true,
      },
    });

    if (!user) {
      console.log("❌ User not found in database");
      console.log("Email searched:", email.toLowerCase());
      return;
    }

    console.log("✅ User found:");
    console.log("  ID:", user.id);
    console.log("  Email:", user.email);
    console.log("  Username:", user.username);
    console.log("  Password hash:", user.password_hash.substring(0, 20) + "...");
    console.log("");

    // Test password comparison
    console.log("🔐 Testing password comparison...");
    const passwordMatch = await bcrypt.compare(testPassword, user.password_hash);
    console.log("  Password match:", passwordMatch ? "✅ YES" : "❌ NO");
    console.log("");

    if (!passwordMatch) {
      console.log("⚠️  Password does not match!");
      console.log("  Tested password:", testPassword);
      console.log("");
      console.log("Would you like to reset the password?");
      console.log("Run: npx tsx scripts/reset-password.ts");
    } else {
      console.log("✅ Password matches! Login should work.");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugLogin();
