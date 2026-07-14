import { BadRequestException } from '@nestjs/common';
import { ExternalService } from './external.service';

// Mocks légers : on instancie le service directement, sans le conteneur Nest,
// pour vérifier la logique de réception (mono / multi examens) sans base ni réseau.
function makeService() {
  const created: any[] = [];
  const anapathService = {
    create: jest.fn(async (dto: any) => {
      const request = { anapathId: `ANP-TEST-${created.length + 1}`, ...dto };
      created.push(request);
      return request;
    }),
  };
  const chuClient = {
    getService: jest.fn(async () => ({ name: 'Service Neuro' })),
    getChu: jest.fn(async () => ({ name: 'CHU Test' })),
  };
  const accueilClient = {
    getPatient: jest.fn(async () => ({
      nom: 'RAKOTO',
      prenom: 'Jean',
      dateNaissance: '1990-01-01',
    })),
    buildNomComplet: jest.fn((p: any) =>
      [p?.nom, p?.prenom].filter(Boolean).join(' '),
    ),
    calculateAge: jest.fn(() => 36),
  };
  const service = new ExternalService(
    anapathService as any,
    chuClient as any,
    accueilClient as any,
  );
  return { service, anapathService, created };
}

describe('ExternalService.createFromPrescription', () => {
  it('accepte une prescription mono-examen (format legacy) et renvoie l\'objet unique', async () => {
    const { service, anapathService } = makeService();

    const result: any = await service.createFromPrescription({
      patientId: 'CHU-2026-00001',
      prescripteurId: 'presc-1',
      urgence: 'URGENTE',
      typeExamen: 'BIOPSIE',
      data: { organe: 'Foie', nature: '3 fragments', fixateur: 'Formol 10%' },
      chuId: 'chu-1',
      serviceId: 'svc-source',
    } as any);

    expect(anapathService.create).toHaveBeenCalledTimes(1);
    // Rétrocompat : un seul examen -> objet unique, pas d'enveloppe de lot.
    expect(result.anapathId).toBeDefined();
    expect(result.requests).toBeUndefined();
    // Aucune donnée clinique perdue.
    expect(result.prelevement.clinicalData).toEqual({
      organe: 'Foie',
      nature: '3 fragments',
      fixateur: 'Formol 10%',
    });
    expect(result.metadata.serviceIdSource).toBe('svc-source');
  });

  it('accepte une prescription multi-examens (demandes[]) sans rien perdre', async () => {
    const { service, anapathService } = makeService();

    const result: any = await service.createFromPrescription({
      patientId: 'CHU-2026-00002',
      prescripteurId: 'presc-2',
      urgence: 'STAT',
      alertes: 'Suspicion maligne',
      lotId: 'lot-abc',
      serviceIdSource: 'svc-source',
      serviceIdDest: 'svc-anapath',
      chuId: 'chu-1',
      demandes: [
        { typeExamen: 'BIOPSIE', data: { organe: 'Sein', nature: 'pièce' } },
        { typeExamen: 'EXTEMPORANE_STAT', data: { organe: 'Ganglion', urgence_chirurgicale: 'oui' } },
        { typeExamen: 'FCV_PAP', data: { etat_col: 'normal' } },
      ],
    } as any);

    // Un examen créé par demande.
    expect(anapathService.create).toHaveBeenCalledTimes(3);
    expect(result.count).toBe(3);
    expect(result.lotId).toBe('lot-abc');
    expect(result.requests).toHaveLength(3);

    // Chaque examen : lié au lot (prescriptionId), type + data conservés,
    // et les deux références de service présentes.
    const types = result.requests.map((r: any) => r.typeExamen);
    expect(types).toEqual(['BIOPSIE', 'EXTEMPORANE_STAT', 'FCV_PAP']);

    for (const r of result.requests) {
      expect(r.prescriptionId).toBe('lot-abc');
      expect(r.metadata.serviceIdSource).toBe('svc-source');
      expect(r.metadata.serviceIdDest).toBe('svc-anapath');
      expect(r.metadata.lotId).toBe('lot-abc');
      expect(r.metadata.alertes).toBe('Suspicion maligne');
    }

    // L'extemporané est bien marqué.
    const extempo = result.requests.find(
      (r: any) => r.typeExamen === 'EXTEMPORANE_STAT',
    );
    expect(extempo.isExtemporane).toBe(true);
    expect(extempo.prelevement.clinicalData).toEqual({
      organe: 'Ganglion',
      urgence_chirurgicale: 'oui',
    });
  });

  it('rejette une prescription sans aucun examen', async () => {
    const { service } = makeService();
    await expect(
      service.createFromPrescription({
        patientId: 'CHU-2026-00003',
        prescripteurId: 'presc-3',
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepte un payload Prescription complet (urgence omise + champs externe/saisie)', async () => {
    const { service, anapathService } = makeService();

    const result: any = await service.createFromPrescription({
      patientId: 'CHU-2026-00004',
      prescripteurId: 'presc-ext',
      // urgence omise → défaut NORMALE (aligné swagger Prescription)
      demandes: [
        { typeExamen: 'LIQUIDE', data: { type_liquide: 'LCR', volume: 5 } },
      ],
      chuId: 'chu-1',
      serviceIdSource: 'svc-source',
      serviceIdDest: 'svc-anapath',
      lotId: 'lot-xyz',
      prescripteurExterne: true,
      prescripteurNomManuel: 'Dupont',
      prescripteurPrenomManuel: 'Jean',
      prescripteurOnm: '12345',
      saisiParUserId: 'user-uuid',
      saisiParNom: 'Agent Accueil',
    } as any);

    expect(anapathService.create).toHaveBeenCalledTimes(1);
    expect(result.count).toBe(1);
    expect(result.requests[0].metadata.urgence).toBe('NORMALE');
    expect(result.requests[0].metadata.prescripteurExterne).toBe(true);
    expect(result.requests[0].metadata.prescripteurNomManuel).toBe('Dupont');
    expect(result.requests[0].metadata.prescripteurPrenomManuel).toBe('Jean');
    expect(result.requests[0].metadata.prescripteurOnm).toBe('12345');
    expect(result.requests[0].metadata.saisiParUserId).toBe('user-uuid');
    expect(result.requests[0].metadata.saisiParNom).toBe('Agent Accueil');
  });
});
