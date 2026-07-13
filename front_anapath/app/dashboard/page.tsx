'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useSearch } from '@/components/SearchContext';
import axios from 'axios';
import { API_BASE } from '@/lib/api';
import { filterAndSortAnapathRequests } from '@/lib/searchAnapath';
import { formatDate } from '@/lib/dateFormat';
import { statusLabels, statusColors } from '@/lib/statusLabels';

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
            <div className="bg-white p-5 rounded-xl shadow-sm border border-outline-variant/20 flex justify-between items-start">
              <div><p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total examens</p><p className="text-3xl font-extrabold text-primary">{totalExamens}</p></div>
              <span className="material-symbols-outlined text-primary text-3xl">biotech</span>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-outline-variant/20 flex justify-between items-start">
              <div><p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">En attente</p><p className="text-3xl font-extrabold text-tertiary">{enAttenteSTAT}</p></div>
              <span className="material-symbols-outlined text-tertiary text-3xl">schedule</span>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-outline-variant/20 flex justify-between items-start">
              <div><p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">En validation</p><p className="text-3xl font-extrabold text-primary">{enValidation}</p></div>
              <span className="material-symbols-outlined text-primary text-3xl">fact_check</span>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-outline-variant/20 flex justify-between items-start">
              <div><p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Validés</p><p className="text-3xl font-extrabold text-primary">{valides}</p></div>
              <span className="material-symbols-outlined text-primary text-3xl">verified</span>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-outline-variant/20">
            <div className="p-5 border-b border-outline-variant/20">
              <h3 className="font-bold text-lg">Dernières demandes</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#f2f3fb] text-[11px] font-bold text-slate-500 uppercase">
                  <tr><th className="p-4 text-left">ID PARA</th><th className="p-4 text-left">Patient</th><th className="p-4 text-left">ID Patient</th><th className="p-4 text-left">Type examen</th><th className="p-4 text-left">Statut</th><th className="p-4 text-left">Date</th></tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {filteredRequests.slice(0, 10).map((req) => (
                    <tr key={req.id} className={`hover:bg-slate-50/80 transition-colors ${req.isExtemporane ? 'bg-red-50' : ''}`}>
                      <td className="p-4 font-mono font-bold text-primary">{req.anapathId}</td>
                      <td className="p-4 font-medium">{patientDisplayName(req)}</td>
                      <td className="p-4 font-mono text-xs text-slate-500">{req.patientId}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold inline-flex items-center gap-1">
                          {getTypeLabel(req.typeExamen)}
                          {req.isExtemporane && (
                            <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[9px] font-bold stat-pulse">STAT</span>
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
        </div>
      </main>
    </div>
  );
}