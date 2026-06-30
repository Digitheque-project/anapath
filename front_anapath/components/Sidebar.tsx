'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: 'dashboard' },
  { name: 'Fil de travail', href: '/worklist', icon: 'clinical_notes' },
  { name: 'Validation', href: '/validation', icon: 'fact_check' },
  { name: 'Archives', href: '/archives', icon: 'inventory_2' },
  { name: 'Rapports', href: '/reports', icon: 'analytics' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    if (confirm('Voulez-vous vous déconnecter ?')) {
      router.push('/');
    }
  };

  return (
    <aside
      className="w-64 h-screen fixed left-0 top-0 flex flex-col text-white z-40"
      style={{
        backgroundImage: `linear-gradient(
          to bottom,
          rgba(0,40,80,0.85),
          rgba(0,30,60,0.92)
        ), url('/assets/bg-sidebar.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="flex flex-col items-center px-4 pt-6 pb-4">
        <img
          src="/assets/logo-chu.png"
          alt="Logo CHU Andrainjato"
          className="w-20 h-20 object-contain drop-shadow-lg mb-3"
        />
        <h1 className="text-lg font-bold text-white text-center leading-tight drop-shadow-sm">
          Service d&apos;Anatomie Pathologique
        </h1>
      </div>

      <nav className="flex-1 space-y-1 px-4">
        {navigation.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                active
                  ? 'text-white font-semibold border-r-4 border-white/80 bg-white/15'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-4 py-4 border-t border-white/20">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5
            rounded-lg text-white/90 hover:bg-white/10
            hover:text-white transition-colors text-sm font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor"
            viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3
                 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0
                 013 3v1"/>
          </svg>
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
