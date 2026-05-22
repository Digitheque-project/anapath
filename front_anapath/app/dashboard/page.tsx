'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import axios from 'axios';

interface AnapathRequest {
  id: string;
  anapathId: string;
  patientId: string;
  typeExamen: string;
  statut: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [requests, setRequests] = useState<AnapathRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/anapath`);
      setRequests(response.data);
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Impossible de charger les données. Vérifiez que le backend est démarré.');
    } finally {
      setLoading(false);
    }
  };

  // Calcul des KPIs
  const totalExamens = requests.length;
  const enAttenteSTAT = requests.filter(r => r.statut === 'CREEE' || r.statut === 'EN_ATTENTE').length;
  const enValidation = requests.filter(r => r.statut === 'RESULTAT_DISPONIBLE').length;
  const valides = requests.filter(r => r.statut === 'VALIDE').length;

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#f9f9ff]">
        <Sidebar />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-on-surface-variant">Chargement des données...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-[#f9f9ff]">
        <Sidebar />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <div className="text-center bg-error-container p-6 rounded-xl">
            <span className="material-symbols-outlined text-4xl text-tertiary">error</span>
            <p className="mt-2 text-tertiary font-semibold">{error}</p>
            <button 
              onClick={fetchData}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
            >
              Réessayer
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f9f9ff] text-[#191c21]">
      <div className="fixed inset-0 grain-overlay z-[60] pointer-events-none"></div>
      <Sidebar />
      
      <main className="flex-1 ml-64 min-h-screen flex flex-col w-[calc(100%-256px)]">
        
        {/* TopAppBar */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl flex justify-between items-center px-6 py-3 shadow-sm shadow-blue-900/5">
          <div className="flex items-center gap-4 flex-1">
            <h2 className="text-lg font-black text-blue-900 tracking-tight whitespace-nowrap">Tableau de bord</h2>
            <div className="flex items-center bg-[#ecedf6]/50 px-3 py-1.5 rounded-full max-w-md w-full">
              <span className="material-symbols-outlined text-[#424752] text-sm mr-2">search</span>
              <input className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-400" placeholder="Rechercher..." type="text"/>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-600">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-600">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-[#00478d]/10 flex items-center justify-center ml-2">
              <span className="material-symbols-outlined text-[#00478d] text-sm">person</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 w-full">
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-[#191c21] tracking-tight">Tableau de bord</h2>
            <p className="text-slate-500 text-sm mt-1">Vue d'ensemble de l'activité du laboratoire</p>
          </div>

          {/* 4 KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-outline-variant/20 flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total examens</p>
                <p className="text-3xl font-extrabold text-primary">{totalExamens}</p>
              </div>
              <span className="material-symbols-outlined text-primary text-3xl">biotech</span>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-outline-variant/20 flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">En attente</p>
                <p className="text-3xl font-extrabold text-tertiary">{enAttenteSTAT}</p>
              </div>
              <span className="material-symbols-outlined text-tertiary text-3xl">schedule</span>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-outline-variant/20 flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">En validation</p>
                <p className="text-3xl font-extrabold text-primary">{enValidation}</p>
              </div>
              <span className="material-symbols-outlined text-primary text-3xl">fact_check</span>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-outline-variant/20 flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Validés</p>
                <p className="text-3xl font-extrabold text-primary">{valides}</p>
              </div>
              <span className="material-symbols-outlined text-primary text-3xl">verified</span>
            </div>
          </div>

          {/* Liste des dernières demandes */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-outline-variant/20">
            <div className="p-5 border-b border-outline-variant/20">
              <h3 className="font-bold text-lg">Dernières demandes</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#f2f3fb] text-[11px] font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="p-4 text-left">ID PARA</th>
                    <th className="p-4 text-left">Patient</th>
                    <th className="p-4 text-left">Type examen</th>
                    <th className="p-4 text-left">Statut</th>
                    <th className="p-4 text-left">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {requests.slice(0, 5).map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-mono font-bold text-primary">{req.anapathId}</td>
                      <td className="p-4 font-medium">{req.patientId}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">
                          {req.typeExamen}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          req.statut === 'VALIDE' ? 'bg-green-100 text-green-700' :
                          req.statut === 'RESULTAT_DISPONIBLE' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {req.statut}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 text-xs">
                        {new Date(req.createdAt).toLocaleDateString('fr-FR')}
                      </td>
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