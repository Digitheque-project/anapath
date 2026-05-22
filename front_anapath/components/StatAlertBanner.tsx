export default function StatAlertBanner() {
  return (
    <div className="relative overflow-hidden bg-tertiary-container/10 border-l-4 border-tertiary p-4 rounded-xl flex items-center justify-between group">
      <div className="flex items-center gap-4">
        {/* Ping animation */}
        <div className="relative flex h-3 w-3 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-error" />
        </div>
        <div>
          <h3 className="font-bold text-tertiary text-sm">
            ALERTE STAT : 3 Examens Prioritaires
          </h3>
          <p className="text-on-surface-variant text-xs">
            Veuillez traiter ces dossiers immédiatement pour respecter le délai clinique.
          </p>
        </div>
      </div>
      <button className="text-xs font-bold text-tertiary hover:underline px-4 py-2 shrink-0">
        Consulter la liste
      </button>
    </div>
  );
}
