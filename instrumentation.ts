// instrumentation.ts — Next.js server startup hook
// Runs once when the serverless function cold-starts

export async function register() {
  // Fix BigInt serialization for Prisma
  (BigInt.prototype as any).toJSON = function () {
    return Number(this);
  };
}
