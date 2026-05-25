import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Team member identifiers for auto-detection
const TEAM_SIGNATURES = [
  { key: 'blue',       keywords: ['21971101000','27520102-3','C6','Blue Clínica','Blue Clinica','48459860'], label: 'Blue Clínica' },
  { key: 'anest',      keywords: ['44856036000147','EP Serviços','EP Servicos'], label: 'Anestesista (EP)' },
  { key: 'leo',        keywords: ['13604862752','01061191-1','Leonardo Valadão','Leonardo Valadao'], label: 'Leonardo Valadão Pinto' },
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
          text: `Você é um assistente OCR para a Clínica Blue. Analise este comprovante/documento e extraia as informações EXATAMENTE como aparecem no documento.

REGRAS CRÍTICAS:
- Extraia SOMENTE o que aparece literalmente no documento. NÃO invente, NÃO infira, NÃO alucine dados.
- Se um campo não estiver visível no documento, retorne null para esse campo.
- O "favorecido" é a pessoa ou empresa que RECEBE o dinheiro (destinatário/beneficiário). Leia cuidadosamente o nome exato.
- O "pagador" é quem ENVIOU o dinheiro (normalmente o paciente).
- Leia o nome do favorecido com atenção — pode ser uma clínica (ex: "Perfeita Saúde"), médico, instrumentadora, etc.

Retorne APENAS JSON válido neste formato exato (sem markdown, sem explicações):
{
  "valor": "R$ X.XXX,XX ou null",
  "data": "DD/MM/YYYY ou null",
  "favorecido": "nome exato do destinatário como aparece no comprovante, ou null",
  "chavePix": "chave PIX, CPF, CNPJ ou conta exata, ou null",
  "pagador": "nome do pagador como aparece no comprovante, ou null",
  "tipo": "PIX|TED|DOC|Boleto|Outro",
  "raw": "transcrição completa do texto visível no comprovante"
}`,
        },
      ];
    } else if (mediaType === 'application/pdf') {
      // PDF: use Anthropic document block (native PDF support)
      textContent = [
        {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: base64 },
        } as unknown as { type: 'text'; text: string },
        {
          type: 'text',
          text: `Você é um assistente OCR para a Clínica Blue. Analise este comprovante/documento PDF e extraia as informações EXATAMENTE como aparecem.

REGRAS CRÍTICAS:
- Extraia SOMENTE o que aparece literalmente no documento. NÃO invente, NÃO infira, NÃO alucine dados.
- Se um campo não estiver visível, retorne null para esse campo.
- O "favorecido" é quem RECEBE o dinheiro. O "pagador" é quem ENVIOU.
- Leia o nome do favorecido com atenção — pode ser uma clínica (ex: "Perfeita Saúde"), médico, instrumentadora.

Retorne APENAS JSON válido neste formato (sem markdown, sem explicações):
{
  "valor": "R$ X.XXX,XX ou null",
  "data": "DD/MM/YYYY ou null",
  "favorecido": "nome exato do destinatário, ou null",
  "chavePix": "chave PIX, CPF, CNPJ ou conta, ou null",
  "pagador": "nome do pagador, ou null",
  "tipo": "PIX|TED|DOC|Boleto|Outro",
  "raw": "transcrição completa do texto visível no documento"
}`,
        },
      ];
    } else {
      // Other file types
      textContent = [
        {
          type: 'text',
          text: `Arquivo: ${filename || 'documento'}. Tipo: ${mediaType}.
Extraia as informações de pagamento e retorne JSON:
{"valor":null,"data":null,"favorecido":null,"chavePix":null,"pagador":null,"tipo":"Outro","raw":"Tipo de arquivo não suportado para OCR visual. Por favor use imagem (PNG/JPG) ou PDF."}`,
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
