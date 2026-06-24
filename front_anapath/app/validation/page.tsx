'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useSearch } from '@/components/SearchContext';
import axios from 'axios';
import { statusLabels, statusColors } from '@/lib/statusLabels';

interface AnapathRequest {
  id: string;
  anapathId: string;
  patientId: string;
  typeExamen: string;
  statut: string;
  prelevement: { site: string; description: string };
  resultat: { conclusion: string; details: string } | null;
}

export default function ValidationPage() {
  const router = useRouter();
  const { searchQuery } = useSearch();
  const [requests, setRequests] = useState<AnapathRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<AnapathRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<AnapathRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [resultData, setResultData] = useState({ details: '', conclusion: '' });
  const [signature, setSignature] = useState({ signature: '', ordreProfessionnelNumber: '' });

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
    if (filtered.length > 0 && !selectedRequest) {
      setSelectedRequest(filtered[0]);
      if (filtered[0].resultat) {
        setResultData({
          details: filtered[0].resultat.details || '',
          conclusion: filtered[0].resultat.conclusion || ''
        });
      }
    }
  }, [searchQuery, requests]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/anapath`);
      const pendingRequests = response.data.filter((req: AnapathRequest) =>
        req.statut === 'CREEE' || req.statut === 'EN_ATTENTE'
      );
      setRequests(pendingRequests);
      setFilteredRequests(pendingRequests);
      if (pendingRequests.length > 0) {
        setSelectedRequest(pendingRequests[0]);
        if (pendingRequests[0].resultat) {
          setResultData({
            details: pendingRequests[0].resultat.details || '',
            conclusion: pendingRequests[0].resultat.conclusion || ''
          });
        }
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRequest = async (id: string) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/anapath/${id}`);
      setSelectedRequest(response.data);
      if (response.data.resultat) {
        setResultData({
          details: response.data.resultat.details || '',
          conclusion: response.data.resultat.conclusion || ''
        });
      } else {
        setResultData({ details: '', conclusion: '' });
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleSaveResult = async () => {
    if (!selectedRequest) return;
    try {
      setUpdating(true);
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/anapath/${selectedRequest.id}`, {
        statut: 'RESULTAT_DISPONIBLE',
        resultat: { details: resultData.details, conclusion: resultData.conclusion }
      });
      await fetchData();
      if (selectedRequest) await loadRequest(selectedRequest.id);
      alert('Résultat sauvegardé !');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setUpdating(false);
    }
  };

  const handleValidate = async () => {
    if (!selectedRequest) return;
    if (!signature.signature || !signature.ordreProfessionnelNumber) {
      alert('Veuillez remplir tous les champs de signature');
      return;
    }
    try {
      setUpdating(true);
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/anapath/${selectedRequest.id}/validate`, signature);
      alert('Demande validée avec succès !');
      await fetchData();
      if (filteredRequests.length > 1) {
        setSelectedRequest(filteredRequests[1]);
        loadRequest(filteredRequests[1].id);
      } else {
        setSelectedRequest(null);
        setResultData({ details: '', conclusion: '' });
        setSignature({ signature: '', ordreProfessionnelNumber: '' });
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la validation');
    } finally {
      setUpdating(false);
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
        <div className="flex-1 p-6 w-full max-w-6xl mx-auto">
          {filteredRequests.length > 0 ? (
            <div className="mb-6">
              <label className="text-xs font-bold text-slate-400 uppercase">Demande à traiter</label>
              <select
                value={selectedRequest?.id || ''}
                onChange={(e) => loadRequest(e.target.value)}
                className="w-full mt-1 p-3 bg-white border border-outline-variant/30 rounded-lg text-sm"
              >
                {filteredRequests.map((req) => (
                  <option key={req.id} value={req.id}>
                    {req.anapathId} - Patient: {req.patientId} - {getTypeLabel(req.typeExamen)}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="bg-green-50 p-6 rounded-xl text-center mb-6">
              <span className="material-symbols-outlined text-4xl text-green-600">check_circle</span>
              <p className="text-green-700 font-semibold mt-2">Aucune demande en attente de validation</p>
            </div>
          )}
          {selectedRequest && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/20">
                  <h3 className="font-bold text-primary mb-4">👤 Informations patient</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs text-slate-400">Patient ID</label><p className="font-semibold">{selectedRequest.patientId}</p></div>
                    <div><label className="text-xs text-slate-400">ID PARA</label><p className="font-mono text-primary font-bold">{selectedRequest.anapathId}</p></div>
                    <div><label className="text-xs text-slate-400">Type examen</label><p className="font-semibold">{getTypeLabel(selectedRequest.typeExamen)}</p></div>
                    <div><label className="text-xs text-slate-400">Site prélèvement</label><p className="font-semibold">{selectedRequest.prelevement?.site || '-'}</p></div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/20">
                  <h3 className="font-bold text-primary mb-4">🔬 Compte-rendu d'analyse</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase">Description microscopique</label>
                      <textarea
                        value={resultData.details}
                        onChange={(e) => setResultData({ ...resultData, details: e.target.value })}
                        className="w-full mt-1 p-3 bg-[#f2f3fb] border border-outline-variant/30 rounded-lg text-sm"
                        rows={5}
                        placeholder="Observations cellulaires détaillées..."
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-tertiary uppercase">Conclusion diagnostique</label>
                      <textarea
                        value={resultData.conclusion}
                        onChange={(e) => setResultData({ ...resultData, conclusion: e.target.value })}
                        className="w-full mt-1 p-3 bg-tertiary/5 border border-tertiary/20 rounded-lg text-sm font-semibold"
                        rows={3}
                        placeholder="Résumé final du diagnostic..."
                      />
                    </div>
                    <button
                      onClick={handleSaveResult}
                      disabled={updating}
                      className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:opacity-90 transition"
                    >
                      {updating ? 'Sauvegarde...' : '💾 Sauvegarder le résultat'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/20">
                  <h3 className="font-bold text-primary mb-4">✍️ Signature numérique</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase">Signature</label>
                      <input
                        type="text"
                        value={signature.signature}
                        onChange={(e) => setSignature({ ...signature, signature: e.target.value })}
                        className="w-full mt-1 p-3 bg-[#f2f3fb] border border-outline-variant/30 rounded-lg text-sm"
                        placeholder="Signature électronique"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase">N° Ordre professionnel</label>
                      <input
                        type="text"
                        value={signature.ordreProfessionnelNumber}
                        onChange={(e) => setSignature({ ...signature, ordreProfessionnelNumber: e.target.value })}
                        className="w-full mt-1 p-3 bg-[#f2f3fb] border border-outline-variant/30 rounded-lg text-sm"
                        placeholder="Ex: ONM-12345"
                      />
                    </div>
                    <button
                      onClick={handleValidate}
                      disabled={updating || selectedRequest.statut !== 'RESULTAT_DISPONIBLE'}
                      className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
                        selectedRequest.statut === 'RESULTAT_DISPONIBLE'
                          ? 'bg-gradient-to-r from-primary to-primary-container text-white shadow-md hover:shadow-lg'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">verified</span>
                      {selectedRequest.statut === 'RESULTAT_DISPONIBLE'
                        ? updating
                          ? 'Traitement...'
                          : 'Valider et signer (immuable)'
                        : 'Sauvegardez d\'abord le résultat'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}