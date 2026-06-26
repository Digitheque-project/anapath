'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Tableau de bord", href: "/dashboard", icon: "dashboard" },
  { name: "Fil de travail", href: "/worklist", icon: "clinical_notes" },
  { name: "Validation", href: "/validation", icon: "fact_check" },
  { name: "Archives", href: "/archives", icon: "inventory_2" },
  { name: "Rapports", href: "/reports", icon: "analytics" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="h-screen w-64 flex flex-col fixed left-0 top-0 bg-slate-50 py-6 z-40">
      <div className="px-6 mb-8">
        <h1 className="text-xl font-bold tracking-tight text-blue-900">Service d&apos;Anatomie Pathologique</h1>
      </div>

      <nav className="flex-1 space-y-1 px-4">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              pathname === item.href
                ? "text-blue-700 font-semibold border-r-4 border-blue-600 bg-blue-50/50"
                : "text-slate-500 hover:text-blue-600 hover:bg-blue-50"
            }`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="text-sm font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}