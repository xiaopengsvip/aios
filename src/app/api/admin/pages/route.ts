import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await requireAdmin();
    const pages = await prisma.staticPage.findMany({ orderBy: { sortOrder: 'asc' } });
    return NextResponse.json({ pages });
  } catch (error: any) {
    if (error.name === 'AuthError') return NextResponse.json({ error: error.message }, { status: error.statusCode });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { slug, title, titleEn, content, contentEn, isPublished, sortOrder } = body;
    if (!slug || !title) return NextResponse.json({ error: 'Missing slug or title' }, { status: 400 });
    const page = await prisma.staticPage.create({
      data: { slug, title, titleEn: titleEn || '', content: content || '', contentEn: contentEn || '', isPublished: isPublished ?? true, sortOrder: sortOrder || 0 },
    });
    return NextResponse.json({ success: true, page });
  } catch (error: any) {
    if (error.name === 'AuthError') return NextResponse.json({ error: error.message }, { status: error.statusCode });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'Missing page ID' }, { status: 400 });
    const page = await prisma.staticPage.update({ where: { id }, data });
    return NextResponse.json({ success: true, page });
  } catch (error: any) {
    if (error.name === 'AuthError') return NextResponse.json({ error: error.message }, { status: error.statusCode });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing page ID' }, { status: 400 });
    await prisma.staticPage.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.name === 'AuthError') return NextResponse.json({ error: error.message }, { status: error.statusCode });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
