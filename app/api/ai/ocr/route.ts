import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Team member identifiers for auto-detection
const TEAM_SIGNATURES = [
  { key: 'blue',       keywords: ['21971101000','27520102-3','C6','Blue Clínica','Blue Clinica','48459860'], label: 'Blue Clínica' },
  { key: 'anest',      keywords: ['44856036000147','EP Serviços','EP Servicos'], label: 'Anestesista (EP)' },
  { key: 'leo',        keywords: ['13604862752','01061191-1','Leonardo Valadão','Leonardo Valadao','Santander'], label: 'Leonardo Valadão Pinto' },
  { key: 'magda',      keywords: ['21995892783','21 995892783','Magda Pires'], label: 'Magda Pires (Instrumentadora)' },
  { key: 'adrielle',   keywords: ['adriellelopesinstrumentacao','Adrielle Lopes'], label: 'Adrielle Lopes (Instrumentadora)' },
  { key: 'fisio',      keywords: ['cintyafisiorj','Perfeita Saúde','Perfeita Saude'], label: 'Fisioterapia (Cintya)' },
];

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  const validToken = process.env.DASHBOARD_ACCESS_TOKEN;
  if (validToken && token !== validToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  try {
    const body = await req.json() as { base64: string; mediaType: string; filename?: string };
    const { base64, mediaType, filename } = body;

    if (!base64) return NextResponse.json({ error: 'base64 required' }, { status: 400 });

    const isImage = mediaType.startsWith('image/');

    type MessageContent = Parameters<typeof client.messages.create>[0]['messages'][0]['content'];

    let textContent: MessageContent;
    if (isImage) {
      textContent = [
        {
          type: 'image',
          source: { type: 'base64', media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp', data: base64 },
        },
        {
          type: 'text',
          text: `Você é um assistente OCR para a Clínica Blue. Analise este comprovante/documento e extraia:
1. Valor do pagamento (em reais)
2. Data do pagamento
3. Nome do favorecido / destinatário
4. Chave PIX ou conta bancária
5. Nome do pagador / paciente (se visível)
6. Tipo de documento (comprovante PIX, TED, boleto, etc.)

Retorne APENAS JSON válido neste formato exato:
{
  "valor": "R$ X.XXX,XX",
  "data": "DD/MM/YYYY",
  "favorecido": "nome",
  "chavePix": "chave ou conta",
  "pagador": "nome ou null",
  "tipo": "PIX|TED|DOC|Boleto|Outro",
  "raw": "texto extraído do comprovante"
}`,
        },
      ];
    } else {
      // Non-image: treat as text extraction from filename description
      textContent = [
        {
          type: 'text',
          text: `Arquivo: ${filename || 'documento'}. Tipo: ${mediaType}. Base64: ${base64.substring(0, 200)}...

Extraia as informações de pagamento e retorne JSON:
{"valor":"","data":"","favorecido":"","chavePix":"","pagador":null,"tipo":"Outro","raw":"Arquivo não suportado para OCR visual"}`,
        },
      ];
    }

    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 512,
      messages: [{ role: 'user', content: textContent }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}';

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const extracted = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: text };

    // Auto-detect team member from extracted data
    let detectedMember: string | null = null;
    const searchText = JSON.stringify(extracted).toLowerCase();
    for (const sig of TEAM_SIGNATURES) {
      if (sig.keywords.some(k => searchText.includes(k.toLowerCase()))) {
        detectedMember = sig.key;
        break;
      }
    }

    return NextResponse.json({
      success: true,
      extracted,
      detectedMember,
      detectedLabel: TEAM_SIGNATURES.find(s => s.key === detectedMember)?.label ?? null,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
