'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { PipelineCard, PipelineStage, PipelineCheckItem, Patient } from '@/lib/data-model';
import WhatsAppButton from './WhatsAppButton';
import { formatCurrency } from '@/lib/dashboard-calculations';

const STAGES: { id: PipelineStage; label: string; color: string; emoji: string }[] = [
  { id: 'orc_enviado',       label: 'Orçamento enviado', color: '#FF9500', emoji: '📋' },
  { id: 'sinal_pago',        label: 'Sinal pago',        color: '#5856D6', emoji: '💰' },
  { id: 'followup',          label: 'Follow-up',         color: '#007AFF', emoji: '📞' },
  { id: 'cirurgia_agendada', label: 'Cirurgia agendada', color: '#28A745', emoji: '✂️' },
  { id: 'perdida',           label: 'Perdida',           color: '#FF3B30', emoji: '❌' },
];

interface MayraPipelineProps {
  cards: PipelineCard[];
  onUpdateCard: (card: PipelineCard) => void;
  onAddCard: (card: Omit<PipelineCard, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDeleteCard: (id: string) => void;
  patients?: Patient[];
}

interface NewCardForm {
  patientName: string;
  phone: string;
  procedure: string;
  value: string;
  stage: PipelineStage;
  notes: string;
}

// ── Fuzzy name helpers ───────────────────────────────────────
function nameTokens(name: string): string[] {
  const stop = new Set(['dos', 'das', 'des', 'del', 'von', 'van', 'de', 'da', 'do', 'di', 'e']);
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/\s+/)
    .filter(t => t.length > 2 && !stop.has(t));
}

function findPatientByName(name: string, patients: Patient[]): Patient | undefined {
  const tokensB = new Set(nameTokens(name));
  return patients.find(p => nameTokens(p.name).filter(t => tokensB.has(t)).length >= 2);
}

// ── Card Profile Panel ───────────────────────────────────────
function CardProfile({
  card,
  patients,
  onUpdateCard,
  onDeleteCard,
  onClose,
}: {
  card: PipelineCard;
  patients: Patient[];
  onUpdateCard: (c: PipelineCard) => void;
  onDeleteCard: (id: string) => void;
  onClose: () => void;
}) {
  const patient = findPatientByName(card.patientName, patients);
  const [localNotes, setLocalNotes] = useState(card.notes ?? '');
  const [checklistText, setChecklistText] = useState('');
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync notes when card.notes changes externally
  useEffect(() => { setLocalNotes(card.notes ?? ''); }, [card.notes]);

  const handleNotesChange = useCallback((text: string) => {
    setLocalNotes(text);
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => {
      onUpdateCard({ ...card, notes: text, updatedAt: new Date().toISOString() });
    }, 600);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card, onUpdateCard]);

  function handleStageChange(stage: PipelineStage) {
    onUpdateCard({ ...card, stage, updatedAt: new Date().toISOString() });
  }

  function addCheckItem() {
    if (!checklistText.trim()) return;
    const item: PipelineCheckItem = {
      id: `chk_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      text: checklistText.trim(),
      done: false,
      createdAt: new Date().toISOString(),
    };
    onUpdateCard({ ...card, checklist: [...(card.checklist ?? []), item], updatedAt: new Date().toISOString() });
    setChecklistText('');
  }

  function toggleCheck(id: string) {
    const checklist = (card.checklist ?? []).map(i => i.id === id ? { ...i, done: !i.done } : i);
    onUpdateCard({ ...card, checklist, updatedAt: new Date().toISOString() });
  }

  function deleteCheck(id: string) {
    const checklist = (card.checklist ?? []).filter(i => i.id !== id);
    onUpdateCard({ ...card, checklist, updatedAt: new Date().toISOString() });
  }

  const totalRevenue = patient
    ? patient.surgeries.reduce((a, s) => a + s.v, 0)
    : (card.value ?? 0);

  const stageInfo = STAGES.find(s => s.id === card.stage) ?? STAGES[0];

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200 }}
        onClick={onClose}
      />
      {/* Slide-in panel */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 'min(440px, 100vw)',
          background: '#fff',
          zIndex: 201,
          overflowY: 'auto',
          boxShadow: '-6px 0 32px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
          gap: '18px',
        }}
      >
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#007AFF', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 600, padding: 0 }}
          >
            ← Fechar
          </button>
          <button
            onClick={() => { onDeleteCard(card.id); onClose(); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF3B30', fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 600, padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            Remover
          </button>
        </div>

        {/* Patient name + info */}
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1D1D1F', margin: '0 0 4px' }}>
            {card.patientName}
          </h2>
          {card.procedure && (
            <div style={{ fontSize: '0.82rem', color: '#86868B', marginBottom: '6px' }}>{card.procedure}</div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {card.phone && <WhatsAppButton phone={card.phone} size="sm" variant="icon" />}
            {card.phone && <span style={{ fontSize: '0.8rem', color: '#86868B', fontFamily: 'monospace' }}>{card.phone}</span>}
            {totalRevenue > 0 && (
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#28A745' }}>
                {formatCurrency(totalRevenue)}
              </span>
            )}
          </div>
        </div>

        {/* Stage selector */}
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
            Etapa atual
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {STAGES.map(s => (
              <button
                key={s.id}
                onClick={() => handleStageChange(s.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  background: card.stage === s.id ? s.color : `${s.color}18`,
                  color: card.stage === s.id ? '#fff' : s.color,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
              >
                {s.emoji} {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Patient history from dashboard */}
        {patient && (patient.surgeries.length > 0 || patient.consultations.length > 0) && (
          <div style={{ background: '#F9F9FB', borderRadius: '14px', padding: '14px' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>
              Histórico clínico
            </div>
            {patient.surgeries.length > 0 && (
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#28A745', marginBottom: '4px' }}>
                  ✂️ {patient.surgeries.length} cirurgia{patient.surgeries.length !== 1 ? 's' : ''} · {formatCurrency(patient.surgeries.reduce((a, s) => a + s.v, 0))}
                </div>
                {patient.surgeries.map((s, i) => (
                  <div key={i} style={{ fontSize: '0.72rem', color: '#86868B', marginTop: '2px', paddingLeft: '16px' }}>
                    {s.d} · {s.mes} · {s.c}
                  </div>
                ))}
              </div>
            )}
            {patient.consultations.length > 0 && (
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#5856D6', marginBottom: '4px' }}>
                  💬 {patient.consultations.length} consulta{patient.consultations.length !== 1 ? 's' : ''}
                </div>
                {patient.consultations.map((c, i) => (
                  <div key={i} style={{ fontSize: '0.72rem', color: '#86868B', marginTop: '2px', paddingLeft: '16px' }}>
                    {c.d} · {c.mes} · {c.canal || '—'}
                    {c.obs && <span style={{ color: '#AEAEB2' }}> · {c.obs}</span>}
                  </div>
                ))}
              </div>
            )}
            {patient.city && (
              <div style={{ marginTop: '8px', fontSize: '0.72rem', color: '#86868B' }}>
                📍 {patient.city}
                {patient.canal && ` · Canal: ${patient.canal}`}
              </div>
            )}
          </div>
        )}

        {/* Observations / Notes */}
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
            Observações
          </div>
          <textarea
            value={localNotes}
            onChange={e => handleNotesChange(e.target.value)}
            placeholder="Anote qualquer informação relevante sobre esta paciente…"
            style={{
              width: '100%',
              minHeight: '130px',
              padding: '12px',
              borderRadius: '10px',
              border: '1.5px solid #E5E5EA',
              fontSize: '0.82rem',
              fontFamily: 'inherit',
              color: '#1D1D1F',
              background: '#F9F9FB',
              resize: 'vertical',
              boxSizing: 'border-box',
              lineHeight: 1.5,
            }}
          />
          <div style={{ fontSize: '0.68rem', color: '#AEAEB2', marginTop: '4px' }}>
            Salvo automaticamente
          </div>
        </div>

        {/* Checklist */}
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>
            Checklist
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
            {(card.checklist ?? []).length === 0 && (
              <div style={{ fontSize: '0.78rem', color: '#AEAEB2', fontStyle: 'italic' }}>Nenhuma tarefa ainda</div>
            )}
            {(card.checklist ?? []).map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => toggleCheck(item.id)}
                  style={{
                    width: '20px', height: '20px',
                    borderRadius: '5px',
                    border: `2px solid ${item.done ? '#28A745' : '#AEAEB2'}`,
                    background: item.done ? '#28A745' : '#fff',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, padding: 0,
                    transition: 'all 0.15s',
                  }}
                >
                  {item.done && <span style={{ color: '#fff', fontSize: '11px', fontWeight: 900, lineHeight: 1 }}>✓</span>}
                </button>
                <span style={{
                  flex: 1,
                  fontSize: '0.82rem',
                  color: item.done ? '#AEAEB2' : '#1D1D1F',
                  textDecoration: item.done ? 'line-through' : 'none',
                  lineHeight: 1.4,
                }}>
                  {item.text}
                </span>
                <button
                  onClick={() => deleteCheck(item.id)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#AEAEB2', padding: '2px 4px', fontSize: '13px',
                    lineHeight: 1,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#FF3B30')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#AEAEB2')}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              value={checklistText}
              onChange={e => setChecklistText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCheckItem(); } }}
              placeholder="Nova tarefa…"
              style={{
                flex: 1, padding: '9px 12px',
                borderRadius: '8px', border: '1.5px solid #E5E5EA',
                fontSize: '0.82rem', fontFamily: 'inherit', background: '#F9F9FB',
              }}
            />
            <button
              onClick={addCheckItem}
              disabled={!checklistText.trim()}
              style={{
                padding: '9px 14px', borderRadius: '8px', border: 'none',
                background: checklistText.trim() ? '#007AFF' : '#C7C7CC',
                color: '#fff', cursor: checklistText.trim() ? 'pointer' : 'default',
                fontFamily: 'inherit', fontWeight: 700, fontSize: '0.85rem',
                transition: 'background 0.15s',
              }}
            >
              +
            </button>
          </div>
        </div>

        {/* Checklist progress */}
        {(card.checklist ?? []).length > 0 && (() => {
          const total = card.checklist!.length;
          const done  = card.checklist!.filter(i => i.done).length;
          const pct   = Math.round((done / total) * 100);
          return (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#86868B', marginBottom: '4px' }}>
                <span>{done}/{total} concluídas</span>
                <span style={{ fontWeight: 700, color: pct === 100 ? '#28A745' : '#007AFF' }}>{pct}%</span>
              </div>
              <div style={{ height: '5px', background: '#F2F2F7', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#28A745' : '#007AFF', borderRadius: '3px', transition: 'width 0.3s ease' }} />
              </div>
            </div>
          );
        })()}
      </div>
    </>
  );
}

// ── Main Pipeline component ──────────────────────────────────
export default function MayraPipeline({
  cards,
  onUpdateCard,
  onAddCard,
  onDeleteCard,
  patients = [],
}: MayraPipelineProps) {
  const [dragging, setDragging]       = useState<string | null>(null);
  const [dragOver, setDragOver]       = useState<PipelineStage | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal]     = useState(false);
  const [newCard, setNewCard] = useState<NewCardForm>({
    patientName: '', phone: '', procedure: '', value: '', stage: 'orc_enviado', notes: '',
  });

  // Refs to avoid stale closures in document event listeners
  const cardsRef   = useRef(cards);
  const pointerRef = useRef<{ startX: number; startY: number; cardId: string; isDragging: boolean; dragOver: PipelineStage | null } | null>(null);
  useEffect(() => { cardsRef.current = cards; }, [cards]);

  // ── Global pointer tracking ───────────────────────────────
  useEffect(() => {
    function onDocMove(e: PointerEvent) {
      const ps = pointerRef.current;
      if (!ps) return;

      if (!ps.isDragging) {
        // Check drag threshold (8px)
        if (Math.hypot(e.clientX - ps.startX, e.clientY - ps.startY) > 8) {
          ps.isDragging = true;
          setDragging(ps.cardId);
        }
        return;
      }

      // Detect drop target column
      const under = document.elementFromPoint(e.clientX, e.clientY);
      const col = under?.closest<HTMLElement>('[data-stage]');
      const stage = (col?.dataset.stage as PipelineStage) ?? null;
      ps.dragOver = stage;
      setDragOver(stage);
    }

    function onDocUp() {
      const ps = pointerRef.current;
      if (!ps) return;

      if (ps.isDragging) {
        // Drop card
        if (ps.dragOver) {
          const card = cardsRef.current.find(c => c.id === ps.cardId);
          if (card && card.stage !== ps.dragOver) {
            onUpdateCard({ ...card, stage: ps.dragOver, updatedAt: new Date().toISOString() });
          }
        }
        setDragging(null);
        setDragOver(null);
      } else {
        // It was a click — open profile panel
        setSelectedCardId(ps.cardId);
      }

      pointerRef.current = null;
    }

    document.addEventListener('pointermove', onDocMove);
    document.addEventListener('pointerup', onDocUp);
    return () => {
      document.removeEventListener('pointermove', onDocMove);
      document.removeEventListener('pointerup', onDocUp);
    };
  }, [onUpdateCard]);

  function onCardPointerDown(e: React.PointerEvent<HTMLDivElement>, cardId: string) {
    // Ignore if a modal/panel is open or if it's not a primary button
    if (showAddModal || selectedCardId) return;
    e.preventDefault();
    e.stopPropagation();
    pointerRef.current = {
      startX: e.clientX, startY: e.clientY,
      cardId,
      isDragging: false,
      dragOver: null,
    };
  }

  function handleAddCard() {
    if (!newCard.patientName.trim()) return;
    onAddCard({
      patientName: newCard.patientName.trim(),
      phone:       newCard.phone.trim(),
      procedure:   newCard.procedure.trim() || undefined,
      value:       newCard.value ? Number(newCard.value) : undefined,
      stage:       newCard.stage,
      notes:       newCard.notes.trim() || undefined,
    });
    setNewCard({ patientName: '', phone: '', procedure: '', value: '', stage: 'orc_enviado', notes: '' });
    setShowAddModal(false);
  }

  const cardsByStage = (stageId: PipelineStage) => cards.filter(c => c.stage === stageId);

  const selectedCard = selectedCardId ? cards.find(c => c.id === selectedCardId) ?? null : null;

  return (
    <div style={{ position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#1D1D1F', margin: 0 }}>
            Pipeline Comercial — Mayra
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#86868B', margin: '2px 0 0' }}>
            {cards.length} pacientes no funil · clique para abrir o perfil
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '8px 16px',
            background: '#007AFF',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.82rem',
            fontWeight: 600,
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Adicionar
        </button>
      </div>

      {/* Kanban board */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          paddingBottom: '8px',
          alignItems: 'flex-start',
          touchAction: dragging ? 'none' : 'pan-x pan-y',
          cursor: dragging ? 'grabbing' : 'auto',
          userSelect: 'none',
        }}
      >
        {STAGES.map(stage => {
          const stageCards = cardsByStage(stage.id);
          const isTarget = dragging !== null && dragOver === stage.id;
          return (
            <div
              key={stage.id}
              data-stage={stage.id}
              style={{
                minWidth: '200px',
                width: '200px',
                flexShrink: 0,
                background: isTarget ? `${stage.color}12` : '#F9F9FB',
                borderRadius: '12px',
                padding: '12px',
                border: isTarget
                  ? `2px solid ${stage.color}`
                  : dragging
                    ? `2px dashed ${stage.color}35`
                    : '2px solid transparent',
                transition: 'border 0.1s, background 0.1s',
                minHeight: '80px', // ensures empty columns are droppable
              }}
            >
              {/* Column header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: stage.color }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1D1D1F' }}>{stage.label}</span>
                </div>
                <span style={{
                  fontSize: '0.7rem', fontWeight: 700,
                  background: `${stage.color}20`, color: stage.color,
                  padding: '2px 6px', borderRadius: '6px',
                }}>
                  {stageCards.length}
                </span>
              </div>

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '40px' }}>
                {stageCards.map(card => {
                  const isDraggingThis = dragging === card.id;
                  const checkDone = (card.checklist ?? []).filter(i => i.done).length;
                  const checkTotal = (card.checklist ?? []).length;
                  return (
                    <div
                      key={card.id}
                      onPointerDown={e => onCardPointerDown(e, card.id)}
                      style={{
                        background: '#fff',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                        cursor: isDraggingThis ? 'grabbing' : 'grab',
                        borderLeft: `3px solid ${stage.color}`,
                        opacity: isDraggingThis ? 0.3 : 1,
                        pointerEvents: isDraggingThis ? 'none' : 'auto',
                        userSelect: 'none',
                        touchAction: 'none',
                        transition: 'opacity 0.15s',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1D1D1F', marginBottom: '2px' }}>
                        {card.patientName}
                      </div>
                      {card.procedure && (
                        <div style={{ fontSize: '0.7rem', color: '#86868B', marginBottom: '2px', lineHeight: 1.3 }}>
                          {card.procedure}
                        </div>
                      )}
                      {card.value && (
                        <div style={{ fontSize: '0.72rem', color: '#28A745', fontWeight: 600 }}>
                          {formatCurrency(card.value)}
                        </div>
                      )}
                      {checkTotal > 0 && (
                        <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <div style={{ flex: 1, height: '3px', background: '#F2F2F7', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.round(checkDone / checkTotal * 100)}%`, background: checkDone === checkTotal ? '#28A745' : '#007AFF', borderRadius: '2px' }} />
                          </div>
                          <span style={{ fontSize: '0.65rem', color: '#86868B', flexShrink: 0 }}>{checkDone}/{checkTotal}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Card Profile Panel */}
      {selectedCard && (
        <CardProfile
          card={selectedCard}
          patients={patients}
          onUpdateCard={card => onUpdateCard(card)}
          onDeleteCard={id => { onDeleteCard(id); setSelectedCardId(null); }}
          onClose={() => setSelectedCardId(null)}
        />
      )}

      {/* Add card modal */}
      {showAddModal && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300 }}
            onClick={() => setShowAddModal(false)}
          />
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: '#ffffff',
              borderRadius: '20px',
              padding: '24px',
              width: 'min(90vw, 420px)',
              zIndex: 301,
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
              color: '#1D1D1F',
            }}
          >
            <h3 style={{ margin: '0 0 20px', fontWeight: 700, fontSize: '1rem', color: '#1D1D1F' }}>
              Adicionar ao Pipeline
            </h3>

            {([
              { label: 'Nome da paciente *', key: 'patientName', type: 'text',   placeholder: 'Nome completo' },
              { label: 'Telefone',           key: 'phone',       type: 'tel',    placeholder: '(47) 99900-0000' },
              { label: 'Procedimento',       key: 'procedure',   type: 'text',   placeholder: 'ex: Lipoaspiração + BBL' },
              { label: 'Valor (R$)',         key: 'value',       type: 'number', placeholder: '0' },
            ] as const).map(({ label, key, type, placeholder }) => (
              <div key={key} style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#86868B', marginBottom: '4px' }}>
                  {label}
                </label>
                <input
                  type={type}
                  placeholder={placeholder}
                  value={newCard[key]}
                  onChange={e => setNewCard(prev => ({ ...prev, [key]: e.target.value }))}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: '8px',
                    border: '1.5px solid #E5E5EA', fontSize: '0.85rem',
                    fontFamily: 'inherit', background: '#F9F9FB',
                    boxSizing: 'border-box', color: '#1D1D1F',
                  }}
                />
              </div>
            ))}

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#86868B', marginBottom: '4px' }}>
                Etapa
              </label>
              <select
                value={newCard.stage}
                onChange={e => setNewCard(prev => ({ ...prev, stage: e.target.value as PipelineStage }))}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: '8px',
                  border: '1.5px solid #E5E5EA', fontSize: '0.85rem',
                  fontFamily: 'inherit', background: '#F9F9FB',
                  boxSizing: 'border-box', color: '#1D1D1F',
                }}
              >
                {STAGES.map(s => (
                  <option key={s.id} value={s.id}>{s.emoji} {s.label}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#86868B', marginBottom: '4px' }}>
                Observações iniciais
              </label>
              <textarea
                placeholder="Observações…"
                value={newCard.notes}
                onChange={e => setNewCard(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: '8px',
                  border: '1.5px solid #E5E5EA', fontSize: '0.85rem',
                  fontFamily: 'inherit', background: '#F9F9FB',
                  resize: 'vertical', boxSizing: 'border-box', color: '#1D1D1F',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px',
                  border: '1.5px solid #E5E5EA', background: '#F9F9FB',
                  cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
                  fontSize: '0.85rem', color: '#1D1D1F',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleAddCard}
                disabled={!newCard.patientName.trim()}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                  background: newCard.patientName.trim() ? '#007AFF' : '#C7C7CC',
                  color: '#fff',
                  cursor: newCard.patientName.trim() ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit', fontWeight: 700, fontSize: '0.85rem',
                }}
              >
                Adicionar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
