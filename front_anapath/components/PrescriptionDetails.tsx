'use client';

import PatientIdentitySection, { PatientInfo } from '@/components/PatientIdentitySection';
import { formatDateLong } from '@/lib/dateFormat';

interface PrescriptionRequest {
  typeExamen: string;
  createdAt: string;
  patientId: string;
  prelevement?: {
    site?: string;
    description?: string;
    clinicalData?: { treatmentType?: string; suspicion?: string; clinicalNotes?: string };
  } | null;
  metadata?: Record<string, unknown> | null;
}

interface PrescriptionDetailsProps {
  request: PrescriptionRequest;
  patient: PatientInfo | null;
  patientLoading?: boolean;
  historiqueButton?: React.ReactNode;
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

/** Détails d'une prescription (identité patient, type d'examen, motif, infos cliniques par type). */
export default function PrescriptionDetails({ request, patient, patientLoading, historiqueButton }: PrescriptionDetailsProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/20">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary">description</span>
        <h4 className="text-lg font-bold text-primary">Détails de la prescription</h4>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-5">
          <div className="bg-surface-container-low rounded-lg p-4 border border-outline-variant/30">
            <PatientIdentitySection examen={request} patient={patient} loading={patientLoading} />
            <div className="grid grid-cols-2 gap-4 text-sm mt-4 pt-4 border-t border-outline-variant/30">
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

          {/* Service demandeur / CHU / données cliniques renseignées par la Prescription */}
          <div className="bg-white border border-outline-variant/30 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-secondary">stethoscope</span>
              <div>
                <p className="text-xs text-slate-400">Service demandeur</p>
                <p className="font-medium text-on-surface">{(request.metadata?.serviceNom as string) ?? '—'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 mt-3">
              <span className="material-symbols-outlined text-secondary">local_hospital</span>
              <div>
                <p className="text-xs text-slate-400">CHU</p>
                <p className="font-medium text-on-surface">{(request.metadata?.chuNom as string) ?? '—'}</p>
              </div>
            </div>
            <hr className="border-outline-variant/30 my-3" />

            <div className="mb-3">
              <p className="text-xs text-slate-400">Type de traitement</p>
              <p className="font-medium text-on-surface">{request.prelevement?.clinicalData?.treatmentType || '—'}</p>
            </div>
            <div className="mb-3">
              <p className="text-xs text-slate-400">Suspicion diagnostique</p>
              <p className="font-medium text-on-surface italic leading-relaxed">{request.prelevement?.clinicalData?.suspicion || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Renseignements cliniques</p>
              <p className="font-medium text-on-surface italic leading-relaxed">{request.prelevement?.clinicalData?.clinicalNotes || '—'}</p>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {historiqueButton && (
            <div className="flex justify-end">
              {historiqueButton}
            </div>
          )}

          {/* Motif de prescription */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-4">
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
              <div className="grid grid-cols-2 gap-4 text-sm">
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
              <div className="grid grid-cols-2 gap-4 text-sm">
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
              <div className="grid grid-cols-2 gap-4 text-sm">
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
      </div>
    </div>
  );
}
