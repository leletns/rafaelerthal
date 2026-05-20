'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import Tabs from '@/components/Tabs';
import AssistantChat from '@/components/AssistantChat';
import ResumoPane from '@/components/TabPanes/ResumoPane';
import CirurgiasPane from '@/components/TabPanes/CirurgiasPane';
import ConsultasPane from '@/components/TabPanes/ConsultasPane';
import PacientesPane from '@/components/TabPanes/PacientesPane';
import PipelinePane from '@/components/TabPanes/PipelinePane';
import RankingPane from '@/components/TabPanes/RankingPane';
import FunilPane from '@/components/TabPanes/FunilPane';
import GeoPane from '@/components/TabPanes/GeoPane';
import CompPane from '@/components/TabPanes/CompPane';
import EquipePane from '@/components/TabPanes/EquipePane';
import OrcamentosPane from '@/components/TabPanes/OrcamentosPane';
import { getBaseData, sheetsFirstMerge } from '@/lib/merge-data';
import { mergePatientRecords } from '@/lib/normalize-patient';
import { getAuthToken, safeStorage, SNAPSHOT_KEY } from '@/lib/safe-storage';
import type { DashboardData, Notification } from '@/lib/data-model';

const TABS = [
  { id: 'resumo', label: 'Resumo' },
  { id: 'cirurgias', label: 'Cirurgias' },
  { id: 'consultas', label: 'Consultas' },
  { id: 'pacientes', label: 'Pacientes' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'ranking', label: 'Ranking' },
  { id: 'funil', label: 'Funil' },
  { id: 'geo', label: 'Geo & Canais' },
  { id: 'comp', label: 'Comparativo' },
  { id: 'equipe', label: 'Equipe' },
  { id: 'orcamentos', label: 'Orçamentos' },
];

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

function getInitialData(): DashboardData {
  const snap = safeStorage.get<DashboardData | null>(SNAPSHOT_KEY, null);
  return snap ?? getBaseData();
}

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('resumo');
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [syncing, setSyncing] = useState(true);
  const [data, setData] = useState<DashboardData>(getBaseData);

  // Load snapshot on client then sync with Sheets
  useEffect(() => {
    const snap = safeStorage.get<DashboardData | null>(SNAPSHOT_KEY, null);
    if (snap) setData(snap);

    const token = getAuthToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    let cancelled = false;

    async function syncSheets() {
      try {
        const res = await fetch('/api/sheets/pull', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        const remote = json?.data?.data as Record<string, unknown> | undefined;

        if (!cancelled && remote) {
          const merged = sheetsFirstMerge(getBaseData(), remote);
          setData(merged);
          safeStorage.set(SNAPSHOT_KEY, merged);

          const totalCir = (merged.cir25?.length ?? 0) + (merged.cir26?.length ?? 0);
          const totalCons = (merged.cons25?.length ?? 0) + (merged.cons26?.length ?? 0);

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
        }
      } catch {
        // Sheets unavailable — keep snapshot/legacy data silently
      } finally {
        if (!cancelled) setSyncing(false);
      }
    }

    syncSheets();

    return () => { cancelled = true; };
  }, [router]);

  function handleMarkRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  const patients = useMemo(
    () =>
      mergePatientRecords(
        [...data.cir25, ...data.cir26],
        [...data.cons25, ...data.cons26]
      ),
    [data]
  );

  function renderTabContent() {
    switch (activeTab) {
      case 'resumo':
        return (
          <ResumoPane
            cir25={data.cir25}
            cir26={data.cir26}
            cons25={data.cons25}
            cons26={data.cons26}
          />
        );
      case 'cirurgias':
        return <CirurgiasPane cir25={data.cir25} cir26={data.cir26} />;
      case 'consultas':
        return <ConsultasPane cons25={data.cons25} cons26={data.cons26} />;
      case 'pacientes':
        return <PacientesPane patients={patients} />;
      case 'pipeline':
        return <PipelinePane />;
      case 'ranking':
        return (
          <RankingPane
            cir25={data.cir25}
            cir26={data.cir26}
            cons25={data.cons25}
            cons26={data.cons26}
          />
        );
      case 'funil':
        return (
          <FunilPane
            cir25={data.cir25}
            cir26={data.cir26}
            cons25={data.cons25}
            cons26={data.cons26}
          />
        );
      case 'geo':
        return (
          <GeoPane
            cir25={data.cir25}
            cir26={data.cir26}
            cons25={data.cons25}
            cons26={data.cons26}
          />
        );
      case 'comp':
        return (
          <CompPane
            cir25={data.cir25}
            cir26={data.cir26}
            cons25={data.cons25}
            cons26={data.cons26}
          />
        );
      case 'equipe':
        return <EquipePane />;
      case 'orcamentos':
        return <OrcamentosPane />;
      default:
        return null;
    }
  }

  return (
    <DashboardLayout
      notifications={notifications}
      onMarkRead={handleMarkRead}
      onMarkAllRead={handleMarkAllRead}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Sync indicator */}
        {syncing && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              background: 'rgba(0,122,255,0.08)',
              borderRadius: '8px',
              fontSize: '0.75rem',
              color: '#007AFF',
              fontWeight: 500,
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#007AFF',
                animation: 'pulse 1.2s ease-in-out infinite',
                display: 'inline-block',
              }}
            />
            Sincronizando com Google Sheets…
          </div>
        )}

        {/* Tabs */}
        <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

        {/* Content */}
        <div style={{ animation: 'fadeIn 0.2s ease' }}>{renderTabContent()}</div>
      </div>

      {/* Floating AI assistant */}
      <AssistantChat />
    </DashboardLayout>
  );
}
