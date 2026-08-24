'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
    title: 'Bem-vinda ao Mydash',
    body: 'Painel da Clínica Blue — Dr. Rafael Erthal. Buscando os dados mais recentes…',
    date: new Date().toISOString().split('T')[0],
    read: false,
  },
];

// ── Estado da sincronização ──────────────────────────────────────────────────
// 'dados'  = planilha da clínica · 'agenda' = sistema de agendamento
export type ConnStatus = 'pending' | 'syncing' | 'ok' | 'error' | 'unconfigured';
export interface SyncState {
  dados: ConnStatus;
  dadosMsg: string;
  agenda: ConnStatus;
  agendaMsg: string;
}

/** De quanto em quanto tempo o painel se atualiza sozinho. */
const AUTO_SYNC_MS = 5 * 60 * 1000;

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('resumo');
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [syncing, setSyncing] = useState(true);
  const [data, setData] = useState<DashboardData>(getBaseData);
  const [amigoData, setAmigoData] = useState<AmigoLiveData>({ birthdays: [] });
  const [pipelineFromSheets, setPipelineFromSheets] = useState<PipelineCard[] | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<SyncState>({
    dados:  'syncing', dadosMsg:  '',
    agenda: 'syncing', agendaMsg: '',
  });

  const emAndamento = useRef(false);

  // ── Planilha da clínica ────────────────────────────────────────────────────
  const puxarDados = useCallback(async (token: string) => {
    setSyncState(s => ({ ...s, dados: 'syncing' }));
    try {
      const res = await fetch('/api/sheets/pull', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('sem conexão');

      const json = await res.json();
      const remote = json?.data as Record<string, unknown> | undefined;
      if (!remote) {
        setSyncState(s => ({ ...s, dados: 'error', dadosMsg: 'Nenhum dado recebido' }));
        return;
      }

      const merged = sheetsFirstMerge(getBaseData(), remote);
      setData(merged);
      safeStorage.set(SNAPSHOT_KEY, merged);

      const sheetsCards = extractPipeline(remote);
      if (sheetsCards && sheetsCards.length > 0) setPipelineFromSheets(sheetsCards);

      const totalCir  = (merged.cir25?.length  ?? 0) + (merged.cir26?.length  ?? 0);
      const totalCons = (merged.cons25?.length ?? 0) + (merged.cons26?.length ?? 0);

      setSyncState(s => ({
        ...s,
        dados: 'ok',
        dadosMsg: `${totalCir} cirurgias · ${totalCons} consultas`,
      }));
      setLastSyncAt(new Date().toISOString());
      setNotifications(prev => prev.filter(n => n.id !== 'notif_welcome'));
    } catch {
      setSyncState(s => ({
        ...s,
        dados: 'error',
        dadosMsg: 'Não foi possível atualizar agora — os últimos dados salvos continuam à mostra.',
      }));
    } finally {
      setSyncing(false);
    }
  }, []);

  // ── Aniversários vindos do sistema de agendamento ──────────────────────────
  const puxarAgenda = useCallback(async (token: string) => {
    setSyncState(s => ({ ...s, agenda: 'syncing' }));
    try {
      const res = await fetch('/api/amigo/sync', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!res.ok) {
        setSyncState(s => ({ ...s, agenda: 'error', agendaMsg: 'Sem conexão com a agenda' }));
        return;
      }

      const json = await res.json();
      if (!json?.data) {
        // Integração ainda não liberada — o painel segue normal, sem alarde.
        setSyncState(s => ({ ...s, agenda: 'unconfigured', agendaMsg: 'Agenda ainda não conectada' }));
        return;
      }

      const todayBdays = (json.data.birthdays ?? []) as import('@/lib/data-model').AmigoBirthdayItem[];
      const upcoming   = (json.data.upcomingBirthdays ?? []) as import('@/lib/data-model').AmigoBirthdayItem[];
      const totalBdays = todayBdays.length + upcoming.length;

      setSyncState(s => ({
        ...s,
        agenda: json.firstError ? 'error' : 'ok',
        agendaMsg: json.firstError
          ? 'Sem conexão com a agenda'
          : totalBdays > 0
            ? `${totalBdays} aniversário${totalBdays !== 1 ? 's' : ''} nos próximos 15 dias`
            : 'Nenhum aniversário nos próximos 15 dias',
      }));

      setAmigoData({
        birthdays:         todayBdays,
        upcomingBirthdays: upcoming,
        syncedAt:          json.timestamp,
      });

      // Aniversariantes de hoje viram avisos — sem repetir a cada atualização.
      const todayStr = new Date().toISOString().split('T')[0];
      if (todayBdays.length > 0) {
        setNotifications(prev => {
          const novos = todayBdays
            .map(b => ({
              id: `bday_${todayStr}_${b.id || b.name}`,
              type: 'birthday' as const,
              title: 'Aniversário hoje',
              body: `${b.name}${b.phone ? ` · ${b.phone}` : ''}`,
              date: todayStr,
              read: false,
            }))
            .filter(n => !prev.some(p => p.id === n.id));
          return novos.length > 0 ? [...novos, ...prev] : prev;
        });
      }
    } catch {
      setSyncState(s => ({ ...s, agenda: 'error', agendaMsg: 'Sem conexão com a agenda' }));
    }
  }, []);

  const sincronizar = useCallback(async () => {
    const token = getAuthToken();
    if (!token || emAndamento.current) return;
    emAndamento.current = true;
    try {
      await Promise.all([puxarDados(token), puxarAgenda(token)]);
    } finally {
      emAndamento.current = false;
    }
  }, [puxarDados, puxarAgenda]);

  // Primeira carga + atualização automática (relógio, volta à aba, rede de volta)
  useEffect(() => {
    const snap = safeStorage.get<DashboardData | null>(SNAPSHOT_KEY, null);
    if (snap) setData(snap);

    if (!getAuthToken()) {
      router.replace('/login');
      return;
    }

    sincronizar();

    const timer = setInterval(sincronizar, AUTO_SYNC_MS);
    const aoVoltar = () => { if (document.visibilityState === 'visible') sincronizar(); };
    document.addEventListener('visibilitychange', aoVoltar);
    window.addEventListener('online', sincronizar);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', aoVoltar);
      window.removeEventListener('online', sincronizar);
    };
  }, [router, sincronizar]);

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
      lastSyncAt={lastSyncAt}
      onRefresh={sincronizar}
      patients={patients}
    >
      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
      <div
        key={activeTab}
        id={`painel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={TABS.some(t => t.id === activeTab) ? `aba-${activeTab}` : undefined}
        tabIndex={-1}
        style={{ animation: 'fadeIn 0.25s ease both', paddingTop: '26px' }}
      >
        {renderTabContent()}
      </div>
      <AssistantChat />
    </DashboardLayout>
  );
}
