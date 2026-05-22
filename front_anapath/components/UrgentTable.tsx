import { urgentTableData } from "@/lib/mockData";

const statutBadge: Record<string, string> = {
  stat: "bg-tertiary-fixed text-tertiary",
  secondary: "bg-secondary-container text-secondary",
  primary: "bg-primary-container/20 text-primary",
};

const statutDot: Record<string, string> = {
  stat: "bg-tertiary",
  secondary: "bg-secondary",
  primary: "bg-primary",
};

export default function UrgentTable() {
  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-[0_12px_48px_rgba(0,0,0,0.03)] overflow-hidden border border-slate-50">
      {/* Header */}
      <div className="p-6 flex justify-between items-center border-b border-surface-container">
        <h3 className="text-xl font-bold font-headline text-on-surface">
          Dernières requêtes urgentes
        </h3>
        <button className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
          Tout voir
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-surface-container-low">
            <tr>
              {["ID Dossier", "Patient", "Type d'Examen", "Statut", "Temps écoulé", ""].map(
                (col, i) => (
                  <th
                    key={i}
                    className="px-6 py-4 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest"
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container">
            {urgentTableData.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-surface-container/50 transition-colors"
              >
                {/* ID */}
                <td className="px-6 py-4 text-sm font-bold text-primary">
                  {row.id}
                </td>

                {/* Patient */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold shrink-0">
                      {row.initiales}
                    </div>
                    <span className="text-sm font-bold text-on-surface">
                      {row.patient}
                    </span>
                  </div>
                </td>

                {/* Examen */}
                <td className="px-6 py-4 text-sm text-on-surface-variant">
                  {row.examen}
                </td>

                {/* Statut */}
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
                      statutBadge[row.statutType]
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${statutDot[row.statutType]}`}
                    />
                    {row.statut}
                  </span>
                </td>

                {/* Temps */}
                <td className="px-6 py-4 text-sm text-on-surface-variant">
                  {row.temps}
                </td>

                {/* Action */}
                <td className="px-6 py-4 text-right">
                  <button className="p-2 hover:bg-surface-container rounded-lg transition-colors">
                    <span className="material-symbols-outlined text-slate-400">
                      chevron_right
                    </span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
