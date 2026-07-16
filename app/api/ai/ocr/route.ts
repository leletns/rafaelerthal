import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { geminiVisionJSON, isGeminiConfigured, getGeminiModel } from '@/lib/gemini';

// ============================================================
// OCR — Google Gemini (tier gratuito) como engine primária.
// Fallback automático para Anthropic Claude quando GEMINI_API_KEY
// não estiver configurada (ou a chamada Gemini falhar).
// ============================================================

// Team member identifiers for auto-detection
const TEAM_SIGNATURES = [
  { key: 'blue',       keywords: ['21971101000','27520102-3','C6','Blue Clínica','Blue Clinica','48459860'], label: 'Blue Clínica' },
  { key: 'anest',      keywords: ['44856036000147','EP Serviços','EP Servicos'], label: 'Anestesista (EP)' },
  { key: 'leo',        keywords: ['13604862752','01061191-1','Leonardo Valadão','Leonardo Valadao'], label: 'Leonardo Valadão Pinto' },
  { key: 'magda',      keywords: ['21995892783','21 995892783','Magda Pires'], label: 'Magda Pires (Instrumentadora)' },
  { key: 'adrielle',   keywords: ['adriellelopesinstrumentacao','Adrielle Lopes'], label: 'Adrielle Lopes (Instrumentadora)' },
  { key: 'fisio',      keywords: ['cintyafisiorj','Perfeita Saúde','Perfeita Saude'], label: 'Fisioterapia (Cintya)' },
];

// Prompt rigoroso: extração literal, JSON estruturado, sem alucinação.
const OCR_PROMPT = `Você é um sistema OCR de alta precisão da Clínica Blue. Analise a imagem/documento anexado (comprovante de pagamento, recibo ou documento financeiro) e extraia os dados em JSON estruturado.

REGRAS OBRIGATÓRIAS:
1. Extraia SOMENTE o que aparece LITERALMENTE no documento. NÃO invente, NÃO infira, NÃO alucine dados.
2. IGNORE ruídos visuais: marcas d'água, logotipos decorativos, elementos de interface (botões, barras de status), sombras, reflexos e texto cortado ilegível.
3. Se um campo não estiver visível ou legível, retorne null para esse campo — nunca chute.
4. O "favorecido" é quem RECEBE o dinheiro (destinatário/beneficiário). Leia o nome exato.
5. O "pagador" é quem ENVIOU o dinheiro (normalmente o paciente).
6. Valores monetários no formato brasileiro exato do documento (ex: "R$ 1.234,56").
7. Datas no formato DD/MM/YYYY.
8. Responda APENAS com o objeto JSON — sem markdown, sem comentários, sem texto extra.

FORMATO DE SAÍDA (JSON):
{
  "valor": "R$ X.XXX,XX ou null",
  "data": "DD/MM/YYYY ou null",
  "favorecido": "nome exato do destinatário como aparece no comprovante, ou null",
  "chavePix": "chave PIX, CPF, CNPJ ou conta exata, ou null",
  "pagador": "nome do pagador como aparece no comprovante, ou null",
  "banco": "instituição financeira de origem, ou null",
  "tipo": "PIX|TED|DOC|Boleto|Cartão|Outro",
  "raw": "transcrição completa e fiel de todo o texto legível do documento"
}`;

const GEMINI_SUPPORTED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
  'application/pdf',
];

interface ExtractedData {
  valor?: string | null;
  data?: string | null;
  favorecido?: string | null;
  chavePix?: string | null;
  pagador?: string | null;
  banco?: string | null;
  tipo?: string | null;
  raw?: string;
}

function parseJsonLoose(text: string): ExtractedData {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  try {
    return jsonMatch ? (JSON.parse(jsonMatch[0]) as ExtractedData) : { raw: text };
  } catch {
    return { raw: text };
  }
}

function detectTeamMember(extracted: ExtractedData): { key: string | null; label: string | null } {
  const searchText = JSON.stringify(extracted).toLowerCase();
  for (const sig of TEAM_SIGNATURES) {
    if (sig.keywords.some((k) => searchText.includes(k.toLowerCase()))) {
      return { key: sig.key, label: sig.label };
    }
  }
  return { key: null, label: null };
}

// ── Engine 1: Google Gemini (gratuito) ─────────────────────────
async function ocrWithGemini(base64: string, mediaType: string): Promise<ExtractedData> {
  const text = await geminiVisionJSON({
    base64,
    mimeType: mediaType,
    prompt: OCR_PROMPT,
    maxOutputTokens: 2048,
  });
  return parseJsonLoose(text);
}

// ── Engine 2: Anthropic Claude (fallback) ──────────────────────
async function ocrWithClaude(base64: string, mediaType: string): Promise<ExtractedData> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const isImage = mediaType.startsWith('image/');

  const mediaBlock: Anthropic.ContentBlockParam = isImage
    ? {
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
          data: base64,
        },
      }
    : {
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: base64 },
      };

  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1024,
    messages: [{ role: 'user', content: [mediaBlock, { type: 'text', text: OCR_PROMPT }] }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
  return parseJsonLoose(text);
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  const validToken = process.env.DASHBOARD_ACCESS_TOKEN;
  if (validToken && token !== validToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hasGemini = isGeminiConfigured();
  const hasClaude = Boolean(process.env.ANTHROPIC_API_KEY);
  if (!hasGemini && !hasClaude) {
    return NextResponse.json(
      { error: 'Nenhuma engine OCR configurada. Defina GEMINI_API_KEY (gratuita) ou ANTHROPIC_API_KEY no ambiente.' },
      { status: 500 }
    );
  }

  try {
    const body = (await req.json()) as { base64: string; mediaType: string; filename?: string };
    const { base64, mediaType } = body;

    if (!base64) return NextResponse.json({ error: 'base64 required' }, { status: 400 });
    if (!mediaType) return NextResponse.json({ error: 'mediaType required' }, { status: 400 });

    const isImage = mediaType.startsWith('image/');
    const isPdf = mediaType === 'application/pdf';
    if (!isImage && !isPdf) {
      return NextResponse.json({
        success: true,
        engine: 'none',
        extracted: {
          valor: null, data: null, favorecido: null, chavePix: null, pagador: null, banco: null,
          tipo: 'Outro',
          raw: 'Tipo de arquivo não suportado para OCR visual. Use imagem (PNG/JPG/WEBP) ou PDF.',
        },
        detectedMember: null,
        detectedLabel: null,
      });
    }

    let extracted: ExtractedData;
    let engine: string;

    const geminiEligible = hasGemini && GEMINI_SUPPORTED_TYPES.includes(mediaType);
    if (geminiEligible) {
      try {
        extracted = await ocrWithGemini(base64, mediaType);
        engine = `gemini (${getGeminiModel()})`;
      } catch (geminiErr) {
        // Free tier pode estourar rate limit — cai para o Claude se disponível
        if (!hasClaude) throw geminiErr;
        extracted = await ocrWithClaude(base64, mediaType);
        engine = 'claude (fallback)';
      }
    } else if (hasClaude) {
      extracted = await ocrWithClaude(base64, mediaType);
      engine = 'claude';
    } else {
      extracted = await ocrWithGemini(base64, mediaType);
      engine = `gemini (${getGeminiModel()})`;
    }

    const detected = detectTeamMember(extracted);

    return NextResponse.json({
      success: true,
      engine,
      extracted,
      detectedMember: detected.key,
      detectedLabel: detected.label,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
