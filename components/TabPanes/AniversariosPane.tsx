'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import type { Surgery, AmigoLiveData, Patient, AmigoBirthdayItem } from '@/lib/data-model';
import { computeAnniversaries, formatDue, daysUntilISODate, type SurgeryAnniversary } from '@/lib/anniversary';
import { buildAnniversaryMessage, buildBirthdayMessage, classifyPatientValue, isSamePerson, type ValueTag } from '@/lib/commercial-intel';
import { openWhatsApp } from '@/lib/whatsapp';
import FollowUpScheduler from '../FollowUpScheduler';

interface AniversariosPaneProps {
  cir25: Surgery[];
  cir26: Surgery[];
  amigoData: AmigoLiveData;
  patients?: Patient[];
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-.1px' }}>{title}</h4>
        <span style={{ fontSize: '12px', color: 'var(--ink-3)', fontWeight: 500 }}>{count}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{children}</div>
    </section>
  );
}

function ValueTagBadge({ tag }: { tag: ValueTag | null }) {
  if (!tag) return null;
  return (
    <span className={`tag tag-${tag.tone}`} title={tag.reason}>
      {tag.label}
    </span>
  );
}

/** Botão de Ação Rápida — gera rascunho humanizado e envia/copia. */
function QuickActionButton({ phone, message }: { phone: string; message: string }) {
  const [copied, setCopied] = useState(false);

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (phone) {
      openWhatsApp(phone, message);
      return;
    }
    navigator.clipboard.writeText(message).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }).catch(() => {});
  }

  return (
    <button
      onClick={handleClick}
      title={phone ? 'Enviar mensagem de parabéns via WhatsApp' : 'Copiar rascunho da mensagem (sem telefone cadastrado)'}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '5px 12px', borderRadius: '8px',
        border: '1px solid var(--line)',
        background: copied ? '#F0F7F2' : '#fff',
        color: copied ? 'var(--positive)' : 'var(--ink)',
        fontSize: '11.5px', fontWeight: 600, cursor: 'pointer',
        transition: 'all .15s ease', whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => { if (!copied) e.currentTarget.style.borderColor = '#C7C7CC'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--line)'; }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {phone
          ? <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          : <><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>}
      </svg>
      {copied ? 'Copiado' : phone ? 'Mensagem' : 'Copiar rascunho'}
    </button>
  );
}

export default function AniversariosPane({ cir25, cir26, amigoData, patients = [] }: AniversariosPaneProps) {
  const today = useMemo(() => new Date(), []);

  // Phone lookup by patient name
  const phoneByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of patients) {
      if (p.phone) map.set(p.name.toLowerCase().trim(), p.phone);
    }
    return map;
  }, [patients]);

  const getPhone = useCallback(
    (name: string): string => phoneByName.get(name.toLowerCase().trim()) ?? '',
    [phoneByName]
  );

  const allSurgeries = useMemo(() => [...cir25, ...cir26], [cir25, cir26]);

  // Surgery anniversaries — 90-day window, timezone-safe calendar math
  const allAnivs = useMemo(() => {
    const a25 = computeAnniversaries(cir25, 2025, today, 90);
    const a26 = computeAnniversaries(cir26, 2026, today, 90);
    return [...a25, ...a26].sort((a, b) => a.daysUntil - b.daysUntil);
  }, [cir25, cir26, today]);

  const todayAnivs    = allAnivs.filter(a => a.daysUntil === 0);
  const weekAnivs     = allAnivs.filter(a => a.daysUntil > 0 && a.daysUntil <= 7);
  const monthAnivs    = allAnivs.filter(a => a.daysUntil > 7 && a.daysUntil <= 30);
  const upcomingAnivs = allAnivs.filter(a => a.daysUntil > 30 && a.daysUntil <= 90);
  const pastAnivs     = allAnivs.filter(a => a.daysUntil < 0 && a.daysUntil >= -30);

  // Operated patient names for fuzzy badge check
  const operatedNames = useMemo(() => allSurgeries.map(s => s.p), [allSurgeries]);
  const isOperated = useCallback(
    (name: string) => operatedNames.some(n => isSamePerson(n, name)),
    [operatedNames]
  );

  const birthdays = amigoData.birthdays ?? [];

  const upcomingBirthdays = useMemo(() =>
    (amigoData.upcomingBirthdays ?? [])
      .map(b => ({ b, days: b.birthdayDate ? daysUntilISODate(b.birthdayDate, today) : null }))
      .filter((x): x is { b: AmigoBirthdayItem; days: number } => x.days !== null && x.days > 0 && x.days <= 14)
      .sort((a, b) => a.days - b.days),
    [amigoData.upcomingBirthdays, today]
  );

  // ── Web Notifications (dia anterior) ────────────────────────
  useEffect(() => {
    if (!('Notification' in window)) return;
    const tomorrow = allAnivs.filter(a => a.daysUntil === 1);
    const bdayTomorrow = upcomingBirthdays.filter(x => x.days === 1);
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
      for (const { b } of bdayTomorrow) {
        new Notification(`Amanhã: aniversário de ${b.name}`, {
          body: 'Paciente da Clínica Blue',
          tag: `bday_${b.id}`,
        });
      }
    }
    requestAndNotify();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function AnnivCard({ a }: { a: SurgeryAnniversary }) {
    const isToday = a.daysUntil === 0;
    const phone = getPhone(a.patientName);
    const tag = classifyPatientValue(a.patientName, allSurgeries);
    return (
      <div style={{
        padding: '14px 16px', borderRadius: '12px',
        background: '#fff',
        border: `1px solid ${isToday ? '#BBDBFF' : 'var(--line)'}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px',
        transition: 'border-color .15s ease',
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {a.patientName}
            </span>
            <ValueTagBadge tag={tag} />
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--ink-2)', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {a.procedure}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--ink-3)', marginTop: '2px' }}>
            Cirurgia {a.surgeryDate}/{a.surgeryYear} · marco em {a.dueDateLabel}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '10px' }}>
            <QuickActionButton phone={phone} message={buildAnniversaryMessage(a)} />
            <FollowUpScheduler patientName={a.patientName} phone={phone} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
          <span style={{
            fontSize: '0.72rem', fontWeight: 600, color: 'var(--ink)',
            padding: '2px 9px', borderRadius: '6px', background: '#F4F4F5', border: '1px solid var(--line)',
          }}>
            {a.milestoneLabel}
          </span>
          <span style={{
            fontSize: '0.74rem', fontWeight: 600,
            color: isToday ? 'var(--critical)' : a.daysUntil > 0 && a.daysUntil <= 7 ? 'var(--warn)' : 'var(--ink-2)',
          }}>
            {formatDue(a.daysUntil)}
          </span>
        </div>
      </div>
    );
  }

  function BirthdayCard({ b, daysUntil }: { b: AmigoBirthdayItem; daysUntil: number }) {
    const isToday = daysUntil === 0;
    const operated = isOperated(b.name);
    return (
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
        padding: '14px 16px', borderRadius: '12px',
        background: '#fff',
        border: `1px solid ${isToday ? '#BBDBFF' : 'var(--line)'}`,
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</span>
            {operated && <span className="tag tag-neutral">Operou</span>}
          </div>
          {b.birthDate && <div style={{ fontSize: '0.72rem', color: 'var(--ink-3)', marginTop: '2px' }}>Nascimento: {b.birthDate}</div>}
          {!isToday && (
            <div style={{ fontSize: '0.74rem', color: 'var(--warn)', fontWeight: 600, marginTop: '2px' }}>{formatDue(daysUntil)}</div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <QuickActionButton phone={b.phone ?? ''} message={buildBirthdayMessage(b.name)} />
          <FollowUpScheduler patientName={b.name} phone={b.phone ?? ''} />
        </div>
      </div>
    );
  }

  const hasAnything = allAnivs.length > 0 || birthdays.length > 0 || upcomingBirthdays.length > 0;
  const eventsToday = todayAnivs.length + birthdays.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header — clean, sem banner */}
      <div className="bday-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-.3px', color: 'var(--ink)' }}>
            Aniversários &amp; pós-operatório
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--ink-2)' }}>
            {today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-1px', color: eventsToday > 0 ? 'var(--accent)' : 'var(--ink)' }}>
            {eventsToday}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--ink-3)' }}>eventos hoje</div>
        </div>
      </div>

      {birthdays.length > 0 && (
        <Section title="Aniversariantes hoje" count={birthdays.length}>
          {birthdays.map((b, i) => <BirthdayCard key={i} b={b} daysUntil={0} />)}
        </Section>
      )}

      {upcomingBirthdays.length > 0 && (
        <Section title="Aniversários nos próximos 14 dias" count={upcomingBirthdays.length}>
          {upcomingBirthdays.map(({ b, days }, i) => <BirthdayCard key={i} b={b} daysUntil={days} />)}
        </Section>
      )}

      {todayAnivs.length > 0 && (
        <Section title="Marcos de pós-operatório hoje" count={todayAnivs.length}>
          {todayAnivs.map((a, i) => <AnnivCard key={i} a={a} />)}
        </Section>
      )}

      {weekAnivs.length > 0 && (
        <Section title="Esta semana" count={weekAnivs.length}>
          {weekAnivs.map((a, i) => <AnnivCard key={i} a={a} />)}
        </Section>
      )}

      {monthAnivs.length > 0 && (
        <Section title="Este mês" count={monthAnivs.length}>
          {monthAnivs.map((a, i) => <AnnivCard key={i} a={a} />)}
        </Section>
      )}

      {upcomingAnivs.length > 0 && (
        <Section title="Próximos 90 dias" count={upcomingAnivs.length}>
          {upcomingAnivs.slice(0, 15).map((a, i) => <AnnivCard key={i} a={a} />)}
        </Section>
      )}

      {pastAnivs.length > 0 && (
        <Section title="Últimos 30 dias" count={pastAnivs.length}>
          {pastAnivs.slice(0, 10).map((a, i) => <AnnivCard key={i} a={a} />)}
        </Section>
      )}

      {!hasAnything && (
        <div style={{ textAlign: 'center', padding: '56px 0', color: 'var(--ink-3)' }}>
          <div style={{ fontWeight: 600, color: 'var(--ink-2)' }}>Nenhum aniversário ou marco nos próximos 90 dias</div>
          <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>Os dados são atualizados automaticamente ao sincronizar com o AmigoClinic</div>
        </div>
      )}
    </div>
  );
}
