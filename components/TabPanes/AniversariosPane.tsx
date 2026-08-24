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
        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>{title}</h4>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{children}</div>
    </div>
  );
}

const MS_COLORS: Record<number, { color: string; bg: string }> = {
  3:  { color: 'var(--c-blue)', bg: 'var(--tint-blue)' },
  6:  { color: 'var(--c-purple)', bg: 'var(--tint-purple)' },
  12: { color: 'var(--c-green)', bg: 'var(--tint-green)' },
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
        new Notification(`Amanhã: ${a.milestoneLabel} de ${a.patientName}`, {
          body: `${a.procedure} · Cirurgia: ${a.surgeryDate}/${a.surgeryYear}`,
          tag: `anniv_${a.patientName}_${a.milestoneMonths}`,
        });
      }
      for (const b of bdayTomorrow) {
        new Notification(`Amanhã: aniversário de ${b.name}`, {
          body: `Paciente da Clínica Blue`,
          tag: `bday_${b.id}`,
        });
      }
    }
    requestAndNotify();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function AnnivCard({ a }: { a: ReturnType<typeof computeAnniversaries>[0] }) {
    const pal = MS_COLORS[a.milestoneMonths] ?? { color: 'var(--text-2)', bg: 'var(--fill)' };
    const urgent = a.daysUntil >= 0 && a.daysUntil <= 3;
    const phone = getPhone(a.patientName);
    return (
      <div style={{
        padding: '12px 14px', borderRadius: '12px',
        background: urgent ? pal.bg : 'var(--surface-2)',
        border: `1.5px solid ${urgent ? pal.color + '50' : 'var(--border)'}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px',
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {a.patientName}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-2)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {a.procedure} · {a.milestoneLabel} pós-op
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-2)', marginTop: '1px' }}>
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
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: a.daysUntil === 0 ? 'var(--c-red)' : a.daysUntil > 0 && a.daysUntil <= 7 ? 'var(--c-orange)' : pal.color }}>
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
        background: isToday ? 'var(--tint-orange)' : 'var(--surface-2)',
        border: `1.5px solid ${isToday ? 'color-mix(in srgb, var(--c-orange) 25%, transparent)' : 'var(--border)'}`,
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {b.name}
            {operated && <span className="badge badge-green" style={{ fontSize: '11px' }}>já operou</span>}
          </div>
          {b.birthDate && <div style={{ fontSize: '0.72rem', color: 'var(--text-2)' }}>Nascimento: {b.birthDate}</div>}
          {b.birthdayDate && !isToday && (
            <div style={{ fontSize: '0.72rem', color: 'var(--c-orange)', fontWeight: 600 }}>{formatDue(daysUntil)}</div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {b.phone && <WhatsAppButton phone={b.phone} size="sm" variant="icon" />}
          <FollowUpScheduler patientName={b.name} phone={b.phone ?? ''} />
        </div>
      </div>
    );
  }

  const hasAnything = allAnivs.length > 0 || birthdays.length > 0 || upcomingBirthdays.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="card" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '16px',
      }}>
        <div>
          <h2 className="sec-ttl">Aniversários e mesversários</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '4px' }}>
            {today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--c-orange)', lineHeight: 1 }}>
            {todayAnivs.length + birthdays.length}
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--text-2)', marginTop: '4px' }}>
            {todayAnivs.length + birthdays.length === 1 ? 'motivo para ligar hoje' : 'motivos para ligar hoje'}
          </div>
        </div>
      </div>

      {/* Today birthdays */}
      {birthdays.length > 0 && (
        <Section title={`Aniversariantes hoje (${birthdays.length})`}>
          {birthdays.map((b, i) => (
            <BirthdayCard key={i} b={b} daysUntil={0} />
          ))}
        </Section>
      )}

      {/* Upcoming birthdays — next 14 days */}
      {upcomingBirthdays.length > 0 && (
        <Section title={`Aniversários nos próximos 14 dias (${upcomingBirthdays.length})`}>
          {upcomingBirthdays
            .sort((a, b) => daysUntilBirthday(a.birthdayDate!) - daysUntilBirthday(b.birthdayDate!))
            .map((b, i) => (
              <BirthdayCard key={i} b={b} daysUntil={daysUntilBirthday(b.birthdayDate!)} />
            ))}
        </Section>
      )}

      {/* Today surgery anniversaries */}
      {todayAnivs.length > 0 && (
        <Section title={`Mesversários de cirurgia hoje (${todayAnivs.length})`}>
          {todayAnivs.map((a, i) => <AnnivCard key={i} a={a} />)}
        </Section>
      )}

      {weekAnivs.length > 0 && (
        <Section title={`Esta semana (${weekAnivs.length})`}>
          {weekAnivs.map((a, i) => <AnnivCard key={i} a={a} />)}
        </Section>
      )}

      {monthAnivs.length > 0 && (
        <Section title={`Este mês (${monthAnivs.length})`}>
          {monthAnivs.map((a, i) => <AnnivCard key={i} a={a} />)}
        </Section>
      )}

      {upcomingAnivs.length > 0 && (
        <Section title={`Próximos 90 dias (${upcomingAnivs.length})`}>
          {upcomingAnivs.slice(0, 15).map((a, i) => <AnnivCard key={i} a={a} />)}
        </Section>
      )}

      {pastAnivs.length > 0 && (
        <Section title={`Últimos 30 dias (${pastAnivs.length})`}>
          {pastAnivs.slice(0, 10).map((a, i) => <AnnivCard key={i} a={a} />)}
        </Section>
      )}

      {!hasAnything && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-2)' }}>
          <div style={{ fontWeight: 600 }}>Nenhum aniversário ou mesversário nos próximos 90 dias</div>
          <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>A lista se atualiza sozinha várias vezes ao dia.</div>
        </div>
      )}
    </div>
  );
}
