import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function SpendingPieChart() {
  const { transactions } = useFinance();

  const expenses = transactions.filter(t => t.type === 'expense');
  const categories = [...new Set(expenses.map(t => t.category))];
  
  const data = categories.map(cat => ({
    name: cat,
    amount: expenses.filter(t => t.category === cat).reduce((acc, curr) => acc + curr.amount, 0)
  }));

  const chartData = {
    labels: data.map(d => d.name),
    datasets: [
      {
        data: data.map(d => d.amount),
        backgroundColor: [
          '#E2FE74', // accent
          '#60A5FA', // blue-400
          '#F87171', // red-400
          '#A78BFA', // violet-400
          '#34D399', // emerald-400
        ],
        borderWidth: 0,
        hoverOffset: 10,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#9CA3AF',
          font: {
            family: "'Inter', sans-serif"
          },
          padding: 20
        }
      },
    },
    cutout: '75%',
  };

  return <Doughnut data={chartData} options={options} />;
}

export function CashflowLineChart() {
  const { transactions } = useFinance();

  // Get last 6 months names
  const months = [];
  const monthIndices = []; // 0-11
  
  for (let i = 5; i >= 0; i--) {
     const d = new Date();
     d.setMonth(d.getMonth() - i);
     months.push(d.toLocaleDateString('en-IN', { month: 'short' }));
     monthIndices.push({ month: d.getMonth(), year: d.getFullYear() });
  }

  const incomeData = monthIndices.map(m => {
     return transactions
        .filter(t => {
           const d = new Date(t.date);
           return d.getMonth() === m.month && d.getFullYear() === m.year && t.type === 'income';
        })
        .reduce((sum, t) => sum + t.amount, 0);
  });

  const expenseData = monthIndices.map(m => {
     return transactions
        .filter(t => {
           const d = new Date(t.date);
           return d.getMonth() === m.month && d.getFullYear() === m.year && t.type === 'expense';
        })
        .reduce((sum, t) => sum + t.amount, 0);
  });

  const chartData = {
    labels: months,
    datasets: [
      {
        label: 'Income',
        data: incomeData,
        borderColor: '#34D399',
        backgroundColor: 'rgba(52, 211, 153, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#34D399',
        pointBorderColor: '#141414',
        pointBorderWidth: 2,
        pointRadius: 4,
      },
      {
        label: 'Expenses',
        data: expenseData,
        borderColor: '#F87171',
        backgroundColor: 'rgba(248, 113, 113, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#F87171',
        pointBorderColor: '#141414',
        pointBorderWidth: 2,
        pointRadius: 4,
      }
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(20, 20, 20, 0.9)',
        titleFont: { size: 10, weight: 'bold' },
        bodyFont: { size: 12, weight: 'bold' },
        padding: 12,
        cornerRadius: 12,
        displayColors: true,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        mode: 'index',
        intersect: false,
        callbacks: {
           label: function(context) {
              return ` ${context.dataset.label}: ₹${context.raw.toLocaleString()}`;
           }
        }
      }
    },
    scales: {
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
        ticks: { 
           color: '#9CA3AF', 
           font: { size: 10, weight: 'bold' },
           callback: (val) => `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`
        }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#9CA3AF', font: { size: 10, weight: 'bold' } }
      }
    },
    interaction: { mode: 'nearest', axis: 'x', intersect: false }
  };

  return <Line data={chartData} options={options} />;
}
