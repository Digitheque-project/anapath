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
    ? calcAge(patient.dateNaissance)
    : patient?.age ?? '—';
  const identifiant = examen?.patientId ?? '—';
  const typePrelevement = formatTypeExamen(
    examen?.typeExamen ?? '',
  );
  const descPrelevement = examen?.prelevement?.description
    ?? '';
  const cd = examen?.prelevement?.clinicalData ?? {};
  const renseignementClinique = cd.clinicalNotes
    ?? cd.alertes
    ?? examen?.metadata?.alertes
    ?? (descPrelevement || '—');
  const suspicionDiagnostique = cd.suspicion
    ?? cd.suspicion_diagnostique ?? '—';
  const prescripteur = examen?.metadata?.prescripteurNom
    ?? examen?.metadata?.prescripteurId ?? '—';
  const resultat = examen?.resultat?.details
    ?? examen?.resultatDetails ?? '';
  const conclusion = examen?.resultat?.conclusion
    ?? examen?.resultatConclusion ?? '';
  const signature = examen?.validatedBySignature ?? '';
  const numOrdre = examen?.validatedByUserId ?? '';
  const anapathId = examen?.anapathId ?? examen?.id ?? '—';
  const dateAujourdhui = new Date().toLocaleDateString(
    'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' },
  );

  const logoBase64 = await loadImageAsBase64('/assets/logo-chu.png');

  const personnel = [
    { f: 'Chef de service',
      n: 'P. ANDRIAMAMPIONONA T. Francine' },
    { f: 'Chef de travaux', n: 'Dr LAZA Odilon' },
    { f: 'Spécialiste', n: 'Dr RAZAFIMAHEFA Joëlle' },
    { f: 'Interne qualifiant', n: '' },
    { f: 'Histotechnicien(ne)s',
      n: 'MILIARISOA Pergaudine\nRAVONINTSALAMA Sarindra' },
    { f: 'Secrétaire', n: 'RAHERIMAMINIAINA Narison' },
    { f: "Personnel d'appui", n: 'RASOARIVONJY Nadia' },
  ];

  const personnelHTML = personnel.map(p => `
    <div style="margin-bottom:14px;">
      <div style="font-size:9px;font-style:italic;
        color:#555;text-transform:uppercase;
        letter-spacing:0.3px;">${p.f}</div>
      <div style="font-weight:bold;font-size:10.5px;
        white-space:pre-line;color:#000;
        min-height:${p.n ? 'auto' : '32px'};
        border-bottom:1px dotted #bbb;
        padding-bottom:3px;margin-top:2px;">
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
.page{width:794px;background:white;padding:6px;}
.header{
  display:flex;align-items:center;
  justify-content:space-between;
  margin-bottom:6px;
}
.logo-img{width:65px;height:65px;object-fit:contain;}
.header-center{text-align:center;flex:1;}
.republic{
  font-size:13px;font-weight:normal;
  letter-spacing:0.5px;
}
.devise{font-size:10px;margin-top:2px;}
.titre-principal{
  text-align:center;font-size:13px;font-weight:bold;
  text-decoration:underline;margin:10px 0 14px 0;
  text-transform:uppercase;
}
.infos-patient{
  display:flex;justify-content:space-between;
  margin-bottom:14px;
}
.infos-left{flex:1;}
.infos-left p{
  font-size:11px;margin-bottom:6px;line-height:1.5;
}
.infos-left .underline-field{
  border-bottom:1px solid #000;
  display:inline-block;min-width:200px;
  padding-bottom:1px;
}
.prescripteur-box{
  font-size:11px;height:fit-content;
  margin-top:2px;
}
.body-cols{
  display:flex;gap:14px;
}
.col-left{
  width:38%;
  border:1px solid #ccc;
  padding:10px 8px;
  background:white;
}
.col-left-title{
  text-align:center;font-size:9.5px;font-weight:bold;
  text-transform:uppercase;letter-spacing:0.5px;
  border-bottom:1.5px solid #333;
  padding-bottom:6px;margin-bottom:10px;
}
.col-right{width:62%;}
.box-resultat, .box-conclusion{
  border:1px solid #000;
  padding:10px;
  margin-bottom:14px;
}
.box-resultat{min-height:200px;}
.box-conclusion{min-height:100px;}
.box-title{
  font-weight:bold;text-decoration:underline;
  font-size:11px;margin-bottom:8px;
}
.box-content{
  font-size:10.5px;white-space:pre-wrap;
  line-height:1.5;
}
.footer-zone{
  margin-top:20px;
  display:flex;
  justify-content:flex-end;
}
.date-signature{
  text-align:right;
  width:280px;
}
.date-fait{
  font-size:10.5px;margin-bottom:30px;
}
.signature-line{
  border-top:1px solid #000;
  padding-top:4px;
  font-size:9px;
  text-align:center;
}
.signature-zone{
  height:50px;
  display:flex;
  align-items:flex-end;
  justify-content:center;
  font-size:10px;
  font-style:italic;
  color:#333;
}
</style></head><body>
<div class="page">
  <div class="header">
    <img src="${logoBase64}" class="logo-img"/>
    <div class="header-center">
      <div class="republic">REPOBLIKAN'I MADAGASIKARA</div>
      <div class="devise">
        Fitiavana – Tanindrazana - Fandrosoana
      </div>
    </div>
    <img src="${logoBase64}" class="logo-img"/>
  </div>

  <div class="titre-principal">
    Compte Rendu d'Examen Anatomo-Pathologique
  </div>

  <div class="infos-patient">
    <div class="infos-left">
      <p>Nom : <span class="underline-field">
        ${escapeHtml(nomPatient)}</span></p>
      <p>Identifiant : <span class="underline-field">
        ${escapeHtml(identifiant)}</span></p>
      <p>Age : <span class="underline-field"
        style="min-width:60px;">${escapeHtml(String(age))}</span> ans</p>
      <p>Type de prélèvement : <span class="underline-field">
        ${escapeHtml(typePrelevement)}</span></p>
      <p>Renseignement clinique : <span class="underline-field">
        ${escapeHtml(String(renseignementClinique))}</span></p>
      <p>Suspicion diagnostique : <span class="underline-field">
        ${escapeHtml(String(suspicionDiagnostique))}</span></p>
    </div>
    <div class="prescripteur-box">
      Prescripteur : Dr ${escapeHtml(String(prescripteur))}
    </div>
  </div>

  <div class="body-cols">
    <div class="col-left">
      <div class="col-left-title">
        Personnel du Service<br/>
        <span style="font-weight:normal;
          text-transform:none;font-size:8.5px;
          font-style:italic;">
          Anatomie Pathologique
        </span>
      </div>
      ${personnelHTML}
    </div>

    <div class="col-right">
      <div class="box-resultat">
        <div class="box-title">RESULTAT :</div>
        <div class="box-content">${escapeHtml(resultat)}</div>
      </div>
      <div class="box-conclusion">
        <div class="box-title">CONCLUSION :</div>
        <div class="box-content">${escapeHtml(conclusion)}</div>
      </div>
    </div>
  </div>

  <div class="footer-zone">
    <div class="date-signature">
      <div class="date-fait">
        Fait à Fianarantsoa, le ${dateAujourdhui}
      </div>
      <div class="signature-zone">
        ${signature ? escapeHtml(signature) : ''}
      </div>
      <div class="signature-line">
        Signature
        ${numOrdre ? `<br/>N° Ordre : ${escapeHtml(numOrdre)}` : ''}
      </div>
    </div>
  </div>
</div>
</body></html>`;

  const iframe = document.createElement('iframe');
  iframe.style.cssText = `
    position:fixed;top:0;left:0;
    width:794px;height:1123px;
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

    const opt = {
      margin: 10,
      filename: `CR-Anapath-${anapathId}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2, useCORS: true,
        logging: false, windowWidth: 794,
      },
      jsPDF: {
        unit: 'mm' as const, format: 'a4' as const,
        orientation: 'portrait' as const,
      },
    };

    await html2pdf().set(opt).from(doc.body).save();
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

async function loadImageAsBase64(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
    BIOPSIE: 'Biopsie tissulaire',
    FCV_PAP: 'Frottis cervico-vaginal / Pap test',
    CYT0PONCTION: 'Cytoponction',
    LIQUIDE: 'Liquide biologique',
    POS: 'Prélèvement Organique Standard',
    POC: 'Prélèvement Organique Complexe',
    EXTEMPORANE_STAT: 'Examen extemporané (STAT)',
  };
  return m[t] ?? t;
}
