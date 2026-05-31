import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /v1/models — OpenAI Compatible model listing
export async function GET() {
  try {
    const models = await prisma.model.findMany({
      where: {
        isEnabled: true,
        provider: {
          isEnabled: true,
          keys: { some: { isEnabled: true, status: 'ACTIVE' } },
        },
      },
      select: { id: true, name: true, displayName: true, contextWindow: true },
    });

    return NextResponse.json({
      object: 'list',
      data: models.map((m) => ({
        id: m.name,
        object: 'model',
        created: 1700000000,
        owned_by: 'aios',
        context_window: m.contextWindow || 4096,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}
