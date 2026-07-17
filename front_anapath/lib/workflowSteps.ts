export type EtapeCode =
  | 'RECEPTION'
  | 'MACROSCOPIE'
  | 'INCLUSION'
  | 'COUPE'
  | 'COLORATION'
  | 'LECTURE';

export interface MaterielUtilise {
  nom: string;
  quantite: number;
  unite?: string;
}

export interface EtapeWorkflow {
  code: EtapeCode;
  complete: boolean;
  completedAt: string | null;
  completedByUserId: string | null;
  completedByNom: string | null;
  materiels: MaterielUtilise[];
  observations: string | null;
}

export const WORKFLOW_STEPS: { code: EtapeCode; label: string }[] = [
  { code: 'RECEPTION', label: 'Réception du prélèvement' },
  { code: 'MACROSCOPIE', label: 'Macroscopie' },
  { code: 'INCLUSION', label: 'Inclusion' },
  { code: 'COUPE', label: 'Coupe' },
  { code: 'COLORATION', label: 'Coloration' },
  { code: 'LECTURE', label: 'Lecture microscopique' },
];

/** Fusionne les étapes réellement enregistrées avec la liste fixe, pour toujours avoir les 6 dans l'ordre. */
export function mergeEtapes(etapes: EtapeWorkflow[] | null | undefined): EtapeWorkflow[] {
  return WORKFLOW_STEPS.map(({ code }) => {
    const found = etapes?.find((e) => e.code === code);
    return (
      found ?? {
        code,
        complete: false,
        completedAt: null,
        completedByUserId: null,
        completedByNom: null,
        materiels: [],
        observations: null,
      }
    );
  });
}

export function allEtapesComplete(etapes: EtapeWorkflow[] | null | undefined): boolean {
  return mergeEtapes(etapes).every((e) => e.complete);
}

/** Vrai si au moins une étape a déjà reçu une saisie (complète, matériel ou observation). */
export function hasWorkflowProgress(etapes: EtapeWorkflow[] | null | undefined): boolean {
  if (!etapes) return false;
  return etapes.some(
    (e) => e.complete || e.materiels.length > 0 || Boolean(e.observations?.trim()),
  );
}

/** Vrai si l'étape Observations a été renseignée (au moins une observation enregistrée). */
export function hasAnyObservations(etapes: EtapeWorkflow[] | null | undefined): boolean {
  if (!etapes) return false;
  return etapes.some((e) => Boolean(e.observations?.trim()));
}
