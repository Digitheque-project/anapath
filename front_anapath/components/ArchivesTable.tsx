'use client';

const archivesData = [
  {
    date: "12 octobre 2023",
    id: "#2023-AP-8842",
    patient: "DUPONT Jean-Marc",
    birthDate: "04/05/1972",
    diagnosis: "Carcinome épidermoïde bien différencié...",
    cim10: "C44.9",
    status: "Validé",
  },
  {
    date: "11 octobre 2023",
    id: "#2023-AP-8841",
    patient: "LEFEBVRE Sophie",
    birthDate: "12/09/1985",
    diagnosis: "FCV : Absence de cellule suspecte de malignité.",
    cim10: "Z12.4",
    status: "Validé",
  },
  {
    date: "10 octobre 2023",
    id: "#2023-AP-8839",
    patient: "MARTIN Thomas",
    birthDate: "23/11/1960",
    diagnosis: "Biopsie prostatique : Adénocarcinome score Gleason 7 (3+4).",
    cim10: "C61",
    status: "Validé",
  },
  {
    date: "8 octobre 2023",
    id: "#2023-AP-8820",
    patient: "MOREAU Lucie",
    birthDate: "30/01/1992",
    diagnosis: "Lésion malpighienne intra-épithéliale de bas grade (LSIL).",
    cim10: "N87.0",
    status: "Validé",
  },
];

export default function ArchivesTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="text-[11px] font-bold text-on-surface-variant/60 uppercase tracking-[0.15em] bg-surface-container/30">
            <th className="px-6 py-4">Date d'archivage</th>
            <th className="px-6 py-4">ID PARA</th>
            <th className="px-6 py-4">Patient</th>
            <th className="px-6 py-4">Diagnostic (conclusion)</th>
            <th className="px-6 py-4 text-center">CIM-10</th>
            <th className="px-6 py-4">Statut</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/10 text-sm">
          {archivesData.map((row, idx) => (
            <tr key={idx} className="hover:bg-primary/5 transition-colors group">
              <td className="px-6 py-5 font-medium text-slate-500">{row.date}</td>
              <td className="px-6 py-5 font-mono text-primary font-bold">{row.id}</td>
              <td className="px-6 py-5">
                <div className="font-bold text-on-surface">{row.patient}</div>
                <div className="text-[10px] text-slate-400">Né le {row.birthDate}</div>
              </td>
              <td className="px-6 py-5 max-w-xs truncate">{row.diagnosis}</td>
              <td className="px-6 py-5 text-center">
                <span className="px-2 py-1 bg-surface-container-highest rounded-md font-mono text-xs">{row.cim10}</span>
              </td>
              <td className="px-6 py-5">
                <span className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  {row.status}
                </span>
              </td>
              <td className="px-6 py-5 text-right space-x-2">
                <button className="p-2 text-slate-400 hover:text-primary transition-all" title="Voir le compte rendu">
                  <span className="material-symbols-outlined">visibility</span>
                </button>
                <button className="p-2 text-slate-400 hover:text-primary transition-all" title="Imprimer le PDF">
                  <span className="material-symbols-outlined">picture_as_pdf</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}