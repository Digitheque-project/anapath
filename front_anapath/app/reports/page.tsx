'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useSearch } from '@/components/SearchContext';
import axios from 'axios';
import { API_BASE } from '@/lib/api';
import { formatDate } from '@/lib/dateFormat';
import {
  getMondayOfWeek,
  formatWeekLabel,
  isDateInWeek,
  getDailyVolumeForWeek,
  getWeekRange,
  toWeekInputValue,
  parseWeekInputValue,
} from '@/lib/weekUtils';
import { statusLabels } from '@/lib/statusLabels';
import { getServiceDisplayName } from '@/lib/serviceDisplay';
import { generateReportPDF, type ReportPdfData } from '@/lib/reportPDF';
import { getTypeLabel } from '@/lib/generatePDF';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';

const COLORS = ['#00478d', '#2563eb', '#10b981',
  '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

interface AnapathRequest {
  id: string;
  anapathId: string;
  patientId: string;
  typeExamen: string;
  statut: string;
  createdAt: string;
  validatedAt: string | null;
  episodeId?: string | null;
}

interface Statistics {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  monthlyData: { month: string; count: number }[];
  tatMoyen: number;
}

export default function ReportsPage() {
  const { searchQuery } = useSearch();
  const [requests, setRequests] = useState<AnapathRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<AnapathRequest[]>([]);
  const [stats, setStats] = useState<Statistics>({
    total: 0, byType: {}, byStatus: {}, monthlyData: [], tatMoyen: 0
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [weekStart, setWeekStart] = useState(() => getMondayOfWeek(new Date()));
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'histogram'>('bar');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = requests;
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(req =>
        req.anapathId.toLowerCase().includes(query) ||
        req.patientId.toLowerCase().includes(query) ||
        req.typeExamen.toLowerCase().includes(query)
      );
    }
    setFilteredRequests(filtered);
    calculateStatistics(filtered);
  }, [searchQuery, requests]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/anapath`);
      const data = response.data;
      setRequests(data);
      setFilteredRequests(data);
      calculateStatistics(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (data: AnapathRequest[]) => {
    const total = data.length;
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    data.forEach(req => {
      byType[req.typeExamen] = (byType[req.typeExamen] || 0) + 1;
      byStatus[req.statut] = (byStatus[req.statut] || 0) + 1;
    });

    const validatedRequests = data.filter(req => req.validatedAt && req.statut === 'VALIDE');
    let tatMoyen = 0;
    if (validatedRequests.length > 0) {
      const totalDays = validatedRequests.reduce((sum, req) => {
        const created = new Date(req.createdAt);
        const validated = new Date(req.validatedAt!);
        return sum + (validated.getTime() - created.getTime()) / (1000 * 3600 * 24);
      }, 0);
      tatMoyen = totalDays / validatedRequests.length;
    }

    const monthlyData: { month: string; count: number }[] = [];
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const currentDate = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = months[date.getMonth()];
      const count = data.filter(req => {
        const reqDate = new Date(req.createdAt);
        return reqDate.getMonth() === date.getMonth() && reqDate.getFullYear() === date.getFullYear();
      }).length;
      monthlyData.push({ month: monthName, count });
    }

    setStats({ total, byType, byStatus, monthlyData, tatMoyen });
  };

  const getFilteredData = () => {
    if (period === 'month') return stats.monthlyData.slice(-1);
    if (period === 'quarter') return stats.monthlyData.slice(-3);
    return stats.monthlyData;
  };

  const dataVolumeMensuel = getFilteredData().map((item) => ({
    month: item.month,
    count: item.count,
  }));

  const weeklyRequests = requests
    .filter((req) => isDateInWeek(req.createdAt, weekStart))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const weeklyValidated = weeklyRequests.filter((r) => r.statut === 'VALIDE');
  const weeklyPending = weeklyRequests.filter(
    (r) => r.statut === 'CREEE' || r.statut === 'EN_ATTENTE' || r.statut === 'EN_COURS',
  );
  let weeklyAvgDelay = 0;
  if (weeklyValidated.length > 0) {
    const totalDays = weeklyValidated.reduce((sum, req) => {
      if (!req.validatedAt) return sum;
      const created = new Date(req.createdAt);
      const validated = new Date(req.validatedAt);
      return sum + (validated.getTime() - created.getTime()) / (1000 * 3600 * 24);
    }, 0);
    weeklyAvgDelay = totalDays / weeklyValidated.length;
  }
  const weeklyDailyVolume = getDailyVolumeForWeek(weeklyRequests, weekStart);

  const dataParType = Object.entries(stats.byType).map(([type, count]) => ({
    type: getTypeLabel(type),
    count,
  }));

  const dataParJour = weeklyDailyVolume.map((d) => ({
    jour: d.day,
    count: d.count,
  }));

  const chartBtn = (active: boolean) =>
    `px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
      active
        ? 'bg-[#00478d] text-white shadow-sm'
        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
    }`;

  const mapToReportRow = (req: AnapathRequest) => ({
    anapathId: req.anapathId,
    patientId: req.patientId,
    typeExamen: req.typeExamen,
    typeLabel: getTypeLabel(req.typeExamen),
    statut: req.statut,
    statutLabel: statusLabels[req.statut] || req.statut,
    prescriber: getServiceDisplayName({ episodeId: req.episodeId }),
    createdAt: req.createdAt,
  });

  const getPeriodLabel = () => {
    const now = new Date();
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
    ];
    if (period === 'month') return `Rapport mensuel : ${months[now.getMonth()]} ${now.getFullYear()}`;
    if (period === 'quarter') {
      const q = Math.floor(now.getMonth() / 3) + 1;
      return `Rapport trimestriel : T${q} ${now.getFullYear()}`;
    }
    return `Rapport annuel : ${now.getFullYear()}`;
  };

  const buildReportPdfData = (weeklyOnly = false): ReportPdfData => ({
    period: period as ReportPdfData['period'],
    periodLabel: weeklyOnly ? `Semaine du ${formatWeekLabel(weekStart)}` : getPeriodLabel(),
    stats,
    filteredMonthlyData: getFilteredData(),
    weekly: {
      weekLabel: formatWeekLabel(weekStart),
      total: weeklyRequests.length,
      validated: weeklyValidated.length,
      pending: weeklyPending.length,
      avgDelay: weeklyAvgDelay,
      dailyVolume: weeklyDailyVolume,
      requests: weeklyRequests.map(mapToReportRow),
    },
    allRequests: filteredRequests.map(mapToReportRow),
    weeklyOnly,
  });

  const exportToPDF = async () => {
    try {
      await generateReportPDF(buildReportPdfData(false));
    } catch {
      alert('Erreur lors de la génération du rapport PDF.');
    }
  };

  const exportWeeklyPDF = async () => {
    try {
      const { start, end } = getWeekRange(weekStart);
      const { generateWeeklyReportPDF } =
        await import('@/lib/generateReportPDF');
      await generateWeeklyReportPDF({
        lundi: start.toLocaleDateString('fr-FR'),
        dimanche: end.toLocaleDateString('fr-FR'),
        kpis: {
          total: weeklyRequests.length,
          valides: weeklyValidated.length,
          enAttente: weeklyPending.length,
          delaiMoyen: `${weeklyAvgDelay.toFixed(1)} j`,
        },
        parJour: weeklyDailyVolume.map((d) => ({
          jour: d.day,
          count: d.count,
        })),
        examens: weeklyRequests.map((req) => ({
          ...req,
          statutLabel: statusLabels[req.statut] || req.statut,
          prescriber: getServiceDisplayName({ episodeId: req.episodeId }),
        })),
      });
    } catch {
      alert('Erreur lors de la génération du rapport hebdomadaire PDF.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-transparent">
        <Sidebar />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-transparent text-[#191c21]">
      <div className="fixed inset-0 grain-overlay z-[60] pointer-events-none"></div>
      <Sidebar />
      
      <main className="flex-1 ml-64 min-h-screen flex flex-col w-[calc(100%-256px)]">
        <TopBar />
        
        <div className="flex-1 p-6 w-full">
          <div className="mb-6"><h2 className="text-2xl font-extrabold text-[#191c21] tracking-tight">Analyse de performance</h2><p className="text-slate-500 text-sm mt-1">Statistiques et indicateurs clés</p></div>

          <div className="flex gap-2 bg-[#ecedf6] p-1 rounded-lg w-fit mb-6">
            <button onClick={() => setPeriod('month')} className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${period === 'month' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}>Mois</button>
            <button onClick={() => setPeriod('quarter')} className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${period === 'quarter' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}>Trimestre</button>
            <button onClick={() => setPeriod('year')} className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${period === 'year' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}>Année</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-outline-variant/20">
              <div className="flex justify-between items-start mb-2"><span className="material-symbols-outlined text-primary text-2xl">analytics</span><span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+{Math.floor(Math.random() * 20)}%</span></div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total examens</p><p className="text-3xl font-extrabold text-primary">{stats.total}</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-outline-variant/20">
              <div className="flex justify-between items-start mb-2"><span className="material-symbols-outlined text-tertiary text-2xl">speed</span><span className="text-xs font-bold text-tertiary bg-tertiary/10 px-2 py-0.5 rounded-full">STAT</span></div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">En attente</p><p className="text-3xl font-extrabold text-tertiary">{stats.byStatus['CREEE'] || 0}</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-outline-variant/20">
              <span className="material-symbols-outlined text-primary text-2xl mb-2">schedule</span>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Délai moyen TAT</p><p className="text-3xl font-extrabold text-primary">{stats.tatMoyen.toFixed(1)} <span className="text-base font-normal">jours</span></p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-outline-variant/20">
              <span className="material-symbols-outlined text-primary text-2xl mb-2">verified</span>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Validés</p><p className="text-3xl font-extrabold text-primary">{stats.byStatus['VALIDE'] || 0}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/20 mb-8">
            <h3 className="font-bold mb-4">Volume d&apos;examens mensuels</h3>
            {dataVolumeMensuel.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dataVolumeMensuel}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#00478d" radius={[6, 6, 0, 0]} name="Examens" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-400 text-center py-12">Aucune donnée pour cette période</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/20 mb-8">
              <h3 className="font-bold mb-4">Répartition par type d&apos;examen</h3>

              <div className="flex flex-wrap gap-2 mb-4">
                <button onClick={() => setChartType('bar')} className={chartBtn(chartType === 'bar')}>
                  📊 Diagramme en bâtons
                </button>
                <button onClick={() => setChartType('pie')} className={chartBtn(chartType === 'pie')}>
                  🥧 Diagramme circulaire
                </button>
                <button onClick={() => setChartType('histogram')} className={chartBtn(chartType === 'histogram')}>
                  📈 Histogramme
                </button>
              </div>

              {chartType === 'bar' && dataParType.length > 0 && (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dataParType}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#00478d" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {chartType === 'pie' && dataParType.length > 0 && (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={dataParType} dataKey="count"
                      nameKey="type" cx="50%" cy="50%"
                      outerRadius={100} label>
                      {dataParType.map((entry, i) => (
                        <Cell key={entry.type} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}

              {chartType === 'histogram' && dataParJour.length > 0 && (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dataParJour}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="jour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {dataParType.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">Aucune donnée disponible</p>
              )}

              <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
              {Object.entries(stats.byType).map(([type, count]) => {
                const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                return (
                  <div key={type} className="mb-3">
                    <div className="flex justify-between text-sm mb-1"><span className="font-medium">{getTypeLabel(type)}</span><span className="font-bold text-primary">{count} ({percentage}%)</span></div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden"><div className="bg-primary h-2 rounded-full" style={{ width: `${percentage}%` }}></div></div>
                  </div>
                );
              })}
              </div>
            </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/20 mb-8">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
              <div>
                <h3 className="font-bold text-lg">Rapport hebdomadaire</h3>
                <p className="text-sm text-slate-500">{formatWeekLabel(weekStart)}</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="week"
                  value={toWeekInputValue(weekStart)}
                  onChange={(e) => setWeekStart(parseWeekInputValue(e.target.value))}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
                <button
                  onClick={exportWeeklyPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00478d] to-[#005eb8] text-white rounded-lg font-semibold text-sm shadow hover:opacity-90 transition-all"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  Exporter PDF
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-[#f2f3fb] p-4 rounded-lg">
                <p className="text-xs font-bold text-slate-500 uppercase">Total examens</p>
                <p className="text-2xl font-extrabold text-primary">{weeklyRequests.length}</p>
              </div>
              <div className="bg-[#f2f3fb] p-4 rounded-lg">
                <p className="text-xs font-bold text-slate-500 uppercase">Validés</p>
                <p className="text-2xl font-extrabold text-primary">{weeklyValidated.length}</p>
              </div>
              <div className="bg-[#f2f3fb] p-4 rounded-lg">
                <p className="text-xs font-bold text-slate-500 uppercase">En attente</p>
                <p className="text-2xl font-extrabold text-tertiary">{weeklyPending.length}</p>
              </div>
              <div className="bg-[#f2f3fb] p-4 rounded-lg">
                <p className="text-xs font-bold text-slate-500 uppercase">Délai moyen</p>
                <p className="text-2xl font-extrabold text-primary">{weeklyAvgDelay.toFixed(1)} <span className="text-sm font-normal">j</span></p>
              </div>
            </div>

            <h4 className="font-semibold mb-3 text-sm">Volume par jour</h4>
            {dataParJour.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={dataParJour}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="jour" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} name="Examens" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">Aucune donnée</p>
            )}

            <div className="overflow-x-auto mt-6">
              <table className="w-full text-sm">
                <thead className="bg-[#f2f3fb] text-[11px] font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="p-3 text-left">ID PARA</th>
                    <th className="p-3 text-left">Patient</th>
                    <th className="p-3 text-left">Type</th>
                    <th className="p-3 text-left">Statut</th>
                    <th className="p-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {weeklyRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-mono font-bold text-primary">{req.anapathId}</td>
                      <td className="p-3">{req.patientId}</td>
                      <td className="p-3">{getTypeLabel(req.typeExamen)}</td>
                      <td className="p-3">{statusLabels[req.statut] || req.statut}</td>
                      <td className="p-3 text-slate-500">{formatDate(req.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {weeklyRequests.length === 0 && (
                <p className="text-center py-6 text-slate-400 text-sm">Aucun examen pour cette semaine</p>
              )}
            </div>
          </div>
        </div>
      </main>

      <button onClick={exportToPDF} className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#00478d] to-[#005eb8] text-white rounded-full font-bold text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200">
        <span className="material-symbols-outlined text-base">download</span>
        Exporter le rapport (PDF)
      </button>
    </div>
  );
}