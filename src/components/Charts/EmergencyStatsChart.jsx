import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export const EmergencyStatsChart = ({ data }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#94a3b8',
          font: { family: 'Plus Jakarta Sans', size: 11, weight: 600 },
          usePointStyle: true,
          padding: 14
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12
      }
    }
  };

  const defaultData = {
    labels: ['SOS Manual Trigger', 'High Impact Fall', 'No Movement (>45m)', 'Geofence Breach'],
    datasets: [
      {
        data: [42, 28, 18, 12],
        backgroundColor: ['#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4'],
        borderWidth: 0,
        hoverOffset: 8
      }
    ]
  };

  return (
    <div className="w-full h-72 flex items-center justify-center">
      <Doughnut data={data || defaultData} options={options} />
    </div>
  );
};
