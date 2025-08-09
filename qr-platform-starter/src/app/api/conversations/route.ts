export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const list = await prisma.conversation.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { messages: true } },
        messages: {
          select: { id: true, createdAt: true, text: true, sender: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const data = list.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name ?? '',
      createdAt: c.createdAt.toISOString(),
      messagesCount: c._count.messages,
      lastMessageAt: c.messages[0]?.createdAt ? c.messages[0].createdAt.toISOString() : null,
      lastMessageText: c.messages[0]?.text ?? null,
      lastMessageSender: c.messages[0]?.sender ?? null,
    }));

    return NextResponse.json({ conversations: data });
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { code, name } = await req.json();
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'code required' }, { status: 400 });
    }

    const conv = await prisma.conversation.upsert({
      where: { code },
      update: { name: typeof name === 'string' ? name : undefined },
      create: { code, name: typeof name === 'string' ? name : undefined },
      select: { id: true, code: true, name: true },
    });

    return NextResponse.json({ id: conv.id, code: conv.code, name: conv.name ?? '' });
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { code, name } = await req.json();
    if (!code || typeof code !== 'string' || typeof name !== 'string') {
      return NextResponse.json({ error: 'code and name required' }, { status: 400 });
    }

    const updated = await prisma.conversation.update({
      where: { code },
      data: { name },
      select: { id: true, code: true, name: true },
    });

    return NextResponse.json({ ok: true, conversation: updated });
  } catch {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { code } = await req.json();
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'code required' }, { status: 400 });
    }

    const conv = await prisma.conversation.findUnique({
      where: { code },
      select: { id: true },
    });
    if (!conv) return NextResponse.json({ ok: true });

    await prisma.message.deleteMany({ where: { conversationId: conv.id } });
    await prisma.conversation.delete({ where: { id: conv.id } });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
  