interface SearchableEtape {
  observations?: string | null;
  materiels?: { nom: string }[];
}

export interface AnapathSearchable {
  anapathId?: string;
  patientId?: string;
  typeExamen?: string;
  statut?: string;
  validatedByUserId?: string | null;
  createdAt?: string;
  prelevement?: { site?: string; description?: string } | null;
  resultat?: { conclusion?: string; details?: string } | null;
  etapes?: SearchableEtape[] | null;
}

function collectSearchableText(req: AnapathSearchable): string {
  const parts = [
    req.anapathId,
    req.patientId,
    req.typeExamen,
    req.statut,
    req.validatedByUserId,
    req.prelevement?.site,
    req.prelevement?.description,
    req.resultat?.conclusion,
    req.resultat?.details,
    // Les observations dictées par le pathologiste et le matériel saisi par étape
    // doivent être trouvables depuis la recherche, au même titre que les autres champs.
    ...(req.etapes ?? []).flatMap((e) => [e.observations, ...(e.materiels ?? []).map((m) => m.nom)]),
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
