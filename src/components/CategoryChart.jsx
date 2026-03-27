import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { formatCurrency } from '../utils/formatters';

ChartJS.register(ArcElement, Tooltip, Legend);

const palette = [
  '#8B5CF6', '#F97316', '#22C55E', '#EF4444', '#3B82F6',
  '#EC4899', '#14B8A6', '#F59E0B', '#6366F1', '#A855F7',
  '#10B981', '#F43F5E',
];

export default function CategoryChart({ data }) {
  if (!data || data.length === 0) {
    return <p className="text-gray-500 text-sm text-center py-8">Sem gastos ainda</p>;
  }

  const chartData = {
    labels: data.map(d => `${d.icon} ${d.name}`),
    datasets: [
      {
        data: data.map(d => d.amount),
        backgroundColor: data.map((_, i) => palette[i % palette.length] + 'CC'),
        borderColor: data.map((_, i) => palette[i % palette.length]),
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#9CA3AF',
          font: { size: 11 },
          padding: 12,
          usePointStyle: true,
          pointStyleWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        borderColor: 'rgba(139, 92, 246, 0.3)',
        borderWidth: 1,
        titleColor: '#9CA3AF',
        bodyColor: '#F3F4F6',
        padding: 12,
        callbacks: {
          label: (ctx) => ` ${formatCurrency(ctx.raw)}`,
        },
      },
    },
  };

  return (
    <div className="h-56">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
