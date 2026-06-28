/* eslint-disable @typescript-eslint/no-explicit-any */

export async function generatePDF(
  examen: any,
  patient: any,
): Promise<void> {
  const html2pdf = (await import('html2pdf.js' as any)).default;

  const nomPatient = patient?.nomComplet
    ?? [patient?.nom, patient?.prenom]
       .filter(Boolean).join(' ')
    ?? examen?.patientId ?? '—';
  const age = patient?.dateNaissance
    ? `${calcAge(patient.dateNaissance)} ans`
    : patient?.age ? `${patient.age} ans` : '—';
  const sexe = patient?.sexe === 'MALE' ? 'Masculin'
    : patient?.sexe === 'FEMALE' ? 'Féminin' : '—';
  const dateNaiss = patient?.dateNaissance
    ? new Date(patient.dateNaissance)
        .toLocaleDateString('fr-FR') : '—';

  const anapathId    = examen?.anapathId ?? examen?.id ?? '—';
  const serviceNom   = examen?.metadata?.serviceNom
    ?? examen?.metadata?.serviceId ?? '—';
  const chuNom       = examen?.metadata?.chuNom
    ?? 'CHU Andrainjato – Fianarantsoa';
  const prescripteur = examen?.metadata?.prescripteurId ?? '—';
  const urgence      = examen?.urgence
    ?? examen?.metadata?.urgence ?? 'NORMALE';
  const typeExamen   = formatTypeExamen(examen?.typeExamen ?? '');
  const site         = examen?.prelevement?.site ?? '—';
  const descPrelevement = examen?.prelevement?.description ?? '—';
  const cd           = examen?.prelevement?.clinicalData ?? {};
  const resultat     = examen?.resultat?.details
    ?? examen?.resultatDetails ?? '—';
  const conclusion   = examen?.resultat?.conclusion
    ?? examen?.resultatConclusion ?? '—';
  const signature    = examen?.validatedBySignature ?? '—';
  const numOrdre     = examen?.validatedByUserId ?? '—';
  const hash         = examen?.validationHash ?? '—';
  const dateValid    = examen?.validatedAt
    ? new Date(examen.validatedAt)
        .toLocaleString('fr-FR', { hour12: false }) : '—';
  const dateCreation = examen?.createdAt
    ? new Date(examen.createdAt)
        .toLocaleDateString('fr-FR') : '—';

  const personnel = [
    { f: 'Chef de service',
      n: 'P. ANDRIAMAMPIONONA T. Francine' },
    { f: 'Chef de travaux',    n: 'Dr LAZA Odilon' },
    { f: 'Spécialiste',        n: 'Dr RAZAFIMAHEFA Joëlle' },
    { f: 'Interne qualifiant', n: '' },
    { f: 'Histotechnicien(ne)s',
      n: 'MILIARISOA Pergaudine\nRAVONINTSALAMA Sarindra' },
    { f: 'Secrétaire',
      n: 'RAHERIMAMINIAINA Narison' },
    { f: "Personnel d'appui",  n: 'RASOARIVONJY Nadia' },
  ];

  const row = (label: string, value: string) => `
    <div class="row">
      <div class="row-label">${label} :</div>
      <div class="row-value">${value ?? '—'}</div>
    </div>`;

  const champsCliniques = [
    cd.organe       ? row('Organe', cd.organe) : '',
    cd.localisation ? row('Localisation', cd.localisation) : '',
    cd.fixateur     ? row('Fixateur', cd.fixateur) : '',
    cd.nature       ? row('Nature', cd.nature) : '',
    cd.etat_col     ? row('État du col', cd.etat_col) : '',
    cd.type_liquide ? row('Type liquide', cd.type_liquide) : '',
    cd.alertes      ? row('Alertes', cd.alertes) : '',
  ].join('');

  const personnelHTML = personnel.map(p => `
    <div style="margin-bottom:10px;">
      <div style="font-size:9px;font-style:italic;
        color:#555;text-transform:uppercase;">
        ${p.f}
      </div>
      <div style="font-weight:bold;font-size:10px;
        white-space:pre-line;
        min-height:${p.n ? 'auto' : '30px'};
        border-bottom:1px dotted #ccc;
        padding-bottom:2px;">
        ${p.n || '&nbsp;'}
      </div>
    </div>`).join('');

  const htmlContent = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/>
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{
  font-family:'Times New Roman',Times,serif;
  font-size:11px;color:#000;background:white;
  width:794px;
}
.page{width:794px;background:white;}
.header{
  display:flex;align-items:center;
  justify-content:space-between;
  border-bottom:2.5px solid #000;
  padding-bottom:10px;margin-bottom:8px;
}
.logo-box{
  width:75px;height:75px;border:1px solid #999;
  display:flex;align-items:center;
  justify-content:center;font-size:7px;
  text-align:center;color:#555;
  padding:4px;flex-shrink:0;
}
.header-center{text-align:center;flex:1;padding:0 12px;}
.republic{
  font-size:13px;font-weight:bold;
  letter-spacing:1px;text-transform:uppercase;
}
.devise{font-size:10px;font-style:italic;margin:2px 0;}
.ministere{
  border-top:1px solid #000;border-bottom:1px solid #000;
  padding:2px 0;margin:3px 0;
  font-size:10px;font-weight:bold;
}
.dossier-info{
  display:flex;justify-content:space-between;
  font-size:10px;margin-bottom:6px;
  padding:4px 6px;background:#f0f4f8;
  border:1px solid #ccc;
}
.body-cols{display:flex;border:1.5px solid #555;}
.col-left{
  width:33%;border-right:1.5px solid #555;
  padding:10px 8px;background:#f9f9f9;
}
.col-left-title{
  text-align:center;font-size:9px;font-weight:bold;
  text-transform:uppercase;
  border-bottom:1px solid #999;
  padding-bottom:5px;margin-bottom:8px;
}
.col-right{width:67%;padding:8px 10px;}
.section{margin-bottom:7px;}
.section-title{
  background:#1a3a5c;color:white;
  padding:2px 6px;font-weight:bold;
  font-size:9px;text-transform:uppercase;
  margin-bottom:3px;
}
.row{
  display:flex;border-bottom:1px dotted #ddd;
  padding:1.5px 0;gap:6px;
}
.row-label{
  width:110px;flex-shrink:0;
  font-weight:bold;font-size:9px;color:#333;
}
.row-value{flex:1;font-size:10px;}
.result-box{
  border:1px solid #ccc;padding:5px;
  min-height:55px;background:white;
  white-space:pre-wrap;font-size:10px;
  margin-bottom:4px;
}
.conclusion-box{
  border:1.5px solid #000;padding:6px;
  min-height:35px;font-weight:bold;
  white-space:pre-wrap;font-size:10px;
}
.hash-box{
  font-family:monospace;font-size:7px;
  word-break:break-all;background:#f5f5f5;
  padding:2px 4px;border:1px solid #ddd;
}
.footer{
  margin-top:6px;border-top:1px solid #999;
  padding-top:3px;font-size:8px;
  color:#666;text-align:center;
}
</style></head><body>
<div class="page">
  <div class="header">
    <div class="logo-box">LOGO<br/>CHU<br/>ANDRAINJATO</div>
    <div class="header-center">
      <div class="republic">REPOBLIKAN'I MADAGASIKARA</div>
      <div class="devise">
        Fitiavana – Tanindrazana – Fandrosoana
      </div>
      <div class="ministere">
        MINISTÈRE DE LA SANTÉ PUBLIQUE
      </div>
      <div style="font-size:10px;font-weight:bold;">
        ${chuNom}
      </div>
      <div style="font-size:12px;font-weight:bold;
        margin-top:3px;text-transform:uppercase;">
        Service d'Anatomie Pathologique
      </div>
    </div>
    <div class="logo-box">LOGO<br/>LABO<br/>ANAPATH</div>
  </div>

  <div class="dossier-info">
    <div><strong>N° Dossier :</strong> ${anapathId}</div>
    <div><strong>Réception :</strong> ${dateCreation}</div>
    <div><strong>Validation :</strong> ${dateValid}</div>
  </div>

  <div class="body-cols">
    <div class="col-left">
      <div class="col-left-title">Personnel du Service</div>
      ${personnelHTML}
    </div>
    <div class="col-right">

      <div class="section">
        <div class="section-title">1. Identité du patient</div>
        ${row('Nom complet', nomPatient)}
        ${row('ID Patient', examen?.patientId ?? '—')}
        ${row('Date naissance', dateNaiss)}
        ${row('Âge', age)}
        ${row('Sexe', sexe)}
        ${row('CIN', patient?.cin ?? '—')}
        ${row('Téléphone', patient?.telephone ?? '—')}
        ${row('Adresse', patient?.adresse ?? '—')}
      </div>

      <div class="section">
        <div class="section-title">2. Prescription</div>
        ${row('Service demandeur', serviceNom)}
        ${row('CHU', chuNom)}
        ${row('Prescripteur', prescripteur)}
        ${row('Urgence', urgence)}
        ${row("Type d'examen", typeExamen)}
      </div>

      <div class="section">
        <div class="section-title">3. Prélèvement</div>
        ${row('Site', site)}
        ${row('Description', descPrelevement)}
        ${champsCliniques}
      </div>

      <div class="section">
        <div class="section-title">4. Résultat</div>
        <div class="result-box">${resultat}</div>
      </div>

      <div class="section">
        <div class="section-title">
          5. Conclusion diagnostique
        </div>
        <div class="conclusion-box">${conclusion}</div>
      </div>

      <div class="section">
        <div class="section-title">6. Validation</div>
        ${row('Signé par', signature)}
        ${row("N° d'ordre", numOrdre)}
        ${row('Date / Heure', dateValid)}
        <div class="row">
          <div class="row-label">Hash SHA-256 :</div>
          <div class="row-value">
            <div class="hash-box">${hash}</div>
          </div>
        </div>
      </div>

    </div>
  </div>

  <div class="footer">
    Document généré le
    ${new Date().toLocaleString('fr-FR', { hour12: false })}
    &nbsp;—&nbsp;${chuNom} – Service d'Anatomie Pathologique
    &nbsp;—&nbsp;Confidentiel – Usage médical exclusif
  </div>
</div>
</body></html>`;

  const iframe = document.createElement('iframe');
  iframe.style.cssText = `
    position:fixed;top:0;left:0;
    width:794px;height:1123px;
    opacity:0.01;
    pointer-events:none;
    z-index:-999;
    border:none;
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

    const opt = {
      margin:      10,
      filename:    `CR-Anapath-${anapathId}.pdf`,
      image:       { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale:       2,
        useCORS:     true,
        logging:     false,
        windowWidth: 794,
      },
      jsPDF: {
        unit:        'mm' as const,
        format:      'a4' as const,
        orientation: 'portrait' as const,
      },
    };

    await html2pdf()
      .set(opt)
      .from(doc.body)
      .save();

    await new Promise(r => setTimeout(r, 300));
  } finally {
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
  }
}

export function getTypeLabel(type: string): string {
  return formatTypeExamen(type);
}

function calcAge(d: string): number {
  const b = new Date(d), n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  if (n.getMonth() - b.getMonth() < 0 ||
     (n.getMonth() === b.getMonth() &&
      n.getDate() < b.getDate())) a--;
  return a;
}

function formatTypeExamen(t: string): string {
  const m: Record<string, string> = {
    BIOPSIE:          'Biopsie tissulaire',
    FCV_PAP:          'Frottis cervico-vaginal / Pap test',
    CYT0PONCTION:     'Cytoponction',
    LIQUIDE:          'Liquide biologique',
    POS:              'Prélèvement Organique Standard',
    POC:              'Prélèvement Organique Complexe',
    EXTEMPORANE_STAT: 'Examen extemporané (STAT)',
  };
  return m[t] ?? t;
}
