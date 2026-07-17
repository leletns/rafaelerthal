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

/** Migrate old pipeline stage values to new 4-stage model. */
function migrateStage(old: string): PipelineStage {
  const map: Record<string, PipelineStage> = {
    consulta_agendada:  'orc_enviado',
    compareceu:         'orc_enviado',
    orc_pendente:       'orc_enviado',
    orc_apresentado:    'orc_enviado',
    followup_agendado:  'orc_enviado',
    retomada:           'orc_enviado',
    nao_fechou:         'perdida',
    sinal_pago:         'sinal_pago',
    followup:           'followup',
    avista_pago:        'cirurgia_agendada',
    cirurgia_agendada:  'cirurgia_agendada',
    cirurgia_realizada: 'cirurgia_realizada',
    perdida:            'perdida',
    orc_enviado:        'orc_enviado',
  };
  return map[old] ?? 'orc_enviado';
}

/** Build pipeline cards from 2026 patient journey data.
 *  Only called when BOTH Sheets pipeline AND localStorage are empty. */
function autoPopulateCards(cons26: Consultation[], cir26: Surgery[]): PipelineCard[] {
  const now = new Date().toISOString();

  const cards: PipelineCard[] = [];
  const seen = new Set<string>();

  // 1. Patients with a surgery → realizada (data já passou) ou agendada (futura)
  const today = new Date();
  for (const s of cir26) {
    const slug = s.p.toLowerCase().trim();
    if (seen.has(slug)) continue;
    seen.add(slug);
    const cons = cons26.find(c => c.p.toLowerCase().trim() === slug);
    const [dd, mm] = s.d.split('/').map(Number);
    const surgDate = dd && mm ? new Date(s.ano || 2026, mm - 1, dd) : null;
    const done = surgDate !== null && surgDate.getTime() <= today.getTime();
    cards.push({
      id: generateId(),
      patientName: s.p,
      phone: cons?.tel || '',
      procedure: s.c || '',
      value: s.v || 0,
      stage: (done ? 'cirurgia_realizada' : 'cirurgia_agendada') as PipelineStage,
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
      notes: `Consulta: ${c.d} · ${c.canal || ''}`,
    });
  }

  return cards;
}

/** Push all pipeline cards to Sheets (debounced). */
async function pushPipelineToSheets(cards: PipelineCard[]): Promise<void> {
  const token = getAuthToken();
  if (!token) return;

  const sheetsUrl = '/api/sheets/push';
  await fetch(sheetsUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      acao: 'pipeline_bulk',
      cards,
    }),
  });
}

export default function PipelinePane({ initialCards, cons26 = [], cir26 = [] }: PipelinePaneProps) {
  const [cards, setCards]   = useState<PipelineCard[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
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
      setSyncing(true);
      try {
        await pushPipelineToSheets(updatedCards);
      } catch {
        // Sheets unavailable — data is safe in localStorage
      } finally {
        setSyncing(false);
      }
    }, 2000); // 2-second debounce
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
      {syncing && (
        <div style={{
          position: 'absolute', top: 0, right: 0, zIndex: 10,
          fontSize: '11px', color: '#007AFF', fontWeight: 600,
          background: '#E5F1FF', padding: '4px 10px', borderRadius: '0 0 0 8px',
          display: 'flex', alignItems: 'center', gap: '4px',
        }}>
          <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#007AFF', animation: 'pulse 1s infinite' }} />
          Salvando no Sheets…
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
