/**
 * Auto reset password for specific user
 */

import { prisma } from "../prisma/db";
import bcrypt from "bcryptjs";

const email = "avinhasmarchetti@gmail.com";
const newPassword = "Conta$100";

async function resetPassword() {
  try {
    console.log("🔄 Resetting password for:", email);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      console.log("❌ User not found");
      return;
    }

    console.log("✅ User found:", user.username);

    // Hash new password
    const hash = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash: hash },
    });

    console.log("✅ Password reset successfully!");
    console.log("  Email:", user.email);
    console.log("  New password:", newPassword);
    
    // Verify the new password
    const verify = await bcrypt.compare(newPassword, hash);
    console.log("  Verification:", verify ? "✅ Password verified" : "❌ Verification failed");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
