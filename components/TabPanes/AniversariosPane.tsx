'use client';

import { useMemo, useEffect } from 'react';
import type { Surgery, AmigoLiveData, Patient, AmigoBirthdayItem } from '@/lib/data-model';
import { computeAnniversaries, formatDue } from '@/lib/anniversary';
import WhatsAppButton from '../WhatsAppButton';
import FollowUpScheduler from '../FollowUpScheduler';

interface AniversariosPaneProps {
  cir25: Surgery[];
  cir26: Surgery[];
  amigoData: AmigoLiveData;
  patients?: Patient[];
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
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

// ── Fuzzy name matching (≥2 significant tokens in common) ─────────────────
function nameTokens(name: string): string[] {
  const stop = new Set(['dos','das','des','del','von','van','de','da','do','di','e']);
  return name.toLowerCase().trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .split(/\s+/).filter(t => t.length > 2 && !stop.has(t));
}
function isSamePerson(a: string, b: string): boolean {
  const tokA = new Set(nameTokens(a));
  return nameTokens(b).filter(t => tokA.has(t)).length >= 2;
}

function daysUntilBirthday(birthdayDate: string): number {
  const today = new Date();
  const bday = new Date(birthdayDate);
  const diff = Math.round((bday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export default function AniversariosPane({ cir25, cir26, amigoData, patients = [] }: AniversariosPaneProps) {
  const today = useMemo(() => new Date(), []);
  const todayStr = today.toISOString().split('T')[0];

  // Phone lookup by patient name
  const phoneByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of patients) {
      if (p.phone) map.set(p.name.toLowerCase().trim(), p.phone);
    }
    return map;
  }, [patients]);

  function getPhone(name: string): string {
    return phoneByName.get(name.toLowerCase().trim()) ?? '';
  }

  // Surgery anniversaries — 90-day window
  const anivs25 = useMemo(() => computeAnniversaries(cir25, 2025, today, 90), [cir25, today]);
  const anivs26 = useMemo(() => computeAnniversaries(cir26, 2026, today, 90), [cir26, today]);
  const allAnivs = useMemo(() => [...anivs25, ...anivs26].sort((a, b) => a.daysUntil - b.daysUntil), [anivs25, anivs26]);

  const todayAnivs    = allAnivs.filter(a => a.daysUntil === 0);
  const weekAnivs     = allAnivs.filter(a => a.daysUntil > 0 && a.daysUntil <= 7);
  const monthAnivs    = allAnivs.filter(a => a.daysUntil > 7 && a.daysUntil <= 30);
  const upcomingAnivs = allAnivs.filter(a => a.daysUntil > 30 && a.daysUntil <= 90);
  const pastAnivs     = allAnivs.filter(a => a.daysUntil < 0 && a.daysUntil >= -30);

  // Operated patient names for fuzzy badge check
  const operatedNames = useMemo(() =>
    [...cir25, ...cir26].map(s => s.p),
    [cir25, cir26]
  );

  // isOperated uses fuzzy matching so "Ana Paula Souza" matches "Ana Souza" etc.
  function isOperated(name: string) {
    return operatedNames.some(n => isSamePerson(n, name));
  }

  // AmigoClinic birthdays — ALL patients (operated badge shown via fuzzy match)
  const birthdays = useMemo(() =>
    (amigoData.birthdays ?? []),
    [amigoData.birthdays]
  );

  const upcomingBirthdays = useMemo(() =>
    (amigoData.upcomingBirthdays ?? []).filter(b => {
      if (!b.birthdayDate) return false;
      const d = daysUntilBirthday(b.birthdayDate);
      return d > 0 && d <= 14;
    }),
    [amigoData.upcomingBirthdays]
  );

  // Today's AmigoClinic appointments
  const todayAppts = (amigoData.attendances ?? []).filter(a => {
    if (!a.date) return false;
    if (a.date.startsWith(todayStr)) return true;
    const parts = a.date.split('/');
    if (parts.length === 3) {
      const iso = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
      return iso === todayStr;
    }
    return false;
  });

  // ── Web Notifications ────────────────────────────
  useEffect(() => {
    if (!('Notification' in window)) return;
    const tomorrow = allAnivs.filter(a => a.daysUntil === 1);
    const bdayTomorrow = upcomingBirthdays.filter(b => {
      if (!b.birthdayDate) return false;
      return daysUntilBirthday(b.birthdayDate) === 1;
    });
    if (tomorrow.length === 0 && bdayTomorrow.length === 0) return;

    async function requestAndNotify() {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return;
      for (const a of tomorrow) {
        new Notification(`🎂 Amanhã: ${a.milestoneLabel} de ${a.patientName}`, {
          body: `${a.procedure} · Cirurgia: ${a.surgeryDate}/${a.surgeryYear}`,
          tag: `anniv_${a.patientName}_${a.milestoneMonths}`,
        });
      }
      for (const b of bdayTomorrow) {
        new Notification(`🎂 Amanhã: Aniversário de ${b.name}`, {
          body: `Paciente da Clínica Blue`,
          tag: `bday_${b.id}`,
        });
      }
    }
    requestAndNotify();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function AnnivCard({ a }: { a: ReturnType<typeof computeAnniversaries>[0] }) {
    const pal = MS_COLORS[a.milestoneMonths] ?? { color: '#86868B', bg: '#F2F2F7' };
    const urgent = a.daysUntil >= 0 && a.daysUntil <= 3;
    const phone = getPhone(a.patientName);
    return (
      <div style={{
        padding: '12px 14px', borderRadius: '12px',
        background: urgent ? pal.bg : '#F9F9FB',
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
            <FollowUpScheduler patientName={a.patientName} phone={phone} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', flexShrink: 0 }}>
          <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '99px', background: pal.bg, color: pal.color, fontSize: '0.72rem', fontWeight: 800 }}>
            {a.milestoneLabel}
          </span>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: a.daysUntil === 0 ? '#FF3B30' : a.daysUntil > 0 && a.daysUntil <= 7 ? '#FF9500' : pal.color }}>
            {formatDue(a.daysUntil)}
          </div>
        </div>
      </div>
    );
  }

  function BirthdayCard({ b, daysUntil }: { b: AmigoBirthdayItem; daysUntil: number }) {
    const isToday = daysUntil === 0;
    const operated = isOperated(b.name);
    return (
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 14px', borderRadius: '12px',
        background: isToday ? '#FFF3E0' : '#F9F9FB',
        border: `1.5px solid ${isToday ? '#FF950040' : '#E5E5EA'}`,
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1D1D1F', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {b.name}
            {operated && <span style={{ fontSize: '0.65rem', background: '#E6F7EC', color: '#28A745', padding: '2px 6px', borderRadius: '6px', fontWeight: 700 }}>✂️ operou</span>}
          </div>
          {b.birthDate && <div style={{ fontSize: '0.72rem', color: '#86868B' }}>Nascimento: {b.birthDate}</div>}
          {b.birthdayDate && !isToday && (
            <div style={{ fontSize: '0.72rem', color: '#FF9500', fontWeight: 600 }}>{formatDue(daysUntil)}</div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isToday && <span style={{ fontSize: '1.4rem' }}>🎂</span>}
          {b.phone && <WhatsAppButton phone={b.phone} size="sm" variant="icon" />}
          <FollowUpScheduler patientName={b.name} phone={b.phone ?? ''} />
        </div>
      </div>
    );
  }

  const hasAnything = allAnivs.length > 0 || birthdays.length > 0 || todayAppts.length > 0 || upcomingBirthdays.length > 0;

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

      {/* Today's appointments */}
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
                {a.status && <span className="badge badge-blue" style={{ fontSize: '10px' }}>{a.status}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today birthdays */}
      {birthdays.length > 0 && (
        <Section title={`🎂 Aniversariantes hoje (${birthdays.length})`}>
          {birthdays.map((b, i) => (
            <BirthdayCard key={i} b={b} daysUntil={0} />
          ))}
        </Section>
      )}

      {/* Upcoming birthdays — next 14 days */}
      {upcomingBirthdays.length > 0 && (
        <Section title={`🎁 Aniversários nos próximos 14 dias (${upcomingBirthdays.length})`}>
          {upcomingBirthdays
            .sort((a, b) => daysUntilBirthday(a.birthdayDate!) - daysUntilBirthday(b.birthdayDate!))
            .map((b, i) => (
              <BirthdayCard key={i} b={b} daysUntil={daysUntilBirthday(b.birthdayDate!)} />
            ))}
        </Section>
      )}

      {/* Today surgery anniversaries */}
      {todayAnivs.length > 0 && (
        <Section title={`🎉 Mesversários hoje (${todayAnivs.length})`}>
          {todayAnivs.map((a, i) => <AnnivCard key={i} a={a} />)}
        </Section>
      )}

      {weekAnivs.length > 0 && (
        <Section title={`📆 Esta semana (${weekAnivs.length})`}>
          {weekAnivs.map((a, i) => <AnnivCard key={i} a={a} />)}
        </Section>
      )}

      {monthAnivs.length > 0 && (
        <Section title={`📅 Este mês (${monthAnivs.length})`}>
          {monthAnivs.map((a, i) => <AnnivCard key={i} a={a} />)}
        </Section>
      )}

      {upcomingAnivs.length > 0 && (
        <Section title={`🔮 Próximos 90 dias (${upcomingAnivs.length})`}>
          {upcomingAnivs.slice(0, 15).map((a, i) => <AnnivCard key={i} a={a} />)}
        </Section>
      )}

      {pastAnivs.length > 0 && (
        <Section title={`✅ Últimos 30 dias (${pastAnivs.length})`}>
          {pastAnivs.slice(0, 10).map((a, i) => <AnnivCard key={i} a={a} />)}
        </Section>
      )}

      {!hasAnything && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#86868B' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎂</div>
          <div style={{ fontWeight: 600 }}>Nenhum aniversário ou mesversário nos próximos 90 dias</div>
          <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>Os dados serão atualizados automaticamente ao sincronizar com o AmigoClinic</div>
        </div>
      )}
    </div>
  );
}
