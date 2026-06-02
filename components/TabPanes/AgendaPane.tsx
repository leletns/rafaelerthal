'use client';

import { useState, useMemo } from 'react';
import type { AmigoAttendanceItem } from '@/lib/data-model';
import WhatsAppButton from '../WhatsAppButton';
import FollowUpScheduler from '../FollowUpScheduler';

interface AgendaPaneProps {
  attendances: AmigoAttendanceItem[];
  amigoConfigured?: boolean;
}

const WEEKDAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  confirmado:   { color: '#28A745', bg: '#E6F7EC' },
  confirmed:    { color: '#28A745', bg: '#E6F7EC' },
  agendado:     { color: '#007AFF', bg: '#E5F1FF' },
  scheduled:    { color: '#007AFF', bg: '#E5F1FF' },
  cancelado:    { color: '#FF3B30', bg: '#FFE5E3' },
  canceled:     { color: '#FF3B30', bg: '#FFE5E3' },
  realizado:    { color: '#5856D6', bg: '#EEECFF' },
  completed:    { color: '#5856D6', bg: '#EEECFF' },
  faltou:       { color: '#FF9500', bg: '#FFF3E0' },
  missed:       { color: '#FF9500', bg: '#FFF3E0' },
};

function statusStyle(status: string) {
  const key = status.toLowerCase();
  for (const [k, v] of Object.entries(STATUS_COLORS)) {
    if (key.includes(k)) return v;
  }
  return { color: '#86868B', bg: '#F2F2F7' };
}

function normalizeDate(dateStr: string): string {
  if (!dateStr) return '';
  // ISO: YYYY-MM-DD or YYYY-MM-DDTHH:mm
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr.slice(0, 10);
  // BR: DD/MM/YYYY
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return dateStr;
}

export default function AgendaPane({ attendances, amigoConfigured = true }: AgendaPaneProps) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState<string | null>(now.toISOString().split('T')[0]);

  const todayStr = now.toISOString().split('T')[0];

  // Group attendances by date
  const byDate = useMemo(() => {
    const map = new Map<string, AmigoAttendanceItem[]>();
    for (const a of attendances) {
      const d = normalizeDate(a.date);
      if (!d) continue;
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(a);
    }
    return map;
  }, [attendances]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }
  function goToday() {
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setSelectedDay(todayStr);
  }

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selectedAppts = selectedDay ? (byDate.get(selectedDay) ?? []) : [];

  // Stats for this month
  const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const monthAppts = Array.from(byDate.entries())
    .filter(([d]) => d.startsWith(monthStr))
    .flatMap(([, appts]) => appts);

  const totalMonth   = monthAppts.length;
  const confirmados  = monthAppts.filter(a => a.status?.toLowerCase().includes('confirm') || a.status?.toLowerCase().includes('realiz')).length;
  const cancelados   = monthAppts.filter(a => a.status?.toLowerCase().includes('cancel')).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #007AFF, #5856D6)',
        borderRadius: '18px', padding: '18px 22px', color: '#fff',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px',
      }}>
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', opacity: 0.85 }}>
            Clínica Blue · AmigoClinic
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '4px' }}>Agenda de Consultas</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '2px' }}>
            {amigoConfigured
              ? `${attendances.length} atendimentos carregados`
              : '⚠️ AmigoClinic não configurado — configure AMIGOCLINIC_API_KEY'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { label: `${totalMonth}`, sub: 'neste mês',   color: '#fff', bg: 'rgba(255,255,255,0.2)' },
            { label: `${confirmados}`, sub: 'confirmados', color: '#fff', bg: 'rgba(255,255,255,0.15)' },
            { label: `${cancelados}`, sub: 'cancelados',  color: '#fff', bg: 'rgba(255,255,255,0.15)' },
          ].map(({ label, sub, color, bg }) => (
            <div key={sub} style={{ background: bg, borderRadius: '12px', padding: '8px 14px', textAlign: 'center', minWidth: '70px' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color }}>{label}</div>
              <div style={{ fontSize: '0.65rem', opacity: 0.85, marginTop: '1px' }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* AmigoClinic not configured warning */}
      {!amigoConfigured && (
        <div style={{ background: '#FFF3E0', border: '1.5px solid #FF950040', borderRadius: '14px', padding: '16px 20px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#FF9500', marginBottom: '8px' }}>
            ⚙️ Como vincular o AmigoClinic
          </div>
          <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: '#6D4C00', lineHeight: 1.7 }}>
            <li>Acesse o painel do AmigoClinic e copie sua <strong>API Key</strong></li>
            <li><strong>Em produção (Vercel):</strong> vá em Settings → Environment Variables → adicione <code style={{ background: '#FFE0B2', padding: '1px 5px', borderRadius: '4px' }}>AMIGOCLINIC_API_KEY</code></li>
            <li><strong>Em desenvolvimento:</strong> abra <code style={{ background: '#FFE0B2', padding: '1px 5px', borderRadius: '4px' }}>.env.local</code> e adicione <code style={{ background: '#FFE0B2', padding: '1px 5px', borderRadius: '4px' }}>AMIGOCLINIC_API_KEY=sua_chave_aqui</code></li>
            <li>Faça redeploy (Vercel) ou reinicie o servidor (<code style={{ background: '#FFE0B2', padding: '1px 5px', borderRadius: '4px' }}>npm run dev</code>)</li>
          </ol>
          <div style={{ marginTop: '10px', fontSize: '0.72rem', color: '#86868B', background: '#FFF8F0', padding: '8px 12px', borderRadius: '8px' }}>
            🔧 Para diagnosticar problemas de conexão, acesse: <code style={{ fontSize: '0.7rem' }}>/api/amigo/test</code> (requer token de autenticação)
          </div>
          <div style={{ marginTop: '10px', fontSize: '0.75rem', color: '#86868B' }}>
            💡 A chave fica apenas no servidor — nunca exposta ao browser.
          </div>
        </div>
      )}

      {attendances.length === 0 && amigoConfigured && (
        <div style={{ background: '#F5F5F7', borderRadius: '14px', padding: '20px', textAlign: 'center', color: '#86868B' }}>
          <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>📭</div>
          <div style={{ fontWeight: 600 }}>Nenhum atendimento encontrado no AmigoClinic</div>
          <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>Verifique se há consultas registradas no sistema</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        {/* Calendar grid */}
        <div style={{ background: '#fff', borderRadius: '18px', padding: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
          {/* Month nav */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <button
              onClick={prevMonth}
              style={{ background: '#F2F2F7', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '16px', color: '#1D1D1F' }}
            >‹</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontWeight: 800, fontSize: '1rem', color: '#1D1D1F' }}>
                {MONTHS_PT[viewMonth]} {viewYear}
              </span>
              <button
                onClick={goToday}
                style={{ background: '#E5F1FF', border: 'none', borderRadius: '6px', padding: '3px 10px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, color: '#007AFF' }}
              >
                Hoje
              </button>
            </div>
            <button
              onClick={nextMonth}
              style={{ background: '#F2F2F7', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '16px', color: '#1D1D1F' }}
            >›</button>
          </div>

          {/* Weekday headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
            {WEEKDAYS_PT.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '0.68rem', fontWeight: 700, color: '#AEAEB2', padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {cells.map((day, idx) => {
              if (day === null) return <div key={idx} />;
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const appts = byDate.get(dateStr) ?? [];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDay;
              const hasAppts = appts.length > 0;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                  style={{
                    padding: '6px 2px',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid #007AFF' : '2px solid transparent',
                    background: isSelected ? '#E5F1FF' : isToday ? '#FFF3E0' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '3px',
                    transition: 'all 0.1s',
                    minHeight: '48px',
                  }}
                >
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: isToday || isSelected ? 800 : 400,
                    color: isToday ? '#FF9500' : isSelected ? '#007AFF' : '#1D1D1F',
                    width: '24px', height: '24px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '50%',
                    background: isToday && !isSelected ? '#FF950015' : 'none',
                  }}>
                    {day}
                  </span>
                  {hasAppts && (
                    <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      {appts.slice(0, 3).map((a, i) => {
                        const pal = statusStyle(a.status ?? '');
                        return (
                          <span key={i} style={{
                            width: '6px', height: '6px', borderRadius: '50%',
                            background: pal.color,
                            display: 'inline-block',
                          }} />
                        );
                      })}
                      {appts.length > 3 && (
                        <span style={{ fontSize: '0.55rem', color: '#86868B', lineHeight: '6px' }}>+{appts.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #F2F2F7' }}>
            {[
              { label: 'Agendado',  color: '#007AFF' },
              { label: 'Confirmado', color: '#28A745' },
              { label: 'Realizado',  color: '#5856D6' },
              { label: 'Cancelado',  color: '#FF3B30' },
              { label: 'Faltou',     color: '#FF9500' },
            ].map(({ label, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                <span style={{ fontSize: '0.68rem', color: '#86868B' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Day detail panel */}
        {selectedDay && (
          <div style={{ background: '#fff', borderRadius: '18px', padding: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1D1D1F', marginBottom: '12px' }}>
              {new Date(selectedDay + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              <span style={{ marginLeft: '8px', fontWeight: 400, fontSize: '0.78rem', color: '#86868B' }}>
                {selectedAppts.length} atendimento{selectedAppts.length !== 1 ? 's' : ''}
              </span>
            </div>

            {selectedAppts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#AEAEB2' }}>
                <div style={{ fontSize: '0.8rem', color: '#AEAEB2' }}>Nenhum atendimento neste dia</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedAppts
                  .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
                  .map((a, i) => {
                    const pal = statusStyle(a.status ?? '');
                    return (
                      <div key={i} style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        background: pal.bg,
                        border: `1.5px solid ${pal.color}30`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '10px',
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            {a.time && (
                              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: pal.color, background: '#fff', padding: '2px 7px', borderRadius: '6px' }}>
                                {a.time}
                              </span>
                            )}
                            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1D1D1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {a.patientName || '—'}
                            </span>
                          </div>
                          {a.procedure && (
                            <div style={{ fontSize: '0.72rem', color: '#86868B', marginTop: '3px' }}>{a.procedure}</div>
                          )}
                          {a.notes && (
                            <div style={{ fontSize: '0.7rem', color: '#86868B', marginTop: '2px', fontStyle: 'italic' }}>{a.notes}</div>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', flexShrink: 0 }}>
                          {a.status && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: pal.color, background: '#fff', padding: '2px 7px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                              {a.status}
                            </span>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FollowUpScheduler patientName={a.patientName || ''} phone="" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
