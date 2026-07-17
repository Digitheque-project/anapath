'use client';

import { useEffect, useRef, useState } from 'react';

interface FilterButtonProps {
  active?: boolean;
  children: React.ReactNode;
}

/** Bouton "Filtrer" générique : ouvre un panneau de filtres au clic, se ferme au clic extérieur. */
export default function FilterButton({ active, children }: FilterButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Filtrer"
        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
          active
            ? 'bg-primary text-white border-primary'
            : 'bg-white text-slate-600 border-outline-variant/20 hover:bg-slate-50'
        }`}
      >
        <span className="material-symbols-outlined text-base">filter_alt</span>
        Filtrer
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-outline-variant/20 p-4 z-30">
          {children}
        </div>
      )}
    </div>
  );
}
