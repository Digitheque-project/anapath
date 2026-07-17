'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import PatientIdentitySection, { PatientInfo } from '@/components/PatientIdentitySection';
import WorkflowStepsCard from '@/components/WorkflowStepsCard';
import { useAuth } from '@/components/AuthProvider';
import axios from 'axios';
import { formatDateLong } from '@/lib/dateFormat';
import { getPatientForExamen, API_BASE } from '@/lib/api';
import { statusLabels, statusColors } from '@/lib/statusLabels';
import { allEtapesComplete, hasAnyObservations, type EtapeWorkflow } from '@/lib/workflowSteps';

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
  episodeId?: string | null;
  metadata?: Record<string, unknown> | null;
  patientInfo?: PatientInfo | null;
  etapes?: EtapeWorkflow[] | null;
}

function extractValue(description: unknown, key: string): string {
  if (typeof description !== 'string' || !description) return '-';
  const regex = new RegExp(`${key}:\\s*([^,]+)`);
  const match = description.match(regex);
  return match ? match[1].trim() : '-';
}

function formatMotif(description: unknown): string {
  if (typeof description !== 'string' || !description) return 'Non renseigné';
  const cleaned = description.replace(/(?:[A-Za-zÀ-ÖØ-öø-ÿ]+):\s*[^,]+(?:,\s*)?/g, '').trim();
  return cleaned || 'Non renseigné';
}

export default function WorklistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { hasPermission } = useAuth();
  const [request, setRequest] = useState<AnapathRequest | null>(null);
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [patientLoading, setPatientLoading] = useState(true);

  const loadExamen = async () => {
    try {
      const response = await axios.get(`${API_BASE}/anapath/${id}`);
      setRequest(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadExamen().finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!request?.id) return;
    setPatientLoading(true);
    if (request.patientInfo?.nomComplet) {
      setPatient(request.patientInfo);
      setPatientLoading(false);
      return;
    }
    getPatientForExamen(request.id)
      .then((p) => setPatient(p))
      .catch(() => setPatient(null))
      .finally(() => setPatientLoading(false));
  }, [request?.id, request?.patientInfo]);

  const handleSaisirResultat = () => {
    if (!request) return;
    router.push(`/validation?id=${request.id}`);
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

  if (!request) {
    return (
      <div className="flex min-h-screen bg-transparent">
        <Sidebar />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <p className="text-slate-500">Demande non trouvée</p>
        </main>
      </div>
    );
  }

  // Les étapes du workflow et le bouton de saisie sont visibles tant que l'examen n'est pas validé (Terminé)
  const isWorkflowVisible = request.statut !== 'VALIDE' && request.statut !== 'ARCHIVE';

  return (
    <div className="flex min-h-screen bg-transparent text-[#191c21]">
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

            <div className="bg-surface-container-low rounded-lg p-4 mb-5 border border-outline-variant/30">
              <PatientIdentitySection
                examen={request}
                patient={patient}
                loading={patientLoading}
              />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mt-4 pt-4 border-t border-outline-variant/30">
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
                  <p className="font-medium text-on-surface">{formatDateLong(request.createdAt)}</p>
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

          {isWorkflowVisible && (
            <WorkflowStepsCard
              requestId={request.id}
              etapes={request.etapes ?? null}
              canEdit={hasPermission('anapath:update')}
              canWriteObservations={hasPermission('anapath:observation:write')}
              onUpdated={loadExamen}
            />
          )}

          {isWorkflowVisible && allEtapesComplete(request.etapes) && (
            <div className="flex flex-col items-center mt-8 gap-2">
              <button
                onClick={handleSaisirResultat}
                disabled={!hasAnyObservations(request.etapes)}
                className={`px-8 py-3 font-bold rounded-full shadow-md flex items-center gap-2 transition-colors ${
                  hasAnyObservations(request.etapes)
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <span className="material-symbols-outlined">edit_note</span>
                Saisir le résultat d'examen
              </button>
              {!hasAnyObservations(request.etapes) && (
                <p className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="material-symbols-outlined text-sm">lock</span>
                  Terminez l&apos;étape Observations pour pouvoir saisir le résultat.
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}