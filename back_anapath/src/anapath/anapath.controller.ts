import { Controller, Get, Patch, Param, Post, Put, Body, HttpCode, Header, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { AnapathService } from './anapath.service';
import { UpdateAnapathDto } from './dto/update-anapath.dto';
import { ValidateAnapathDto } from './dto/validate-anapath.dto';
import { AnapathRequest } from './entities/anapath-request.entity';
import { ChuClient } from '../common/clients/chu.client';
import { AccueilClient } from '../common/clients/accueil.client';

function sortNotifications(notifs: any[]): any[] {
  const urgencePriority: Record<string, number> = { STAT: 1, URGENTE: 2, NORMALE: 3 };
  return [...notifs].sort((a, b) => {
    const pa = urgencePriority[a.urgence ?? a.metadata?.urgence ?? a.priority ?? 'NORMALE'] ?? 3;
    const pb = urgencePriority[b.urgence ?? b.metadata?.urgence ?? b.priority ?? 'NORMALE'] ?? 3;
    if (pa !== pb) return pa - pb;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

@ApiTags('anapath')
@Controller('anapath')
export class AnapathController {
  constructor(
    private readonly service: AnapathService,
    private readonly chuClient: ChuClient,
    private readonly accueilClient: AccueilClient,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lister toutes les demandes' })
  @ApiResponse({ status: 200, description: 'Liste des demandes', type: [AnapathRequest] })
  @Header('Content-Type', 'application/json; charset=utf-8')
  findAll() {
    return this.service.findAll();
  }

  @Get('chu')
  @ApiOperation({ summary: 'Lister tous les CHU' })
  @Header('Content-Type', 'application/json; charset=utf-8')
  getChus() {
    return this.chuClient.getAllChus();
  }

  @Get('chu/:chuId/services')
  @ApiOperation({ summary: "Lister les services d'un CHU" })
  @ApiParam({ name: 'chuId', description: 'UUID du CHU' })
  @Header('Content-Type', 'application/json; charset=utf-8')
  getServicesByChu(@Param('chuId') chuId: string) {
    return this.chuClient.getServicesByChu(chuId);
  }

  @Get('service/anapath')
  @ApiOperation({ summary: 'Infos du service Anatomie Pathologique' })
  @Header('Content-Type', 'application/json; charset=utf-8')
  getAnapathService() {
    return this.chuClient.getAnapathServiceInfo();
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Notifications du service Anapath' })
  @Header('Content-Type', 'application/json; charset=utf-8')
  async getNotifications() {
    const base =
      process.env.NOTIF_SERVICE_URL ??
      'https://prescription-back-7m7a.onrender.com';
    const svcId =
      process.env.ANAPATH_SERVICE_ID ??
      '14a94274-db57-49e3-9375-1e642729b92b';
    try {
      const res = await fetch(`${base}/notifications/service/${svcId}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return [];
      const notifs = await res.json();
      if (!Array.isArray(notifs)) return [];

      const enriched = await Promise.all(
        notifs.map(async (n: any) => {
          const anapathId =
            n.metadata?.anapathId ?? n.referenceId ?? n.examId;
          if (!anapathId) return n;

          try {
            const examen = await this.service.findByAnapathId(anapathId);
            if (!examen) return n;

            const metadata = examen.metadata as Record<string, unknown> | null;
            return {
              ...n,
              enriched: {
                anapathId: examen.anapathId,
                typeExamen: examen.typeExamen,
                statut: examen.statut,
                urgence:
                  (metadata?.urgence as string) ??
                  (examen.isExtemporane ? 'STAT' : 'NORMALE'),
                serviceNom:
                  (metadata?.serviceNom as string) ??
                  (metadata?.serviceId as string) ??
                  '—',
                patientId: examen.patientId,
                createdAt: examen.createdAt,
                lu:
                  examen.notificationLue &&
                  ['RESULTAT_DISPONIBLE', 'VALIDE', 'ARCHIVE'].includes(
                    examen.statut,
                  ),
              },
            };
          } catch {
            return n;
          }
        }),
      );

      return enriched;
    } catch (e) {
      console.warn('Notifications indisponibles:', e);
      return [];
    }
  }

  @Get('notifications/non-lues')
  @ApiOperation({ summary: 'Notifications non lues' })
  @Header('Content-Type', 'application/json; charset=utf-8')
  async getUnread() {
    const base = process.env.NOTIF_SERVICE_URL
      ?? 'https://prescription-back-7m7a.onrender.com';
    const svcId = process.env.ANAPATH_SERVICE_ID
      ?? '14a94274-db57-49e3-9375-1e642729b92b';
    try {
      const res = await fetch(
        `${base}/notifications/non-lues/${svcId}`,
        { signal: AbortSignal.timeout(5000) },
      );
      if (!res.ok) return [];
      const data = await res.json();
      return sortNotifications(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('Non-lues indisponibles:', e);
      return [];
    }
  }

  @Put('notifications/:id/lire')
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  @ApiParam({ name: 'id', description: 'UUID de la notification' })
  @Header('Content-Type', 'application/json; charset=utf-8')
  async markAsRead(@Param('id') id: string) {
    const base = process.env.NOTIF_SERVICE_URL
      ?? 'https://prescription-back-7m7a.onrender.com';
    try {
      const res = await fetch(
        `${base}/notifications/${id}/lire`,
        { method: 'PUT', signal: AbortSignal.timeout(5000) },
      );
      return res.ok ? res.json() : { success: false };
    } catch {
      return { success: false };
    }
  }

  @Get(':id/patient')
  @ApiOperation({ summary: "Récupérer les infos patient d'un examen depuis Accueil" })
  @ApiParam({ name: 'id', description: 'UUID de la demande' })
  @Header('Content-Type', 'application/json; charset=utf-8')
  async getPatientForExamen(@Param('id') id: string) {
    const examen = await this.service.findOneEntity(id);
    if (!examen) throw new NotFoundException('Examen non trouvé');

    if (examen.patientInfo?.nomComplet || (examen.patientInfo as any)?.nom) {
      return examen.patientInfo;
    }

    const patient = await this.accueilClient.getPatient(
      examen.patientId,
      (examen.metadata?.chuId as string) ?? '',
    );
    if (patient) return patient;

    return {
      nomComplet: examen.patientId,
      patientId: examen.patientId,
      age: null,
      sexe: null,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir une demande par son ID' })
  @ApiParam({ name: 'id', description: 'UUID de la demande' })
  @ApiResponse({ status: 200, description: 'Demande trouvée', type: AnapathRequest })
  @ApiResponse({ status: 404, description: 'Demande non trouvée' })
  @Header('Content-Type', 'application/json; charset=utf-8')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/notification-lue')
  @ApiOperation({ summary: 'Marquer notif comme lue pour cet examen' })
  @Header('Content-Type', 'application/json; charset=utf-8')
  async marquerNotifLue(@Param('id') id: string) {
    let examen = await this.service.findByAnapathId(id);
    if (!examen) {
      try {
        examen = await this.service.findOneEntity(id);
      } catch {
        throw new NotFoundException();
      }
    }
    examen.notificationLue = true;
    examen.notificationLueAt = new Date();
    await this.service.save(examen);

    const base =
      process.env.NOTIF_SERVICE_URL ??
      'https://prescription-back-7m7a.onrender.com';
    const svcId =
      process.env.ANAPATH_SERVICE_ID ??
      '14a94274-db57-49e3-9375-1e642729b92b';
    try {
      const res = await fetch(`${base}/notifications/service/${svcId}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const notifs = await res.json();
        const matching = Array.isArray(notifs)
          ? notifs.filter(
              (n: any) =>
                n.metadata?.anapathId === examen.anapathId ||
                n.referenceId === examen.anapathId ||
                n.examId === examen.anapathId,
            )
          : [];
        await Promise.all(
          matching.map((n: any) =>
            fetch(`${base}/notifications/${n.id ?? n._id}/lire`, {
              method: 'PUT',
              signal: AbortSignal.timeout(3000),
            }).catch(() => {}),
          ),
        );
      }
    } catch (e) {
      console.warn('Marquage notif externe échoué:', e);
    }

    return { success: true };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une demande (résultat, statut)' })
  @ApiParam({ name: 'id', description: 'UUID de la demande' })
  @ApiResponse({ status: 200, description: 'Demande mise à jour', type: AnapathRequest })
  @ApiResponse({ status: 404, description: 'Demande non trouvée' })
  @Header('Content-Type', 'application/json; charset=utf-8')
  update(@Param('id') id: string, @Body() dto: UpdateAnapathDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/validate')
  @ApiOperation({ summary: 'Valider une demande avec signature numérique' })
  @ApiParam({ name: 'id', description: 'UUID de la demande' })
  @ApiBody({ type: ValidateAnapathDto })
  @ApiResponse({ status: 200, description: 'Demande validée avec succès', type: AnapathRequest })
  @ApiResponse({ status: 400, description: 'Validation impossible (déjà validée ou résultat non disponible)' })
  @ApiResponse({ status: 404, description: 'Demande non trouvée' })
  @HttpCode(200)
  @Header('Content-Type', 'application/json; charset=utf-8')
  validate(@Param('id') id: string, @Body() dto: ValidateAnapathDto) {
    return this.service.validate(id, dto);
  }
}
