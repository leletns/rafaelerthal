'use client';

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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const CHART_COLORS = {
  blue: '#007AFF',
  green: '#28A745',
  orange: '#FF9500',
  red: '#FF3B30',
  purple: '#5856D6',
  teal: '#5AC8FA',
  yellow: '#FFCC00',
  indigo: '#34A853',
};

const PALETTE = Object.values(CHART_COLORS);

// ===================== Revenue Bar Chart =====================
interface RevenueChartProps {
  data: { mes: string; receita: number }[];
  year: number;
}

export function RevenueBarChart({ data, year }: RevenueChartProps) {
  const chartData = {
    labels: data.map((d) => d.mes),
    datasets: [
      {
        label: `Faturamento ${year}`,
        data: data.map((d) => d.receita),
        backgroundColor: 'rgba(0, 122, 255, 0.8)',
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { raw: unknown }) =>
            ` R$ ${Number(ctx.raw).toLocaleString('pt-BR')}`,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (val: unknown) => `R$ ${Number(val).toLocaleString('pt-BR')}`,
          font: { size: 11 },
        },
        grid: { color: '#F2F2F7' },
      },
      x: {
        ticks: { font: { size: 11 } },
        grid: { display: false },
      },
    },
  };

  return (
    <div style={{ height: '220px' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}

// ===================== Monthly Surgeries Line =====================
interface MonthlySurgeriesChartProps {
  data: { mes: string; cirurgias: number }[];
  year: number;
}

export function MonthlySurgeriesChart({ data, year }: MonthlySurgeriesChartProps) {
  const chartData = {
    labels: data.map((d) => d.mes),
    datasets: [
      {
        label: `Cirurgias ${year}`,
        data: data.map((d) => d.cirurgias),
        borderColor: '#007AFF',
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 5,
        pointBackgroundColor: '#007AFF',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, font: { size: 11 } },
        grid: { color: '#F2F2F7' },
      },
      x: {
        ticks: { font: { size: 11 } },
        grid: { display: false },
      },
    },
  };

  return (
    <div style={{ height: '220px' }}>
      <Line data={chartData} options={options} />
    </div>
  );
}

// ===================== Canal Doughnut =====================
interface CanalChartProps {
  data: { canal: string; count: number; pct: number }[];
}

export function CanalDoughnutChart({ data }: CanalChartProps) {
  const chartData = {
    labels: data.map((d) => d.canal),
    datasets: [
      {
        data: data.map((d) => d.count),
        backgroundColor: PALETTE.slice(0, data.length),
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: { font: { size: 12 }, padding: 12, boxWidth: 12 },
      },
      tooltip: {
        callbacks: {
          label: (ctx: { label: string; raw: unknown; dataset: { data: unknown[] }; dataIndex: number }) =>
            ` ${ctx.label}: ${ctx.raw} (${data[ctx.dataIndex]?.pct}%)`,
        },
      },
    },
    cutout: '60%',
  };

  return (
    <div style={{ height: '200px' }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
}

// ===================== Age Bracket Bar =====================
interface AgeChartProps {
  data: { faixa: string; count: number; pct: number }[];
}

export function AgeBarChart({ data }: AgeChartProps) {
  const chartData = {
    labels: data.map((d) => d.faixa),
    datasets: [
      {
        label: 'Pacientes',
        data: data.map((d) => d.count),
        backgroundColor: 'rgba(88, 86, 214, 0.8)',
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 5, font: { size: 11 } },
        grid: { color: '#F2F2F7' },
      },
      x: {
        ticks: { font: { size: 11 } },
        grid: { display: false },
      },
    },
  };

  return (
    <div style={{ height: '200px' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}

// ===================== Funnel Bar (horizontal) =====================
interface FunnelChartProps {
  data: { label: string; value: number }[];
}

export function FunnelBarChart({ data }: FunnelChartProps) {
  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        label: 'Quantidade',
        data: data.map((d) => d.value),
        backgroundColor: [
          '#007AFF',
          '#5856D6',
          '#FF9500',
          '#28A745',
          '#FF3B30',
        ].slice(0, data.length),
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { font: { size: 11 } },
        grid: { color: '#F2F2F7' },
      },
      y: {
        ticks: { font: { size: 11 } },
        grid: { display: false },
      },
    },
  };

  return (
    <div style={{ height: `${data.length * 44}px`, minHeight: '160px' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}

// ===================== City Pie =====================
interface CityChartProps {
  data: { cidade: string; count: number }[];
}

export function CityPieChart({ data }: CityChartProps) {
  const top = data.slice(0, 6);
  const otherCount = data.slice(6).reduce((acc, d) => acc + d.count, 0);
  const display = otherCount > 0 ? [...top, { cidade: 'Outras', count: otherCount }] : top;

  const chartData = {
    labels: display.map((d) => d.cidade),
    datasets: [
      {
        data: display.map((d) => d.count),
        backgroundColor: PALETTE.slice(0, display.length),
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: { font: { size: 11 }, padding: 10, boxWidth: 10 },
      },
    },
  };

  return (
    <div style={{ height: '200px' }}>
      <Pie data={chartData} options={options} />
    </div>
  );
}

// ===================== Comparison Bar (2025 vs 2026) =====================
interface CompChartProps {
  data: { label: string; v2025: number; v2026: number }[];
  title?: string;
}

export function ComparisonBarChart({ data, title }: CompChartProps) {
  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        label: '2025',
        data: data.map((d) => d.v2025),
        backgroundColor: 'rgba(0, 122, 255, 0.7)',
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: '2026',
        data: data.map((d) => d.v2026),
        backgroundColor: 'rgba(40, 167, 69, 0.7)',
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const, labels: { font: { size: 11 } } },
      title: title ? { display: true, text: title, font: { size: 13, weight: 'bold' as const } } : undefined,
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { font: { size: 11 } },
        grid: { color: '#F2F2F7' },
      },
      x: {
        ticks: { font: { size: 11 } },
        grid: { display: false },
      },
    },
  };

  return (
    <div style={{ height: '220px' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}
