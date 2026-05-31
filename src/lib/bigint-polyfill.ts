// src/lib/bigint-polyfill.ts
// Fix BigInt serialization for Prisma queries
// NextResponse.json uses JSON.stringify internally, which throws on BigInt

(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};
