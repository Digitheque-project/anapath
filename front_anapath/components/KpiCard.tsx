interface KpiCardProps {
  icon: string;
  label: string;
  value: string;
  valueSuffix?: string;
  badge?: string | null;
  badgeClass?: string;
  iconClass?: string;
  valueClass?: string;
}

export default function KpiCard({
  icon,
  label,
  value,
  valueSuffix,
  badge,
  badgeClass = "",
  iconClass = "",
  valueClass = "text-on-surface",
}: KpiCardProps) {
  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0_12px_32px_rgba(0,71,141,0.04)] border border-white flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <span className={`material-symbols-outlined p-2 rounded-lg ${iconClass}`}>
          {icon}
        </span>
        {badge && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${badgeClass}`}>
            {badge}
          </span>
        )}
      </div>
      <div>
        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
          {label}
        </p>
        <h4 className={`text-4xl font-extrabold font-headline ${valueClass}`}>
          {value}
          {valueSuffix && (
            <span className="text-lg font-bold">{valueSuffix}</span>
          )}
        </h4>
      </div>
    </div>
  );
}
