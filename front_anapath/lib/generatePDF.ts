/* eslint-disable @typescript-eslint/no-explicit-any */

export async function generatePDF(
  examen: any,
  patient: any,
): Promise<void> {
  const html2pdf = (await import('html2pdf.js')).default;

  const nomPatient = patient?.nomComplet
    ?? (`${patient?.nom ?? ''} ${patient?.prenom ?? ''}`.trim() || examen?.patientId)
    ?? '—';
  const age = patient?.age
    ? `${patient.age} ans`
    : patient?.dateNaissance
    ? `${calcAge(patient.dateNaissance)} ans`
    : '—';
  const sexe = patient?.sexe === 'MALE' ? 'Masculin'
    : patient?.sexe === 'FEMALE' ? 'Féminin' : '—';
  const dateNaiss = patient?.dateNaissance
    ? new Date(patient.dateNaissance)
        .toLocaleDateString('fr-FR')
    : '—';
  const telephone = patient?.telephone ?? '—';
  const adresse = patient?.adresse ?? '—';
  const cin = patient?.cin ?? '—';

  const serviceNom = examen?.metadata?.serviceNom
    ?? examen?.metadata?.serviceId ?? '—';
  const chuNom = examen?.metadata?.chuNom
    ?? examen?.metadata?.chuId ?? 'CHU Andrainjato';
  const prescripteurId = examen?.metadata?.prescripteurId ?? '—';
  const urgence = examen?.urgence
    ?? examen?.metadata?.urgence ?? 'NORMALE';
  const typeExamen = formatTypeExamen(examen?.typeExamen ?? '');
  const site = examen?.prelevement?.site ?? '—';
  const description = examen?.prelevement?.description ?? '—';
  const clinicalData = examen?.prelevement?.clinicalData ?? {};
  const resultat = examen?.resultat?.details ?? '—';
  const conclusion = examen?.resultat?.conclusion ?? '—';
  const signature = examen?.validatedBySignature ?? '—';
  const numeroOrdre = examen?.validatedByUserId ?? '—';
  const hash = examen?.validationHash ?? examen?.signedHash ?? '—';
  const dateValidation = examen?.validatedAt
    ? new Date(examen.validatedAt).toLocaleString('fr-FR', {
        hour12: false,
      })
    : '—';
  const anapathId = examen?.anapathId ?? examen?.id ?? '—';
  const dateCreation = examen?.createdAt
    ? new Date(examen.createdAt).toLocaleDateString('fr-FR')
    : '—';

  const html = `
  <div style="
    width: 794px;
    font-family: 'Times New Roman', Times, serif;
    font-size: 11px;
    color: #000;
    background: white;
  ">

    <div style="
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
      margin-bottom: 10px;
    ">
      <div style="
        width: 80px;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid #ccc;
        font-size: 8px;
        text-align: center;
        color: #555;
        padding: 4px;
      ">
        LOGO<br/>CHU<br/>ANDRAINJATO
      </div>

      <div style="text-align: center; flex: 1; padding: 0 16px;">
        <div style="
          font-size: 13px;
          font-weight: bold;
          letter-spacing: 1px;
          text-transform: uppercase;
        ">
          REPOBLIKAN'I MADAGASIKARA
        </div>
        <div style="
          font-size: 11px;
          font-style: italic;
          margin: 2px 0;
        ">
          Fitiavana – Tanindrazana – Fandrosoana
        </div>
        <div style="
          border-top: 1px solid #000;
          border-bottom: 1px solid #000;
          padding: 3px 0;
          margin: 4px 0;
          font-size: 11px;
          font-weight: bold;
        ">
          MINISTÈRE DE LA SANTÉ PUBLIQUE
        </div>
        <div style="font-size: 10px; font-weight: bold;">
          ${chuNom}
        </div>
        <div style="
          font-size: 12px;
          font-weight: bold;
          margin-top: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        ">
          SERVICE D'ANATOMIE PATHOLOGIQUE
        </div>
      </div>

      <div style="
        width: 80px;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid #ccc;
        font-size: 7px;
        text-align: center;
        color: #555;
        padding: 4px;
      ">
        LOGO<br/>LABO<br/>ANAPATH
      </div>
    </div>

    <div style="
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 10px;
    ">
      <div><strong>N° Dossier :</strong> ${anapathId}</div>
      <div><strong>Date réception :</strong> ${dateCreation}</div>
      <div><strong>Date validation :</strong> ${dateValidation}</div>
    </div>

    <div style="display: flex; gap: 0; border: 1px solid #ccc;">

      <div style="
        width: 33%;
        border-right: 1px solid #ccc;
        padding: 10px 8px;
        background: #fafafa;
      ">
        <div style="
          text-align: center;
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
          border-bottom: 1px solid #ccc;
          padding-bottom: 6px;
          margin-bottom: 10px;
          letter-spacing: 0.5px;
        ">
          PERSONNEL DU SERVICE
        </div>

        ${personnelHTML([
          { fonction: 'Chef de service', nom: 'P. ANDRIAMAMPIONONA T. Francine' },
          { fonction: 'Chef de travaux', nom: 'Dr LAZA Odilon' },
          { fonction: 'Spécialiste', nom: 'Dr RAZAFIMAHEFA Joëlle' },
          { fonction: 'Interne qualifiant', nom: '' },
          { fonction: 'Histotechnicien(ne)s', nom: 'MILIARISOA Pergaudine\nRAVONINTSALAMA Sarindra' },
          { fonction: 'Secrétaire', nom: 'RAHERIMAMINIAINA Narison' },
          { fonction: "Personnel d'appui", nom: 'RASOARIVONJY Nadia' },
        ])}
      </div>

      <div style="width: 67%; padding: 10px 12px;">

        ${sectionHTML('1. IDENTITÉ DU PATIENT', `
          ${rowHTML('Nom complet', nomPatient)}
          ${rowHTML('ID Patient', examen?.patientId ?? '—')}
          ${rowHTML('Date de naissance', dateNaiss)}
          ${rowHTML('Âge', age)}
          ${rowHTML('Sexe', sexe)}
          ${rowHTML('CIN', cin)}
          ${rowHTML('Téléphone', telephone)}
          ${rowHTML('Adresse', adresse)}
        `)}

        ${sectionHTML('2. PRESCRIPTION', `
          ${rowHTML('Service demandeur', serviceNom)}
          ${rowHTML('CHU', chuNom)}
          ${rowHTML('Prescripteur', prescripteurId)}
          ${rowHTML('Urgence', urgence)}
          ${rowHTML("Type d'examen", typeExamen)}
        `)}

        ${sectionHTML('3. PRÉLÈVEMENT', `
          ${rowHTML('Site', site)}
          ${rowHTML('Description', description)}
          ${clinicalData.organe ? rowHTML('Organe', clinicalData.organe) : ''}
          ${clinicalData.localisation ? rowHTML('Localisation', clinicalData.localisation) : ''}
          ${clinicalData.fixateur ? rowHTML('Fixateur', clinicalData.fixateur) : ''}
          ${clinicalData.etat_col ? rowHTML('État du col', clinicalData.etat_col) : ''}
          ${clinicalData.type_liquide ? rowHTML('Type de liquide', clinicalData.type_liquide) : ''}
          ${clinicalData.alertes ? rowHTML('Alertes', clinicalData.alertes) : ''}
        `)}

        ${sectionHTML('4. RÉSULTAT', `
          <div style="margin-bottom: 6px;">
            <div style="font-style: italic; color: #555;
              font-size: 9px; margin-bottom: 2px;">
              Description microscopique :
            </div>
            <div style="
              border: 1px solid #ddd;
              padding: 6px;
              min-height: 60px;
              background: white;
              white-space: pre-wrap;
            ">${resultat}</div>
          </div>
        `)}

        ${sectionHTML('5. CONCLUSION DIAGNOSTIQUE', `
          <div style="
            border: 1px solid #000;
            padding: 8px;
            min-height: 40px;
            font-weight: bold;
            white-space: pre-wrap;
          ">${conclusion}</div>
        `)}

        ${sectionHTML('6. VALIDATION', `
          ${rowHTML('Signé par', signature)}
          ${rowHTML("N° d'ordre", numeroOrdre)}
          <div style="margin-top: 4px;">
            <div style="font-style: italic; color: #555;
              font-size: 9px;">Hash SHA-256 :</div>
            <div style="
              font-family: monospace;
              font-size: 8px;
              word-break: break-all;
              background: #f5f5f5;
              padding: 3px;
              border: 1px solid #ddd;
            ">${hash}</div>
          </div>
          ${rowHTML('Date et heure', dateValidation)}
        `)}

      </div>
    </div>

    <div style="
      margin-top: 8px;
      border-top: 1px solid #ccc;
      padding-top: 4px;
      font-size: 8px;
      color: #666;
      text-align: center;
    ">
      Document généré le
      ${new Date().toLocaleString('fr-FR', { hour12: false })} —
      ${chuNom} – Service d'Anatomie Pathologique —
      Confidentiel – Usage médical exclusif
    </div>

  </div>`;

  const options = {
    margin: 10,
    filename: `CR-Anapath-${anapathId}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
    },
  };

  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;left:-9999px;top:0;background:white;';
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    await html2pdf().set(options).from(container).save();
  } finally {
    document.body.removeChild(container);
  }
}

export function getTypeLabel(type: string): string {
  return formatTypeExamen(type);
}

function calcAge(dateNaissance: string): number {
  const birth = new Date(dateNaissance);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate()))
    age--;
  return age;
}

function formatTypeExamen(type: string): string {
  const map: Record<string, string> = {
    BIOPSIE: 'Biopsie tissulaire',
    FCV_PAP: 'Frottis cervico-vaginal / Pap test',
    CYT0PONCTION: 'Cytoponction',
    LIQUIDE: 'Liquide biologique',
    POS: 'Prélèvement Organique Standard',
    POC: 'Prélèvement Organique Complexe',
    EXTEMPORANE_STAT: 'Examen extemporané (STAT)',
  };
  return map[type] ?? type;
}

function personnelHTML(
  personnel: { fonction: string; nom: string }[],
): string {
  return personnel.map(p => `
    <div style="margin-bottom: 10px;">
      <div style="
        font-size: 9px;
        font-style: italic;
        color: #555;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      ">${p.fonction}</div>
      <div style="
        font-weight: bold;
        font-size: 10px;
        white-space: pre-line;
        min-height: ${p.nom ? 'auto' : '36px'};
        border-bottom: 1px dotted #ccc;
        padding-bottom: 2px;
      ">${p.nom || '&nbsp;'}</div>
    </div>
  `).join('');
}

function sectionHTML(title: string, content: string): string {
  return `
    <div style="margin-bottom: 8px;">
      <div style="
        background: #1a3a5c;
        color: white;
        padding: 3px 8px;
        font-weight: bold;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      ">${title}</div>
      <div style="padding: 0 4px;">${content}</div>
    </div>
  `;
}

function rowHTML(label: string, value: string): string {
  return `
    <div style="
      display: flex;
      border-bottom: 1px dotted #eee;
      padding: 2px 0;
      gap: 8px;
    ">
      <div style="
        width: 120px;
        flex-shrink: 0;
        font-weight: bold;
        font-size: 9px;
        color: #333;
      ">${label} :</div>
      <div style="flex: 1; font-size: 10px;">${value ?? '—'}</div>
    </div>
  `;
}
