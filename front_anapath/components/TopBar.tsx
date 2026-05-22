'use client';

export default function TopBar() {
  return (
    <header className="w-full sticky top-0 z-50 bg-slate-50/80 backdrop-blur-xl flex justify-between items-center px-8 py-4 shadow-sm">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-headline font-bold bg-gradient-to-br from-blue-800 to-blue-600 bg-clip-text text-transparent">
          Archives centralisées
        </h2>
        <div className="h-6 w-[1px] bg-outline-variant/30"></div>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input
            className="pl-10 pr-4 py-2 bg-white rounded-full border border-slate-200 focus:ring-2 focus:ring-primary/20 w-80 text-sm transition-all"
            placeholder="Rechercher par nom, ID PARA ou code CIM-10..."
            type="text"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500">
          <span className="material-symbols-outlined">settings</span>
        </button>
        <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-primary/10 bg-primary/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary">person</span>
        </div>
      </div>
    </header>
  );
}