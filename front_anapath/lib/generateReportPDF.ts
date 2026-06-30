/* eslint-disable @typescript-eslint/no-explicit-any */

export async function generateWeeklyReportPDF(
  weekData: {
    lundi: string;
    dimanche: string;
    kpis: {
      total: number;
      valides: number;
      enAttente: number;
      delaiMoyen: string;
    };
    parJour: { jour: string; count: number }[];
    examens: any[];
  },
): Promise<void> {
  const html2pdf = (await import('html2pdf.js' as any)).default;

  const joursRows = weekData.parJour.map(j => `
    <tr>
      <td>${j.jour}</td>
      <td style="text-align:center;">${j.count}</td>
    </tr>`).join('');

  const examensRows = weekData.examens.map(e => `
    <tr>
      <td>${e.anapathId}</td>
      <td>${e.patientId}</td>
      <td>${formatTypeExamen(e.typeExamen)}</td>
      <td>${e.statutLabel ?? e.statut}</td>
      <td>${e.metadata?.prescripteurId ?? e.prescriber ?? '—'}</td>
      <td>${new Date(e.createdAt)
        .toLocaleDateString('fr-FR')}</td>
    </tr>`).join('');

  const htmlContent = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/>
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{
  font-family:'Times New Roman',Times,serif;
  font-size:11px;color:#000;width:794px;background:white;
}
.page{width:794px;padding:10px;}
h1{font-size:16px;text-align:center;margin-bottom:4px;}
h2{font-size:12px;text-align:center;color:#555;
  margin-bottom:16px;font-weight:normal;}
.kpi-grid{
  display:flex;justify-content:space-around;
  margin-bottom:16px;border:1px solid #ccc;padding:10px;
}
.kpi-item{text-align:center;}
.kpi-value{font-size:20px;font-weight:bold;color:#00478d;}
.kpi-label{font-size:9px;color:#666;
  text-transform:uppercase;}
table{width:100%;border-collapse:collapse;
  margin-bottom:16px;font-size:10px;}
th,td{border:1px solid #ccc;padding:5px 8px;
  text-align:left;}
th{background:#e8edf5;font-weight:bold;}
.section-title{
  font-size:12px;font-weight:bold;
  background:#1a3a5c;color:white;
  padding:4px 8px;margin-bottom:8px;
}
</style></head><body>
<div class="page">
  <h1>RAPPORT HEBDOMADAIRE D'ACTIVITÉ</h1>
  <h2>Semaine du ${weekData.lundi} au ${weekData.dimanche}
    — Service d'Anatomie Pathologique</h2>

  <div class="kpi-grid">
    <div class="kpi-item">
      <div class="kpi-value">${weekData.kpis.total}</div>
      <div class="kpi-label">Total examens</div>
    </div>
    <div class="kpi-item">
      <div class="kpi-value">${weekData.kpis.valides}</div>
      <div class="kpi-label">Validés</div>
    </div>
    <div class="kpi-item">
      <div class="kpi-value">${weekData.kpis.enAttente}</div>
      <div class="kpi-label">En attente</div>
    </div>
    <div class="kpi-item">
      <div class="kpi-value">${weekData.kpis.delaiMoyen}</div>
      <div class="kpi-label">Délai moyen</div>
    </div>
  </div>

  <div class="section-title">Volume par jour</div>
  <table>
    <tr><th>Jour</th><th>Nombre d'examens</th></tr>
    ${joursRows}
  </table>

  <div class="section-title">
    Liste complète des examens de la semaine
  </div>
  <table>
    <tr>
      <th>ID PARA</th><th>Patient</th><th>Type</th>
      <th>Statut</th><th>Prescripteur</th><th>Date</th>
    </tr>
    ${examensRows || '<tr><td colspan="6" style="text-align:center;color:#999;">Aucun examen cette semaine</td></tr>'}
  </table>

  <div style="margin-top:16px;text-align:center;
    font-size:8px;color:#666;border-top:1px solid #ccc;
    padding-top:6px;">
    Document généré le ${new Date().toLocaleString(
      'fr-FR', { hour12: false },
    )}
    — Service d'Anatomie Pathologique — CHU Andrainjato
  </div>
</div>
</body></html>`;

  const iframe = document.createElement('iframe');
  iframe.style.cssText = `
    position:fixed;top:0;left:0;
    width:794px;height:1400px;
    opacity:0.01;pointer-events:none;
    z-index:-999;border:none;
  `;
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentDocument
      ?? iframe.contentWindow?.document;
    if (!doc) throw new Error('iframe indisponible');
    doc.open();
    doc.write(htmlContent);
    doc.close();

    await new Promise(r => setTimeout(r, 800));

    await html2pdf().set({
      margin: 10,
      filename: `Rapport-Hebdo-${weekData.lundi}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true,
        logging: false, windowWidth: 794 },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const,
        orientation: 'portrait' as const },
    }).from(doc.body).save();

    await new Promise(r => setTimeout(r, 300));
  } finally {
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
  }
}

function formatTypeExamen(t: string): string {
  const m: Record<string, string> = {
    BIOPSIE: 'Biopsie', FCV_PAP: 'FCV / Pap test',
    CYT0PONCTION: 'Cytoponction', LIQUIDE: 'Liquide',
    POS: 'POS', POC: 'POC',
    EXTEMPORANE_STAT: 'Extemporané STAT',
  };
  return m[t] ?? t;
}
