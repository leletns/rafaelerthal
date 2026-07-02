// ============================================================
// GEMINI — Cliente server-side da API Google Gemini (tier gratuito)
//
// Usado exclusivamente em rotas de API (nunca no browser) para que
// a GEMINI_API_KEY permaneça segura em variável de ambiente.
//
// Obs.: o modelo gemini-1.5-flash foi desligado pelo Google em
// set/2025. O padrão abaixo é o gemini-2.5-flash (gratuito e com
// visão); pode ser trocado via env GEMINI_MODEL sem alterar código.
// ============================================================

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-2.5-flash';

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL || DEFAULT_MODEL;
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

interface GeminiVisionRequest {
  /** Conteúdo do arquivo em base64 (sem o prefixo data:). */
  base64: string;
  /** MIME type: image/jpeg, image/png, image/webp, application/pdf... */
  mimeType: string;
  /** Instrução textual enviada junto com a imagem. */
  prompt: string;
  maxOutputTokens?: number;
}

interface GeminiResponse {
  candidates?: {
    content?: { parts?: { text?: string }[] };
    finishReason?: string;
  }[];
  error?: { code: number; message: string; status: string };
}

/**
 * Envia imagem/PDF + prompt ao Gemini e retorna o texto gerado.
 * `responseMimeType: application/json` força saída JSON estruturada
 * e `temperature: 0` elimina variação criativa (ideal para OCR).
 */
export async function geminiVisionJSON({
  base64,
  mimeType,
  prompt,
  maxOutputTokens = 2048,
}: GeminiVisionRequest): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY não configurada');

  const model = getGeminiModel();
  const res = await fetch(`${GEMINI_BASE_URL}/${model}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { inline_data: { mime_type: mimeType, data: base64 } },
            { text: prompt },
          ],
        },
      ],
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
        maxOutputTokens,
      },
    }),
  });

  const json = (await res.json()) as GeminiResponse;

  if (!res.ok || json.error) {
    const msg = json.error?.message ?? `HTTP ${res.status}`;
    throw new Error(`Gemini API: ${msg}`);
  }

  const text = json.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? '')
    .join('') ?? '';

  if (!text.trim()) {
    throw new Error(`Gemini API: resposta vazia (finishReason: ${json.candidates?.[0]?.finishReason ?? 'desconhecido'})`);
  }

  return text;
}
