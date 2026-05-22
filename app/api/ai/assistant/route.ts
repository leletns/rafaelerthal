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
    const { message, history, attachment } = body as {
      message: string;
      history?: { role: 'user' | 'assistant'; content: string }[];
      attachment?: { base64: string; mediaType: string; name?: string };
    };

    if (!message?.trim() && !attachment) {
      return NextResponse.json({ error: 'Message or attachment required' }, { status: 400 });
    }

    const systemPrompt = buildSystemPrompt(cir25_lista, cir26_lista, cons25_lista, cons26_lista);

    // Build history messages (text-only)
    const historyMessages: Anthropic.MessageParam[] = (history || []).map(m => ({
      role: m.role,
      content: m.content,
    }));

    // Build current user message — with or without attachment
    let currentContent: Anthropic.MessageParam['content'];

    if (attachment) {
      // Determine media type — support images only for vision (PDFs treated as text fallback)
      const isImage = attachment.mediaType.startsWith('image/');

      if (isImage) {
        // Vision message with image block + text
        currentContent = [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: attachment.mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: attachment.base64,
            },
          },
          {
            type: 'text',
            text: message?.trim() || 'Analise este arquivo e forneça um resumo detalhado em português.',
          },
        ];
      } else {
        // Non-image file — just mention the filename in the message
        const fileName = attachment.name || 'arquivo';
        currentContent = `${message?.trim() || ''}\n\n[Arquivo anexado: ${fileName} — PDF/documento não pode ser visualizado diretamente, mas você pode descrever o que está procurando.]`.trim();
      }
    } else {
      currentContent = message.trim();
    }

    const messages: Anthropic.MessageParam[] = [
      ...historyMessages,
      { role: 'user', content: currentContent },
    ];

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
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
