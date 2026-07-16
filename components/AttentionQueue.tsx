'use client';

// ============================================================
// ATTENTION QUEUE — "Atenção Imediata" no topo do dashboard.
// Cruza mesversários, aniversários, pipeline e pagamentos lidos
// pelo OCR; ordena leads por prioridade (score), não por nome.
// ============================================================

import { useMemo, useState } from 'react';
import type { Surgery, Consultation, PipelineCard, AmigoLiveData, Patient } from '@/lib/data-model';
import { computeAnniversaries } from '@/lib/anniversary';
import { buildAttentionQueue, type AttentionItem } from '@/lib/commercial-intel';
import { openWhatsApp } from '@/lib/whatsapp';
import { safeStorage, PIPELINE_KEY } from '@/lib/safe-storage';

interface AttentionQueueProps {
  cir25: Surgery[];
  cir26: Surgery[];
  cons25: Consultation[];
  cons26: Consultation[];
  amigoData: AmigoLiveData;
  pipelineFromSheets: PipelineCard[] | null;
  patients: Patient[];
  syncing?: boolean;
}

function ItemRow({ item }: { item: AttentionItem }) {
  const [copied, setCopied] = useState(false);

  function handleAction(e: React.MouseEvent) {
    e.stopPropagation();
    if (item.phone && item.message) {
      openWhatsApp(item.phone, item.message);
    } else if (item.message) {
      navigator.clipboard.writeText(item.message).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }).catch(() => {});
    }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '10px 14px', borderRadius: '10px',
      background: '#fff', border: '1px solid var(--line)',
      transition: 'border-color .15s ease',
    }}>
      {/* Prioridade */}
      <span style={{
        width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
        background: item.score >= 50 ? 'var(--critical)' : item.score >= 40 ? 'var(--warn)' : 'var(--accent)',
      }} />

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.patientName}
          </span>
          {item.tag && (
            <span className={`tag tag-${item.tag.tone}`} title={item.tag.reason}>{item.tag.label}</span>
          )}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--ink-2)', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.reasons.join(' · ')}
        </div>
      </div>

      {item.message && (
        <button
          onClick={handleAction}
          title={item.phone ? 'Enviar via WhatsApp' : 'Copiar rascunho'}
          style={{
            flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '5px 11px', borderRadius: '8px',
            border: 'none',
            background: copied ? '#F0F7F2' : 'var(--accent)',
            color: copied ? 'var(--positive)' : '#fff',
            fontSize: '11.5px', fontWeight: 600, cursor: 'pointer',
            transition: 'all .15s ease', whiteSpace: 'nowrap',
          }}
        >
          {copied ? 'Copiado' : 'Contatar'}
        </button>
      )}
    </div>
  );
}

export default function AttentionQueue({
  cir25, cir26, cons25, cons26, amigoData, pipelineFromSheets, patients, syncing,
}: AttentionQueueProps) {
  const [expanded, setExpanded] = useState(false);

  const queue = useMemo(() => {
    const today = new Date();
    const anniversaries = [
      ...computeAnniversaries(cir25, 2025, today, 7),
      ...computeAnniversaries(cir26, 2026, today, 7),
    ];
    const pipeline = pipelineFromSheets ?? safeStorage.get<PipelineCard[]>(PIPELINE_KEY, []);
    const phoneMap = new Map<string, string>();
    for (const p of patients) {
      if (p.phone) phoneMap.set(p.name.toLowerCase().trim(), p.phone);
    }
    return buildAttentionQueue({
      anniversaries,
      birthdaysToday: amigoData.birthdays ?? [],
      pipeline,
      surgeries: [...cir25, ...cir26],
      consultations: [...cons25, ...cons26],
      phoneByName: (name) => phoneMap.get(name.toLowerCase().trim()) ?? '',
      today,
    });
  }, [cir25, cir26, cons25, cons26, amigoData, pipelineFromSheets, patients]);

  // Skeleton sutil enquanto sincroniza e ainda não há fila
  if (syncing && queue.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
        <div className="skeleton" style={{ width: '160px', height: '14px' }} />
        <div className="skeleton" style={{ height: '46px' }} />
        <div className="skeleton" style={{ height: '46px' }} />
      </div>
    );
  }

  if (queue.length === 0) return null;

  const visible = expanded ? queue : queue.slice(0, 4);

  return (
    <div style={{ marginBottom: '28px', animation: 'fadeIn .25s ease both' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-.1px' }}>
            Atenção imediata
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--ink-3)' }}>
            {queue.length} lead{queue.length !== 1 ? 's' : ''} por prioridade
          </span>
        </div>
        {queue.length > 4 && (
          <button
            onClick={() => setExpanded(v => !v)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '12px', fontWeight: 600, color: 'var(--accent)', padding: '2px 4px',
            }}
          >
            {expanded ? 'Ver menos' : `Ver todos (${queue.length})`}
          </button>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {visible.map((item) => <ItemRow key={item.patientName} item={item} />)}
      </div>
    </div>
  );
}
