'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { PipelineCard, PipelineStage, Consultation, Surgery } from '@/lib/data-model';
import MayraPipeline from '../MayraPipeline';
import { safeStorage, PIPELINE_KEY, getAuthToken } from '@/lib/safe-storage';

interface PipelinePaneProps {
  initialCards?: PipelineCard[];
  cons26?: Consultation[];
  cir26?: Surgery[];
}

function generateId(): string {
  return `card_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Converte etapas antigas para o modelo atual de 5 colunas.
 *  Uma etapa já válida passa intacta — antes, mover para Follow-up
 *  voltava sozinho para "Orçamento enviado" no recarregamento. */
const ETAPAS_VALIDAS = new Set<PipelineStage>([
  'orc_enviado', 'sinal_pago', 'followup', 'cirurgia_agendada', 'perdida',
]);

function migrateStage(old: string): PipelineStage {
  if (ETAPAS_VALIDAS.has(old as PipelineStage)) return old as PipelineStage;
  const map: Record<string, PipelineStage> = {
    consulta_agendada:  'orc_enviado',
    compareceu:         'orc_enviado',
    orc_pendente:       'orc_enviado',
    orc_apresentado:    'orc_enviado',
    followup_agendado:  'followup',
    retomada:           'followup',
    nao_fechou:         'perdida',
    avista_pago:        'cirurgia_agendada',
  };
  return map[old] ?? 'orc_enviado';
}

/** Build pipeline cards from 2026 patient journey data.
 *  Only called when BOTH Sheets pipeline AND localStorage are empty. */
function autoPopulateCards(cons26: Consultation[], cir26: Surgery[]): PipelineCard[] {
  const now = new Date().toISOString();

  const cards: PipelineCard[] = [];
  const seen = new Set<string>();

  // 1. Patients who had surgery → cirurgia_agendada (surgery completed)
  for (const s of cir26) {
    const slug = s.p.toLowerCase().trim();
    if (seen.has(slug)) continue;
    seen.add(slug);
    const cons = cons26.find(c => c.p.toLowerCase().trim() === slug);
    cards.push({
      id: generateId(),
      patientName: s.p,
      phone: cons?.tel || '',
      procedure: s.c || '',
      value: s.v || 0,
      stage: 'cirurgia_agendada' as PipelineStage,
      createdAt: now,
      updatedAt: now,
      notes: `Cirurgia: ${s.d}/${s.mes || '2026'}`,
    });
  }

  // 2. Patients who consulted but have NO surgery → orc_enviado
  for (const c of cons26) {
    const slug = c.p.toLowerCase().trim();
    if (seen.has(slug)) continue;
    seen.add(slug);
    cards.push({
      id: generateId(),
      patientName: c.p,
      phone: c.tel || '',
      procedure: '',
      value: 0,
      stage: 'orc_enviado' as PipelineStage,
      createdAt: now,
      updatedAt: now,
      notes: [`Consulta: ${c.d}`, c.canal].filter(Boolean).join(' · '),
    });
  }

  return cards;
}

/** Push all pipeline cards to Sheets (debounced). */
async function pushPipelineToSheets(cards: PipelineCard[]): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new Error('sem sessão');

  const res = await fetch('/api/sheets/push', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ acao: 'pipeline_bulk', cards }),
  });

  if (!res.ok) throw new Error('falha ao gravar');
  const json = await res.json().catch(() => null);
  if (json && json.success === false) throw new Error('falha ao gravar');
}

export default function PipelinePane({ initialCards, cons26 = [], cir26 = [] }: PipelinePaneProps) {
  const [cards, setCards]   = useState<PipelineCard[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'offline'>('idle');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load order: initialCards (from Sheets) → localStorage → auto-populate
  useEffect(() => {
    if (loaded) return;

    if (initialCards && initialCards.length > 0) {
      // Sheets has pipeline data — use it as authoritative, migrating old stages
      const migrated = initialCards.map(c => ({ ...c, stage: migrateStage(c.stage) }));
      setCards(migrated);
      safeStorage.set(PIPELINE_KEY, migrated);
      setLoaded(true);
      return;
    }

    const saved = safeStorage.get<PipelineCard[]>(PIPELINE_KEY, []);
    if (saved.length > 0) {
      // Migrate all cards to new stages
      const migrated = saved.map(c => ({ ...c, stage: migrateStage(c.stage) }));
      setCards(migrated);
      setLoaded(true);
      return;
    }

    // Nothing in Sheets or localStorage — auto-populate from patient data
    if (cons26.length > 0 || cir26.length > 0) {
      const auto = autoPopulateCards(cons26, cir26);
      if (auto.length > 0) {
        setCards(auto);
        safeStorage.set(PIPELINE_KEY, auto);
        // Schedule immediate save to Sheets
        scheduleSheetsSave(auto);
      }
      setLoaded(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCards, cons26, cir26]);

  // When initialCards arrives later (Sheets synced after mount), update if we auto-populated
  useEffect(() => {
    if (!loaded) return;
    if (initialCards && initialCards.length > 0) {
      const migrated = initialCards.map(c => ({ ...c, stage: migrateStage(c.stage) }));
      setCards(migrated);
      safeStorage.set(PIPELINE_KEY, migrated);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCards]);

  const scheduleSheetsSave = useCallback((updatedCards: PipelineCard[]) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaveState('saving');
      try {
        await pushPipelineToSheets(updatedCards);
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 2500);
      } catch {
        // Nada se perde: as alterações continuam guardadas neste aparelho.
        setSaveState('offline');
      }
    }, 1200);
  }, []);

  function saveCards(updated: PipelineCard[]) {
    setCards(updated);
    safeStorage.set(PIPELINE_KEY, updated);
    scheduleSheetsSave(updated);
  }

  function handleUpdateCard(card: PipelineCard) {
    saveCards(cards.map((c) => (c.id === card.id ? { ...card, updatedAt: new Date().toISOString() } : c)));
  }

  function handleAddCard(data: Omit<PipelineCard, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString();
    saveCards([...cards, { ...data, id: generateId(), createdAt: now, updatedAt: now }]);
  }

  function handleDeleteCard(id: string) {
    saveCards(cards.filter((c) => c.id !== id));
  }

  return (
    <div style={{ position: 'relative' }}>
      {saveState !== 'idle' && (
        <div
          role="status"
          style={{
            position: 'fixed', left: '24px', bottom: '24px', zIndex: 30,
            boxShadow: 'var(--shadow-2)',
            fontSize: '12px', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '5px 12px', borderRadius: '999px',
            background: saveState === 'offline' ? 'var(--tint-orange)' : 'var(--tint-green)',
            color: saveState === 'offline' ? 'var(--c-orange)' : 'var(--c-green)',
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: 'currentColor',
              animation: saveState === 'saving' ? 'pulse 1s infinite' : undefined,
            }}
          />
          {saveState === 'saving' ? 'Salvando…'
            : saveState === 'saved' ? 'Alterações salvas'
            : 'Salvo neste aparelho — sincroniza assim que a conexão voltar'}
        </div>
      )}

      <MayraPipeline
        cards={cards}
        onUpdateCard={handleUpdateCard}
        onAddCard={handleAddCard}
        onDeleteCard={handleDeleteCard}
      />
    </div>
  );
}
