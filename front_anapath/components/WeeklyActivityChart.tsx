import { weeklyData } from "@/lib/mockData";

export default function WeeklyActivityChart() {
  return (
    <div className="lg:col-span-2 bg-surface-container rounded-xl p-8 relative overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h3 className="text-xl font-bold font-headline text-on-surface">
            Activité Hebdomadaire
          </h3>
          <p className="text-on-surface-variant text-sm">
            Volume de demandes reçues
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <span className="w-3 h-3 rounded-full bg-primary inline-block" />
          <span className="text-xs font-bold text-on-surface-variant uppercase">
            Standard
          </span>
        </div>
      </div>

      {/* Bars */}
      <div className="flex items-end justify-between h-48 gap-4 px-2">
        {weeklyData.map((item) => (
          <div key={item.day} className="flex flex-col items-center flex-1 gap-4">
            <div
              className={`w-full rounded-t-lg relative group transition-all duration-300 ${
                item.highlighted
                  ? "bg-primary"
                  : "bg-primary-container/40 hover:bg-primary"
              }`}
              style={{ height: `${item.heightPercent}%` }}
            >
              <span
                className={`absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-bold text-primary transition-opacity ${
                  item.highlighted
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100"
                }`}
              >
                {item.value}
              </span>
            </div>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-tighter">
              {item.day}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
