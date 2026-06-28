import { formatDate, formatDateTime, formatDateLong } from './dateFormat';

/* eslint-disable @typescript-eslint/no-explicit-any */

const HTML2PDF_CDN =
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';

let html2pdfLoadPromise: Promise<any> | null = null;

export function loadHtml2Pdf(): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('html2pdf ne peut être chargé que côté client'));
  }
  if ((window as any).html2pdf) {
    return Promise.resolve((window as any).html2pdf);
  }
  if (!html2pdfLoadPromise) {
    html2pdfLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = HTML2PDF_CDN;
      script.async = true;
      script.onload = () => resolve((window as any).html2pdf);
      script.onerror = () => reject(new Error('Erreur de chargement de html2pdf.js'));
      document.head.appendChild(script);
    });
  }
  return html2pdfLoadPromise;
}

function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function extractValue(description: string | undefined, key: string): string {
  if (!description) return '-';
  const regex = new RegExp(`${key}:\\s*([^,]+)`, 'i');
  const match = description.match(regex);
  return match ? match[1].trim() : '-';
}

export function getTypeLabel(type: string): string {
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
}

export const DEFAULT_PERSONNEL = {
  chefService: 'P. ANDRIAMAMPIONONA T. Francine',
  chefTravaux: 'Dr LAZA Odilon',
  specialiste: 'Dr RAZAFIMAHEFA Joëlle',
  interneQualifiant: '',
  histotechniciens: ['MILIARISOA Pergaudine', 'RAVONINTSALAMA Sarindra'],
  secretaire: 'RAHERIMAMINIAINA Narison',
  appui: 'RASOARIVONJY Nadia',
};

export type ExamPdfPersonnel = typeof DEFAULT_PERSONNEL;

export interface ExamPdfData {
  anapathId: string;
  patientId: string;
  typeExamen: string;
  typeExamenLabel: string;
  createdAt: string;
  validatedAt?: string | null;
  patientFullName: string;
  patientAge: number | string;
  patientSex: string;
  patientDateNaissance?: string | null;
  patientCin?: string | null;
  patientTelephone?: string | null;
  patientAdresse?: string | null;
  sampleDate: string;
  prelevementSite?: string;
  prelevementDescription?: string;
  requestingService: string;
  chuName?: string;
  prescriber?: string;
  urgence?: string;
  clinicalData?: {
    treatmentType?: string;
    suspicion?: string;
    clinicalNotes?: string;
  };
  resultDetails: string;
  resultConclusion: string;
  signature?: string;
  ordreProfessionnelNumber?: string;
  validatedByUserId?: string | null;
  signedHash?: string | null;
  personnel?: ExamPdfPersonnel;
}

export interface ReportPdfRequestRow {
  anapathId: string;
  patientId: string;
  typeExamen: string;
  typeLabel: string;
  statut: string;
  statutLabel: string;
  prescriber: string;
  createdAt: string;
}

export interface ReportPdfData {
  period: 'month' | 'quarter' | 'year';
  periodLabel: string;
  stats: {
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    monthlyData: { month: string; count: number }[];
    topDiagnostics: { code: string; name: string; count: number }[];
    tatMoyen: number;
  };
  weekly: {
    weekLabel: string;
    total: number;
    validated: number;
    pending: number;
    avgDelay: number;
    dailyVolume: { day: string; count: number }[];
    requests: ReportPdfRequestRow[];
  };
  allRequests: ReportPdfRequestRow[];
  weeklyOnly?: boolean;
}

const EXAM_PDF_OPTIONS = {
  margin: 10,
  image: { type: 'jpeg', quality: 0.98 },
  html2canvas: { scale: 2, useCORS: true },
  jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
};

const REPORT_PDF_OPTIONS = {
  margin: 10,
  image: { type: 'jpeg', quality: 0.98 },
  html2canvas: { scale: 2, useCORS: true },
  jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
};

function personnelRole(label: string, value: string, emptyLines = 0): string {
  let html = `
    <div style="margin-bottom:14px;">
      <div style="font-style:italic;color:#555;font-size:11px;">${escapeHtml(label)}</div>`;
  if (emptyLines > 0) {
    html += '<div style="height:8px;"></div>'.repeat(emptyLines);
    if (!value) {
      html += '<div style="height:14px;border-bottom:1px dotted #ccc;margin-bottom:6px;"></div>'.repeat(
        emptyLines,
      );
    }
  }
  if (value) {
    html += `<div style="font-weight:bold;font-size:12px;color:#000;">${escapeHtml(value)}</div>`;
  }
  html += '</div>';
  return html;
}

function buildPersonnelColumnHtml(personnel: ExamPdfPersonnel): string {
  return `
    <div style="width:33%;border-right:1px solid #ccc;padding:8px;box-sizing:border-box;">
      <h2 style="text-align:center;font-size:13px;margin:0 0 4px;color:#00478d;">PERSONNEL DU SERVICE</h2>
      <p style="text-align:center;font-size:11px;color:#555;margin:0 0 16px;">Service d'Anatomie Pathologique</p>
      ${personnelRole('Chef de service', personnel.chefService)}
      ${personnelRole('Chef de travaux', personnel.chefTravaux)}
      ${personnelRole('Spécialiste', personnel.specialiste)}
      <div style="margin-bottom:14px;">
        <div style="font-style:italic;color:#555;font-size:11px;">Interne qualifiant</div>
        <div style="height:14px;border-bottom:1px dotted #ccc;margin:6px 0;"></div>
        <div style="height:14px;border-bottom:1px dotted #ccc;margin:6px 0;"></div>
        <div style="height:14px;border-bottom:1px dotted #ccc;margin:6px 0;"></div>
        ${personnel.interneQualifiant ? `<div style="font-weight:bold;font-size:12px;">${escapeHtml(personnel.interneQualifiant)}</div>` : ''}
      </div>
      <div style="margin-bottom:14px;">
        <div style="font-style:italic;color:#555;font-size:11px;">Histotechnicien(ne)s</div>
        ${personnel.histotechniciens.map((n) => `<div style="font-weight:bold;font-size:12px;color:#000;margin-top:4px;">${escapeHtml(n)}</div>`).join('')}
      </div>
      ${personnelRole('Secrétaire', personnel.secretaire)}
      ${personnelRole("Personnel d'appui", personnel.appui)}
    </div>`;
}

function buildClinicalDetailsHtml(
  typeExamen: string,
  description?: string,
  clinicalData?: ExamPdfData['clinicalData'],
): string {
  const parts: string[] = [];

  if (clinicalData?.treatmentType) {
    parts.push(`<p><strong>Type de traitement :</strong> ${escapeHtml(clinicalData.treatmentType)}</p>`);
  }
  if (clinicalData?.suspicion) {
    parts.push(`<p><strong>Suspicion diagnostique :</strong> ${escapeHtml(clinicalData.suspicion)}</p>`);
  }
  if (clinicalData?.clinicalNotes) {
    parts.push(`<p><strong>Notes cliniques :</strong> ${escapeHtml(clinicalData.clinicalNotes)}</p>`);
  }

  switch (typeExamen) {
    case 'FCV_PAP':
      parts.push(`<p><strong>État du col :</strong> ${escapeHtml(extractValue(description, 'État du col') || extractValue(description, 'etat_col'))}</p>`);
      parts.push(`<p><strong>GPA :</strong> ${escapeHtml(extractValue(description, 'GPA'))}</p>`);
      parts.push(`<p><strong>DDR :</strong> ${escapeHtml(extractValue(description, 'DDR'))}</p>`);
      break;
    case 'BIOPSIE':
    case 'POS':
    case 'POC':
      parts.push(`<p><strong>Organe :</strong> ${escapeHtml(extractValue(description, 'Organe'))}</p>`);
      parts.push(`<p><strong>Localisation :</strong> ${escapeHtml(extractValue(description, 'Localisation'))}</p>`);
      parts.push(`<p><strong>Nature :</strong> ${escapeHtml(extractValue(description, 'Nature'))}</p>`);
      parts.push(`<p><strong>Fixateur :</strong> ${escapeHtml(extractValue(description, 'Fixateur'))}</p>`);
      break;
    case 'CYT0PONCTION':
      parts.push(`<p><strong>Site :</strong> ${escapeHtml(extractValue(description, 'Site'))}</p>`);
      parts.push(`<p><strong>Nature :</strong> ${escapeHtml(extractValue(description, 'Nature'))}</p>`);
      break;
    case 'LIQUIDE':
      parts.push(`<p><strong>Type de liquide :</strong> ${escapeHtml(extractValue(description, 'Type'))}</p>`);
      parts.push(`<p><strong>Volume :</strong> ${escapeHtml(extractValue(description, 'Volume'))}</p>`);
      break;
    case 'EXTEMPORANE_STAT':
      parts.push(`<p><strong>Urgence chirurgicale :</strong> ${escapeHtml(extractValue(description, 'Urgence chirurgicale'))}</p>`);
      parts.push(`<p><strong>Organe :</strong> ${escapeHtml(extractValue(description, 'Organe'))}</p>`);
      break;
    default:
      if (description) {
        parts.push(`<p>${escapeHtml(description)}</p>`);
      }
  }

  if (parts.length === 0) {
    return '<p style="color:#666;">Non renseigné</p>';
  }
  return parts.join('');
}

function sectionTitle(title: string): string {
  return `<h4 style="color:#00478d;font-size:12px;margin:16px 0 8px;border-bottom:1px solid #00478d;padding-bottom:4px;">${escapeHtml(title)}</h4>`;
}

function buildExamReportHtml(data: ExamPdfData): string {
  const personnel = data.personnel ?? DEFAULT_PERSONNEL;
  const prescriber = data.prescriber || 'Non renseigné';
  const urgence = data.urgence || 'Normale';
  const validationDateTime = data.validatedAt ? formatDateTime(data.validatedAt) : '-';
  const signatureText = data.signature || data.validatedByUserId || '_________________';
  const ordreNumber = data.ordreProfessionnelNumber || data.validatedByUserId || '_________________';
  const hash = data.signedHash || '_________________';

  const rightColumn = `
    <div style="width:67%;padding:8px;box-sizing:border-box;">
      <div style="text-align:center;margin-bottom:16px;">
        <svg width="60" height="60" viewBox="0 0 100 100" style="margin:0 auto 8px;display:block;">
          <rect width="100" height="100" fill="#00478d" rx="10"/>
          <text x="50" y="55" text-anchor="middle" fill="white" font-size="11" font-weight="bold">CHUA</text>
        </svg>
        <div style="font-weight:bold;font-size:14px;color:#00478d;">SERVICE D'ANATOMIE PATHOLOGIQUE</div>
        <div style="font-size:12px;margin-top:4px;">CHU Andrainjato – Fianarantsoa</div>
        <div style="font-size:11px;margin-top:8px;"><strong>N° :</strong> ${escapeHtml(data.anapathId)}</div>
        <div style="font-size:10px;color:#555;margin-top:4px;">
          Créé le ${escapeHtml(formatDateTime(data.createdAt))}
          ${data.validatedAt ? ` | Validé le ${escapeHtml(validationDateTime)}` : ''}
        </div>
      </div>

      ${sectionTitle("1. IDENTITÉ DU PATIENT")}
      <table style="width:100%;font-size:11px;border-collapse:collapse;">
        <tr><td style="padding:3px 0;"><strong>Nom complet</strong></td><td>${escapeHtml(data.patientFullName)}</td></tr>
        <tr><td style="padding:3px 0;"><strong>ID Patient</strong></td><td>${escapeHtml(data.patientId)}</td></tr>
        <tr><td style="padding:3px 0;"><strong>Âge</strong></td><td>${escapeHtml(data.patientAge)}</td></tr>
        <tr><td style="padding:3px 0;"><strong>Sexe</strong></td><td>${escapeHtml(data.patientSex)}</td></tr>
        <tr><td style="padding:3px 0;"><strong>Date de naissance</strong></td><td>${escapeHtml(data.patientDateNaissance ? formatDate(data.patientDateNaissance) : '—')}</td></tr>
        <tr><td style="padding:3px 0;"><strong>CIN</strong></td><td>${escapeHtml(data.patientCin ?? '—')}</td></tr>
        <tr><td style="padding:3px 0;"><strong>Téléphone</strong></td><td>${escapeHtml(data.patientTelephone ?? '—')}</td></tr>
        <tr><td style="padding:3px 0;"><strong>Adresse</strong></td><td>${escapeHtml(data.patientAdresse ?? '—')}</td></tr>
      </table>

      ${sectionTitle('2. PRESCRIPTION')}
      <table style="width:100%;font-size:11px;border-collapse:collapse;">
        <tr><td style="padding:3px 0;"><strong>Prescripteur</strong></td><td>${escapeHtml(prescriber)}</td></tr>
        <tr><td style="padding:3px 0;"><strong>Service demandeur</strong></td><td>${escapeHtml(data.requestingService)}</td></tr>
        <tr><td style="padding:3px 0;"><strong>CHU</strong></td><td>${escapeHtml(data.chuName || 'N/A')}</td></tr>
        <tr><td style="padding:3px 0;"><strong>Urgence</strong></td><td>${escapeHtml(urgence)}</td></tr>
      </table>

      ${sectionTitle('3. PRÉLÈVEMENT')}
      <table style="width:100%;font-size:11px;border-collapse:collapse;">
        <tr><td style="padding:3px 0;"><strong>Type d'examen</strong></td><td>${escapeHtml(data.typeExamenLabel)}</td></tr>
        <tr><td style="padding:3px 0;"><strong>Site</strong></td><td>${escapeHtml(data.prelevementSite || '-')}</td></tr>
        <tr><td style="padding:3px 0;"><strong>Date de réception</strong></td><td>${escapeHtml(data.sampleDate)}</td></tr>
      </table>

      ${sectionTitle('4. RENSEIGNEMENTS CLINIQUES')}
      <div style="font-size:11px;line-height:1.5;">
        ${buildClinicalDetailsHtml(data.typeExamen, data.prelevementDescription, data.clinicalData)}
      </div>

      ${sectionTitle('5. RÉSULTAT')}
      <div style="font-size:11px;line-height:1.6;min-height:60px;border:1px solid #e5e7eb;padding:8px;border-radius:4px;white-space:pre-wrap;">
        ${escapeHtml(data.resultDetails || '_________________')}
      </div>

      ${sectionTitle('6. CONCLUSION')}
      <div style="font-size:11px;line-height:1.6;min-height:40px;border:1px solid #e5e7eb;padding:8px;border-radius:4px;white-space:pre-wrap;">
        ${escapeHtml(data.resultConclusion || '_________________')}
      </div>

      ${sectionTitle('7. VALIDATION')}
      <table style="width:100%;font-size:11px;border-collapse:collapse;">
        <tr><td style="padding:3px 0;"><strong>Signé par</strong></td><td>${escapeHtml(signatureText)}</td></tr>
        <tr><td style="padding:3px 0;"><strong>N° d'ordre</strong></td><td>${escapeHtml(ordreNumber)}</td></tr>
        <tr><td style="padding:3px 0;"><strong>Hash SHA-256</strong></td><td style="word-break:break-all;font-family:monospace;font-size:9px;">${escapeHtml(hash)}</td></tr>
        <tr><td style="padding:3px 0;"><strong>Date et heure</strong></td><td>${escapeHtml(validationDateTime)}</td></tr>
      </table>
    </div>`;

  return `
    <div style="width:794px;font-family:Arial,sans-serif;font-size:12px;color:#000;box-sizing:border-box;">
      <div style="display:flex;flex-direction:row;min-height:1050px;">
        ${buildPersonnelColumnHtml(personnel)}
        ${rightColumn}
      </div>
    </div>`;
}

const DAY_FULL_NAMES: Record<string, string> = {
  Lun: 'Lundi',
  Mar: 'Mardi',
  Mer: 'Mercredi',
  Jeu: 'Jeudi',
  Ven: 'Vendredi',
  Sam: 'Samedi',
  Dim: 'Dimanche',
};

function tableHtml(headers: string[], rows: string[][], striped = false): string {
  const head = headers.map((h) => `<th style="padding:6px 8px;text-align:left;background:#00478d;color:#fff;font-size:10px;">${escapeHtml(h)}</th>`).join('');
  const body = rows
    .map(
      (row, i) =>
        `<tr style="background:${striped && i % 2 ? '#f8fafc' : '#fff'};">${row
          .map((cell) => `<td style="padding:5px 8px;font-size:10px;border-bottom:1px solid #e5e7eb;">${escapeHtml(cell)}</td>`)
          .join('')}</tr>`,
    )
    .join('');
  return `<table style="width:100%;border-collapse:collapse;margin:8px 0;">${head ? `<thead><tr>${head}</tr></thead>` : ''}<tbody>${body}</tbody></table>`;
}

function reportSection(title: string, content: string, pageBreak = false): string {
  return `
    <div style="${pageBreak ? 'page-break-before:always;' : ''}padding:8px 0;">
      <h3 style="color:#00478d;font-size:13px;margin:0 0 10px;border-bottom:2px solid #00478d;padding-bottom:4px;">${escapeHtml(title)}</h3>
      ${content}
    </div>`;
}

function buildReportHtml(data: ReportPdfData): string {
  const { stats, weekly, allRequests, periodLabel, weeklyOnly } = data;
  const generatedAt = formatDateTime(new Date());
  const filenameDate = formatDate(new Date()).replace(/\//g, '-');

  if (weeklyOnly) {
    return `
      <div style="width:794px;font-family:Arial,sans-serif;color:#000;padding:8px;">
        <div style="text-align:center;margin-bottom:20px;">
          <div style="font-weight:bold;font-size:16px;color:#00478d;">SERVICE D'ANATOMIE PATHOLOGIQUE – CHU Andrainjato</div>
          <div style="font-size:14px;margin-top:6px;">RAPPORT HEBDOMADAIRE</div>
          <div style="font-size:11px;color:#555;margin-top:6px;">Semaine du ${escapeHtml(weekly.weekLabel)}</div>
        </div>
        ${reportSection('KPIs hebdomadaires', tableHtml(['Total', 'Validés', 'En attente', 'Délai moyen'], [[`${weekly.total}`, `${weekly.validated}`, `${weekly.pending}`, `${weekly.avgDelay.toFixed(1)} j`]]))}
        ${reportSection('Volume par jour', tableHtml(['Jour', "Nombre d'examens"], weekly.dailyVolume.map((d) => [DAY_FULL_NAMES[d.day] || d.day, `${d.count}`])))}
        ${reportSection('Examens de la semaine', tableHtml(['ID PARA', 'Patient', 'Type', 'Statut', 'Prescripteur', 'Date'], weekly.requests.map((r) => [r.anapathId, r.patientId, r.typeLabel, r.statutLabel, r.prescriber, formatDate(r.createdAt)])))}
        <div style="margin-top:24px;font-size:9px;color:#666;text-align:center;">
          Document généré le ${escapeHtml(generatedAt)}<br/>
          Service d'Anatomie Pathologique – CHU Andrainjato
        </div>
      </div>`;
  }

  const typeRows = Object.entries(stats.byType).map(([type, count]) => {
    const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
    return [getTypeLabel(type), `${count}`, `${pct}%`];
  });

  const pending =
    (stats.byStatus['CREEE'] || 0) +
    (stats.byStatus['EN_ATTENTE'] || 0) +
    (stats.byStatus['EN_COURS'] || 0);

  return `
    <div style="width:794px;font-family:Arial,sans-serif;color:#000;padding:8px;">
      <div style="text-align:center;margin-bottom:20px;">
        <div style="font-weight:bold;font-size:16px;color:#00478d;">SERVICE D'ANATOMIE PATHOLOGIQUE – CHU Andrainjato</div>
        <div style="font-size:14px;margin-top:6px;">RAPPORT D'ACTIVITÉ</div>
        <div style="font-size:11px;color:#555;margin-top:6px;">${escapeHtml(periodLabel)}</div>
      </div>

      ${reportSection('SECTION 1 — KPIs globaux', tableHtml(['Total examens', 'Validés', 'En attente', 'Délai moyen (TAT)'], [[`${stats.total}`, `${stats.byStatus['VALIDE'] || 0}`, `${pending}`, `${stats.tatMoyen.toFixed(1)} j`]]))}

      ${reportSection('SECTION 2 — Volume mensuel', tableHtml(['Mois', "Nombre d'examens"], stats.monthlyData.map((m) => [m.month, `${m.count}`])), true)}

      ${reportSection('SECTION 3 — Répartition par type', tableHtml(["Type d'examen", 'Nombre', 'Pourcentage'], typeRows), true)}

      ${reportSection('SECTION 4 — Top diagnostics CIM-10', tableHtml(['Code CIM-10', 'Libellé', 'Occurrences'], stats.topDiagnostics.map((d) => [d.code, d.name, `${d.count}`])), true)}

      ${reportSection(
        'SECTION 5 — RAPPORT HEBDOMADAIRE',
        `
        <p style="font-size:11px;color:#555;margin:0 0 10px;">Semaine du ${escapeHtml(weekly.weekLabel)}</p>
        ${tableHtml(['Total', 'Validés', 'En attente', 'Délai moyen'], [[`${weekly.total}`, `${weekly.validated}`, `${weekly.pending}`, `${weekly.avgDelay.toFixed(1)} j`]])}
        <p style="font-size:11px;font-weight:bold;margin:12px 0 6px;">Volume par jour</p>
        ${tableHtml(['Jour', "Nombre d'examens"], weekly.dailyVolume.map((d) => [DAY_FULL_NAMES[d.day] || d.day, `${d.count}`]))}
        <p style="font-size:11px;font-weight:bold;margin:12px 0 6px;">Liste des examens de la semaine</p>
        ${tableHtml(['ID PARA', 'Patient', 'Type', 'Statut', 'Prescripteur', 'Date'], weekly.requests.map((r) => [r.anapathId, r.patientId, r.typeLabel, r.statutLabel, r.prescriber, formatDate(r.createdAt)]))}
        `,
        true,
      )}

      ${reportSection(
        'SECTION 6 — Liste complète des demandes',
        tableHtml(
          ['ID PARA', 'Patient', 'Type', 'Statut', 'Date'],
          allRequests.map((r) => [r.anapathId, r.patientId, r.typeLabel, r.statutLabel, formatDate(r.createdAt)]),
          true,
        ),
        true,
      )}

      <div style="margin-top:24px;font-size:9px;color:#666;text-align:center;">
        Document généré le ${escapeHtml(generatedAt)}<br/>
        Service d'Anatomie Pathologique – CHU Andrainjato
      </div>
    </div>`;
}

async function runHtml2Pdf(
  html: string,
  filename: string,
  options: Record<string, unknown>,
  withPageNumbers = false,
): Promise<void> {
  const html2pdf = await loadHtml2Pdf();
  const container = document.createElement('div');
  container.innerHTML = html;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  document.body.appendChild(container);

  const opt = { ...options, filename };

  try {
    await html2pdf()
      .set(opt)
      .from(container)
      .toPdf()
      .get('pdf')
      .then((pdf: any) => {
        if (!withPageNumbers) return pdf;
        const total = pdf.internal.getNumberOfPages();
        const generatedAt = formatDateTime(new Date());
        for (let i = 1; i <= total; i++) {
          pdf.setPage(i);
          pdf.setFontSize(8);
          pdf.setTextColor(100);
          const pageH = pdf.internal.pageSize.getHeight();
          const pageW = pdf.internal.pageSize.getWidth();
          pdf.text(`Document généré le ${generatedAt}`, 10, pageH - 12);
          pdf.text("Service d'Anatomie Pathologique – CHU Andrainjato", 10, pageH - 8);
          pdf.text(`Page ${i} / ${total}`, pageW - 28, pageH - 10);
        }
        return pdf;
      })
      .save();
  } finally {
    document.body.removeChild(container);
  }
}

export function buildExamPdfData(
  examen: any,
  patient: any,
  extras: Partial<ExamPdfData> = {},
): ExamPdfData {
  const urgenceMeta = examen.metadata?.urgence ?? (examen.isExtemporane ? 'STAT' : 'NORMALE');
  const urgenceLabel = urgenceMeta === 'NORMALE' ? 'Normale' : String(urgenceMeta);

  return {
    anapathId: examen.anapathId,
    patientId: examen.patientId,
    typeExamen: examen.typeExamen,
    typeExamenLabel: getTypeLabel(examen.typeExamen),
    createdAt: examen.createdAt,
    patientFullName: patient?.nomComplet ?? examen.patientId,
    patientAge: patient?.age ? `${patient.age} ans` : '—',
    patientSex: patient?.sexe ?? '—',
    patientDateNaissance: patient?.dateNaissance ?? null,
    patientCin: patient?.cin ?? null,
    patientTelephone: patient?.telephone ?? null,
    patientAdresse: patient?.adresse ?? null,
    sampleDate: formatDateLong(examen.createdAt),
    prelevementSite: examen.prelevement?.site,
    prelevementDescription: examen.prelevement?.description,
    requestingService: examen.metadata?.serviceNom ?? '—',
    chuName: examen.metadata?.chuNom ?? '—',
    prescriber: 'Non renseigné',
    urgence: urgenceLabel,
    resultDetails: '',
    resultConclusion: '',
    ...extras,
  };
}

export async function generatePDF(
  examen: any,
  patient: any,
  extras?: Partial<ExamPdfData>,
): Promise<void> {
  return generateExamPDF(buildExamPdfData(examen, patient, extras));
}

export async function generateExamPDF(data: ExamPdfData): Promise<void> {
  const html = buildExamReportHtml(data);
  await runHtml2Pdf(html, `CR-Anapath-${data.anapathId}.pdf`, {
    ...EXAM_PDF_OPTIONS,
    filename: `CR-Anapath-${data.anapathId}.pdf`,
  });
}

export async function generateReportPDF(data: ReportPdfData): Promise<void> {
  const html = buildReportHtml(data);
  const dateSlug = formatDate(new Date()).replace(/\//g, '-');
  const filename = data.weeklyOnly
    ? `Rapport-Hebdo-Anapath-${dateSlug}.pdf`
    : `Rapport-Anapath-${dateSlug}.pdf`;
  await runHtml2Pdf(html, filename, { ...REPORT_PDF_OPTIONS, filename }, !data.weeklyOnly);
}

export { formatDateLong };
