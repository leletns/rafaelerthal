'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import Tabs from '@/components/Tabs';
import AssistantChat from '@/components/AssistantChat';
import ResumoPane from '@/components/TabPanes/ResumoPane';
import PacientesPane from '@/components/TabPanes/PacientesPane';
import PipelinePane from '@/components/TabPanes/PipelinePane';
import RankingPane from '@/components/TabPanes/RankingPane';
import FunilPane from '@/components/TabPanes/FunilPane';
import GeoPane from '@/components/TabPanes/GeoPane';
import CompPane from '@/components/TabPanes/CompPane';
import EquipePane from '@/components/TabPanes/EquipePane';
import AniversariosPane from '@/components/TabPanes/AniversariosPane';
import OrcamentosPane from '@/components/TabPanes/OrcamentosPane';
import { getBaseData, sheetsFirstMerge, extractPipeline } from '@/lib/merge-data';
import { canonicalCategoryLabel } from '@/lib/normalize-category';
import { mergePatientRecords } from '@/lib/normalize-patient';
import { getAuthToken, safeStorage, SNAPSHOT_KEY } from '@/lib/safe-storage';
import type { DashboardData, Notification, AmigoLiveData, PipelineCard } from '@/lib/data-model';

const TABS = [
  { id: 'resumo',       label: 'Visão Geral' },
  { id: 'pipeline',     label: 'Comercial', highlight: true },
  { id: 'pacientes',    label: 'Pacientes' },
  { id: 'ranking',      label: 'Ranking' },
  { id: 'equipe',       label: 'Equipe' },
  { id: 'comp',         label: 'Comparativo' },
  { id: 'aniversarios', label: 'Aniversários', highlight: true },
];
// Note: 'funil', 'orcamentos' and 'geo' are not in the nav but remain available
// via onTabChange ('Ver detalhes' links in Visão Geral summaries)

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif_welcome',
    type: 'info',
    title: 'Bem-vindo ao Mydash',
    body: 'Dashboard da Clínica Blue — Dr. Rafael Erthal. Sincronizando dados com o Google Sheets…',
    date: new Date().toISOString().split('T')[0],
    read: false,
  },
];

// ── Sync status types ────────────────────────────────────────────────────────
export type ConnStatus = 'pending' | 'syncing' | 'ok' | 'error' | 'unconfigured';
export interface SyncState {
  sheets: ConnStatus;
  sheetsMsg: string;
  amigo: ConnStatus;
  amigoMsg: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('resumo');
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [syncing, setSyncing] = useState(true);
  const [data, setData] = useState<DashboardData>(getBaseData);
  const [amigoData, setAmigoData] = useState<AmigoLiveData>({ birthdays: [] });
  const [pipelineFromSheets, setPipelineFromSheets] = useState<PipelineCard[] | null>(null);
  const [syncState, setSyncState] = useState<SyncState>({
    sheets: 'syncing', sheetsMsg: '',
    amigo:  'syncing', amigoMsg:  '',
  });

  useEffect(() => {
    const snap = safeStorage.get<DashboardData | null>(SNAPSHOT_KEY, null);
    if (snap) {
      // Snapshots antigos podem conter categorias não normalizadas
      const normalizeCl = (list: typeof snap.cir25) =>
        (list ?? []).map((s) => ({ ...s, cl: canonicalCategoryLabel(s.cl) }));
      setData({ ...snap, cir25: normalizeCl(snap.cir25), cir26: normalizeCl(snap.cir26) });
    }

    const token = getAuthToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    let cancelled = false;

    async function syncSheets() {
      if (!cancelled) setSyncState(s => ({ ...s, sheets: 'syncing', sheetsMsg: '' }));
      try {
        const res = await fetch('/api/sheets/pull', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const remote = json?.data as Record<string, unknown> | undefined;
        if (!cancelled && remote) {
          const merged = sheetsFirstMerge(getBaseData(), remote);
          setData(merged);
          safeStorage.set(SNAPSHOT_KEY, merged);
          const sheetsCards = extractPipeline(remote);
          if (sheetsCards && sheetsCards.length > 0) setPipelineFromSheets(sheetsCards);
          const totalCir  = (merged.cir25?.length  ?? 0) + (merged.cir26?.length  ?? 0);
          const totalCons = (merged.cons25?.length ?? 0) + (merged.cons26?.length ?? 0);
          if (!cancelled) setSyncState(s => ({
            ...s,
            sheets: 'ok',
            sheetsMsg: `${totalCir} cirurgias · ${totalCons} consultas`,
          }));
          setNotifications((prev) => [
            {
              id: `sync_${Date.now()}`,
              type: 'info',
              title: 'Dados sincronizados',
              body: `Google Sheets · ${totalCir} cirurgias · ${totalCons} consultas.`,
              date: new Date().toISOString().split('T')[0],
              read: false,
            },
            ...prev.filter((n) => n.id !== 'notif_welcome'),
          ]);
        } else if (!cancelled) {
          setSyncState(s => ({ ...s, sheets: 'error', sheetsMsg: 'Sem dados recebidos' }));
        }
      } catch (err) {
        if (!cancelled) setSyncState(s => ({
          ...s,
          sheets: 'error',
          sheetsMsg: err instanceof Error ? err.message : 'Erro de conexão',
        }));
      } finally {
        if (!cancelled) setSyncing(false);
      }
    }

    async function syncAmigo() {
      if (!cancelled) setSyncState(s => ({ ...s, amigo: 'syncing', amigoMsg: '' }));
      try {
        const res = await fetch('/api/amigo/sync', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (!cancelled) setSyncState(s => ({
            ...s, amigo: 'error', amigoMsg: `HTTP ${res.status}`,
          }));
          return;
        }
        const json = await res.json();
        if (!cancelled) {
          // No API key configured
          if (!json?.data) {
            setSyncState(s => ({
              ...s, amigo: 'unconfigured',
              amigoMsg: 'Configure AMIGOCLINIC_API_KEY no Vercel',
            }));
            return;
          }

          const todayBdays  = (json.data.birthdays         ?? []) as import('@/lib/data-model').AmigoBirthdayItem[];
          const upcoming    = (json.data.upcomingBirthdays ?? []);
          const totalBdays  = todayBdays.length + upcoming.length;

          if (json.firstError) {
            setSyncState(s => ({ ...s, amigo: 'error', amigoMsg: json.firstError }));
          } else {
            setSyncState(s => ({
              ...s, amigo: 'ok',
              amigoMsg: totalBdays > 0
                ? `${totalBdays} aniversário${totalBdays !== 1 ? 's' : ''} nos próx. 15 dias`
                : 'sem aniversários hoje',
            }));
          }

          setAmigoData({
            birthdays:         todayBdays,
            upcomingBirthdays: upcoming,
            syncedAt:          json.timestamp,
          });

          // Push today's birthdays as notifications
          const todayStr = new Date().toISOString().split('T')[0];
          if (todayBdays.length > 0) {
            setNotifications(prev => [
              ...todayBdays.map((b, i) => ({
                id: `bday_${Date.now()}_${i}`,
                type: 'birthday' as const,
                title: '🎂 Aniversário hoje',
                body: `${b.name}${b.phone ? ` · ${b.phone}` : ''}`,
                date: todayStr,
                read: false,
              } satisfies import('@/lib/data-model').Notification)),
              ...prev,
            ]);
          }
        }
      } catch (err) {
        if (!cancelled) setSyncState(s => ({
          ...s, amigo: 'error',
          amigoMsg: err instanceof Error ? err.message : 'Serviço offline',
        }));
      }
    }

    syncSheets();
    syncAmigo();
    const amigoPollId = setInterval(syncAmigo, 5 * 60 * 1000);
    return () => { cancelled = true; clearInterval(amigoPollId); };
  }, [router]);

  function handleMarkRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }
  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  const patients = useMemo(
    () => mergePatientRecords(
      [...data.cir25, ...data.cir26],
      [...data.cons25, ...data.cons26]
    ),
    [data]
  );

  function renderTabContent() {
    switch (activeTab) {
      case 'resumo':
        return <ResumoPane
          cir25={data.cir25} cir26={data.cir26}
          cons25={data.cons25} cons26={data.cons26}
          canal25={data.canal25} canal26={data.canal26}
          fx25={data.fx25} fx26={data.fx26}
          cidades25={data.cidades25} cidades26={data.cidades26}
          intl25={data.intl25} intl26={data.intl26}
          onTabChange={setActiveTab}
        />;
      case 'pacientes':
        return <PacientesPane patients={patients} />;
      case 'pipeline':
        return <PipelinePane initialCards={pipelineFromSheets ?? undefined} cons26={data.cons26} cir26={data.cir26} />;
      case 'ranking':
        return <RankingPane cir25={data.cir25} cir26={data.cir26} cons25={data.cons25} cons26={data.cons26} />;
      case 'funil':
        return <FunilPane cir25={data.cir25} cir26={data.cir26} cons25={data.cons25} cons26={data.cons26} />;
      case 'geo':
        return <GeoPane cir25={data.cir25} cir26={data.cir26} cons25={data.cons25} cons26={data.cons26} canal25={data.canal25} canal26={data.canal26} cidades25={data.cidades25} cidades26={data.cidades26} fx25={data.fx25} fx26={data.fx26} intl25={data.intl25} intl26={data.intl26} />;
      case 'comp':
        return <CompPane cir25={data.cir25} cir26={data.cir26} cons25={data.cons25} cons26={data.cons26} />;
      case 'equipe':
        return <EquipePane />;
      case 'orcamentos':
        return <OrcamentosPane orc25={data.orc25} orc26={data.orc26} cons25={data.cons25} cons26={data.cons26} cir25={data.cir25} cir26={data.cir26} />;
      case 'aniversarios':
        return <AniversariosPane cir25={data.cir25} cir26={data.cir26} amigoData={amigoData} patients={patients} />;
      default:
        return null;
    }
  }

  return (
    <DashboardLayout
      notifications={notifications}
      onMarkRead={handleMarkRead}
      onMarkAllRead={handleMarkAllRead}
      syncing={syncing}
      syncState={syncState}
      patients={patients}
    >
      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
      <div key={activeTab} style={{ animation: 'fadeIn 0.25s ease both' }}>
        {renderTabContent()}
      </div>
      <AssistantChat />
    </DashboardLayout>
  );
}
