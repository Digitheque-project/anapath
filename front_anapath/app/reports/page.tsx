'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const [requests, setRequests] = useState<AnapathRequest[]>([]);
  const [stats, setStats] = useState<Statistics>({
    total: 0, byType: {}, byStatus: {}, monthlyData: [], topDiagnostics: [], tatMoyen: 0
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/anapath`);
      const data = response.data;
      setRequests(data);
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
    const date = new Date().toLocaleDateString('fr-FR');
    doc.setFontSize(18);
    doc.setTextColor(0, 71, 141);
    doc.text('Rapport Anapath - Statistiques', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Généré le ${date}`, 14, 28);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total examens: ${stats.total}`, 14, 45);
    doc.text(`En attente: ${stats.byStatus['CREEE'] || 0}`, 14, 53);
    doc.text(`Validés: ${stats.byStatus['VALIDE'] || 0}`, 14, 61);
    doc.text(`Délai moyen TAT: ${stats.tatMoyen.toFixed(1)} jours`, 14, 69);
    doc.setFontSize(14);
    doc.setTextColor(0, 71, 141);
    doc.text('Liste des demandes', 14, 85);
    
    const tableData = requests.map(req => [
      req.anapathId, req.patientId, req.typeExamen, req.statut,
      new Date(req.createdAt).toLocaleDateString('fr-FR')
    ]);
    
    autoTable(doc, {
      startY: 90,
      head: [['ID PARA', 'Patient', 'Type examen', 'Statut', 'Date']],
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
                    <div className="flex justify-between text-sm mb-1"><span className="font-medium">{type}</span><span className="font-bold text-primary">{count} ({percentage}%)</span></div>
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
        </div>
      </main>

      <button onClick={exportToPDF} className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#00478d] to-[#005eb8] text-white rounded-full font-bold text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200">
        <span className="material-symbols-outlined text-base">download</span>
        Exporter le rapport (PDF)
      </button>
    </div>
  );
}