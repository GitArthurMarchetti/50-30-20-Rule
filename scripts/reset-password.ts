/**
 * Reset password for a user
 * Usage: npx tsx scripts/reset-password.ts
 */

import { prisma } from "../prisma/db";
import bcrypt from "bcryptjs";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function resetPassword() {
  try {
    const email = await question("Enter email: ");
    const newPassword = await question("Enter new password: ");

    if (!email || !newPassword) {
      console.log("❌ Email and password are required");
      rl.close();
      return;
    }

    if (newPassword.length < 6) {
      console.log("❌ Password must be at least 6 characters");
      rl.close();
      return;
    }

    console.log("");
    console.log("🔄 Resetting password for:", email);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      console.log("❌ User not found");
      rl.close();
      return;
    }

    // Hash new password
    const hash = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash: hash },
    });

    console.log("✅ Password reset successfully!");
    console.log("  User ID:", user.id);
    console.log("  Email:", user.email);
    console.log("  New password hash:", hash.substring(0, 20) + "...");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

resetPassword();
