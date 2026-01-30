/**
 * Clear rate limit for a specific email (useful after password reset)
 * Usage: npx tsx scripts/clear-rate-limit.ts
 */

// Note: This script would need to be run in the same process as the server
// For now, just restart the server to clear rate limits (they're in-memory)

console.log("ℹ️  Rate limits are stored in-memory and will be cleared when the server restarts.");
console.log("   To clear rate limits, restart your Next.js development server.");
console.log("");
console.log("   If you need to clear rate limits without restarting,");
console.log("   you can add an admin endpoint or restart the server.");
