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
import AniversariosPane from '@/components/TabPanes/AniversariosPane';
import OrcamentosPane from '@/components/TabPanes/OrcamentosPane';
import { getBaseData, sheetsFirstMerge, extractPipeline } from '@/lib/merge-data';
import { mergePatientRecords } from '@/lib/normalize-patient';
import { getAuthToken, safeStorage, SNAPSHOT_KEY } from '@/lib/safe-storage';
import type { DashboardData, Notification, AmigoLiveData, PipelineCard } from '@/lib/data-model';

// Tab names match the original HTML exactly
const TABS = [
  { id: 'resumo',    label: 'Visão Geral' },
  { id: 'mayra',     label: 'Mayra',    highlight: true },
  { id: 'pipeline',  label: 'Comercial',highlight: true },
  { id: 'cirurgias', label: 'Cirurgias' },
  { id: 'consultas', label: 'Consultas' },
  { id: 'pacientes', label: 'Pacientes' },
  { id: 'ranking',   label: 'Ranking' },
  { id: 'equipe',    label: 'Equipe' },
  { id: 'orcamentos',label: 'Orçamentos' },
  { id: 'funil',     label: 'Funil' },
  { id: 'geo',       label: 'Origem' },
  { id: 'comp',      label: '2025 × 2026' },
  { id: 'aniversarios', label: '🎂 Aniversários', highlight: true },
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

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('resumo');
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [syncing, setSyncing] = useState(true);
  const [data, setData] = useState<DashboardData>(getBaseData);
  const [amigoData, setAmigoData] = useState<AmigoLiveData>({ attendances: [], birthdays: [] });
  const [pipelineFromSheets, setPipelineFromSheets] = useState<PipelineCard[] | null>(null);

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
        const remote = json?.data as Record<string, unknown> | undefined;

        if (!cancelled && remote) {
          const merged = sheetsFirstMerge(getBaseData(), remote);
          setData(merged);
          safeStorage.set(SNAPSHOT_KEY, merged);
          // Extract pipeline cards from Sheets if available
          const sheetsCards = extractPipeline(remote);
          if (sheetsCards && sheetsCards.length > 0) {
            setPipelineFromSheets(sheetsCards);
          }

          const totalCir  = (merged.cir25?.length  ?? 0) + (merged.cir26?.length  ?? 0);
          const totalCons = (merged.cons25?.length ?? 0) + (merged.cons26?.length ?? 0);

          setNotifications((prev) => [
            {
              id: `sync_${Date.now()}`,
              type: 'info',
              title: '✅ Dados sincronizados',
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

    async function syncAmigo() {
      try {
        const res = await fetch('/api/amigo/sync', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled && json?.data) {
          setAmigoData({
            attendances: json.data.attendances ?? [],
            birthdays:   json.data.birthdays   ?? [],
            syncedAt:    json.timestamp,
          });
          // Add birthday notifications
          const todayStr = new Date().toISOString().split('T')[0];
          const bdays = (json.data.birthdays ?? []) as Array<{name:string;phone?:string}>;
          if (bdays.length > 0) {
            setNotifications(prev => [
              ...bdays.map((b, i) => ({
                id: `bday_${Date.now()}_${i}`,
                type: 'birthday' as const,
                title: '🎂 Aniversário hoje',
                body: `${b.name}${b.phone ? ` · ${b.phone}` : ''}`,
                date: todayStr,
                read: false,
              })),
              ...prev,
            ]);
          }
        }
      } catch {
        // AmigoClinic offline — ignore silently
      }
    }

    syncSheets();
    syncAmigo();
    return () => { cancelled = true; };
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
        return <ResumoPane cir25={data.cir25} cir26={data.cir26} cons25={data.cons25} cons26={data.cons26} canal25={data.canal25} canal26={data.canal26} fx25={data.fx25} fx26={data.fx26} />;
      case 'mayra':
        return <PipelinePane initialCards={pipelineFromSheets ?? undefined} cons26={data.cons26} cir26={data.cir26} />;
      case 'cirurgias':
        return <CirurgiasPane cir25={data.cir25} cir26={data.cir26} />;
      case 'consultas':
        return <ConsultasPane cons25={data.cons25} cons26={data.cons26} />;
      case 'pacientes':
        return <PacientesPane patients={patients} amigoAttendances={amigoData.attendances} />;
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
        return <OrcamentosPane orc25={data.orc25} orc26={data.orc26} />;
      case 'aniversarios':
        return <AniversariosPane cir25={data.cir25} cir26={data.cir26} amigoData={amigoData} />;
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
      patients={patients}
    >
      {/* Tabs */}
      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {/* Content — fadein on tab change */}
      <div key={activeTab} style={{ animation: 'fadeIn 0.25s ease both' }}>
        {renderTabContent()}
      </div>

      {/* Floating AI assistant */}
      <AssistantChat />
    </DashboardLayout>
  );
}
