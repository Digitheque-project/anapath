'use client';

import NotificationBell from './NotificationBell';
import SettingsMenu from './SettingsMenu';
import { useSearch } from './SearchContext';

export default function TopBar() {
  const { searchQuery, setSearchQuery } = useSearch();

  return (
    <header className="w-full sticky top-0 z-50 bg-white/80 backdrop-blur-xl flex justify-between items-center px-6 py-3 shadow-sm shadow-blue-900/5">
      <div className="flex items-center gap-4 flex-1">
        <h2 className="text-lg font-black text-blue-900 tracking-tight whitespace-nowrap">Anapath System</h2>
        
        <div className="h-6 w-[1px] bg-outline-variant/30"></div>
        
        <div className="relative group flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white rounded-full border border-slate-200 focus:ring-2 focus:ring-primary/20 w-full text-sm transition-all"
            placeholder="Rechercher un patient, un ID, un type..."
          />
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <NotificationBell />
        
        <div className="flex items-center gap-2 pl-2">
          <div className="text-right">
            <p className="text-sm font-bold text-[#191c21]">Dr. Aris Thorne</p>
            <p className="text-[10px] text-slate-500">Pathologiste senior</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#00478d]/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#00478d] text-sm">person</span>
          </div>
        </div>
        
        <SettingsMenu />
      </div>
    </header>
  );
}