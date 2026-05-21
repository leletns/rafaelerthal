'use client';

import { useMemo } from 'react';
import type { Surgery, AmigoLiveData, Patient } from '@/lib/data-model';
import { computeAnniversaries, formatDue } from '@/lib/anniversary';
import WhatsAppButton from '../WhatsAppButton';
import FollowUpScheduler from '../FollowUpScheduler';

interface AniversariosPaneProps {
  cir25: Surgery[];
  cir26: Surgery[];
  amigoData: AmigoLiveData;
  patients?: Patient[];
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <span style={{ fontSize: '1.2rem' }}>{icon}</span>
        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#1D1D1F' }}>{title}</h4>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{children}</div>
    </div>
  );
}

const MS_COLORS: Record<number, { color: string; bg: string }> = {
  3:  { color: '#007AFF', bg: '#E5F1FF' },
  6:  { color: '#5856D6', bg: '#EEECFF' },
  12: { color: '#28A745', bg: '#E6F7EC' },
};

function getPhone(name: string, patients: Patient[]): string | undefined {
  const n = name.toLowerCase().trim();
  return patients.find(
    p => p.name.toLowerCase().trim() === n ||
         p.name.toLowerCase().includes(n.split(' ')[0].toLowerCase())
  )?.phone;
}

export default function AniversariosPane({ cir25, cir26, amigoData, patients = [] }: AniversariosPaneProps) {
  const today = useMemo(() => new Date(), []);
  const todayStr = today.toISOString().split('T')[0];

  // Surgery anniversaries — 90-day window
  const anivs25 = useMemo(() => computeAnniversaries(cir25, 2025, today, 90), [cir25, today]);
  const anivs26 = useMemo(() => computeAnniversaries(cir26, 2026, today, 90), [cir26, today]);
  const allAnivs = useMemo(() => [...anivs25, ...anivs26].sort((a, b) => a.daysUntil - b.daysUntil), [anivs25, anivs26]);

  // Group anniversaries
  const todayAnivs   = allAnivs.filter(a => a.daysUntil === 0);
  const weekAnivs    = allAnivs.filter(a => a.daysUntil > 0 && a.daysUntil <= 7);
  const monthAnivs   = allAnivs.filter(a => a.daysUntil > 7 && a.daysUntil <= 30);
  const upcomingAnivs= allAnivs.filter(a => a.daysUntil > 30 && a.daysUntil <= 90);
  const pastAnivs    = allAnivs.filter(a => a.daysUntil < 0 && a.daysUntil >= -30);

  // AmigoClinic birthdays (today)
  const birthdays = amigoData.birthdays ?? [];

  // Today's appointments from AmigoClinic
  const todayAppts = (amigoData.attendances ?? []).filter(a => {
    if (!a.date) return false;
    // date might be "2026-05-21" or "21/05/2026"
    if (a.date.startsWith(todayStr)) return true;
    const parts = a.date.split('/');
    if (parts.length === 3) {
      const iso = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
      return iso === todayStr;
    }
    return false;
  });

  function AnnivCard({ a }: { a: ReturnType<typeof computeAnniversaries>[0] }) {
    const pal = MS_COLORS[a.milestoneMonths] ?? { color: '#86868B', bg: '#F2F2F7' };
    const urgent = a.daysUntil >= 0 && a.daysUntil <= 3;
    const phone = getPhone(a.patientName, patients);
    return (
      <div style={{
        padding: '12px 14px', borderRadius: '12px', background: urgent ? pal.bg : '#F9F9FB',
        border: `1.5px solid ${urgent ? pal.color + '50' : '#E5E5EA'}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px',
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1D1D1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {a.patientName}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#86868B', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {a.procedure} · {a.milestoneLabel} pós-op
          </div>
          <div style={{ fontSize: '0.7rem', color: '#86868B', marginTop: '1px' }}>
            Cirurgia: {a.surgeryDate}/{a.surgeryYear}
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '6px' }}>
            {phone && <WhatsAppButton phone={phone} size="sm" variant="icon" />}
            <FollowUpScheduler patientId={a.patientName} patientName={a.patientName} />
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <span style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: '99px',
            background: pal.bg, color: pal.color, fontSize: '0.72rem', fontWeight: 800,
          }}>
            {a.milestoneLabel}
          </span>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: a.daysUntil === 0 ? '#FF3B30' : a.daysUntil > 0 && a.daysUntil <= 7 ? '#FF9500' : pal.color, marginTop: '4px' }}>
            {formatDue(a.daysUntil)}
          </div>
        </div>
      </div>
    );
  }

  const hasAnything = allAnivs.length > 0 || birthdays.length > 0 || todayAppts.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #FF9500, #FF3B30)',
        borderRadius: '18px', padding: '18px 22px', color: '#fff',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px',
      }}>
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', opacity: 0.85 }}>
            Clínica Blue · Aniversários &amp; Follow-up
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '4px' }}>
            🎂 Aniversários &amp; Mesversários
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '2px' }}>
            {today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{todayAnivs.length + birthdays.length}</div>
          <div style={{ fontSize: '0.72rem', opacity: 0.85 }}>eventos hoje</div>
        </div>
      </div>

      {/* Today's AmigoClinic appointments */}
      {todayAppts.length > 0 && (
        <div className="card">
          <div className="card-ttl">📅 Atendimentos de hoje (AmigoClinic)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {todayAppts.map((a, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#F9F9FB', borderRadius: '8px', borderLeft: '3px solid #007AFF' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1D1D1F' }}>{a.patientName || '—'}</span>
                  {a.time && <span style={{ fontSize: '0.75rem', color: '#86868B', marginLeft: '8px' }}>{a.time}</span>}
                  {a.procedure && <div style={{ fontSize: '0.72rem', color: '#86868B' }}>{a.procedure}</div>}
                </div>
                {a.status && (
                  <span className="badge badge-blue" style={{ fontSize: '10px' }}>{a.status}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today birthdays */}
      {birthdays.length > 0 && (
        <Section title={`🎂 Aniversariantes hoje (${birthdays.length})`} icon="">
          {birthdays.map((b, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: '12px', background: '#FFF3E0', border: '1.5px solid #FF950040' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1D1D1F' }}>{b.name}</div>
                {b.birthDate && <div style={{ fontSize: '0.72rem', color: '#86868B' }}>Nascimento: {b.birthDate}</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.4rem' }}>🎂</span>
                {b.phone && <WhatsAppButton phone={b.phone} size="sm" variant="icon" />}
                <FollowUpScheduler patientId={b.name} patientName={b.name} />
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* Today surgery anniversaries */}
      {todayAnivs.length > 0 && (
        <Section title={`🎉 Mesversários hoje (${todayAnivs.length})`} icon="">
          {todayAnivs.map((a, i) => <AnnivCard key={i} a={a} />)}
        </Section>
      )}

      {/* This week */}
      {weekAnivs.length > 0 && (
        <Section title={`📆 Esta semana (${weekAnivs.length})`} icon="">
          {weekAnivs.map((a, i) => <AnnivCard key={i} a={a} />)}
        </Section>
      )}

      {/* This month */}
      {monthAnivs.length > 0 && (
        <Section title={`📅 Este mês (${monthAnivs.length})`} icon="">
          {monthAnivs.map((a, i) => <AnnivCard key={i} a={a} />)}
        </Section>
      )}

      {/* Next 90 days */}
      {upcomingAnivs.length > 0 && (
        <Section title={`🔮 Próximos 90 dias (${upcomingAnivs.length})`} icon="">
          {upcomingAnivs.slice(0, 15).map((a, i) => <AnnivCard key={i} a={a} />)}
        </Section>
      )}

      {/* Recent past */}
      {pastAnivs.length > 0 && (
        <Section title={`✅ Últimos 30 dias (${pastAnivs.length})`} icon="">
          {pastAnivs.slice(0, 10).map((a, i) => <AnnivCard key={i} a={a} />)}
        </Section>
      )}

      {!hasAnything && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#86868B' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎂</div>
          <div style={{ fontWeight: 600 }}>Nenhum aniversário ou mesversário nos próximos 90 dias</div>
          <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>Os dados serão atualizados automaticamente ao sincronizar com o Sheets</div>
        </div>
      )}
    </div>
  );
}
