'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { PipelineCard, PipelineStage, Consultation, Surgery, Patient } from '@/lib/data-model';
import MayraPipeline from '../MayraPipeline';
import { safeStorage, PIPELINE_KEY, getAuthToken } from '@/lib/safe-storage';

interface PipelinePaneProps {
  initialCards?: PipelineCard[];
  cons26?: Consultation[];
  cir26?: Surgery[];
  patients?: Patient[];
}

function generateId(): string {
  return `card_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Build pipeline cards from 2026 patient journey data.
 *  Only called when BOTH Sheets pipeline AND localStorage are empty. */
function autoPopulateCards(cons26: Consultation[], cir26: Surgery[]): PipelineCard[] {
  const now = new Date().toISOString();
  // Index surgeries by normalised patient name
  const surgByName = new Map<string, Surgery>();
  for (const s of cir26) {
    surgByName.set(s.p.toLowerCase().trim(), s);
  }

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
      notes: `Consulta: ${c.d} · ${c.canal || ''}`,
    });
  }

  return cards;
}

/** Serialize a card for Sheets storage.
 *  checklist (array) → checklistJson (JSON string) so Apps Script can store it
 *  as a plain text column without losing structure. */
function serializeCardForSheets(card: PipelineCard): Record<string, unknown> {
  return {
    id:           card.id,
    patientName:  card.patientName,
    phone:        card.phone,
    procedure:    card.procedure ?? '',
    value:        card.value ?? 0,
    stage:        card.stage,
    notes:        card.notes ?? '',
    checklistJson: JSON.stringify(card.checklist ?? []),
    createdAt:    card.createdAt,
    updatedAt:    card.updatedAt,
  };
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
      cards: cards.map(serializeCardForSheets),
    }),
  });
}

export default function PipelinePane({ initialCards, cons26 = [], cir26 = [], patients = [] }: PipelinePaneProps) {
  const [cards, setCards]   = useState<PipelineCard[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load order: initialCards (from Sheets) → localStorage → auto-populate
  useEffect(() => {
    if (loaded) return;

    if (initialCards && initialCards.length > 0) {
      // Sheets is authoritative for stage/notes/checklist.
      // Merge: for each Sheets card, if localStorage has richer checklist/notes, prefer it.
      const saved = safeStorage.get<PipelineCard[]>(PIPELINE_KEY, []);
      const localById = new Map(saved.map(c => [c.id, c]));
      const merged = initialCards.map(sheetsCard => {
        const local = localById.get(sheetsCard.id);
        if (!local) return sheetsCard;
        return {
          ...sheetsCard,
          // Prefer local notes/checklist if Sheets doesn't have them (old Apps Script)
          notes:     sheetsCard.notes     ?? local.notes,
          checklist: sheetsCard.checklist ?? local.checklist,
        };
      });
      setCards(merged);
      safeStorage.set(PIPELINE_KEY, merged);
      setLoaded(true);
      return;
    }

    const saved = safeStorage.get<PipelineCard[]>(PIPELINE_KEY, []);
    if (saved.length > 0) {
      setCards(saved);
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

  // When initialCards arrives later (Sheets synced after mount), merge with current cards
  useEffect(() => {
    if (!loaded) return;
    if (initialCards && initialCards.length > 0) {
      setCards(prev => {
        const prevById = new Map(prev.map(c => [c.id, c]));
        const merged = initialCards.map(sheetsCard => {
          const current = prevById.get(sheetsCard.id);
          if (!current) return sheetsCard;
          return {
            ...sheetsCard,
            // Current in-memory card wins for notes/checklist (user may have just edited)
            notes:     current.notes     ?? sheetsCard.notes,
            checklist: current.checklist ?? sheetsCard.checklist,
          };
        });
        safeStorage.set(PIPELINE_KEY, merged);
        return merged;
      });
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
        patients={patients}
      />
    </div>
  );
}
