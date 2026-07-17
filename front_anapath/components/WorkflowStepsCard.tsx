'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '@/lib/api';
import {
  WORKFLOW_STEPS,
  mergeEtapes,
  allEtapesComplete,
  type EtapeCode,
  type EtapeWorkflow,
  type MaterielUtilise,
} from '@/lib/workflowSteps';

interface WorkflowStepsCardProps {
  requestId: string;
  etapes: EtapeWorkflow[] | null;
  canEdit: boolean;
  canWriteObservations: boolean;
  onUpdated: () => void;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function WorkflowStepsCard({
  requestId,
  etapes,
  canEdit,
  canWriteObservations,
  onUpdated,
}: WorkflowStepsCardProps) {
  const [draft, setDraft] = useState<EtapeWorkflow[]>(mergeEtapes(etapes));
  const [saving, setSaving] = useState(false);
  // Une fois le matériel validé (bouton "Valider le matériel" + confirmation),
  // l'étape Matériel devient définitivement non modifiable et l'étape
  // Observations s'ouvre — dans une fenêtre, pour éviter de devoir scroller.
  const [materielValidated, setMaterielValidated] = useState(allEtapesComplete(etapes));
  const [showValidateConfirm, setShowValidateConfirm] = useState(false);
  const [validating, setValidating] = useState(false);
  const [showObservationsModal, setShowObservationsModal] = useState(false);
  const [savingObservations, setSavingObservations] = useState(false);
  // Petite fenêtre pour saisir le matériel d'une étape, ouverte via son bouton
  // "Marquer terminé" (ou "Modifier" si déjà terminée) — évite d'avoir les 6
  // étapes ouvertes en même temps sur la page.
  const [materielModalStep, setMaterielModalStep] = useState<EtapeCode | null>(null);
  const [materielModalRows, setMaterielModalRows] = useState<MaterielUtilise[]>([]);

  useEffect(() => {
    setDraft(mergeEtapes(etapes));
    setMaterielValidated(allEtapesComplete(etapes));
  }, [etapes]);

  const draftAllChecked = draft.every((s) => s.complete);
  const hasAnyMaterielDone = draft.some((s) => s.complete);
  const hasAnyObservations = draft.some((s) => Boolean(s.observations?.trim()));

  const updateObservations = (code: EtapeCode, observations: string) => {
    setDraft(draft.map((s) => (s.code === code ? { ...s, observations } : s)));
  };

  const openMaterielModal = (step: EtapeWorkflow) => {
    setMaterielModalRows(
      step.materiels.length > 0 ? step.materiels.map((m) => ({ ...m })) : [{ nom: '', quantite: 1, unite: '' }],
    );
    setMaterielModalStep(step.code);
  };

  const closeMaterielModal = () => {
    setMaterielModalStep(null);
    setMaterielModalRows([]);
  };

  const addModalMateriel = () => {
    setMaterielModalRows([...materielModalRows, { nom: '', quantite: 1, unite: '' }]);
  };

  const removeModalMateriel = (idx: number) => {
    setMaterielModalRows(materielModalRows.filter((_, i) => i !== idx));
  };

  const updateModalMateriel = (idx: number, patch: Partial<MaterielUtilise>) => {
    setMaterielModalRows(materielModalRows.map((m, i) => (i === idx ? { ...m, ...patch } : m)));
  };

  const confirmMaterielModal = () => {
    if (!materielModalStep) return;
    const code = materielModalStep;
    setDraft(
      draft.map((s) =>
        s.code === code
          ? { ...s, complete: true, materiels: materielModalRows.filter((m) => m.nom.trim() !== '') }
          : s,
      ),
    );
    closeMaterielModal();
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await axios.patch(`${API_BASE}/anapath/${requestId}/etapes/bulk`, {
        etapes: draft.map((s) => ({
          code: s.code,
          complete: s.complete,
          materiels: s.materiels.filter((m) => m.nom.trim() !== ''),
        })),
      });
      onUpdated();
    } catch (error) {
      console.error('Erreur sauvegarde étapes:', error);
      alert('Erreur lors de la sauvegarde des étapes');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmValidateMateriel = async () => {
    setValidating(true);
    try {
      await axios.patch(`${API_BASE}/anapath/${requestId}/etapes/bulk`, {
        etapes: draft.map((s) => ({
          code: s.code,
          complete: s.complete,
          materiels: s.materiels.filter((m) => m.nom.trim() !== ''),
        })),
      });
      setMaterielValidated(true);
      setShowValidateConfirm(false);
      onUpdated();
      if (canWriteObservations) setShowObservationsModal(true);
    } catch (error) {
      console.error('Erreur validation matériel:', error);
      alert('Erreur lors de la validation du matériel');
    } finally {
      setValidating(false);
    }
  };

  const handleSaveObservations = async () => {
    setSavingObservations(true);
    try {
      await axios.patch(`${API_BASE}/anapath/${requestId}/etapes/observations`, {
        etapes: draft.map((s) => ({
          code: s.code,
          observations: s.observations ?? '',
        })),
      });
      setShowObservationsModal(false);
      onUpdated();
    } catch (error) {
      console.error('Erreur sauvegarde observations:', error);
      alert('Erreur lors de la sauvegarde des observations');
    } finally {
      setSavingObservations(false);
    }
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Étape 1 — Matériel */}
      <div
        className={`rounded-xl border-2 p-6 transition-colors ${
          materielValidated ? 'border-outline-variant/20 bg-slate-50' : 'border-blue-300 bg-blue-50/30'
        }`}
      >
        <div className="flex items-center gap-2 mb-4">
          <span className={`material-symbols-outlined text-xl ${materielValidated ? 'text-slate-400' : 'text-primary'}`}>
            {materielValidated ? 'check_circle' : 'radio_button_checked'}
          </span>
          <h3 className={`font-bold text-lg ${materielValidated ? 'text-slate-500' : 'text-[#191c21]'}`}>
            Étape 1 — Matériel
          </h3>
        </div>
        <div className="space-y-3">
          {draft.map((step, i) => {
            const label = WORKFLOW_STEPS[i].label;
            return (
              <div
                key={step.code}
                className={`p-3 rounded-lg border transition-colors ${
                  step.complete ? 'border-green-200 bg-green-50' : 'border-outline-variant/20 bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`material-symbols-outlined mt-0.5 ${step.complete ? 'text-green-600' : 'text-slate-300'}`}
                  >
                    {step.complete ? 'check_circle' : 'radio_button_unchecked'}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{label}</p>
                    {step.complete && step.completedByNom && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Par {step.completedByNom}
                        {step.completedAt ? ` le ${formatDateTime(step.completedAt)}` : ''}
                      </p>
                    )}

                    <div className="mt-2 space-y-1.5">
                      {step.complete && step.materiels.length > 0 && (
                        <ul className="text-xs text-slate-600 list-disc list-inside">
                          {step.materiels.map((m, idx) => (
                            <li key={idx}>
                              {m.nom} — {m.quantite}
                              {m.unite ? ` ${m.unite}` : ''}
                            </li>
                          ))}
                        </ul>
                      )}
                      {!materielValidated && canEdit && (
                        <button
                          type="button"
                          onClick={() => openMaterielModal(step)}
                          className={
                            step.complete
                              ? 'text-[11px] text-slate-500 hover:text-primary underline'
                              : 'text-xs font-semibold px-3 py-1.5 rounded-full bg-primary text-white hover:opacity-90 inline-flex items-center gap-1'
                          }
                        >
                          {step.complete ? (
                            'Modifier'
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-sm">check</span>
                              Marquer terminé
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!materielValidated && canEdit && (
          <div className="flex flex-wrap justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={saving}
              className={`px-5 py-2 rounded-full font-semibold text-sm disabled:opacity-50 flex items-center gap-2 ${
                hasAnyMaterielDone
                  ? 'bg-primary text-white hover:opacity-90'
                  : 'bg-white border border-outline-variant/30 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-base">save</span>
              {saving ? 'Enregistrement...' : 'Sauvegarder les étapes'}
            </button>
            {draftAllChecked && (
              <button
                type="button"
                onClick={() => setShowValidateConfirm(true)}
                className="px-5 py-2 bg-green-600 text-white rounded-full font-semibold text-sm hover:opacity-90 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">task_alt</span>
                Valider le matériel
              </button>
            )}
          </div>
        )}
      </div>

      {/* Étape 2 — Observations : statut compact, la saisie se fait dans une fenêtre (pas de scroll) */}
      {canWriteObservations && (
        <div className="flex items-center gap-2 px-1">
          {!materielValidated ? (
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="material-symbols-outlined text-sm">lock</span>
              Les observations pourront être saisies une fois le matériel validé.
            </p>
          ) : (
            <button
              type="button"
              onClick={() => setShowObservationsModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-semibold hover:opacity-90 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">edit_note</span>
              {hasAnyObservations ? 'Modifier les observations' : 'Saisir les observations'}
            </button>
          )}
        </div>
      )}

      {/* Fenêtre de saisie du matériel d'une étape */}
      {materielModalStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-outline-variant/20">
              <h3 className="font-bold text-lg">
                {WORKFLOW_STEPS.find((s) => s.code === materielModalStep)?.label}
              </h3>
              <button
                type="button"
                onClick={closeMaterielModal}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Fermer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-5 space-y-2 overflow-y-auto">
              {materielModalRows.map((m, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Nom (ex: Cassette)"
                    value={m.nom}
                    onChange={(e) => updateModalMateriel(idx, { nom: e.target.value })}
                    className="flex-1 px-2 py-1.5 border border-outline-variant/30 rounded-md text-xs"
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="Qté"
                    value={m.quantite}
                    onChange={(e) => updateModalMateriel(idx, { quantite: Number(e.target.value) })}
                    className="w-16 px-2 py-1.5 border border-outline-variant/30 rounded-md text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Unité"
                    value={m.unite}
                    onChange={(e) => updateModalMateriel(idx, { unite: e.target.value })}
                    className="w-16 px-2 py-1.5 border border-outline-variant/30 rounded-md text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => removeModalMateriel(idx)}
                    className="text-slate-400 hover:text-red-600"
                    aria-label="Supprimer"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addModalMateriel}
                className="text-xs text-primary font-semibold hover:underline"
              >
                + Ajouter du matériel
              </button>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={closeMaterielModal}
                className="px-4 py-2 rounded-full border border-outline-variant/30 text-slate-600 text-sm font-semibold hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmMaterielModal}
                className="px-5 py-2 bg-primary text-white rounded-full font-semibold text-sm hover:opacity-90 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">check</span>
                Marquer terminé
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fenêtre de confirmation : valider le matériel verrouille définitivement la saisie */}
      {showValidateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-amber-500 text-2xl">warning</span>
              <h3 className="font-bold text-lg">Valider le matériel ?</h3>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Une fois validé, les étapes et le matériel de cet examen ne pourront plus être modifiés.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowValidateConfirm(false)}
                disabled={validating}
                className="px-4 py-2 rounded-full border border-outline-variant/30 text-slate-600 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
              >
                Modifier
              </button>
              <button
                type="button"
                onClick={handleConfirmValidateMateriel}
                disabled={validating}
                className="px-4 py-2 rounded-full bg-green-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {validating ? 'Validation...' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fenêtre de saisie des observations — s'ouvre automatiquement après validation du matériel */}
      {showObservationsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-outline-variant/20">
              <h3 className="font-bold text-lg">Étape 2 — Observations</h3>
              <button
                type="button"
                onClick={() => setShowObservationsModal(false)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Fermer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto">
              {draft.map((step, i) => (
                <div key={step.code}>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                    {WORKFLOW_STEPS[i].label}
                  </p>
                  <textarea
                    value={step.observations ?? ''}
                    onChange={(e) => updateObservations(step.code, e.target.value)}
                    placeholder="Observations (ce que le pathologiste constate)..."
                    rows={2}
                    className="w-full px-2 py-1.5 border border-outline-variant/30 rounded-md text-xs"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setShowObservationsModal(false)}
                className="px-4 py-2 rounded-full border border-outline-variant/30 text-slate-600 text-sm font-semibold hover:bg-slate-50"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={handleSaveObservations}
                disabled={savingObservations}
                className="px-5 py-2 bg-primary text-white rounded-full font-semibold text-sm hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">save</span>
                {savingObservations ? 'Enregistrement...' : 'Enregistrer les observations'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
