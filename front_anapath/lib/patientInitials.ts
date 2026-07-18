/**
 * Initiales à afficher pour un patient : nom+prénom donnent chacun une lettre
 * (ex: "Rakoto" + "Jean" -> "RJ") ; sans prénom, les 3 premières lettres du
 * nom sont utilisées (ex: "Randrianaivo" -> "RAN").
 */
export function getPatientInitials(nom?: string | null, prenom?: string | null): string {
  const n = (nom ?? '').trim();
  const p = (prenom ?? '').trim();
  if (n && p) return (n[0] + p[0]).toUpperCase();
  if (n) return n.slice(0, 3).toUpperCase();
  if (p) return p.slice(0, 3).toUpperCase();
  return '?';
}
