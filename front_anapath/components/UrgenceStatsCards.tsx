'use client';

import { getUrgenceLevel } from '@/lib/urgencySort';

interface UrgenceAware {
  metadata?: Record<string, unknown> | null;
  isExtemporane?: boolean;
}

export default function UrgenceStatsCards({ requests }: { requests: UrgenceAware[] }) {
  const total = requests.length;
  const stat = requests.filter((r) => getUrgenceLevel(r) === 'STAT').length;
  const urgent = requests.filter((r) => getUrgenceLevel(r) === 'URGENTE').length;
  const normal = requests.filter((r) => getUrgenceLevel(r) === 'NORMALE').length;

  const subCards = [
    { label: 'TRES URGENT', value: stat, icon: 'emergency', color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'URGENT', value: urgent, icon: 'priority_high', color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Normal', value: normal, icon: 'task_alt', color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="relative overflow-hidden bg-gradient-to-br from-primary to-blue-900 p-4 rounded-xl shadow-sm flex justify-between items-center text-white">
        <div className="relative z-10">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/80">Total examens</p>
          <p className="text-4xl font-extrabold mt-0.5">{total}</p>
        </div>
        <span className="material-symbols-outlined text-white/15 text-6xl absolute -right-2 -bottom-3">biotech</span>
      </div>
      {subCards.map((c) => (
        <div
          key={c.label}
          className="bg-white p-4 rounded-xl shadow-sm border border-outline-variant/20 flex justify-between items-start"
        >
          <div>
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">{c.label}</p>
            <p className={`text-2xl font-extrabold mt-0.5 ${c.color}`}>{c.value}</p>
          </div>
          <span className={`material-symbols-outlined ${c.color} ${c.bg} rounded-full p-1.5 text-lg`}>{c.icon}</span>
        </div>
      ))}
    </div>
  );
}
