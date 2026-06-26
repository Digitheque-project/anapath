'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import axios from 'axios';
import { formatDateLong, formatDateTime, formatDate } from '@/lib/dateFormat';
import { getServiceDisplayName } from '@/lib/serviceDisplay';
import { statusLabels, statusColors } from '@/lib/statusLabels';

declare global {
  interface Window {
    html2pdf: any;
  }
}

interface AnapathRequest {
  id: string;
  anapathId: string;
  patientId: string;
  typeExamen: string;
  statut: string;
  isExtemporane: boolean;
  prelevement: {
    site: string;
    description: string;
    clinicalData?: {
      treatmentType?: string;
      suspicion?: string;
      clinicalNotes?: string;
    };
  };
  resultat: {
    conclusion: string;
    details: string;
  } | null;
  validatedByUserId: string | null;
  validatedAt: string | null;
  signedHash: string | null;
  createdAt: string;
  episodeId?: string | null;
}

export default function ArchiveDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [request, setRequest] = useState<AnapathRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const patientInfo = {
    fullName: 'RANDRIANTOANDRO N.',
    sex: 'Féminin',
    age: 34,
    sampleDate: request ? formatDateLong(request.createdAt) : '',
    site: request?.prelevement?.site || '',
    requestingService: request
      ? getServiceDisplayName({ episodeId: request.episodeId })
      : 'Service inconnu',
  };

  const personnel = {
    chefService: 'P. ANDRIAMAMPIONONA T. Francine',
    chefTravaux: 'Dr LAZA Odilon',
    specialiste: 'Dr RAZAFIMAHEFA Joëlle',
    interneQualifiant: '',
    histotechniciens: ['MILIARISOA Pergaudine', 'RAVONINTSALAMA Sarindra'],
    secretaire: 'RAHERIMAMINIAINA Narison',
    appui: 'RASOARIVONJY Nadia',
  };

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/anapath/${id}`);
      setRequest(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      BIOPSIE: 'Biopsie',
      FCV_PAP: 'FCV / Pap test',
      CYT0PONCTION: 'Cytoponction',
      LIQUIDE: 'Liquide',
      EXTEMPORANE_STAT: 'Extemporané',
      POS: 'POS',
      POC: 'POC',
    };
    return labels[type] || type;
  };

  // ============================================================
  // EXPORT PDF (identique à Validation)
  // ============================================================
  const exportPDF = () => {
    if (!request) {
      alert('Aucune donnée à exporter.');
      return;
    }

    if (typeof window.html2pdf === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      document.head.appendChild(script);
      script.onload = () => {
        generatePDF();
      };
      script.onerror = () => alert('Erreur de chargement de la bibliothèque PDF.');
    } else {
      generatePDF();
    }
  };

  const generatePDF = () => {
    if (!request) return;

    const content = document.createElement('div');
    content.id = 'pdf-content';
    content.style.padding = '10px';
    content.style.fontFamily = 'Arial, sans-serif';
    content.style.fontSize = '12px';
    content.style.color = '#000';
    content.style.width = '100%';
    content.style.boxSizing = 'border-box';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.borderBottom = '2px solid #00478d';
    header.style.paddingBottom = '10px';
    header.style.marginBottom = '20px';

    const leftLogo = document.createElement('div');
    leftLogo.innerHTML = `
      <svg width="70" height="70" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="#00478d" rx="10"/>
        <text x="50" y="55" text-anchor="middle" fill="white" font-size="12" font-weight="bold">CHUA</text>
        <text x="50" y="70" text-anchor="middle" fill="white" font-size="8">Fianarantsoa</text>
      </svg>
    `;
    leftLogo.style.width = '70px';
    leftLogo.style.height = '70px';

    const centerText = document.createElement('div');
    centerText.style.textAlign = 'center';
    centerText.innerHTML = `
      <div style="font-weight:bold; font-size:14px;">REPUBLIKAN'I MADAGASIKARA</div>
      <div style="font-size:11px; margin-top:2px;">Fitiavana-Tanindrazana-Fandrosoana</div>
      <div style="font-size:10px; margin-top:4px;">MINISTÈRE DE LA SANTÉ PUBLIQUE</div>
      <div style="font-size:10px;">CHU ANDRAINJATO - FIANARANTSOA</div>
    `;

    const rightLogo = document.createElement('div');
    rightLogo.innerHTML = `
      <svg width="70" height="70" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="#c20000" rx="10"/>
        <text x="50" y="55" text-anchor="middle" fill="white" font-size="12" font-weight="bold">ANAPATH</text>
        <text x="50" y="70" text-anchor="middle" fill="white" font-size="8">Laboratoire</text>
      </svg>
    `;
    rightLogo.style.width = '70px';
    rightLogo.style.height = '70px';

    header.appendChild(leftLogo);
    header.appendChild(centerText);
    header.appendChild(rightLogo);

    const body = document.createElement('div');
    body.style.display = 'flex';
    body.style.gap = '20px';
    body.style.marginTop = '10px';

    const leftCol = document.createElement('div');
    leftCol.style.flex = '1';
    leftCol.style.borderRight = '1px solid #ccc';
    leftCol.style.paddingRight = '15px';
    leftCol.innerHTML = `
      <h3 style="color:#00478d; font-size:13px; margin-top:0;">PERSONNEL DU SERVICE</h3>
      <p><strong>Chef de service :</strong> ${personnel.chefService}</p>
      <p><strong>Chef de travaux :</strong> ${personnel.chefTravaux}</p>
      <p><strong>Spécialiste :</strong> ${personnel.specialiste}</p>
      <p><strong>Interne qualifiant :</strong><br/>${personnel.interneQualifiant || '_________________'}</p>
      <p><strong>Histotechniciens :</strong><br/>
        ${personnel.histotechniciens.map(n => '&nbsp;&nbsp;• ' + n).join('<br/>')}
      </p>
      <p><strong>Secrétaire :</strong> ${personnel.secretaire}</p>
      <p><strong>Personnel d'appui :</strong> ${personnel.appui}</p>
    `;

    const rightCol = document.createElement('div');
    rightCol.style.flex = '2';
    const clinicalData = request.prelevement?.clinicalData || {};
    rightCol.innerHTML = `
      <h3 style="color:#00478d; font-size:13px; margin-top:0;">COMPTE RENDU D'EXAMEN</h3>
      <p><strong>IPP :</strong> ${request.anapathId}</p>
      <p><strong>Patient :</strong> ${patientInfo.fullName} (${patientInfo.age} ans, ${patientInfo.sex})</p>
      <p><strong>Patient ID :</strong> ${request.patientId}</p>
      <p><strong>Type d'examen :</strong> ${getTypeLabel(request.typeExamen)}</p>
      <p><strong>Date prélèvement :</strong> ${patientInfo.sampleDate}</p>
      <p><strong>Site de prélèvement :</strong> ${request.prelevement?.site || '-'}</p>
      <p><strong>Service demandeur :</strong> ${patientInfo.requestingService}</p>
      <p><strong>Type de traitement :</strong> ${clinicalData.treatmentType || '_________________'}</p>
      <p><strong>Suspicion diagnostique :</strong> ${clinicalData.suspicion || '_________________'}</p>
      <p><strong>Renseignements cliniques :</strong> ${clinicalData.clinicalNotes || '_________________'}</p>
      <hr/>
      <p><strong>RÉSULTAT :</strong><br/>${request.resultat?.details || '_________________'}</p>
      <p><strong>CONCLUSION :</strong><br/>${request.resultat?.conclusion || '_________________'}</p>
      <hr/>
      <p><strong>Validé par :</strong> ${request.validatedByUserId || '_________________'}</p>
      <p><strong>Date validation :</strong> ${request.validatedAt ? formatDate(request.validatedAt) : '_________________'}</p>
      <p><strong>Hash signature :</strong> ${request.signedHash?.substring(0, 20) || '_________________'}</p>
      <p style="margin-top:20px;"><strong>Fait à Fianarantsoa, le ${formatDateLong(new Date())}</strong></p>
    `;

    body.appendChild(leftCol);
    body.appendChild(rightCol);
    content.appendChild(header);
    content.appendChild(body);

    const footer = document.createElement('div');
    footer.style.textAlign = 'center';
    footer.style.marginTop = '30px';
    footer.style.fontSize = '10px';
    footer.style.color = '#666';
    footer.textContent = 'Document généré par le système Anapath - CHU Andrainjato';
    content.appendChild(footer);

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Rapport_Anapath_${request.anapathId}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, letterRendering: true, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    window.html2pdf().set(opt).from(content).save();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#f9f9ff]">
        <Sidebar />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </main>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex min-h-screen bg-[#f9f9ff]">
        <Sidebar />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <p className="text-slate-500">Résultat non trouvé</p>
        </main>
      </div>
    );
  }

  const clinicalData = request.prelevement?.clinicalData || {};

  return (
    <div className="flex min-h-screen bg-[#f9f9ff] text-[#191c21]">
      <div className="fixed inset-0 grain-overlay z-[60] pointer-events-none"></div>
      <Sidebar />

      <main className="flex-1 ml-64 min-h-screen flex flex-col w-[calc(100%-256px)]">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl flex justify-between items-center px-6 py-3 shadow-sm">
          <div className="flex items-center gap-4">
            <Link href="/archives" className="flex items-center gap-2 text-primary text-sm hover:underline">
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Retour aux archives
            </Link>
            <h2 className="text-lg font-black text-blue-900">Résultat d'examen</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[request.statut] || 'bg-gray-100 text-gray-700'}`}>
              {statusLabels[request.statut] || request.statut}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#00478d]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#00478d] text-sm">person</span>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 w-full max-w-5xl mx-auto">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/20 mb-6">
            <h4 className="font-bold text-primary mb-3">👤 Identité Patient</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div><label className="text-xs text-slate-400">Nom complet</label><p className="font-bold">{patientInfo.fullName}</p></div>
              <div><label className="text-xs text-slate-400">Patient ID</label><p className="font-medium">{request.patientId}</p></div>
              <div><label className="text-xs text-slate-400">Âge / Sexe</label><p className="font-medium">{patientInfo.age} ans / {patientInfo.sex}</p></div>
              <div><label className="text-xs text-slate-400">Type d'examen</label><p className="font-medium">{getTypeLabel(request.typeExamen)}</p></div>
              <div><label className="text-xs text-slate-400">Date Prélèvement</label><p className="font-medium">{patientInfo.sampleDate}</p></div>
              <div><label className="text-xs text-slate-400">Site de prélèvement</label><p className="font-medium">{request.prelevement?.site || '-'}</p></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/20 mb-6">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-secondary">stethoscope</span>
              <div>
                <p className="text-xs text-slate-400">Service demandeur</p>
                <p className="font-medium">{patientInfo.requestingService}</p>
              </div>
            </div>
            <hr className="border-outline-variant my-3" />
            <div className="grid grid-cols-1 gap-3">
              <div>
                <p className="text-xs text-slate-400">Type de traitement</p>
                <p className="font-medium">{clinicalData.treatmentType || 'Non renseigné'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Suspicion diagnostique</p>
                <p className="font-medium italic">{clinicalData.suspicion || 'Non renseignée'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Renseignements cliniques</p>
                <p className="font-medium italic">{clinicalData.clinicalNotes || 'Non renseignés'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/20 mb-6">
            <h4 className="font-bold text-primary mb-3">🔬 Compte-rendu d'analyse</h4>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Description microscopique</label>
                <div className="w-full mt-1 p-3 bg-[#f2f3fb] border border-outline-variant/30 rounded-lg text-sm whitespace-pre-wrap">
                  {request.resultat?.details || 'Non renseigné'}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-tertiary uppercase">Conclusion diagnostique</label>
                <div className="w-full mt-1 p-3 bg-tertiary/5 border border-tertiary/20 rounded-lg text-sm font-semibold whitespace-pre-wrap">
                  {request.resultat?.conclusion || 'Non renseignée'}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-xl border border-green-200 mb-6">
            <h4 className="font-bold text-green-700 mb-3">✅ Demande validée</h4>
            <p className="text-sm">Validée par: {request.validatedByUserId}</p>
            <p className="text-sm">Le: {request.validatedAt ? formatDateTime(request.validatedAt) : '-'}</p>
            <p className="text-xs text-slate-500 mt-2">Hash: {request.signedHash?.substring(0, 20)}...</p>
          </div>

          <div className="flex justify-center mt-8">
            <button
              onClick={exportPDF}
              className="flex items-center gap-2 px-5 h-10 rounded-full bg-primary text-white font-bold uppercase tracking-wider shadow-sm hover:opacity-90 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
              Exporter PDF
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}