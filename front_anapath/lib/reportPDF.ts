import { formatDate, formatDateTime } from './dateFormat';
import { getTypeLabel } from './generatePDF';

/* eslint-disable @typescript-eslint/no-explicit-any */

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

const REPORT_PDF_OPTIONS = {
  margin: 10,
  image: { type: 'jpeg', quality: 0.98 },
  html2canvas: { scale: 2, useCORS: true, logging: false },
  jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
};

function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
  const head = headers
    .map(
      (h) =>
        `<th style="padding:6px 8px;text-align:left;background:#00478d;color:#fff;font-size:10px;">${escapeHtml(h)}</th>`,
    )
    .join('');
  const body = rows
    .map(
      (row, i) =>
        `<tr style="background:${striped && i % 2 ? '#f8fafc' : '#fff'};">${row
          .map(
            (cell) =>
              `<td style="padding:5px 8px;font-size:10px;border-bottom:1px solid #e5e7eb;">${escapeHtml(cell)}</td>`,
          )
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
  const html2pdf = (await import('html2pdf.js')).default;
  const container = document.createElement('div');
  container.innerHTML = html;
  container.style.cssText = 'position:fixed;left:-9999px;top:0;background:white;';
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

export async function generateReportPDF(data: ReportPdfData): Promise<void> {
  const html = buildReportHtml(data);
  const dateSlug = formatDate(new Date()).replace(/\//g, '-');
  const filename = data.weeklyOnly
    ? `Rapport-Hebdo-Anapath-${dateSlug}.pdf`
    : `Rapport-Anapath-${dateSlug}.pdf`;
  await runHtml2Pdf(html, filename, { ...REPORT_PDF_OPTIONS, filename }, !data.weeklyOnly);
}
