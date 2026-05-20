'use client';

import { useState, useMemo } from 'react';
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
import { cir25_lista, cir26_lista, cons25_lista, cons26_lista } from '@/lib/legacy-data';
import { mergePatientRecords } from '@/lib/normalize-patient';
import type { Notification } from '@/lib/data-model';

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
    body: 'Dashboard da Clínica Blue — Dr. Rafael Erthal. Todos os dados carregados com sucesso.',
    date: new Date().toISOString().split('T')[0],
    read: false,
  },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('resumo');
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);

  const patients = useMemo(
    () => mergePatientRecords(
      [...cir25_lista, ...cir26_lista],
      [...cons25_lista, ...cons26_lista]
    ),
    []
  );

  function handleMarkRead(id: string) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function renderTabContent() {
    switch (activeTab) {
      case 'resumo':
        return <ResumoPane cir25={cir25_lista} cir26={cir26_lista} cons25={cons25_lista} cons26={cons26_lista} />;
      case 'cirurgias':
        return <CirurgiasPane cir25={cir25_lista} cir26={cir26_lista} />;
      case 'consultas':
        return <ConsultasPane cons25={cons25_lista} cons26={cons26_lista} />;
      case 'pacientes':
        return <PacientesPane patients={patients} />;
      case 'pipeline':
        return <PipelinePane />;
      case 'ranking':
        return <RankingPane cir25={cir25_lista} cir26={cir26_lista} cons25={cons25_lista} cons26={cons26_lista} />;
      case 'funil':
        return <FunilPane cir25={cir25_lista} cir26={cir26_lista} cons25={cons25_lista} cons26={cons26_lista} />;
      case 'geo':
        return <GeoPane cir25={cir25_lista} cir26={cir26_lista} cons25={cons25_lista} cons26={cons26_lista} />;
      case 'comp':
        return <CompPane cir25={cir25_lista} cir26={cir26_lista} cons25={cons25_lista} cons26={cons26_lista} />;
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
        {/* Tabs */}
        <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

        {/* Content */}
        <div style={{ animation: 'fadeIn 0.2s ease' }}>
          {renderTabContent()}
        </div>
      </div>

      {/* Floating AI assistant */}
      <AssistantChat />
    </DashboardLayout>
  );
}
