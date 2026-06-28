'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import PatientIdentitySection, { PatientInfo } from '@/components/PatientIdentitySection';
import { useSearch } from '@/components/SearchContext';
import axios from 'axios';
import { formatDateLong } from '@/lib/dateFormat';
import { getPatientForExamen } from '@/lib/api';
import {
  generateExamPDF,
  buildExamPdfData,
  DEFAULT_PERSONNEL,
  getTypeLabel,
} from '@/lib/generatePDF';

interface AnapathRequest {
  id: string;
  anapathId: string;
  patientId: string;
  typeExamen: string;
  statut: string;
  prelevement: {
    site: string;
    description: string;
    clinicalData?: {
      treatmentType?: string;
      suspicion?: string;
      clinicalNotes?: string;
    };
  };
  resultat: { conclusion: string; details: string } | null;
  createdAt: string;
  isExtemporane?: boolean;
  episodeId?: string | null;
  metadata?: Record<string, unknown> | null;
  patientInfo?: PatientInfo | null;
}

function ValidationPageContent() {
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get('id');

  const { searchQuery } = useSearch();
  const [requests, setRequests] = useState<AnapathRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<AnapathRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<AnapathRequest | null>(null);
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [patientLoading, setPatientLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [resultData, setResultData] = useState({ details: '', conclusion: '' });
  const [signature, setSignature] = useState({ signature: '', ordreProfessionnelNumber: '' });
  const [ippNumber, setIppNumber] = useState('');
  const [treatmentType, setTreatmentType] = useState('');
  const [suspicion, setSuspicion] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');

  useEffect(() => {
    async function loadPatient() {
      if (!selectedRequest) {
        setPatient(null);
        return;
      }
      setPatientLoading(true);
      if (selectedRequest.patientInfo?.nomComplet) {
        setPatient(selectedRequest.patientInfo);
      } else {
        const pat = await getPatientForExamen(selectedRequest.id);
        setPatient(pat);
      }
      setPatientLoading(false);
    }
    loadPatient();
  }, [selectedRequest?.id, selectedRequest?.patientInfo]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = requests;
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (req: AnapathRequest) =>
          req.anapathId.toLowerCase().includes(query) ||
          req.patientId.toLowerCase().includes(query) ||
          req.typeExamen.toLowerCase().includes(query)
      );
    }
    setFilteredRequests(filtered);

    if (preselectedId && filtered.length > 0) {
      const found = filtered.find((req: AnapathRequest) => req.id === preselectedId);
      if (found) {
        setSelectedRequest(found);
        populateFields(found);
        return;
      }
    }

    if (filtered.length > 0 && !selectedRequest) {
      setSelectedRequest(filtered[0]);
      populateFields(filtered[0]);
    }
  }, [searchQuery, requests, preselectedId]);

  const populateFields = (request: AnapathRequest) => {
    if (request.resultat) {
      setResultData({
        details: request.resultat.details || '',
        conclusion: request.resultat.conclusion || '',
      });
    } else {
      setResultData({ details: '', conclusion: '' });
    }

    const clinicalData = request.prelevement?.clinicalData || {};
    setTreatmentType(clinicalData.treatmentType || '');
    setSuspicion(clinicalData.suspicion || '');
    setClinicalNotes(clinicalData.clinicalNotes || '');
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/anapath`);
      const pendingRequests = response.data.filter(
        (req: AnapathRequest) =>
          req.statut === 'CREEE' ||
          req.statut === 'EN_ATTENTE' ||
          req.statut === 'RESULTAT_DISPONIBLE'
      );
      pendingRequests.sort((a: AnapathRequest, b: AnapathRequest) => {
        if (a.isExtemporane && !b.isExtemporane) return -1;
        if (!a.isExtemporane && b.isExtemporane) return 1;
        return 0;
      });
      setRequests(pendingRequests);
      setFilteredRequests(pendingRequests);

      if (preselectedId) {
        const found = pendingRequests.find((req: AnapathRequest) => req.id === preselectedId);
        if (found) {
          setSelectedRequest(found);
          populateFields(found);
        } else if (pendingRequests.length > 0) {
          setSelectedRequest(pendingRequests[0]);
          populateFields(pendingRequests[0]);
        }
      } else if (pendingRequests.length > 0) {
        setSelectedRequest(pendingRequests[0]);
        populateFields(pendingRequests[0]);
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
      populateFields(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleSaveResult = async () => {
    if (!selectedRequest) return;

    const prelevementData = {
      site: selectedRequest.prelevement?.site || '',
      description: selectedRequest.prelevement?.description || '',
      clinicalData: {
        treatmentType: treatmentType || '',
        suspicion: suspicion || '',
        clinicalNotes: clinicalNotes || '',
      },
    };

    try {
      setUpdating(true);
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/anapath/${selectedRequest.id}`, {
        statut: 'RESULTAT_DISPONIBLE',
        resultat: { details: resultData.details, conclusion: resultData.conclusion },
        prelevement: prelevementData,
      });
      await fetchData();
      if (selectedRequest) {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/anapath/${selectedRequest.id}`);
        setSelectedRequest(response.data);
        populateFields(response.data);
      }
      alert('Résultat et données cliniques sauvegardés !');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setUpdating(false);
    }
  };

  const handleValidate = async () => {
    if (!selectedRequest) return;

    if (!resultData.details.trim() || !resultData.conclusion.trim()) {
      alert('Veuillez saisir le résultat et la conclusion.');
      return;
    }
    if (!ippNumber.trim()) {
      alert('Veuillez saisir le numéro de dossier (IPP).');
      return;
    }
    if (!signature.signature.trim() || !signature.ordreProfessionnelNumber.trim()) {
      alert('Veuillez remplir les champs de signature.');
      return;
    }

    if (selectedRequest.statut !== 'RESULTAT_DISPONIBLE') {
      await handleSaveResult();
      await fetchData();
      if (selectedRequest) await loadRequest(selectedRequest.id);
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
        setIppNumber('');
        setTreatmentType('');
        setSuspicion('');
        setClinicalNotes('');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la validation');
    } finally {
      setUpdating(false);
    }
  };

  const isFormValid = () => {
    return (
      resultData.details.trim() !== '' &&
      resultData.conclusion.trim() !== '' &&
      ippNumber.trim() !== '' &&
      signature.signature.trim() !== '' &&
      signature.ordreProfessionnelNumber.trim() !== ''
    );
  };

  const isSaveEnabled = () => {
    return (
      resultData.details.trim() !== '' ||
      resultData.conclusion.trim() !== '' ||
      ippNumber.trim() !== '' ||
      signature.signature.trim() !== '' ||
      signature.ordreProfessionnelNumber.trim() !== '' ||
      treatmentType.trim() !== '' ||
      suspicion.trim() !== '' ||
      clinicalNotes.trim() !== ''
    );
  };

  // ============================================================
  // EXPORT PDF
  // ============================================================
  const exportPDF = async () => {
    if (!selectedRequest) {
      alert('Aucun examen sélectionné.');
      return;
    }

    try {
      await generateExamPDF(
        buildExamPdfData(selectedRequest, patient, {
          validatedAt: null,
          resultDetails: resultData.details,
          resultConclusion: resultData.conclusion,
          signature: signature.signature,
          ordreProfessionnelNumber: signature.ordreProfessionnelNumber,
          clinicalData: {
            treatmentType: treatmentType || selectedRequest.prelevement?.clinicalData?.treatmentType,
            suspicion: suspicion || selectedRequest.prelevement?.clinicalData?.suspicion,
            clinicalNotes: clinicalNotes || selectedRequest.prelevement?.clinicalData?.clinicalNotes,
          },
          personnel: DEFAULT_PERSONNEL,
        }),
      );
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

  return (
    <div className="flex min-h-screen bg-surface text-on-surface">
      <div className="fixed inset-0 grain-overlay z-[60] pointer-events-none"></div>
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen flex flex-col w-[calc(100%-256px)]">
        <TopBar />

        <div className="flex-1 p-6 w-full">
          <div className="max-w-4xl mx-auto space-y-4 pt-4 pb-8">
            {filteredRequests.length > 0 ? (
              <div className="mb-4">
                <label className="text-xs font-bold text-slate-400 uppercase">Demande à traiter</label>
                <select
                  value={selectedRequest?.id || ''}
                  onChange={(e) => loadRequest(e.target.value)}
                  className="w-full mt-1 p-3 bg-white border border-outline-variant/30 rounded-lg text-sm"
                >
                  {filteredRequests.map((req: AnapathRequest) => (
                    <option key={req.id} value={req.id}>
                      {req.anapathId} - Patient: {req.patientId} - {getTypeLabel(req.typeExamen)}
                      {req.isExtemporane && ' ⚠️ STAT'}
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
              <>
                <div className="py-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-outline-variant pb-3">
                  <div className="text-center sm:text-left">
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Compte Rendu d'Examen</p>
                    <h2 className="text-2xl font-bold text-on-surface">Anatomo-Pathologique</h2>
                  </div>
                  <input
                    type="text"
                    value={ippNumber}
                    onChange={(e) => setIppNumber(e.target.value)}
                    placeholder="F26399"
                    className="w-32 px-2 py-1 text-sm font-bold text-on-surface bg-surface-container-low border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <section className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
                      <div className="p-4 bg-surface-container-low border-b border-outline-variant">
                        <PatientIdentitySection
                          examen={selectedRequest}
                          patient={patient}
                          loading={patientLoading}
                        />
                        <div className="grid grid-cols-2 gap-y-3 gap-x-2 mt-4 pt-4 border-t border-outline-variant">
                          <div>
                            <p className="text-xs text-on-surface-variant">Type d'examen</p>
                            <p className="font-medium text-on-surface">{getTypeLabel(selectedRequest.typeExamen)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-on-surface-variant">Date Prélèvement</p>
                            <p className="font-medium text-on-surface">{formatDateLong(selectedRequest.createdAt)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-on-surface-variant">Site de prélèvement</p>
                            <p className="font-medium text-on-surface">{selectedRequest.prelevement?.site || '-'}</p>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="bg-white border border-outline-variant rounded-xl shadow-sm p-4">
                      <div className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-secondary">stethoscope</span>
                        <div>
                          <p className="text-xs text-on-surface-variant">Service demandeur</p>
                          <p className="font-medium text-on-surface">{(selectedRequest.metadata?.serviceNom as string) ?? '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 mt-3">
                        <span className="material-symbols-outlined text-secondary">local_hospital</span>
                        <div>
                          <p className="text-xs text-on-surface-variant">CHU</p>
                          <p className="font-medium text-on-surface">{(selectedRequest.metadata?.chuNom as string) ?? '—'}</p>
                        </div>
                      </div>
                      <hr className="border-outline-variant my-3" />

                      <div className="mb-3">
                        <p className="text-xs font-bold text-on-surface-variant">Type de traitement <span className="text-red-500">*</span></p>
                        <input
                          type="text"
                          value={treatmentType}
                          onChange={(e) => setTreatmentType(e.target.value)}
                          className="w-full mt-1 p-2 border rounded-lg bg-surface-container-low border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-medium text-on-surface"
                          placeholder="Ex: Chirurgie, Chimiothérapie, Radiothérapie..."
                          required
                        />
                      </div>

                      <div className="mb-3">
                        <p className="text-xs font-bold text-on-surface-variant">Suspicion diagnostique <span className="text-red-500">*</span></p>
                        <textarea
                          value={suspicion}
                          onChange={(e) => setSuspicion(e.target.value)}
                          className="w-full mt-1 p-2 border rounded-lg bg-surface-container-low border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-medium text-on-surface italic leading-relaxed"
                          placeholder="Adénopathie cervicale persistante, perte de poids inexpliquée..."
                          rows={3}
                          required
                        />
                      </div>

                      <div>
                        <p className="text-xs font-bold text-on-surface-variant">Renseignements cliniques <span className="text-red-500">*</span></p>
                        <textarea
                          value={clinicalNotes}
                          onChange={(e) => setClinicalNotes(e.target.value)}
                          className="w-full mt-1 p-2 border rounded-lg bg-surface-container-low border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-medium text-on-surface italic leading-relaxed"
                          placeholder="Motif de la consultation, antécédents, examens complémentaires..."
                          rows={3}
                          required
                        />
                      </div>
                    </section>
                  </div>

                  <div className="space-y-4">
                    <section className="bg-white border border-outline-variant rounded-xl shadow-sm p-4">
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">RÉSULTAT : <span className="text-red-500">*</span></p>
                      <textarea
                        value={resultData.details}
                        onChange={(e) => setResultData({ ...resultData, details: e.target.value })}
                        className="w-full p-2 border rounded-lg bg-surface-container-low border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-medium text-on-surface"
                        placeholder="Saisir les résultats de l'examen ici..."
                        rows={12}
                        required
                      />
                    </section>

                    <section className="bg-white border border-outline-variant rounded-xl shadow-sm p-4">
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">CONCLUSION : <span className="text-red-500">*</span></p>
                      <textarea
                        value={resultData.conclusion}
                        onChange={(e) => setResultData({ ...resultData, conclusion: e.target.value })}
                        className="w-full p-2 border rounded-lg bg-surface-container-low border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-medium text-on-surface"
                        placeholder="Saisir la conclusion ici..."
                        rows={4}
                        required
                      />
                    </section>

                    <button
                      onClick={handleSaveResult}
                      disabled={!isSaveEnabled() || updating}
                      className={`w-full flex items-center justify-center gap-2 px-5 py-2 rounded-full font-bold uppercase tracking-wider shadow-sm transition-all ${
                        isSaveEnabled() && !updating
                          ? 'bg-blue-600 text-white hover:opacity-90'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      {updating ? 'Sauvegarde...' : '💾 Sauvegarder le résultat'}
                    </button>
                  </div>
                </div>

                <section className="bg-white border border-outline-variant rounded-xl shadow-sm p-4 md:p-6 mt-4">
                  <div className="text-center">
                    <p className="text-xs text-on-surface-variant mb-4">
                      Fait à Fianarantsoa, le {formatDateLong(new Date())}
                    </p>

                    <div className="mt-6 border-t border-outline-variant pt-4">
                      <p className="text-sm font-bold text-on-surface-variant flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-primary">verified</span>
                        Signature numérique
                      </p>

                      <div className="mt-4 w-full max-w-sm mx-auto space-y-3">
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase">Signature électronique <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={signature.signature}
                            onChange={(e) => setSignature({ ...signature, signature: e.target.value })}
                            className="w-full mt-1 p-2 bg-[#f2f3fb] border border-outline-variant/30 rounded-lg text-sm"
                            placeholder="Signature électronique"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase">N° Ordre professionnel <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={signature.ordreProfessionnelNumber}
                            onChange={(e) => setSignature({ ...signature, ordreProfessionnelNumber: e.target.value })}
                            className="w-full mt-1 p-2 bg-[#f2f3fb] border border-outline-variant/30 rounded-lg text-sm"
                            placeholder="Ex: ONM-12345"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="flex flex-wrap gap-3 items-center justify-center pt-6 pb-4 border-t border-outline-variant">
                  <button
                    onClick={exportPDF}
                    className="flex items-center gap-2 px-5 h-10 rounded-full bg-primary text-white font-bold uppercase tracking-wider shadow-sm hover:opacity-90 transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                    Exporter PDF
                  </button>
                  <button
                    onClick={handleValidate}
                    disabled={!isFormValid() || updating}
                    className={`flex items-center gap-2 px-5 h-10 rounded-full font-bold uppercase tracking-wider shadow-sm transition-all ${
                      isFormValid() && !updating
                        ? 'bg-green-700 text-white hover:opacity-90'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    {isFormValid() && !updating
                      ? 'Valider le résultat'
                      : 'Valider le résultat'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ValidationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen bg-[#f9f9ff]">
          <Sidebar />
          <main className="flex-1 ml-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </main>
        </div>
      }
    >
      <ValidationPageContent />
    </Suspense>
  );
}