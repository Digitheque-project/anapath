'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useSearch } from '@/components/SearchContext';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '@/lib/dateFormat';
import {
  getMondayOfWeek,
  formatWeekLabel,
  isDateInWeek,
  getDailyVolumeForWeek,
  toWeekInputValue,
  parseWeekInputValue,
} from '@/lib/weekUtils';
import { statusLabels } from '@/lib/statusLabels';

interface AnapathRequest {
  id: string;
  anapathId: string;
  patientId: string;
  typeExamen: string;
  statut: string;
  createdAt: string;
  validatedAt: string | null;
}

interface Statistics {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  monthlyData: { month: string; count: number }[];
  topDiagnostics: { code: string; name: string; count: number }[];
  tatMoyen: number;
}

export default function ReportsPage() {
  const { searchQuery } = useSearch();
  const [requests, setRequests] = useState<AnapathRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<AnapathRequest[]>([]);
  const [stats, setStats] = useState<Statistics>({
    total: 0, byType: {}, byStatus: {}, monthlyData: [], topDiagnostics: [], tatMoyen: 0
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [weekStart, setWeekStart] = useState(() => getMondayOfWeek(new Date()));

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
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/anapath`);
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

    const topDiagnostics = [
      { code: 'C50.9', name: 'Tumeur maligne du sein', count: Math.floor(Math.random() * 50) + 10 },
      { code: 'K29.7', name: 'Gastrite', count: Math.floor(Math.random() * 40) + 5 },
      { code: 'N60.1', name: 'Kyste mammaire', count: Math.floor(Math.random() * 30) + 5 },
      { code: 'D12.6', name: 'Adénome du colon', count: Math.floor(Math.random() * 25) + 3 },
      { code: 'L72.0', name: 'Kyste épidermique', count: Math.floor(Math.random() * 20) + 2 }
    ].sort((a, b) => b.count - a.count);

    setStats({ total, byType, byStatus, monthlyData, topDiagnostics, tatMoyen });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const date = formatDate(new Date());
    let yOffset = 20;

    // Titre
    doc.setFontSize(18);
    doc.setTextColor(0, 71, 141);
    doc.text('Rapport Anapath - Statistiques', 14, yOffset);
    yOffset += 10;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Généré le ${date}`, 14, yOffset);
    yOffset += 8;

    // === 1. KPIs ===
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total examens : ${stats.total}`, 14, yOffset);
    yOffset += 6;
    doc.text(`En attente : ${stats.byStatus['CREEE'] || 0}`, 14, yOffset);
    yOffset += 6;
    doc.text(`Validés : ${stats.byStatus['VALIDE'] || 0}`, 14, yOffset);
    yOffset += 6;
    doc.text(`Délai moyen TAT : ${stats.tatMoyen.toFixed(1)} jours`, 14, yOffset);
    yOffset += 10;

    // === 2. Volume mensuel ===
    doc.setFontSize(14);
    doc.setTextColor(0, 71, 141);
    doc.text('Volume mensuel', 14, yOffset);
    yOffset += 6;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    const monthlyTable = stats.monthlyData.map(item => [item.month, item.count.toString()]);
    autoTable(doc, {
      startY: yOffset,
      head: [['Mois', 'Nombre']],
      body: monthlyTable,
      theme: 'plain',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [0, 71, 141], textColor: [255, 255, 255] },
      margin: { left: 14, right: 14 },
    });
    yOffset = (doc as any).lastAutoTable.finalY + 8;

    // === 3. Répartition par type ===
    doc.setFontSize(14);
    doc.setTextColor(0, 71, 141);
    doc.text('Répartition par type d\'examen', 14, yOffset);
    yOffset += 6;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    const typeRows = Object.entries(stats.byType).map(([type, count]) => {
      const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
      return [type, count.toString(), `${pct}%`];
    });
    autoTable(doc, {
      startY: yOffset,
      head: [['Type', 'Nombre', 'Pourcentage']],
      body: typeRows,
      theme: 'plain',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [0, 71, 141], textColor: [255, 255, 255] },
      margin: { left: 14, right: 14 },
    });
    yOffset = (doc as any).lastAutoTable.finalY + 8;

    // === 4. Top diagnostics CIM-10 ===
    doc.setFontSize(14);
    doc.setTextColor(0, 71, 141);
    doc.text('Top diagnostics CIM-10', 14, yOffset);
    yOffset += 6;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    const diagRows = stats.topDiagnostics.map(d => [d.code, d.name, d.count.toString()]);
    autoTable(doc, {
      startY: yOffset,
      head: [['Code', 'Diagnostic', 'Occurrences']],
      body: diagRows,
      theme: 'plain',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [0, 71, 141], textColor: [255, 255, 255] },
      margin: { left: 14, right: 14 },
    });
    yOffset = (doc as any).lastAutoTable.finalY + 8;

    // === 5. Liste des demandes ===
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(0, 71, 141);
    doc.text('Liste des demandes', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    const tableData = filteredRequests.map(req => [
      req.anapathId,
      req.patientId,
      req.typeExamen,
      req.statut,
      formatDate(req.createdAt)
    ]);

    autoTable(doc, {
      startY: 30,
      head: [['ID PARA', 'Patient', 'Type', 'Statut', 'Date']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [0, 71, 141], textColor: [255, 255, 255] },
      margin: { left: 14, right: 14 },
    });

    doc.save(`rapport-anapath-${date}.pdf`);
  };

  const getFilteredData = () => {
    if (period === 'month') return stats.monthlyData.slice(-1);
    if (period === 'quarter') return stats.monthlyData.slice(-3);
    return stats.monthlyData;
  };

  const maxCount = Math.max(...stats.monthlyData.map(d => d.count), 1);

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
  const weeklyMaxCount = Math.max(...weeklyDailyVolume.map((d) => d.count), 1);

  const exportWeeklyPDF = () => {
    const doc = new jsPDF();
    const label = formatWeekLabel(weekStart);
    let y = 20;

    doc.setFontSize(18);
    doc.setTextColor(0, 71, 141);
    doc.text('Rapport hebdomadaire Anapath', 14, y);
    y += 8;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Semaine : ${label}`, 14, y);
    y += 10;

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total examens : ${weeklyRequests.length}`, 14, y);
    y += 6;
    doc.text(`Validés : ${weeklyValidated.length}`, 14, y);
    y += 6;
    doc.text(`En attente : ${weeklyPending.length}`, 14, y);
    y += 6;
    doc.text(`Délai moyen : ${weeklyAvgDelay.toFixed(1)} jours`, 14, y);
    y += 10;

    const volumeRows = weeklyDailyVolume.map((d) => [d.day, d.count.toString()]);
    autoTable(doc, {
      startY: y,
      head: [['Jour', 'Volume']],
      body: volumeRows,
      theme: 'plain',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [0, 71, 141], textColor: [255, 255, 255] },
      margin: { left: 14, right: 14 },
    });
    y = (doc as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

    const tableData = weeklyRequests.map((req) => [
      req.anapathId,
      req.patientId,
      req.typeExamen,
      req.statut,
      formatDate(req.createdAt),
    ]);
    autoTable(doc, {
      startY: y,
      head: [['ID PARA', 'Patient', 'Type', 'Statut', 'Date']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [0, 71, 141], textColor: [255, 255, 255] },
      margin: { left: 14, right: 14 },
    });

    doc.save(`rapport-hebdo-anapath-${toWeekInputValue(weekStart)}.pdf`);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'BIOPSIE': 'Biopsie',
      'FCV_PAP': 'FCV / Pap test',
      'CYT0PONCTION': 'Cytoponction',
      'LIQUIDE': 'Liquide',
      'EXTEMPORANE_STAT': 'Extemporané',
      'POS': 'POS',
      'POC': 'POC',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#f9f9ff]">
        <Sidebar />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f9f9ff] text-[#191c21]">
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
            <h3 className="font-bold mb-4">Volume d'examens mensuels</h3>
            <div className="flex items-end justify-between gap-3 h-48">
              {getFilteredData().map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-primary/30 rounded-t-lg relative group" style={{ height: `${(item.count / maxCount) * 100}%`, minHeight: '8px' }}>
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">{item.count}</span>
                  </div>
                  <span className="text-xs font-medium text-slate-500">{item.month}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/20">
              <h3 className="font-bold mb-4">Répartition par type d'examen</h3>
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

            <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/20">
              <h3 className="font-bold mb-4">Top diagnostics CIM-10</h3>
              <div className="space-y-3">
                {stats.topDiagnostics.map((diag, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-[#f2f3fb] rounded-lg">
                    <div><span className="font-mono text-xs font-bold text-primary">{diag.code}</span><p className="text-xs text-slate-600 mt-0.5">{diag.name}</p></div>
                    <span className="text-xl font-extrabold text-primary">{diag.count}</span>
                  </div>
                ))}
              </div>
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
            <div className="flex items-end justify-between gap-2 h-40 mb-6">
              {weeklyDailyVolume.map((item) => (
                <div key={item.day} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-primary/30 rounded-t-lg relative group"
                    style={{ height: `${(item.count / weeklyMaxCount) * 100}%`, minHeight: '8px' }}
                  >
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.count}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-500">{item.day}</span>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto">
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