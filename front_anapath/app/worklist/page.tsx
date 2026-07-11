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

interface AnapathRequest {
  id: string;
  anapathId: string;
  patientId: string;
  typeExamen: string;
  statut: string;
  createdAt: string;
  isExtemporane?: boolean;
  prelevement?: { site: string; description: string };
  resultat?: { conclusion?: string; details?: string } | null;
  validatedByUserId?: string | null;
}

export default function WorklistPage() {
  const { searchQuery } = useSearch();
  const [requests, setRequests] = useState<AnapathRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<AnapathRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = requests;
    const enCours = ['CREEE', 'EN_ATTENTE', 'EN_COURS', 'RESULTAT_DISPONIBLE'];
    if (filter === 'pending') {
      filtered = filtered.filter(req => enCours.includes(req.statut));
    } else if (filter === 'validated') {
      filtered = filtered.filter(req => req.statut === 'VALIDE' || req.statut === 'ARCHIVE');
    }
    filtered = [...filtered].sort((a, b) => {
      const prio = (s: string) => {
        if (s === 'RESULTAT_DISPONIBLE') return 0;
        if (s === 'CREEE' || s === 'EN_ATTENTE' || s === 'EN_COURS') return 1;
        return 2;
      };
      const pa = prio(a.statut);
      const pb = prio(b.statut);
      if (pa !== pb) return pa - pb;
      if (a.isExtemporane && !b.isExtemporane) return -1;
      if (!a.isExtemporane && b.isExtemporane) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    setFilteredRequests(filterAndSortAnapathRequests(filtered, searchQuery));
  }, [searchQuery, filter, requests]);

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
          <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-[#191c21] tracking-tight">Fil de travail</h2>
              <p className="text-slate-500 text-sm mt-1">Gérez les examens en attente</p>
            </div>
            <div className="flex gap-2 bg-[#ecedf6] p-1 rounded-lg">
              <button onClick={() => setFilter('pending')} className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${filter === 'pending' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}>En cours (sans validés)</button>
              <button onClick={() => setFilter('all')} className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${filter === 'all' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}>Tous</button>
              <button onClick={() => setFilter('validated')} className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${filter === 'validated' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}>Validés / Archivés</button>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-outline-variant/20">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#f2f3fb] text-[11px] font-bold text-slate-500 uppercase">
                  <tr><th className="p-4 text-left">ID PARA</th><th className="p-4 text-left">Patient</th><th className="p-4 text-left">Type examen</th><th className="p-4 text-left">Prélèvement</th><th className="p-4 text-left">Statut</th><th className="p-4 text-left">Date</th><th className="p-4 text-center">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {filteredRequests.map((req) => (
                    <tr key={req.id} className={`hover:bg-slate-50/80 transition-colors group ${req.isExtemporane ? 'bg-red-50' : ''}`}>
                      <td className="p-4 font-mono font-bold text-primary">{req.anapathId}</td>
                      <td className="p-4 font-medium">{req.patientId}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold inline-flex items-center gap-1">
                          {getTypeLabel(req.typeExamen)}
                          {req.isExtemporane && (
                            <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[9px] font-bold stat-pulse">STAT</span>
                          )}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-slate-500">{req.prelevement?.site || '-'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          req.statut === 'RESULTAT_DISPONIBLE'
                            ? 'bg-amber-100 text-amber-800'
                            : statusColors[req.statut] || 'bg-gray-100 text-gray-700'
                        }`}>
                          {statusLabels[req.statut] || req.statut}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 text-xs">{formatDate(req.createdAt)}</td>
                      <td className="p-4 text-center">
                        <Link
                          href={
                            req.statut === 'RESULTAT_DISPONIBLE' ||
                            req.statut === 'CREEE' ||
                            req.statut === 'EN_ATTENTE' ||
                            req.statut === 'EN_COURS'
                              ? `/validation?id=${req.anapathId}`
                              : `/worklist/${req.id}`
                          }
                          className="p-2 text-slate-400 hover:text-primary transition-colors inline-block"
                        >
                          <span className="material-symbols-outlined text-base">visibility</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredRequests.length === 0 && <div className="text-center py-8 text-slate-400">Aucun résultat trouvé</div>}
            </div>
          </div>
          <div className="mt-6 text-center text-xs text-slate-400">Total: {filteredRequests.length} demande(s)</div>
        </div>
      </main>
    </div>
  );
}