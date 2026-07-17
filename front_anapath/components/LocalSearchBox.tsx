'use client';

interface LocalSearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function LocalSearchBox({ value, onChange, placeholder }: LocalSearchBoxProps) {
  return (
    <div className="relative w-full max-w-xs" title="Rechercher dans cette page">
      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
        search
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Rechercher dans cette page...'}
        title="Rechercher dans cette page"
        className="pl-9 pr-4 py-2 bg-white rounded-lg border border-outline-variant/20 focus:ring-2 focus:ring-primary/20 w-full text-sm transition-all"
      />
    </div>
  );
}
