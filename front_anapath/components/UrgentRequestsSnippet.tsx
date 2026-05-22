import { urgentSnippetData } from "@/lib/mockData";

export default function UrgentRequestsSnippet() {
  return (
    <div className="bg-surface-container-low rounded-xl p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold font-headline text-on-surface">
          Urgent Requests
        </h3>
        <span className="material-symbols-outlined text-slate-400">more_vert</span>
      </div>

      {/* List */}
      <div className="space-y-4">
        {urgentSnippetData.map((item) => (
          <div
            key={item.id}
            className={`bg-surface-container-lowest p-3 rounded-lg flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer ${
              item.urgence === "semi" ? "opacity-80" : ""
            }`}
          >
            {/* Icon */}
            {item.urgence === "critique" ? (
              <div className="bg-tertiary-fixed text-tertiary p-2 rounded flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-base">warning</span>
              </div>
            ) : (
              <div className="bg-secondary-container/20 text-secondary p-2 rounded flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-base">priority_high</span>
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-on-surface">{item.nom}</p>
              <p className="text-[10px] text-on-surface-variant uppercase">{item.type}</p>
            </div>

            {/* Time */}
            {item.urgence === "critique" ? (
              <span className="text-[10px] font-bold text-tertiary bg-tertiary-container/10 px-2 py-1 rounded shrink-0">
                {item.temps}
              </span>
            ) : (
              <span className="text-[10px] font-bold text-on-surface-variant px-2 py-1 rounded shrink-0">
                {item.temps}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
