'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import axios from 'axios';
import { statusLabels, statusColors } from '@/lib/statusLabels';

interface AnapathRequest {
  id: string;
  anapathId: string;
  patientId: string;
  typeExamen: string;
  statut: string;
  isExtemporane: boolean;
  prelevement: {
    site: string;
    description: string;
  } | null;
  createdAt: string;
}

function extractValue(description: string | undefined, key: string): string {
  if (!description) return '-';
  const regex = new RegExp(`${key}:\\s*([^,]+)`);
  const match = description.match(regex);
  return match ? match[1].trim() : '-';
}

function formatMotif(description: string | undefined): string {
  if (!description) return 'Non renseigné';
  const cleaned = description.replace(/(?:[A-Za-zÀ-ÖØ-öø-ÿ]+):\s*[^,]+(?:,\s*)?/g, '').trim();
  return cleaned || 'Non renseigné';
}

export default function WorklistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [request, setRequest] = useState<AnapathRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const patientInfo = {
    fullName: 'RANDRIANTOANDRO N.',
    sex: 'Féminin',
    age: 34,
    sampleDate: request
      ? new Date(request.createdAt).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '',
    site: request?.prelevement?.site || '',
    prescriber: 'Dr. Rakotoarisoa Jean - Service de Chirurgie',
  };

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/anapath/${id}`);
      setRequest(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTakeCharge = async () => {
    if (!request) return;
    try {
      setUpdating(true);
      // Ne changer le statut que si l'examen est encore en "En attente de validation" (CREEE)
      // Sinon, on garde le statut actuel pour ne pas écraser un résultat déjà saisi.
      if (request.statut === 'CREEE') {
        await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/anapath/${request.id}`, {
          statut: 'EN_ATTENTE',
        });
        await fetchRequest();
      }
      // Rediriger vers la page validation avec l'ID de l'examen
      router.push(`/validation?id=${request.id}`);
    } catch (error) {
      console.error('Erreur lors de la prise en charge:', error);
      alert('Erreur lors de la prise en charge');
    } finally {
      setUpdating(false);
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

  // Le bouton "Prise en charge" est visible tant que l'examen n'est pas validé (Terminé)
  const isTakeChargeVisible = request.statut !== 'VALIDE' && request.statut !== 'ARCHIVE';

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
            <h2 className="text-lg font-black text-blue-900">Détail de la prescription</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[request.statut] || 'bg-gray-100 text-gray-700'}`}>
              {statusLabels[request.statut] || request.statut}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#00478d]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#00478d] text-sm">person</span>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 w-full max-w-5xl mx-auto">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/20 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">description</span>
              <h4 className="text-lg font-bold text-primary">Détails de la prescription</h4>
            </div>

            {/* Identité Patient */}
            <div className="bg-surface-container-low rounded-lg p-4 mb-5 border border-outline-variant/30">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-primary text-sm">person</span>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Identité Patient</label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Nom complet</p>
                  <p className="font-bold text-on-surface">{patientInfo.fullName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Patient ID</p>
                  <p className="font-medium text-on-surface">{request.patientId}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Âge / Sexe</p>
                  <p className="font-medium text-on-surface">{patientInfo.age} ans / {patientInfo.sex}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Type d'examen</p>
                  <p className="font-medium text-on-surface">
                    {request.typeExamen === 'FCV_PAP' && 'FCV / Pap test'}
                    {request.typeExamen === 'CYT0PONCTION' && 'Cytoponction'}
                    {request.typeExamen === 'LIQUIDE' && 'Liquide'}
                    {request.typeExamen === 'BIOPSIE' && 'Biopsie'}
                    {request.typeExamen === 'POS' && 'POS'}
                    {request.typeExamen === 'POC' && 'POC'}
                    {request.typeExamen === 'EXTEMPORANE_STAT' && 'Extemporané'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Date Prélèvement</p>
                  <p className="font-medium text-on-surface">{patientInfo.sampleDate}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Site de prélèvement</p>
                  <p className="font-medium text-on-surface">{request.prelevement?.site || '-'}</p>
                </div>
              </div>
            </div>

            {/* Motif de prescription */}
            <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-4 mb-5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                <span className="material-symbols-outlined text-sm">medical_services</span>
                Motif de prescription
              </label>
              <p className="text-base font-medium text-on-surface leading-relaxed">
                {formatMotif(request.prelevement?.description) || 'Non renseigné'}
              </p>
            </div>

            {/* Détails spécifiques par type */}
            <div className="space-y-4">
              <div className="border-b border-outline-variant/30 pb-2">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Informations cliniques</h5>
              </div>

              {request.typeExamen === 'FCV_PAP' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-surface-container-low rounded-lg p-3">
                    <label className="text-xs text-slate-400 block">GPA</label>
                    <p className="font-medium text-on-surface">{extractValue(request.prelevement?.description, 'GPA')}</p>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-3">
                    <label className="text-xs text-slate-400 block">DDR</label>
                    <p className="font-medium text-on-surface">{extractValue(request.prelevement?.description, 'DDR')}</p>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-3">
                    <label className="text-xs text-slate-400 block">Méthode</label>
                    <p className="font-medium text-on-surface">{extractValue(request.prelevement?.description, 'Méthode')}</p>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-3">
                    <label className="text-xs text-slate-400 block">Symptômes</label>
                    <p className="font-medium text-on-surface">{extractValue(request.prelevement?.description, 'Symptômes')}</p>
                  </div>
                </div>
              )}

              {request.typeExamen === 'CYT0PONCTION' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-surface-container-low rounded-lg p-3">
                    <label className="text-xs text-slate-400 block">Siège</label>
                    <p className="font-medium text-on-surface">{request.prelevement?.site || '-'}</p>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-3">
                    <label className="text-xs text-slate-400 block">Organe</label>
                    <p className="font-medium text-on-surface">{extractValue(request.prelevement?.description, 'Organe')}</p>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-3">
                    <label className="text-xs text-slate-400 block">Fixateur</label>
                    <p className="font-medium text-on-surface">{extractValue(request.prelevement?.description, 'Fixateur')}</p>
                  </div>
                </div>
              )}

              {request.typeExamen === 'LIQUIDE' && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-surface-container-low rounded-lg p-3">
                    <label className="text-xs text-slate-400 block">Nature du liquide</label>
                    <p className="font-medium text-on-surface">{extractValue(request.prelevement?.description, 'Nature')}</p>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-3">
                    <label className="text-xs text-slate-400 block">Notes</label>
                    <p className="font-medium text-on-surface">{extractValue(request.prelevement?.description, 'Notes')}</p>
                  </div>
                </div>
              )}

              {(request.typeExamen === 'BIOPSIE' || request.typeExamen === 'POS' || request.typeExamen === 'POC') && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-surface-container-low rounded-lg p-3">
                    <label className="text-xs text-slate-400 block">Type</label>
                    <p className="font-medium text-on-surface">{extractValue(request.prelevement?.description, 'Type')}</p>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-3">
                    <label className="text-xs text-slate-400 block">Fixateur</label>
                    <p className="font-medium text-on-surface">{extractValue(request.prelevement?.description, 'Fixateur')}</p>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-3">
                    <label className="text-xs text-slate-400 block">Nature</label>
                    <p className="font-medium text-on-surface">{extractValue(request.prelevement?.description, 'Nature')}</p>
                  </div>
                </div>
              )}

              {request.typeExamen === 'EXTEMPORANE_STAT' && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-surface-container-low rounded-lg p-3">
                    <label className="text-xs text-slate-400 block">Chirurgien</label>
                    <p className="font-medium text-on-surface">{extractValue(request.prelevement?.description, 'Chirurgien')}</p>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-3">
                    <label className="text-xs text-slate-400 block">Question posée</label>
                    <p className="font-medium text-on-surface">{extractValue(request.prelevement?.description, 'Question')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bouton Prise en charge - visible tant que le statut n'est pas "Terminé" */}
          {isTakeChargeVisible && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleTakeCharge}
                disabled={updating}
                className="px-8 py-3 bg-blue-600 text-white font-bold rounded-full shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <span className="material-symbols-outlined">handshake</span>
                {updating ? 'Traitement...' : 'Prise en charge'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}