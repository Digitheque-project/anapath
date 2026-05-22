export default function FAB() {
  return (
    <button className="fixed bottom-8 right-8 h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary-container text-white shadow-xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 group z-[70]">
      <span className="material-symbols-outlined text-3xl">add</span>
      <span className="absolute right-16 bg-inverse-surface text-inverse-on-surface text-xs py-1 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        Nouveau Dossier
      </span>
    </button>
  );
}
