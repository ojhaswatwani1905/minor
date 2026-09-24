import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const TripStatsChart = ({ data }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#94a3b8',
          font: { family: 'Plus Jakarta Sans', size: 12, weight: 600 },
          usePointStyle: true,
          padding: 16
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { family: 'Plus Jakarta Sans' } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#64748b', font: { family: 'Plus Jakarta Sans' } }
      }
    }
  };

  const defaultData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Active Expeditions',
        data: [120, 150, 210, 340, 480, 590, 720],
        backgroundColor: 'rgba(2, 132, 199, 0.85)',
        borderRadius: 8,
      },
      {
        label: 'Completed Expeditions',
        data: [110, 140, 195, 310, 450, 560, 680],
        backgroundColor: 'rgba(16, 185, 129, 0.85)',
        borderRadius: 8,
      }
    ]
  };

  return (
    <div className="w-full h-72">
      <Bar data={data || defaultData} options={options} />
    </div>
  );
};
