'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useSearch } from '@/components/SearchContext';
import axios from 'axios';

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
}

export default function ArchivesPage() {
  const { searchQuery } = useSearch();
  const [requests, setRequests] = useState<AnapathRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<AnapathRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = requests;
    if (typeFilter !== 'all') filtered = filtered.filter(req => req.typeExamen === typeFilter);
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(req =>
        req.anapathId.toLowerCase().includes(query) ||
        req.patientId.toLowerCase().includes(query) ||
        req.typeExamen.toLowerCase().includes(query)
      );
    }
    setFilteredRequests(filtered);
  }, [searchQuery, typeFilter, requests]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/anapath`);
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
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-[#191c21] tracking-tight">Examens archivés</h2>
            <p className="text-slate-500 text-sm mt-1">Registre des comptes-rendus validés</p>
          </div>

          <div className="flex gap-3 mb-6 flex-wrap">
            <button onClick={() => setTypeFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${typeFilter === 'all' ? 'bg-primary text-white' : 'bg-white text-slate-600 border border-outline-variant/20'}`}>Tous</button>
            <button onClick={() => setTypeFilter('BIOPSIE')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${typeFilter === 'BIOPSIE' ? 'bg-primary text-white' : 'bg-white text-slate-600 border border-outline-variant/20'}`}>Biopsie</button>
            <button onClick={() => setTypeFilter('FCV_PAP')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${typeFilter === 'FCV_PAP' ? 'bg-primary text-white' : 'bg-white text-slate-600 border border-outline-variant/20'}`}>FCV / Pap</button>
            <button onClick={() => setTypeFilter('CYT0PONCTION')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${typeFilter === 'CYT0PONCTION' ? 'bg-primary text-white' : 'bg-white text-slate-600 border border-outline-variant/20'}`}>Cytoponction</button>
            <button onClick={() => setTypeFilter('LIQUIDE')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${typeFilter === 'LIQUIDE' ? 'bg-primary text-white' : 'bg-white text-slate-600 border border-outline-variant/20'}`}>Liquide</button>
            <button onClick={() => setTypeFilter('EXTEMPORANE_STAT')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${typeFilter === 'EXTEMPORANE_STAT' ? 'bg-primary text-white' : 'bg-white text-slate-600 border border-outline-variant/20'}`}>Extemporané</button>
            <button onClick={() => setTypeFilter('POS')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${typeFilter === 'POS' ? 'bg-primary text-white' : 'bg-white text-slate-600 border border-outline-variant/20'}`}>POS</button>
            <button onClick={() => setTypeFilter('POC')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${typeFilter === 'POC' ? 'bg-primary text-white' : 'bg-white text-slate-600 border border-outline-variant/20'}`}>POC</button>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-outline-variant/20">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#f2f3fb] text-[11px] font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="p-4 text-left">ID PARA</th>
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
                      <td className="p-4 font-mono font-bold text-primary">{req.anapathId}</td>
                      <td className="p-4 font-medium">{req.patientId}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getTypeBadge(req.typeExamen)}`}>
                          {getTypeLabel(req.typeExamen)}
                        </span>
                      </td>
                      <td className="p-4 max-w-xs truncate text-slate-600">{req.resultat?.conclusion || '-'}</td>
                      <td className="p-4 text-slate-500 text-xs">{req.validatedByUserId || '-'}</td>
                      <td className="p-4 text-slate-500 text-xs">
                        {req.validatedAt ? new Date(req.validatedAt).toLocaleDateString('fr-FR') : '-'}
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