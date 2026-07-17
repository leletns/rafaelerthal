'use client';

import { useState, useEffect } from 'react';
import type { PipelineCard, PipelineStage } from '@/lib/data-model';
import WhatsAppButton from './WhatsAppButton';
import { formatCurrency } from '@/lib/dashboard-calculations';

const STAGES: { id: PipelineStage; label: string; color: string; emoji: string }[] = [
  { id: 'orc_enviado',        label: 'Orçamento enviado',  color: '#FF9500', emoji: '📋' },
  { id: 'sinal_pago',         label: 'Sinal pago',         color: '#5856D6', emoji: '💰' },
  { id: 'followup',           label: 'Follow-up',          color: '#007AFF', emoji: '📞' },
  { id: 'cirurgia_agendada',  label: 'Cirurgia agendada',  color: '#28A745', emoji: '✂️' },
  { id: 'cirurgia_realizada', label: 'Cirurgia realizada', color: '#00A67C', emoji: '✅' },
  { id: 'perdida',            label: 'Perdida',            color: '#FF3B30', emoji: '❌' },
];

interface MayraPipelineProps {
  cards: PipelineCard[];
  onUpdateCard: (card: PipelineCard) => void;
  onAddCard: (card: Omit<PipelineCard, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDeleteCard: (id: string) => void;
}

interface NewCardForm {
  patientName: string;
  phone: string;
  procedure: string;
  value: string;
  stage: PipelineStage;
  notes: string;
}

export default function MayraPipeline({
  cards,
  onUpdateCard,
  onAddCard,
  onDeleteCard,
}: MayraPipelineProps) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<PipelineStage | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCard, setNewCard] = useState<NewCardForm>({
    patientName: '',
    phone: '',
    procedure: '',
    value: '',
    stage: 'orc_enviado',
    notes: '',
  });

  // Release drag on global pointerup (handles touch release outside board)
  useEffect(() => {
    if (!dragging) return;
    function onGlobalUp() { setDragging(null); setDragOver(null); }
    document.addEventListener('pointerup', onGlobalUp);
    return () => document.removeEventListener('pointerup', onGlobalUp);
  }, [dragging]);

  function onCardPointerDown(e: React.PointerEvent<HTMLDivElement>, cardId: string) {
    e.preventDefault();
    setDragging(cardId);
  }

  function onBoardPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    // elementFromPoint sees through the dragging card (pointer-events:none on it)
    const under = document.elementFromPoint(e.clientX, e.clientY);
    const col = under?.closest<HTMLElement>('[data-stage]');
    setDragOver((col?.dataset.stage as PipelineStage) ?? null);
  }

  function onBoardPointerUp() {
    if (dragging && dragOver) {
      const card = cards.find((c) => c.id === dragging);
      if (card && card.stage !== dragOver) {
        onUpdateCard({ ...card, stage: dragOver, updatedAt: new Date().toISOString() });
      }
    }
    setDragging(null);
    setDragOver(null);
  }

  function handleAddCard() {
    if (!newCard.patientName.trim()) return;
    onAddCard({
      patientName: newCard.patientName.trim(),
      phone: newCard.phone.trim(),
      procedure: newCard.procedure.trim() || undefined,
      value: newCard.value ? Number(newCard.value) : undefined,
      stage: newCard.stage,
      notes: newCard.notes.trim() || undefined,
    });
    setNewCard({ patientName: '', phone: '', procedure: '', value: '', stage: 'orc_enviado', notes: '' });
    setShowAddModal(false);
  }

  const cardsByStage = (stageId: PipelineStage) =>
    cards.filter((c) => c.stage === stageId);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#1D1D1F', margin: 0 }}>Pipeline Comercial — Mayra</h3>
          <p style={{ fontSize: '0.8rem', color: '#86868B', margin: '2px 0 0' }}>{cards.length} pacientes no funil</p>
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
        onPointerMove={onBoardPointerMove}
        onPointerUp={onBoardPointerUp}
        style={{
          // Todas as colunas sempre visíveis (sem rolagem horizontal),
          // para arrastar um card de qualquer coluna até qualquer outra
          display: 'grid',
          gridTemplateColumns: `repeat(${STAGES.length}, minmax(0, 1fr))`,
          gap: '10px',
          paddingBottom: '8px',
          alignItems: 'start',
          touchAction: dragging ? 'none' : 'pan-x pan-y',
          cursor: dragging ? 'grabbing' : 'auto',
        }}
      >
        {STAGES.map((stage) => {
          const stageCards = cardsByStage(stage.id);
          const isTarget = dragging && dragOver === stage.id;
          return (
            <div
              key={stage.id}
              data-stage={stage.id}
              style={{
                minWidth: 0,
                background: isTarget ? `${stage.color}12` : '#F9F9FB',
                borderRadius: '12px',
                padding: '12px',
                border: isTarget
                  ? `2px solid ${stage.color}`
                  : dragging
                    ? `2px dashed ${stage.color}35`
                    : '2px solid transparent',
                transition: 'border 0.1s, background 0.1s',
              }}
            >
              {/* Column header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: stage.color }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1D1D1F' }}>{stage.label}</span>
                </div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    background: `${stage.color}20`,
                    color: stage.color,
                    padding: '2px 6px',
                    borderRadius: '6px',
                  }}
                >
                  {stageCards.length}
                </span>
              </div>

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '60px' }}>
                {stageCards.map((card) => (
                  <div
                    key={card.id}
                    onPointerDown={(e) => onCardPointerDown(e, card.id)}
                    style={{
                      background: '#fff',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                      cursor: dragging === card.id ? 'grabbing' : 'grab',
                      borderLeft: `3px solid ${stage.color}`,
                      opacity: dragging === card.id ? 0.35 : 1,
                      // while this card is dragging, make it transparent to pointer hits
                      // so elementFromPoint sees the column div below
                      pointerEvents: dragging === card.id ? 'none' : 'auto',
                      userSelect: 'none',
                      touchAction: 'none',
                      transition: 'opacity 0.15s',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1D1D1F', marginBottom: '4px' }}>
                      {card.patientName}
                    </div>
                    {card.procedure && (
                      <div style={{ fontSize: '0.72rem', color: '#86868B', marginBottom: '4px' }}>
                        {card.procedure}
                      </div>
                    )}
                    {card.value && (
                      <div style={{ fontSize: '0.72rem', color: '#28A745', fontWeight: 600, marginBottom: '6px' }}>
                        {formatCurrency(card.value)}
                      </div>
                    )}
                    {card.notes && (
                      <div style={{ fontSize: '0.7rem', color: '#86868B', marginBottom: '6px', fontStyle: 'italic', lineHeight: 1.3 }}>
                        {card.notes}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {card.phone && (
                        <WhatsAppButton phone={card.phone} size="sm" variant="icon" />
                      )}
                      <button
                        onClick={() => onDeleteCard(card.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#AEAEB2',
                          padding: '2px',
                          marginLeft: 'auto',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#FF3B30')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#AEAEB2')}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add card modal */}
      {showAddModal && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50 }}
            onClick={() => setShowAddModal(false)}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: '#fff',
              borderRadius: '20px',
              padding: '2rem',
              width: '90%',
              maxWidth: '420px',
              zIndex: 60,
              boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ margin: '0 0 1.5rem', fontWeight: 700, fontSize: '1rem', color: '#1D1D1F' }}>
              Adicionar ao Pipeline
            </h3>

            {[
              { label: 'Nome da paciente *', key: 'patientName', type: 'text', placeholder: 'Nome completo' },
              { label: 'Telefone', key: 'phone', type: 'tel', placeholder: '(47) 99900-0000' },
              { label: 'Procedimento', key: 'procedure', type: 'text', placeholder: 'ex: Lipoaspiracao + BBL' },
              { label: 'Valor (R$)', key: 'value', type: 'number', placeholder: '0' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key} style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#86868B', marginBottom: '4px' }}>
                  {label}
                </label>
                <input
                  type={type}
                  placeholder={placeholder}
                  value={newCard[key as keyof NewCardForm]}
                  onChange={(e) => setNewCard((prev) => ({ ...prev, [key]: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #E5E5EA',
                    fontSize: '0.85rem',
                    fontFamily: 'inherit',
                    background: '#F9F9FB',
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
                onChange={(e) => setNewCard((prev) => ({ ...prev, stage: e.target.value as PipelineStage }))}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #E5E5EA',
                  fontSize: '0.85rem',
                  fontFamily: 'inherit',
                  background: '#F9F9FB',
                }}
              >
                {STAGES.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#86868B', marginBottom: '4px' }}>
                Observações
              </label>
              <textarea
                placeholder="Observações..."
                value={newCard.notes}
                onChange={(e) => setNewCard((prev) => ({ ...prev, notes: e.target.value }))}
                rows={2}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #E5E5EA',
                  fontSize: '0.85rem',
                  fontFamily: 'inherit',
                  background: '#F9F9FB',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1.5px solid #E5E5EA',
                  background: '#F9F9FB',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleAddCard}
                disabled={!newCard.patientName.trim()}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: newCard.patientName.trim() ? '#007AFF' : '#99C9FF',
                  color: '#fff',
                  cursor: newCard.patientName.trim() ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit',
                  fontWeight: 700,
                  fontSize: '0.85rem',
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
