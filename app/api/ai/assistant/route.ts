import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt } from '@/lib/ai-context';
import { cir25_lista, cir26_lista, cons25_lista, cons26_lista } from '@/lib/legacy-data';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const validToken = process.env.DASHBOARD_ACCESS_TOKEN;
  if (validToken && token !== validToken && process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'AI assistant not configured (ANTHROPIC_API_KEY missing)', reply: 'Assistente não configurado. Configure ANTHROPIC_API_KEY para usar esta funcionalidade.' },
      { status: 200 }
    );
  }

  try {
    const body = await req.json();
    const { message, history } = body as {
      message: string;
      history?: { role: 'user' | 'assistant'; content: string }[];
    };

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    const systemPrompt = buildSystemPrompt(cir25_lista, cir26_lista, cons25_lista, cons26_lista);

    const messages: { role: 'user' | 'assistant'; content: string }[] = [
      ...(history || []),
      { role: 'user', content: message },
    ];

    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const reply =
      response.content[0].type === 'text' ? response.content[0].text : '';

    return NextResponse.json({ reply });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message, reply: `Erro ao processar: ${message}` }, { status: 500 });
  }
}
