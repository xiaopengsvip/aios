import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/conversations/export?id=xxx&format=markdown|json
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const format = searchParams.get('format') || 'markdown';

  if (!id) return NextResponse.json({ error: 'Missing conversation id' }, { status: 400 });

  try {
    const conv = await prisma.conversation.findFirst({
      where: { id, userId: user.id },
      include: {
        messages: { orderBy: { createdAt: 'asc' }, select: { role: true, content: true, createdAt: true, modelName: true } },
      },
    });

    if (!conv) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

    if (format === 'json') {
      return NextResponse.json({
        title: conv.title,
        model: conv.modelId,
        messages: conv.messages.map((m) => ({ role: m.role.toLowerCase(), content: m.content, timestamp: m.createdAt })),
        exportedAt: new Date().toISOString(),
      });
    }

    // Markdown format
    let md = `# ${conv.title || 'Conversation'}

`;
    md += `> Exported: ${new Date().toISOString()}

---

`;
    for (const msg of conv.messages) {
      const role = msg.role === 'USER' ? '👤 User' : '🤖 Assistant';
      md += `### ${role}

${msg.content}

---

`;
    }

    return new NextResponse(md, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="conversation-${id}.md"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
