import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

export default function BalanceChart({ data }) {
  if (!data || data.length === 0) {
    return <p className="text-gray-500 text-sm text-center py-8">Sem dados ainda</p>;
  }

  const chartData = {
    labels: data.map(d => {
      const dt = new Date(d.date);
      return `${dt.getDate()}/${dt.getMonth() + 1}`;
    }),
    datasets: [
      {
        data: data.map(d => d.balance),
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#8B5CF6',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        borderColor: 'rgba(139, 92, 246, 0.3)',
        borderWidth: 1,
        titleColor: '#9CA3AF',
        bodyColor: '#F3F4F6',
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (ctx) =>
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ctx.raw),
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#6B7280', font: { size: 10 }, maxTicksLimit: 8 },
        border: { display: false },
      },
      y: {
        grid: { color: 'rgba(75, 85, 99, 0.2)' },
        ticks: {
          color: '#6B7280',
          font: { size: 10 },
          callback: v => `R$${(v / 1000).toFixed(0)}k`,
        },
        border: { display: false },
      },
    },
  };

  return (
    <div className="h-56">
      <Line data={chartData} options={options} />
    </div>
  );
}
