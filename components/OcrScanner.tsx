'use client';

// ============================================================
// OCR SCANNER — Upload/captura de imagem + extração via Gemini
// Envia o arquivo para /api/ai/ocr (server-side, chave protegida)
// e exibe os dados estruturados extraídos do comprovante.
// ============================================================

import { useState, useRef } from 'react';
import { getAuthToken } from '@/lib/safe-storage';

export interface OcrExtracted {
  valor?: string | null;
  data?: string | null;
  favorecido?: string | null;
  chavePix?: string | null;
  pagador?: string | null;
  banco?: string | null;
  tipo?: string | null;
  raw?: string;
}

export interface OcrResult {
  success?: boolean;
  engine?: string;
  extracted?: OcrExtracted;
  detectedMember?: string | null;
  detectedLabel?: string | null;
  error?: string;
}

/** Converte um File em base64 (sem o prefixo data:). */
async function fileToBase64(file: File): Promise<string> {
  return new Promise<string>((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res((reader.result as string).split(',')[1]);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

/** Chama a rota de OCR. Reutilizável por qualquer componente. */
export async function runOcr(file: File): Promise<OcrResult> {
  const base64 = await fileToBase64(file);
  const token = getAuthToken();
  const resp = await fetch('/api/ai/ocr', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ base64, mediaType: file.type, filename: file.name }),
  });
  return (await resp.json()) as OcrResult;
}

const FIELD_LABELS: { key: keyof OcrExtracted; label: string }[] = [
  { key: 'valor',      label: 'Valor' },
  { key: 'data',       label: 'Data' },
  { key: 'favorecido', label: 'Favorecido' },
  { key: 'pagador',    label: 'Pagador' },
  { key: 'chavePix',   label: 'Chave PIX' },
  { key: 'banco',      label: 'Banco' },
  { key: 'tipo',       label: 'Tipo' },
];

interface OcrScannerProps {
  /** Chamado quando a extração termina com sucesso. */
  onExtracted?: (result: OcrResult, file: File) => void;
}

export default function OcrScanner({ onExtracted }: OcrScannerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<OcrResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [filename, setFilename] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  async function processFile(file: File) {
    setLoading(true);
    setError('');
    setResult(null);
    setFilename(file.name);
    setPreview(file.type.startsWith('image/') ? URL.createObjectURL(file) : null);

    try {
      const res = await runOcr(file);
      if (res.error) {
        setError(res.error);
      } else {
        setResult(res);
        onExtracted?.(res, file);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar o arquivo');
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  const ext = result?.extracted;

  return (
    <div className="card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Hidden inputs: arquivo e câmera */}
      <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={handleInputChange} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleInputChange} />

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !loading && fileRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? '#007AFF' : '#D1D1D6'}`,
          background: dragOver ? '#E5F1FF' : '#F9F9FB',
          borderRadius: '14px',
          padding: '22px',
          textAlign: 'center',
          cursor: loading ? 'wait' : 'pointer',
          transition: 'all .15s',
        }}
      >
        {loading ? (
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#007AFF' }}>
            ⏳ Lendo documento com Gemini…
          </div>
        ) : (
          <>
            <div style={{ fontSize: '1.6rem', marginBottom: '6px' }}>🔍</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1D1D1F' }}>
              Arraste um comprovante ou clique para escolher
            </div>
            <div style={{ fontSize: '11px', color: '#86868B', marginTop: '2px' }}>
              PNG, JPG, WEBP ou PDF · extração automática por IA
            </div>
          </>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          style={{ flex: 1, minWidth: '140px', padding: '9px 14px', borderRadius: '10px', border: 'none', background: '#007AFF', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
        >
          📎 Escolher arquivo
        </button>
        <button
          onClick={() => cameraRef.current?.click()}
          disabled={loading}
          style={{ flex: 1, minWidth: '140px', padding: '9px 14px', borderRadius: '10px', border: '1.5px solid #007AFF', background: '#fff', color: '#007AFF', fontSize: '13px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
        >
          📷 Tirar foto
        </button>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: '10px', background: '#FFE5E3', color: '#FF3B30', fontWeight: 600, fontSize: '12.5px' }}>
          ❌ {error}
        </div>
      )}

      {/* Result */}
      {(preview || ext) && !loading && (
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt={filename}
              style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '12px', border: '1px solid #E5E5EA', flexShrink: 0 }}
            />
          )}
          {ext && (
            <div style={{ flex: 1, minWidth: '220px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#28A745', textTransform: 'uppercase', letterSpacing: '.6px' }}>
                  ✅ Dados extraídos
                </span>
                {result?.engine && (
                  <span style={{ fontSize: '10px', color: '#86868B' }}>{result.engine}</span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {FIELD_LABELS.map(({ key, label }) => (
                  <div key={key} style={{ display: 'flex', gap: '8px', fontSize: '12.5px' }}>
                    <span style={{ width: '86px', flexShrink: 0, color: '#86868B', fontWeight: 600 }}>{label}</span>
                    <span style={{ color: ext[key] ? '#1D1D1F' : '#AEAEB2', fontWeight: ext[key] ? 700 : 400 }}>
                      {ext[key] || '—'}
                    </span>
                  </div>
                ))}
                {result?.detectedLabel && (
                  <div style={{ marginTop: '6px', fontSize: '12px', color: '#007AFF', fontWeight: 700 }}>
                    👤 Profissional detectado: {result.detectedLabel}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
