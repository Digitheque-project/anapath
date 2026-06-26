'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import axios from 'axios';
import { formatDateLong, formatDateTime, formatDate } from '@/lib/dateFormat';
import { getServiceDisplayName } from '@/lib/serviceDisplay';
import {
  generateExamPDF,
  DEFAULT_PERSONNEL,
  getTypeLabel,
} from '@/lib/generatePDF';
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
    clinicalData?: {
      treatmentType?: string;
      suspicion?: string;
      clinicalNotes?: string;
    };
  };
  resultat: {
    conclusion: string;
    details: string;
  } | null;
  validatedByUserId: string | null;
  validatedAt: string | null;
  signedHash: string | null;
  createdAt: string;
  episodeId?: string | null;
}

export default function ArchiveDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [request, setRequest] = useState<AnapathRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const patientInfo = {
    fullName: 'RANDRIANTOANDRO N.',
    sex: 'Féminin',
    age: 34,
    sampleDate: request ? formatDateLong(request.createdAt) : '',
    site: request?.prelevement?.site || '',
    requestingService: request
      ? getServiceDisplayName({ episodeId: request.episodeId })
      : 'Service inconnu',
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

  const exportPDF = async () => {
    if (!request) {
      alert('Aucune donnée à exporter.');
      return;
    }

    const clinicalDataExport = request.prelevement?.clinicalData || {};

    try {
      await generateExamPDF({
        anapathId: request.anapathId,
        patientId: request.patientId,
        typeExamen: request.typeExamen,
        typeExamenLabel: getTypeLabel(request.typeExamen),
        createdAt: request.createdAt,
        validatedAt: request.validatedAt,
        patientFullName: patientInfo.fullName,
        patientAge: patientInfo.age,
        patientSex: patientInfo.sex,
        sampleDate: patientInfo.sampleDate,
        prelevementSite: request.prelevement?.site,
        prelevementDescription: request.prelevement?.description,
        requestingService: patientInfo.requestingService,
        prescriber: 'Non renseigné',
        urgence: request.isExtemporane ? 'STAT' : 'Normale',
        clinicalData: clinicalDataExport,
        resultDetails: request.resultat?.details || '',
        resultConclusion: request.resultat?.conclusion || '',
        validatedByUserId: request.validatedByUserId,
        signedHash: request.signedHash,
        signature: request.validatedByUserId || undefined,
        ordreProfessionnelNumber: request.validatedByUserId || undefined,
        personnel: DEFAULT_PERSONNEL,
      });
    } catch {
      alert('Erreur lors de la génération du PDF.');
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
          <p className="text-slate-500">Résultat non trouvé</p>
        </main>
      </div>
    );
  }

  const clinicalData = request.prelevement?.clinicalData || {};

  return (
    <div className="flex min-h-screen bg-[#f9f9ff] text-[#191c21]">
      <div className="fixed inset-0 grain-overlay z-[60] pointer-events-none"></div>
      <Sidebar />

      <main className="flex-1 ml-64 min-h-screen flex flex-col w-[calc(100%-256px)]">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl flex justify-between items-center px-6 py-3 shadow-sm">
          <div className="flex items-center gap-4">
            <Link href="/archives" className="flex items-center gap-2 text-primary text-sm hover:underline">
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Retour aux archives
            </Link>
            <h2 className="text-lg font-black text-blue-900">Résultat d'examen</h2>
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
            <h4 className="font-bold text-primary mb-3">👤 Identité Patient</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div><label className="text-xs text-slate-400">Nom complet</label><p className="font-bold">{patientInfo.fullName}</p></div>
              <div><label className="text-xs text-slate-400">Patient ID</label><p className="font-medium">{request.patientId}</p></div>
              <div><label className="text-xs text-slate-400">Âge / Sexe</label><p className="font-medium">{patientInfo.age} ans / {patientInfo.sex}</p></div>
              <div><label className="text-xs text-slate-400">Type d'examen</label><p className="font-medium">{getTypeLabel(request.typeExamen)}</p></div>
              <div><label className="text-xs text-slate-400">Date Prélèvement</label><p className="font-medium">{patientInfo.sampleDate}</p></div>
              <div><label className="text-xs text-slate-400">Site de prélèvement</label><p className="font-medium">{request.prelevement?.site || '-'}</p></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/20 mb-6">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-secondary">stethoscope</span>
              <div>
                <p className="text-xs text-slate-400">Service demandeur</p>
                <p className="font-medium">{patientInfo.requestingService}</p>
              </div>
            </div>
            <hr className="border-outline-variant my-3" />
            <div className="grid grid-cols-1 gap-3">
              <div>
                <p className="text-xs text-slate-400">Type de traitement</p>
                <p className="font-medium">{clinicalData.treatmentType || 'Non renseigné'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Suspicion diagnostique</p>
                <p className="font-medium italic">{clinicalData.suspicion || 'Non renseignée'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Renseignements cliniques</p>
                <p className="font-medium italic">{clinicalData.clinicalNotes || 'Non renseignés'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/20 mb-6">
            <h4 className="font-bold text-primary mb-3">🔬 Compte-rendu d'analyse</h4>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Description microscopique</label>
                <div className="w-full mt-1 p-3 bg-[#f2f3fb] border border-outline-variant/30 rounded-lg text-sm whitespace-pre-wrap">
                  {request.resultat?.details || 'Non renseigné'}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-tertiary uppercase">Conclusion diagnostique</label>
                <div className="w-full mt-1 p-3 bg-tertiary/5 border border-tertiary/20 rounded-lg text-sm font-semibold whitespace-pre-wrap">
                  {request.resultat?.conclusion || 'Non renseignée'}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-xl border border-green-200 mb-6">
            <h4 className="font-bold text-green-700 mb-3">✅ Demande validée</h4>
            <p className="text-sm">Validée par: {request.validatedByUserId}</p>
            <p className="text-sm">Le: {request.validatedAt ? formatDateTime(request.validatedAt) : '-'}</p>
            <p className="text-xs text-slate-500 mt-2">Hash: {request.signedHash?.substring(0, 20)}...</p>
          </div>

          <div className="flex justify-center mt-8">
            <button
              onClick={exportPDF}
              className="flex items-center gap-2 px-5 h-10 rounded-full bg-primary text-white font-bold uppercase tracking-wider shadow-sm hover:opacity-90 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
              Exporter PDF
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}