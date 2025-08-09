import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 });

    const conv = await prisma.conversation.findUnique({
      where: { code },
      select: { id: true },
    });
    if (!conv) return NextResponse.json({ messages: [] });

    const messages = await prisma.message.findMany({
      where: { conversationId: conv.id },
      orderBy: { createdAt: 'asc' },
      select: { id: true, sender: true, text: true, createdAt: true },
    });

    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { code, sender, text } = await req.json();
    if (!code || !sender || !text) {
      return NextResponse.json({ error: 'code, sender, text required' }, { status: 400 });
    }

    const conv = await prisma.conversation.upsert({
      where: { code },
      update: {},
      create: { code },
      select: { id: true },
    });

    const msg = await prisma.message.create({
      data: {
        conversationId: conv.id,
        sender,
        text,
      },
      select: { id: true, sender: true, text: true, createdAt: true },
    });

    return NextResponse.json({ ok: true, message: msg });
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
