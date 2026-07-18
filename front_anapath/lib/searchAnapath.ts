import { statusLabels } from './statusLabels';

const TYPE_LABELS: Record<string, string> = {
  BIOPSIE: 'Biopsie',
  FCV_PAP: 'FCV / Pap test',
  CYT0PONCTION: 'Cytoponction',
  LIQUIDE: 'Liquide',
  EXTEMPORANE_STAT: 'Extemporané',
  POS: 'POS',
  POC: 'POC',
};

export interface AnapathSearchable {
  anapathId?: string;
  patientId?: string;
  typeExamen?: string;
  statut?: string;
  validatedByUserId?: string | null;
  createdAt?: string;
  prelevement?: { site?: string; description?: string } | null;
  resultat?: { conclusion?: string; details?: string } | null;
  patientInfo?: { nomComplet?: string | null; nom?: string | null; prenom?: string | null } | null;
}

function collectSearchableText(req: AnapathSearchable): string {
  const parts = [
    req.anapathId,
    req.patientId,
    req.typeExamen,
    TYPE_LABELS[req.typeExamen ?? ''],
    req.statut,
    statusLabels[req.statut ?? ''],
    req.validatedByUserId,
    req.prelevement?.site,
    req.prelevement?.description,
    req.resultat?.conclusion,
    req.resultat?.details,
    req.patientInfo?.nomComplet,
    req.patientInfo?.nom,
    req.patientInfo?.prenom,
  ];
  return parts.filter(Boolean).join(' ').toLowerCase();
}

export function matchesAnapathSearch(req: AnapathSearchable, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return collectSearchableText(req).includes(q);
}

export function filterAndSortAnapathRequests<T extends AnapathSearchable>(
  requests: T[],
  query: string,
): T[] {
  const filtered = query.trim()
    ? requests.filter((req) => matchesAnapathSearch(req, query))
    : [...requests];

  return filtered.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });
}
