'use client';

import { useState, useEffect, useRef, useCallback, useId } from 'react';
import type { PipelineCard, PipelineStage } from '@/lib/data-model';
import WhatsAppButton from './WhatsAppButton';
import { formatCurrency } from '@/lib/dashboard-calculations';

export const STAGES: { id: PipelineStage; label: string; color: string; hint: string }[] = [
  { id: 'orc_enviado',       label: 'Orçamento enviado', color: 'var(--c-orange)', hint: 'Recebeu a proposta e está avaliando' },
  { id: 'sinal_pago',        label: 'Sinal pago',        color: 'var(--c-purple)', hint: 'Confirmou com o pagamento do sinal' },
  { id: 'followup',          label: 'Follow-up',         color: 'var(--c-blue)',   hint: 'Aguardando retorno, precisa de contato' },
  { id: 'cirurgia_agendada', label: 'Cirurgia agendada', color: 'var(--c-green)',  hint: 'Data marcada' },
  { id: 'perdida',           label: 'Perdida',           color: 'var(--c-red)',    hint: 'Não seguiu com o procedimento' },
];

const STAGE_INDEX: Record<string, number> = Object.fromEntries(STAGES.map((s, i) => [s.id, i]));

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

const EMPTY_FORM: NewCardForm = {
  patientName: '', phone: '', procedure: '', value: '', stage: 'orc_enviado', notes: '',
};

const DRAG_THRESHOLD = 6; // px — evita arrastar sem querer ao clicar

export default function MayraPipeline({
  cards,
  onUpdateCard,
  onAddCard,
  onDeleteCard,
}: MayraPipelineProps) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver]  = useState<PipelineStage | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [newCard, setNewCard] = useState<NewCardForm>(EMPTY_FORM);

  const pending   = useRef<{ id: string; x: number; y: number } | null>(null);
  const boardRef  = useRef<HTMLDivElement>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const formId    = useId();

  // Solta o cartão mesmo se o dedo/mouse sair do quadro
  useEffect(() => {
    function release() { pending.current = null; setDragging(null); setDragOver(null); }
    document.addEventListener('pointerup', release);
    document.addEventListener('pointercancel', release);
    return () => {
      document.removeEventListener('pointerup', release);
      document.removeEventListener('pointercancel', release);
    };
  }, []);

  const moveCard = useCallback((cardId: string, stage: PipelineStage) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.stage === stage) return;
    onUpdateCard({ ...card, stage, updatedAt: new Date().toISOString() });
    const label = STAGES.find((s) => s.id === stage)?.label ?? '';
    setAnnouncement(`${card.patientName} movida para ${label}.`);
  }, [cards, onUpdateCard]);

  function shiftCard(card: PipelineCard, delta: number) {
    const next = STAGES[STAGE_INDEX[card.stage] + delta];
    if (next) moveCard(card.id, next.id);
  }

  function onCardPointerDown(e: React.PointerEvent, cardId: string) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    pending.current = { id: cardId, x: e.clientX, y: e.clientY };
  }

  function onBoardPointerMove(e: React.PointerEvent) {
    const p = pending.current;
    if (p && !dragging) {
      if (Math.abs(e.clientX - p.x) < DRAG_THRESHOLD && Math.abs(e.clientY - p.y) < DRAG_THRESHOLD) return;
      setDragging(p.id);
    }
    if (!pending.current) return;

    const under = document.elementFromPoint(e.clientX, e.clientY);
    const col = under?.closest<HTMLElement>('[data-stage]');
    setDragOver((col?.dataset.stage as PipelineStage) ?? null);

    // Rola o quadro ao chegar perto das bordas — alcança colunas fora da tela
    const board = boardRef.current;
    if (board) {
      const r = board.getBoundingClientRect();
      if (e.clientX > r.right - 60) board.scrollLeft += 14;
      else if (e.clientX < r.left + 60) board.scrollLeft -= 14;
    }
  }

  function onBoardPointerUp() {
    if (dragging && dragOver) moveCard(dragging, dragOver);
    pending.current = null;
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
    setAnnouncement(`${newCard.patientName.trim()} adicionada ao pipeline.`);
    setNewCard(EMPTY_FORM);
    closeModal();
  }

  const closeModal = useCallback(() => {
    setShowAddModal(false);
    addBtnRef.current?.focus();
  }, []);

  // Esc fecha o formulário
  useEffect(() => {
    if (!showAddModal) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') closeModal(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showAddModal, closeModal]);

  const total = cards.reduce((s, c) => s + (c.value || 0), 0);

  return (
    <section aria-labelledby="pipeline-titulo">
      {/* Cabeçalho */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        gap: '16px', flexWrap: 'wrap', marginBottom: '18px',
      }}>
        <div>
          <h2 id="pipeline-titulo" className="sec-ttl">Pipeline comercial</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '4px' }}>
            {cards.length} paciente{cards.length === 1 ? '' : 's'} em acompanhamento
            {total > 0 && <> · {formatCurrency(total)} em negociação</>}
          </p>
        </div>
        <button ref={addBtnRef} onClick={() => setShowAddModal(true)} className="btn-primary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Adicionar paciente
        </button>
      </div>

      <p style={{ fontSize: '12.5px', color: 'var(--text-2)', marginBottom: '14px' }}>
        Arraste um cartão para a coluna desejada — ou use as setas do cartão. As colunas ficam sempre
        visíveis, mesmo vazias.
      </p>

      {/* Quadro */}
      <div
        ref={boardRef}
        className="pipe-board"
        onPointerMove={onBoardPointerMove}
        onPointerUp={onBoardPointerUp}
        style={{ touchAction: dragging ? 'none' : 'pan-x pan-y', cursor: dragging ? 'grabbing' : undefined }}
      >
        {STAGES.map((stage) => {
          const stageCards = cards.filter((c) => c.stage === stage.id);
          const stageTotal = stageCards.reduce((s, c) => s + (c.value || 0), 0);
          const isTarget   = Boolean(dragging) && dragOver === stage.id;
          const stageIdx   = STAGE_INDEX[stage.id];

          return (
            <div
              key={stage.id}
              data-stage={stage.id}
              className="pipe-col"
              style={{
                background: isTarget ? `color-mix(in srgb, ${stage.color} 10%, var(--surface-2))` : 'var(--surface-2)',
                borderColor: isTarget
                  ? stage.color
                  : dragging
                    ? `color-mix(in srgb, ${stage.color} 35%, transparent)`
                    : 'var(--border)',
              }}
            >
              {/* Cabeçalho da coluna */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
                    <span aria-hidden="true" style={{ width: '9px', height: '9px', borderRadius: '50%', background: stage.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>{stage.label}</span>
                  </span>
                  <span style={{
                    fontSize: '12px', fontWeight: 700,
                    background: `color-mix(in srgb, ${stage.color} 14%, var(--surface))`,
                    color: 'var(--text)', padding: '2px 8px', borderRadius: '7px',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {stageCards.length}
                  </span>
                </div>
                {stageTotal > 0 && (
                  <div style={{ fontSize: '11.5px', color: 'var(--text-2)', marginTop: '5px', fontWeight: 600 }}>
                    {formatCurrency(stageTotal)}
                  </div>
                )}
              </div>

              {/* Cartões */}
              {stageCards.length === 0 ? (
                <div className="pipe-empty">
                  {dragging ? 'Solte aqui' : stage.hint}
                </div>
              ) : (
                <ul className="pipe-drop" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {stageCards.map((card) => (
                    <li key={card.id}>
                      <div
                        className="pipe-card"
                        onPointerDown={(e) => onCardPointerDown(e, card.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowLeft')  { e.preventDefault(); shiftCard(card, -1); }
                          if (e.key === 'ArrowRight') { e.preventDefault(); shiftCard(card, +1); }
                        }}
                        tabIndex={0}
                        role="group"
                        aria-label={`${card.patientName}, etapa ${stage.label}. Use as setas esquerda e direita para mudar de etapa.`}
                        style={{
                          borderLeft: `3px solid ${stage.color}`,
                          cursor: dragging === card.id ? 'grabbing' : 'grab',
                          opacity: dragging === card.id ? 0.4 : 1,
                          pointerEvents: dragging === card.id ? 'none' : 'auto',
                          userSelect: 'none',
                          touchAction: 'none',
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text)', marginBottom: '3px' }}>
                          {card.patientName}
                        </div>
                        {card.procedure && (
                          <div style={{ fontSize: '12px', color: 'var(--text-2)', marginBottom: '3px' }}>{card.procedure}</div>
                        )}
                        {Boolean(card.value) && (
                          <div style={{ fontSize: '12.5px', color: 'var(--c-green)', fontWeight: 700, marginBottom: '5px' }}>
                            {formatCurrency(card.value as number)}
                          </div>
                        )}
                        {card.notes && (
                          <div style={{ fontSize: '11.5px', color: 'var(--text-2)', marginBottom: '6px', lineHeight: 1.4 }}>
                            {card.notes}
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginTop: '8px' }}>
                          <button
                            className="icon-btn"
                            style={{ padding: '5px' }}
                            disabled={stageIdx === 0}
                            onClick={() => shiftCard(card, -1)}
                            aria-label={`Mover ${card.patientName} para ${STAGES[stageIdx - 1]?.label ?? 'etapa anterior'}`}
                            title="Etapa anterior"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                              <polyline points="15 18 9 12 15 6" />
                            </svg>
                          </button>
                          <button
                            className="icon-btn"
                            style={{ padding: '5px' }}
                            disabled={stageIdx === STAGES.length - 1}
                            onClick={() => shiftCard(card, +1)}
                            aria-label={`Mover ${card.patientName} para ${STAGES[stageIdx + 1]?.label ?? 'próxima etapa'}`}
                            title="Próxima etapa"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </button>

                          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '2px' }}>
                            {card.phone && <WhatsAppButton phone={card.phone} size="sm" variant="icon" />}
                            <button
                              className="icon-btn"
                              style={{ padding: '5px' }}
                              onClick={() => setConfirmDelete(card.id)}
                              aria-label={`Remover ${card.patientName} do pipeline`}
                              title="Remover"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                              </svg>
                            </button>
                          </span>
                        </div>

                        {confirmDelete === card.id && (
                          <div style={{
                            marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)',
                            display: 'flex', gap: '6px', alignItems: 'center',
                          }}>
                            <span style={{ fontSize: '11.5px', color: 'var(--text-2)', flex: 1 }}>Remover?</span>
                            <button
                              onClick={() => { onDeleteCard(card.id); setConfirmDelete(null); setAnnouncement(`${card.patientName} removida.`); }}
                              style={{ background: 'var(--c-red)', color: 'var(--on-accent)', border: 'none', borderRadius: '7px', padding: '4px 10px', fontSize: '11.5px', fontWeight: 700 }}
                            >
                              Sim
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              style={{ background: 'var(--fill)', color: 'var(--text)', border: 'none', borderRadius: '7px', padding: '4px 10px', fontSize: '11.5px', fontWeight: 600 }}
                            >
                              Não
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* Aviso para leitores de tela */}
      <p aria-live="polite" className="sr-only">{announcement}</p>

      {/* Formulário */}
      {showAddModal && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', zIndex: 50 }}
            onClick={closeModal}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${formId}-titulo`}
            style={{
              position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '20px', padding: '28px', width: 'calc(100% - 32px)', maxWidth: '420px',
              maxHeight: 'calc(100vh - 48px)', overflowY: 'auto',
              zIndex: 60, boxShadow: 'var(--shadow-3)',
            }}
          >
            <h3 id={`${formId}-titulo`} style={{ margin: '0 0 22px', fontWeight: 700, fontSize: '17px', color: 'var(--text)' }}>
              Adicionar paciente ao pipeline
            </h3>

            {([
              { label: 'Nome da paciente', key: 'patientName', type: 'text',   placeholder: 'Nome completo', required: true },
              { label: 'Telefone',         key: 'phone',       type: 'tel',    placeholder: '(21) 99999-9999' },
              { label: 'Procedimento',     key: 'procedure',   type: 'text',   placeholder: 'Ex.: LipeDefinition' },
              { label: 'Valor em reais',   key: 'value',       type: 'number', placeholder: '0' },
            ] as const).map(({ label, key, type, placeholder, ...rest }) => (
              <div key={key} style={{ marginBottom: '14px' }}>
                <label className="field-lbl" htmlFor={`${formId}-${key}`}>
                  {label}{'required' in rest && rest.required ? ' *' : ''}
                </label>
                <input
                  id={`${formId}-${key}`}
                  type={type}
                  placeholder={placeholder}
                  required={'required' in rest ? rest.required : undefined}
                  autoFocus={key === 'patientName'}
                  value={newCard[key]}
                  onChange={(e) => setNewCard((prev) => ({ ...prev, [key]: e.target.value }))}
                  style={{ width: '100%', padding: '11px 13px', fontSize: '15px' }}
                />
              </div>
            ))}

            <div style={{ marginBottom: '14px' }}>
              <label className="field-lbl" htmlFor={`${formId}-stage`}>Etapa</label>
              <select
                id={`${formId}-stage`}
                value={newCard.stage}
                onChange={(e) => setNewCard((prev) => ({ ...prev, stage: e.target.value as PipelineStage }))}
                style={{ width: '100%', padding: '11px 13px', fontSize: '15px' }}
              >
                {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label className="field-lbl" htmlFor={`${formId}-notes`}>Observações</label>
              <textarea
                id={`${formId}-notes`}
                value={newCard.notes}
                onChange={(e) => setNewCard((prev) => ({ ...prev, notes: e.target.value }))}
                rows={2}
                style={{ width: '100%', padding: '11px 13px', fontSize: '15px', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={closeModal}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px',
                  border: '1.5px solid var(--border)', background: 'var(--surface-2)',
                  color: 'var(--text)', fontWeight: 600, fontSize: '14px',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleAddCard}
                disabled={!newCard.patientName.trim()}
                className="btn-primary"
                style={{ flex: 1, justifyContent: 'center', padding: '12px', fontSize: '14px' }}
              >
                Adicionar
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
