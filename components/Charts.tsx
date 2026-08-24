'use client';

import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Doughnut, Pie } from 'react-chartjs-2';
import { THEME_EVENT, readToken } from '@/lib/theme';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Title, Tooltip, Legend, Filler
);

// ── Cores dos gráficos vindas do tema ────────────────────────────────────────
const TOKENS = ['--c-blue', '--c-green', '--c-orange', '--c-purple', '--c-red', '--c-teal', '--c-magenta', '--c-coral'];

interface ChartTheme {
  palette: string[];
  grid: string;
  tick: string;
  surface: string;
  ready: boolean;
}

const FALLBACK: ChartTheme = {
  palette: ['#0B63CE', '#167A3A', '#A85B00', '#4A45C4', '#C0271E', '#0E7490', '#8E3BB8', '#B24A1E'],
  grid: '#E3E3E8', tick: '#5C5C64', surface: '#FFFFFF', ready: false,
};

function useChartTheme(): ChartTheme {
  const [theme, setTheme] = useState<ChartTheme>(FALLBACK);

  useEffect(() => {
    function read() {
      setTheme({
        palette: TOKENS.map((t, i) => readToken(t, FALLBACK.palette[i])),
        grid:    readToken('--border', FALLBACK.grid),
        tick:    readToken('--text-2', FALLBACK.tick),
        surface: readToken('--surface', FALLBACK.surface),
        ready:   true,
      });
    }
    read();
    window.addEventListener(THEME_EVENT, read);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', read);
    return () => {
      window.removeEventListener(THEME_EVENT, read);
      mq.removeEventListener('change', read);
    };
  }, []);

  return theme;
}

function baseScales(t: ChartTheme, extraY: Record<string, unknown> = {}) {
  return {
    y: {
      beginAtZero: true,
      ticks: { font: { size: 12 }, color: t.tick },
      grid: { color: t.grid },
      border: { color: t.grid },
      ...extraY,
    },
    x: {
      ticks: { font: { size: 12 }, color: t.tick },
      grid: { display: false },
      border: { color: t.grid },
    },
  };
}

/** Descrição em texto para quem usa leitor de tela. */
function Descricao({ children }: { children: string }) {
  return <span className="sr-only">{children}</span>;
}

// ===================== Faturamento por mês =====================
interface RevenueChartProps {
  data: { mes: string; receita: number }[];
  year: number;
}

export function RevenueBarChart({ data, year }: RevenueChartProps) {
  const t = useChartTheme();
  const total = data.reduce((s, d) => s + d.receita, 0);

  const chartData = {
    labels: data.map((d) => d.mes),
    datasets: [{
      label: `Faturamento ${year}`,
      data: data.map((d) => d.receita),
      backgroundColor: t.palette[0],
      borderRadius: 8,
      borderSkipped: false as const,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { raw: unknown }) => ` R$ ${Number(ctx.raw).toLocaleString('pt-BR')}`,
        },
      },
    },
    scales: baseScales(t, {
      ticks: {
        callback: (val: unknown) => `R$ ${Number(val).toLocaleString('pt-BR')}`,
        font: { size: 12 },
        color: t.tick,
      },
    }),
  };

  return (
    <div style={{ height: '220px' }}>
      <Bar data={chartData} options={options} aria-label={`Faturamento mês a mês em ${year}. Total de R$ ${total.toLocaleString('pt-BR')}.`} />
      <Descricao>{data.map((d) => `${d.mes}: R$ ${d.receita.toLocaleString('pt-BR')}`).join('. ')}</Descricao>
    </div>
  );
}

// ===================== Atendimentos por mês =====================
interface MonthlySurgeriesChartProps {
  data: { mes: string; cirurgias: number }[];
  year: number;
}

export function MonthlySurgeriesChart({ data, year }: MonthlySurgeriesChartProps) {
  const t = useChartTheme();
  const total = data.reduce((s, d) => s + d.cirurgias, 0);

  const chartData = {
    labels: data.map((d) => d.mes),
    datasets: [{
      label: `Cirurgias ${year}`,
      data: data.map((d) => d.cirurgias),
      borderColor: t.palette[0],
      backgroundColor: `color-mix(in srgb, ${t.palette[0]} 14%, transparent)`,
      fill: true,
      tension: 0.3,
      pointRadius: 4,
      pointBackgroundColor: t.palette[0],
      pointBorderColor: t.surface,
      pointBorderWidth: 2,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: baseScales(t, { ticks: { stepSize: 1, font: { size: 12 }, color: t.tick } }),
  };

  return (
    <div style={{ height: '220px' }}>
      <Line data={chartData} options={options} aria-label={`Cirurgias mês a mês em ${year}. Total de ${total}.`} />
      <Descricao>{data.map((d) => `${d.mes}: ${d.cirurgias}`).join('. ')}</Descricao>
    </div>
  );
}

// ===================== Canais =====================
interface CanalChartProps {
  data: { canal: string; count: number; pct: number }[];
}

export function CanalDoughnutChart({ data }: CanalChartProps) {
  const t = useChartTheme();
  const chartData = {
    labels: data.map((d) => d.canal),
    datasets: [{
      data: data.map((d) => d.count),
      backgroundColor: t.palette.slice(0, Math.max(1, data.length)),
      borderWidth: 2,
      borderColor: t.surface,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' as const, labels: { font: { size: 12 }, padding: 12, boxWidth: 12, color: t.tick } },
      tooltip: {
        callbacks: {
          label: (ctx: { label: string; raw: unknown; dataIndex: number }) =>
            ` ${ctx.label}: ${ctx.raw} (${data[ctx.dataIndex]?.pct}%)`,
        },
      },
    },
    cutout: '60%',
  };

  return (
    <div style={{ height: '200px' }}>
      <Doughnut data={chartData} options={options} aria-label="Distribuição de pacientes por canal de origem" />
      <Descricao>{data.map((d) => `${d.canal}: ${d.count} (${d.pct}%)`).join('. ')}</Descricao>
    </div>
  );
}

// ===================== Faixa etária =====================
interface AgeChartProps {
  data: { faixa: string; count: number; pct: number }[];
}

export function AgeBarChart({ data }: AgeChartProps) {
  const t = useChartTheme();
  const chartData = {
    labels: data.map((d) => d.faixa),
    datasets: [{
      label: 'Pacientes',
      data: data.map((d) => d.count),
      backgroundColor: t.palette[3],
      borderRadius: 6,
      borderSkipped: false as const,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: baseScales(t, { ticks: { stepSize: 5, font: { size: 12 }, color: t.tick } }),
  };

  return (
    <div style={{ height: '200px' }}>
      <Bar data={chartData} options={options} aria-label="Pacientes por faixa etária" />
      <Descricao>{data.map((d) => `${d.faixa}: ${d.count} (${d.pct}%)`).join('. ')}</Descricao>
    </div>
  );
}

// ===================== Funil =====================
interface FunnelChartProps {
  data: { label: string; value: number }[];
}

export function FunnelBarChart({ data }: FunnelChartProps) {
  const t = useChartTheme();
  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [{
      label: 'Quantidade',
      data: data.map((d) => d.value),
      backgroundColor: t.palette.slice(0, Math.max(1, data.length)),
      borderRadius: 6,
      borderSkipped: false as const,
    }],
  };

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { beginAtZero: true, ticks: { font: { size: 12 }, color: t.tick }, grid: { color: t.grid }, border: { color: t.grid } },
      y: { ticks: { font: { size: 12 }, color: t.tick }, grid: { display: false }, border: { color: t.grid } },
    },
  };

  return (
    <div style={{ height: `${data.length * 44}px`, minHeight: '160px' }}>
      <Bar data={chartData} options={options} aria-label="Funil de conversão" />
      <Descricao>{data.map((d) => `${d.label}: ${d.value}`).join('. ')}</Descricao>
    </div>
  );
}

// ===================== Cidades =====================
interface CityChartProps {
  data: { cidade: string; count: number }[];
}

export function CityPieChart({ data }: CityChartProps) {
  const t = useChartTheme();
  const top = data.slice(0, 6);
  const otherCount = data.slice(6).reduce((acc, d) => acc + d.count, 0);
  const display = otherCount > 0 ? [...top, { cidade: 'Outras', count: otherCount }] : top;

  const chartData = {
    labels: display.map((d) => d.cidade),
    datasets: [{
      data: display.map((d) => d.count),
      backgroundColor: t.palette.slice(0, Math.max(1, display.length)),
      borderWidth: 2,
      borderColor: t.surface,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' as const, labels: { font: { size: 12 }, padding: 10, boxWidth: 10, color: t.tick } },
    },
  };

  return (
    <div style={{ height: '200px' }}>
      <Pie data={chartData} options={options} aria-label="Pacientes por cidade de origem" />
      <Descricao>{display.map((d) => `${d.cidade}: ${d.count}`).join('. ')}</Descricao>
    </div>
  );
}

// ===================== 2025 vs 2026 =====================
interface CompChartProps {
  data: { label: string; v2025: number; v2026: number }[];
  title?: string;
}

export function ComparisonBarChart({ data, title }: CompChartProps) {
  const t = useChartTheme();
  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      { label: '2025', data: data.map((d) => d.v2025), backgroundColor: t.palette[0], borderRadius: 6, borderSkipped: false as const },
      { label: '2026', data: data.map((d) => d.v2026), backgroundColor: t.palette[1], borderRadius: 6, borderSkipped: false as const },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const, labels: { font: { size: 12 }, color: t.tick } },
      title: title ? { display: true, text: title, color: t.tick, font: { size: 13, weight: 'bold' as const } } : undefined,
    },
    scales: baseScales(t),
  };

  return (
    <div style={{ height: '220px' }}>
      <Bar data={chartData} options={options} aria-label={title ? `${title}: comparação entre 2025 e 2026` : 'Comparação entre 2025 e 2026'} />
      <Descricao>{data.map((d) => `${d.label}: 2025 ${d.v2025}, 2026 ${d.v2026}`).join('. ')}</Descricao>
    </div>
  );
}
