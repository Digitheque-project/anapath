'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import ExtemporaneTimer from '@/components/ExtemporaneTimer';
import axios from 'axios';

interface AnapathRequest {
  id: string;
  anapathId: string;
  patientId: string;
  episodeId: string | null;
  prescriptionId: string | null;
  typeExamen: string;
  isExtemporane: boolean;
  prelevement: {
    site: string;
    description: string;
  };
  resultat: {
    conclusion: string;
    details: string;
    imageUrls?: string[];
  } | null;
  statut: string;
  validatedByUserId: string | null;
  validatedAt: string | null;
  signedHash: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function WorklistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [request, setRequest] = useState<AnapathRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [resultData, setResultData] = useState({
    conclusion: '',
    details: ''
  });
  const [signature, setSignature] = useState({
    signature: '',
    ordreProfessionnelNumber: ''
  });

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/anapath/${id}`);
      setRequest(response.data);
      if (response.data.resultat) {
        setResultData({
          conclusion: response.data.resultat.conclusion || '',
          details: response.data.resultat.details || ''
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResult = async () => {
    if (!request) return;
    try {
      setUpdating(true);
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/anapath/${id}`, {
        statut: 'RESULTAT_DISPONIBLE',
        resultat: resultData
      });
      await fetchRequest();
      alert('Résultat sauvegardé avec succès !');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setUpdating(false);
    }
  };

  const handleValidate = async () => {
    if (!request) return;
    if (!signature.signature || !signature.ordreProfessionnelNumber) {
      alert('Veuillez remplir tous les champs de signature');
      return;
    }
    try {
      setUpdating(true);
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/anapath/${id}/validate`, signature);
      await fetchRequest();
      alert('Demande validée avec succès !');
      router.push('/worklist');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la validation');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = () => {
    if (!request) return null;
    switch (request.statut) {
      case 'VALIDE':
        return <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">✓ Validé</span>;
      case 'RESULTAT_DISPONIBLE':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">📋 Résultat disponible</span>;
      default:
        return <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">⏳ En attente</span>;
    }
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

  if (!request) {
    return (
      <div className="flex min-h-screen bg-[#f9f9ff]">
        <Sidebar />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <p className="text-slate-500">Demande non trouvée</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f9f9ff] text-[#191c21]">
      <div className="fixed inset-0 grain-overlay z-[60] pointer-events-none"></div>
      <Sidebar />

      <main className="flex-1 ml-64 min-h-screen flex flex-col w-[calc(100%-256px)]">
        
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl flex justify-between items-center px-6 py-3 shadow-sm">
          <div className="flex items-center gap-4">
            <Link href="/worklist" className="flex items-center gap-2 text-primary text-sm hover:underline">
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Retour
            </Link>
            <h2 className="text-lg font-black text-blue-900">Détail de la demande</h2>
            {getStatusBadge()}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#00478d]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#00478d] text-sm">person</span>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 w-full max-w-5xl mx-auto">
          
          {/* Minuteur Extemporané STAT - Placé APRÈS avoir vérifié que request existe */}
          {request.isExtemporane && request.statut !== 'VALIDE' && (
            <div className="mb-6">
              <ExtemporaneTimer 
  startTime={request.createdAt}
  requestId={request.id}
  anapathId={request.anapathId}
  patientId={request.patientId}
  onTimeOut={() => console.log('Temps écoulé')}
              />
            </div>
          )}

          {/* Patient Info */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/20 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#191c21]">Patient: {request.patientId}</h3>
                <div className="flex gap-4 mt-2 text-sm text-slate-500">
                  <span>ID: {request.anapathId}</span>
                  <span>Type: {request.typeExamen}</span>
                  <span>Reçu le: {new Date(request.createdAt).toLocaleDateString('fr-FR')}</span>
                  {request.isExtemporane && (
                    <span className="text-tertiary font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">emergency</span>
                      EXAMEN STAT
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Prélèvement */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/20 mb-6">
            <h4 className="font-bold text-primary mb-3">📋 Prélèvement</h4>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs text-slate-400">Site</label><p className="font-medium">{request.prelevement?.site || '-'}</p></div>
              <div><label className="text-xs text-slate-400">Description</label><p className="font-medium">{request.prelevement?.description || '-'}</p></div>
            </div>
          </div>

          {/* Résultat */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/20 mb-6">
            <h4 className="font-bold text-primary mb-3">🔬 Compte-rendu d'analyse</h4>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Description microscopique</label>
                <textarea
                  value={resultData.details}
                  onChange={(e) => setResultData({ ...resultData, details: e.target.value })}
                  className="w-full mt-1 p-3 bg-[#f2f3fb] border border-outline-variant/30 rounded-lg text-sm"
                  rows={4}
                  placeholder="Observations cellulaires détaillées..."
                  disabled={request.statut === 'VALIDE'}
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
                  disabled={request.statut === 'VALIDE'}
                />
              </div>
              {request.statut !== 'VALIDE' && (
                <button
                  onClick={handleSaveResult}
                  disabled={updating}
                  className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:opacity-90 transition"
                >
                  {updating ? 'Sauvegarde...' : '💾 Sauvegarder le résultat'}
                </button>
              )}
            </div>
          </div>

          {/* Signature */}
          {request.statut !== 'VALIDE' && request.statut === 'RESULTAT_DISPONIBLE' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/20 mb-6">
              <h4 className="font-bold text-primary mb-3">✍️ Signature numérique</h4>
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
                  disabled={updating}
                  className="w-full py-3 bg-gradient-to-r from-primary to-primary-container text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">verified</span>
                  {updating ? 'Traitement...' : 'Valider et signer (immuable)'}
                </button>
              </div>
            </div>
          )}

          {/* Info validation */}
          {request.statut === 'VALIDE' && (
            <div className="bg-green-50 p-6 rounded-xl border border-green-200">
              <h4 className="font-bold text-green-700 mb-3">✅ Demande validée</h4>
              <p className="text-sm">Validée par: {request.validatedByUserId}</p>
              <p className="text-sm">Le: {new Date(request.validatedAt!).toLocaleString('fr-FR')}</p>
              <p className="text-xs text-slate-500 mt-2">Hash: {request.signedHash?.substring(0, 20)}...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}