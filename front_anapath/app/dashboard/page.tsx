'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useSearch } from '@/components/SearchContext';
import axios from 'axios';
import { API_BASE } from '@/lib/api';
import { filterAndSortAnapathRequests } from '@/lib/searchAnapath';
import { formatDate } from '@/lib/dateFormat';
import { statusLabels, statusColors } from '@/lib/statusLabels';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface AnapathRequest {
  id: string;
  anapathId: string;
  patientId: string;
  typeExamen: string;
  statut: string;
  createdAt: string;
  isExtemporane?: boolean;
  prelevement?: { site?: string; description?: string } | null;
  resultat?: { conclusion?: string; details?: string } | null;
  validatedByUserId?: string | null;
  patientInfo?: { nomComplet?: string | null; nom?: string | null; prenom?: string | null } | null;
}

/** Nom affichable du patient : nom complet enrichi (Accueil), sinon nom+prénom, sinon tiret. */
function patientDisplayName(req: { patientInfo?: { nomComplet?: string | null; nom?: string | null; prenom?: string | null } | null }): string {
  const info = req.patientInfo;
  const complet = info?.nomComplet?.trim();
  if (complet) return complet;
  const assemble = [info?.nom, info?.prenom].filter(Boolean).join(' ').trim();
  return assemble || '—';
}

export default function DashboardPage() {
  const { searchQuery } = useSearch();
  const [requests, setRequests] = useState<AnapathRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<AnapathRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setFilteredRequests(filterAndSortAnapathRequests(requests, searchQuery));
  }, [searchQuery, requests]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/anapath`);
      setRequests(response.data);
      setFilteredRequests(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalExamens = filteredRequests.length;
  const enAttenteSTAT = filteredRequests.filter(r => r.statut === 'CREEE' || r.statut === 'EN_ATTENTE').length;
  const enValidation = filteredRequests.filter(r => r.statut === 'RESULTAT_DISPONIBLE').length;
  const valides = filteredRequests.filter(r => r.statut === 'VALIDE').length;
  const autres = totalExamens - enAttenteSTAT - enValidation - valides;

  const repartitionData = [
    { name: 'En attente', value: enAttenteSTAT, color: '#f59e0b' },
    { name: 'En validation', value: enValidation, color: '#2563eb' },
    { name: 'Validés', value: valides, color: '#10b981' },
    { name: 'Autres', value: autres, color: '#94a3b8' },
  ].filter((d) => d.value > 0);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      BIOPSIE: 'Biopsie',
      FCV_PAP: 'FCV / Pap test',
      CYT0PONCTION: 'Cytoponction',
      LIQUIDE: 'Liquide',
      EXTEMPORANE_STAT: 'Extemporané',
      POS: 'POS',
      POC: 'POC',
    };
    return labels[type] || type;
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
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-[#191c21] tracking-tight">Tableau de bord</h2>
            <p className="text-slate-500 text-sm mt-1">Vue d'ensemble de l'activité du laboratoire</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="relative overflow-hidden bg-gradient-to-br from-primary to-blue-900 p-6 rounded-xl shadow-md flex justify-between items-center text-white">
              <div className="relative z-10">
                <p className="text-xs font-bold uppercase tracking-wider text-white/80">Total examens</p>
                <p className="text-5xl font-extrabold mt-1">{totalExamens}</p>
              </div>
              <span className="material-symbols-outlined text-white/15 text-8xl absolute -right-3 -bottom-4">biotech</span>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-outline-variant/20 flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">En attente</p>
                <p className="text-3xl font-extrabold text-tertiary mt-1">{enAttenteSTAT}</p>
                <Link
                  href="/worklist"
                  className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-tertiary/10 text-tertiary text-[11px] font-bold hover:bg-tertiary/20 transition-colors"
                >
                  Traiter maintenant
                </Link>
              </div>
              <span className="material-symbols-outlined text-tertiary bg-tertiary/10 rounded-full p-2 text-xl">schedule</span>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-outline-variant/20 flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">En validation</p>
                <p className="text-3xl font-extrabold text-primary mt-1">{enValidation}</p>
                <Link
                  href="/validation"
                  className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold hover:bg-primary/20 transition-colors"
                >
                  Valider maintenant
                </Link>
              </div>
              <span className="material-symbols-outlined text-primary bg-primary/10 rounded-full p-2 text-xl">fact_check</span>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-outline-variant/20 flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Validés</p>
                <p className="text-3xl font-extrabold text-primary mt-1">{valides}</p>
                <Link
                  href="/archives"
                  className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold hover:bg-primary/20 transition-colors"
                >
                  Consulter
                </Link>
              </div>
              <span className="material-symbols-outlined text-primary bg-primary/10 rounded-full p-2 text-xl">verified</span>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden border border-outline-variant/20">
              <div className="p-5 border-b border-outline-variant/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary bg-primary/10 rounded-full p-1.5 text-lg">history</span>
                  <h3 className="font-bold text-lg">Dernières demandes</h3>
                </div>
                <Link href="/worklist" className="text-xs font-bold text-primary hover:underline">
                  Voir le fil de travail
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#f2f3fb] text-[11px] font-bold text-slate-500 uppercase">
                    <tr><th className="p-4 text-left">ID Patient</th><th className="p-4 text-left">Patient</th><th className="p-4 text-left">Type examen</th><th className="p-4 text-left">Statut</th><th className="p-4 text-left">Date</th></tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {filteredRequests.slice(0, 10).map((req) => (
                      <tr key={req.id} className={`hover:bg-slate-50/80 transition-colors ${req.isExtemporane ? 'bg-red-50' : ''}`}>
                        <td className="p-4 font-mono text-xs text-slate-500">{req.patientId}</td>
                        <td className="p-4 font-medium">{patientDisplayName(req)}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold inline-flex items-center gap-1">
                            {getTypeLabel(req.typeExamen)}
                            {req.isExtemporane && (
                              <span className="px-1 py-px rounded-full bg-red-600 text-white text-[7px] leading-normal font-bold stat-pulse">STAT</span>
                            )}
                          </span>
                        </td>
                        <td className="p-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusColors[req.statut] || 'bg-gray-100 text-gray-700'}`}>{statusLabels[req.statut] || req.statut}</span></td>
                        <td className="p-4 text-slate-500 text-xs">{formatDate(req.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-outline-variant/20 p-5">
              <h3 className="font-bold text-lg mb-1">Répartition des examens</h3>
              <p className="text-xs text-slate-400 mb-2">Par statut, sur {totalExamens} examen(s)</p>
              {repartitionData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={repartitionData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {repartitionData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-2 space-y-2">
                    {repartitionData.map((entry) => {
                      const percentage = totalExamens > 0 ? Math.round((entry.value / totalExamens) * 100) : 0;
                      return (
                        <div key={entry.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
                            <span className="text-slate-600">{entry.name}</span>
                          </div>
                          <span className="font-bold text-[#191c21]">{entry.value} <span className="text-slate-400 font-normal">({percentage}%)</span></span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-400 text-center py-12">Aucune donnée disponible</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}