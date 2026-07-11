'use client';

import { useState, useEffect, useRef } from 'react';
import ThemeToggle from './ThemeToggle';
import { useAuth } from './AuthProvider';

export default function SettingsMenu() {
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
      >
        <span className="material-symbols-outlined">settings</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-[#1e1e1e] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <p className="px-3 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Thème</p>
            <ThemeToggle vertical />
          </div>
          
          <div className="p-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </div>
  );
}