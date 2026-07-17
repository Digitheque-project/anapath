'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import UrgenceStatsCards from '@/components/UrgenceStatsCards';
import LocalSearchBox from '@/components/LocalSearchBox';
import FilterButton from '@/components/FilterButton';
import { useSearch } from '@/components/SearchContext';
import axios from 'axios';
import { API_BASE } from '@/lib/api';
import { filterAndSortAnapathRequests, matchesAnapathSearch } from '@/lib/searchAnapath';
import { formatDate } from '@/lib/dateFormat';
import type { EtapeWorkflow } from '@/lib/workflowSteps';

interface AnapathRequest {
  id: string;
  anapathId: string;
  patientId: string;
  typeExamen: string;
  statut: string;
  createdAt: string;
  validatedAt: string | null;
  validatedByUserId: string | null;
  resultat: { conclusion: string; details: string } | null;
  metadata?: Record<string, unknown> | null;
  isExtemporane?: boolean;
  etapes?: EtapeWorkflow[] | null;
  patientInfo?: { nomComplet?: string | null; nom?: string | null; prenom?: string | null } | null;
}

const TYPE_LABELS: Record<string, string> = {
  BIOPSIE: 'Biopsie',
  FCV_PAP: 'FCV / Pap test',
  CYT0PONCTION: 'Cytoponction',
  LIQUIDE: 'Liquide',
  EXTEMPORANE_STAT: 'Extemporané',
  POS: 'POS',
  POC: 'POC',
};

function toggleValue<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

/** Nom affichable du patient : nom complet enrichi (Accueil), sinon nom+prénom, sinon tiret. */
function patientDisplayName(req: { patientInfo?: { nomComplet?: string | null; nom?: string | null; prenom?: string | null } | null }): string {
  const info = req.patientInfo;
  const complet = info?.nomComplet?.trim();
  if (complet) return complet;
  const assemble = [info?.nom, info?.prenom].filter(Boolean).join(' ').trim();
  return assemble || '—';
}

export default function ArchivesPage() {
  const { searchQuery } = useSearch();
  const [localQuery, setLocalQuery] = useState('');
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  const [requests, setRequests] = useState<AnapathRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<AnapathRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = requests;
    if (filterTypes.length > 0) filtered = filtered.filter((req) => filterTypes.includes(req.typeExamen));
    if (localQuery.trim()) filtered = filtered.filter((req) => matchesAnapathSearch(req, localQuery));
    setFilteredRequests(filterAndSortAnapathRequests(filtered, searchQuery));
  }, [searchQuery, localQuery, filterTypes, requests]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/anapath`);
      const validatedRequests = response.data.filter((req: AnapathRequest) => req.statut === 'VALIDE');
      setRequests(validatedRequests);
      setFilteredRequests(validatedRequests);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
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

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      'BIOPSIE': 'bg-blue-100 text-blue-700',
      'FCV_PAP': 'bg-purple-100 text-purple-700',
      'CYT0PONCTION': 'bg-green-100 text-green-700',
      'LIQUIDE': 'bg-yellow-100 text-yellow-700',
      'EXTEMPORANE_STAT': 'bg-red-100 text-red-700',
      'POS': 'bg-indigo-100 text-indigo-700',
      'POC': 'bg-pink-100 text-pink-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
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
            <h2 className="text-2xl font-extrabold text-[#191c21] tracking-tight">Examens archivés</h2>
            <p className="text-slate-500 text-sm mt-1">Registre des comptes-rendus validés</p>
          </div>

          <UrgenceStatsCards requests={filteredRequests} />

          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <LocalSearchBox value={localQuery} onChange={setLocalQuery} placeholder="Rechercher dans les archives..." />
            <FilterButton active={filterTypes.length > 0}>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Type d'examen</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(TYPE_LABELS).map(([code, label]) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setFilterTypes(toggleValue(filterTypes, code))}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                          filterTypes.includes(code)
                            ? 'bg-primary text-white border-primary'
                            : 'bg-slate-50 text-slate-600 border-outline-variant/30 hover:bg-slate-100'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                {filterTypes.length > 0 && (
                  <button type="button" onClick={() => setFilterTypes([])} className="text-xs text-primary font-semibold hover:underline">
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            </FilterButton>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-outline-variant/20">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#f2f3fb] text-[11px] font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="p-4 text-left">ID Patient</th>
                    <th className="p-4 text-left">Patient</th>
                    <th className="p-4 text-left">Type examen</th>
                    <th className="p-4 text-left">Diagnostic</th>
                    <th className="p-4 text-left">Validé par</th>
                    <th className="p-4 text-left">Date validation</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="p-4 font-mono text-xs text-slate-500">{req.patientId}</td>
                      <td className="p-4 font-medium">{patientDisplayName(req)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getTypeBadge(req.typeExamen)}`}>
                          {getTypeLabel(req.typeExamen)}
                        </span>
                      </td>
                      <td className="p-4 max-w-xs truncate text-slate-600">{req.resultat?.conclusion || '-'}</td>
                      <td className="p-4 text-slate-500 text-xs">{req.validatedByUserId || '-'}</td>
                      <td className="p-4 text-slate-500 text-xs">
                        {req.validatedAt ? formatDate(req.validatedAt) : '-'}
                      </td>
                      <td className="p-4 text-center">
                        <Link
                          href={`/archives/${req.id}`}
                          className="p-2 text-slate-400 hover:text-primary transition-colors inline-block"
                          title="Voir le résultat"
                        >
                          <span className="material-symbols-outlined text-base">visibility</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredRequests.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <span className="material-symbols-outlined text-5xl">inbox</span>
                  <p className="mt-2">Aucune archive trouvée</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}