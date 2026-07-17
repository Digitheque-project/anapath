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
import { matchesAnapathSearch } from '@/lib/searchAnapath';
import { sortByUrgencyThenArrival, getUrgenceLevel, type UrgenceLevel } from '@/lib/urgencySort';
import { hasWorkflowProgress, type EtapeWorkflow } from '@/lib/workflowSteps';
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
  metadata?: Record<string, unknown> | null;
  patientInfo?: { nomComplet?: string | null; nom?: string | null; prenom?: string | null } | null;
  etapes?: EtapeWorkflow[] | null;
}

/** Une fois validée/archivée, une demande relève de la page Archives, plus du fil de travail. */
const STATUTS_EN_COURS = ['CREEE', 'EN_ATTENTE', 'EN_COURS', 'RESULTAT_DISPONIBLE'];

const TYPE_LABELS: Record<string, string> = {
  BIOPSIE: 'Biopsie',
  FCV_PAP: 'FCV / Pap test',
  CYT0PONCTION: 'Cytoponction',
  LIQUIDE: 'Liquide',
  EXTEMPORANE_STAT: 'Extemporané',
  POS: 'POS',
  POC: 'POC',
};

const URGENCE_LABELS: Record<UrgenceLevel, string> = {
  STAT: 'Stat',
  URGENTE: 'Urgent',
  NORMALE: 'Normal',
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

export default function WorklistPage() {
  const { searchQuery } = useSearch();
  const [localQuery, setLocalQuery] = useState('');
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  const [filterUrgences, setFilterUrgences] = useState<UrgenceLevel[]>([]);
  const [filterStatuts, setFilterStatuts] = useState<string[]>([]);
  const [requests, setRequests] = useState<AnapathRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<AnapathRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = requests.filter((req) => STATUTS_EN_COURS.includes(req.statut));
    if (searchQuery.trim()) {
      filtered = filtered.filter((req) => matchesAnapathSearch(req, searchQuery));
    }
    if (localQuery.trim()) {
      filtered = filtered.filter((req) => matchesAnapathSearch(req, localQuery));
    }
    if (filterTypes.length > 0) {
      filtered = filtered.filter((req) => filterTypes.includes(req.typeExamen));
    }
    if (filterUrgences.length > 0) {
      filtered = filtered.filter((req) => filterUrgences.includes(getUrgenceLevel(req)));
    }
    if (filterStatuts.length > 0) {
      filtered = filtered.filter((req) => filterStatuts.includes(req.statut));
    }
    setFilteredRequests(sortByUrgencyThenArrival(filtered));
  }, [searchQuery, localQuery, filterTypes, filterUrgences, filterStatuts, requests]);

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

  const getTypeLabel = (type: string) => TYPE_LABELS[type] || type;

  const hasActiveFilters = filterTypes.length > 0 || filterUrgences.length > 0 || filterStatuts.length > 0;
  const resetFilters = () => {
    setFilterTypes([]);
    setFilterUrgences([]);
    setFilterStatuts([]);
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
            <h2 className="text-2xl font-extrabold text-[#191c21] tracking-tight">Fil de travail</h2>
            <p className="text-slate-500 text-sm mt-1">
              Examens en cours, triés par degré d'urgence puis heure d'arrivée — les demandes validées se trouvent dans Archives
            </p>
          </div>

          <UrgenceStatsCards requests={filteredRequests} />

          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <LocalSearchBox value={localQuery} onChange={setLocalQuery} placeholder="Rechercher dans le fil de travail..." />
            <FilterButton active={hasActiveFilters}>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Urgence</p>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(URGENCE_LABELS) as UrgenceLevel[]).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setFilterUrgences(toggleValue(filterUrgences, lvl))}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                          filterUrgences.includes(lvl)
                            ? 'bg-primary text-white border-primary'
                            : 'bg-slate-50 text-slate-600 border-outline-variant/30 hover:bg-slate-100'
                        }`}
                      >
                        {URGENCE_LABELS[lvl]}
                      </button>
                    ))}
                  </div>
                </div>
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
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Statut</p>
                  <div className="flex flex-wrap gap-2">
                    {STATUTS_EN_COURS.map((statut) => (
                      <button
                        key={statut}
                        type="button"
                        onClick={() => setFilterStatuts(toggleValue(filterStatuts, statut))}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                          filterStatuts.includes(statut)
                            ? 'bg-primary text-white border-primary'
                            : 'bg-slate-50 text-slate-600 border-outline-variant/30 hover:bg-slate-100'
                        }`}
                      >
                        {statusLabels[statut] || statut}
                      </button>
                    ))}
                  </div>
                </div>
                {hasActiveFilters && (
                  <button type="button" onClick={resetFilters} className="text-xs text-primary font-semibold hover:underline">
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
                  <tr><th className="p-4 text-left">ID Patient</th><th className="p-4 text-left">Patient</th><th className="p-4 text-left">Type examen</th><th className="p-4 text-left">Prélèvement</th><th className="p-4 text-left">Statut</th><th className="p-4 text-left">Date</th><th className="p-4 text-center">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {filteredRequests.map((req) => {
                    const urgence = getUrgenceLevel(req);
                    const enCours = hasWorkflowProgress(req.etapes);
                    return (
                      <tr
                        key={req.id}
                        className={`hover:bg-slate-50/80 transition-colors group ${
                          urgence === 'STAT' ? 'bg-red-50' : urgence === 'URGENTE' ? 'bg-amber-50' : ''
                        }`}
                      >
                        <td className="p-4 font-mono text-xs text-slate-500">{req.patientId}</td>
                        <td className="p-4 font-medium">{patientDisplayName(req)}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold inline-flex items-center gap-1">
                            {getTypeLabel(req.typeExamen)}
                            {urgence === 'STAT' && (
                              <span className="px-1 py-px rounded-full bg-red-600 text-white text-[7px] leading-normal font-bold stat-pulse">
                                STAT
                              </span>
                            )}
                            {urgence === 'URGENTE' && (
                              <span className="px-1 py-px rounded-full bg-orange-500 text-white text-[7px] leading-normal font-bold">
                                Urgent
                              </span>
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
                            href={`/worklist/${req.id}`}
                            title={enCours ? 'Poursuivre la saisie' : 'Consulter'}
                            className={`p-2 transition-colors inline-block ${
                              enCours ? 'text-primary hover:text-primary/70' : 'text-slate-400 hover:text-primary'
                            }`}
                          >
                            <span className="material-symbols-outlined text-base">
                              {enCours ? 'edit_note' : 'visibility'}
                            </span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
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
