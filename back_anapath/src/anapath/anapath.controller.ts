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
    const url = `${process.env.NOTIF_SERVICE_URL ?? 'https://prescription-back-7m7a.onrender.com'}/notifications/service/${process.env.ANAPATH_SERVICE_ID ?? '14a94274-db57-49e3-9375-1e642729b92b'}`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return [];
      const data = await res.json();
      return sortNotifications(Array.isArray(data) ? data : []);
    } catch {
      return [];
    }
  }

  @Get('notifications/non-lues')
  @ApiOperation({ summary: 'Notifications non lues' })
  @Header('Content-Type', 'application/json; charset=utf-8')
  async getUnread() {
    const url = `${process.env.NOTIF_SERVICE_URL ?? 'https://prescription-back-7m7a.onrender.com'}/notifications/non-lues/${process.env.ANAPATH_SERVICE_ID ?? '14a94274-db57-49e3-9375-1e642729b92b'}`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return [];
      const data = await res.json();
      return sortNotifications(Array.isArray(data) ? data : []);
    } catch {
      return [];
    }
  }

  @Put('notifications/:id/lire')
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  @ApiParam({ name: 'id', description: 'UUID de la notification' })
  @Header('Content-Type', 'application/json; charset=utf-8')
  async markAsRead(@Param('id') id: string) {
    const url = `${process.env.NOTIF_SERVICE_URL ?? 'https://prescription-back-7m7a.onrender.com'}/notifications/${id}/lire`;
    try {
      const res = await fetch(url, {
        method: 'PUT',
        signal: AbortSignal.timeout(5000),
      });
      return res.ok ? res.json() : { success: false };
    } catch {
      return { success: false };
    }
  }

  @Get()
  @ApiOperation({ summary: 'Lister toutes les demandes' })
  @ApiResponse({ status: 200, description: 'Liste des demandes', type: [AnapathRequest] })
  @Header('Content-Type', 'application/json; charset=utf-8')
  findAll() {
    return this.service.findAll();
  }

  @Get(':id/patient')
  @ApiOperation({ summary: "Récupérer les infos patient d'un examen depuis Accueil" })
  @ApiParam({ name: 'id', description: 'UUID de la demande' })
  @Header('Content-Type', 'application/json; charset=utf-8')
  async getPatientForExamen(@Param('id') id: string) {
    const examen = await this.service.findOneEntity(id);
    if (!examen) throw new NotFoundException();

    if (examen.patientInfo) return examen.patientInfo;

    const patient = await this.accueilClient.getPatient(
      examen.patientId,
      (examen.metadata?.chuId as string) ?? '',
    );
    return (
      patient ?? {
        nomComplet: examen.patientId,
        age: null,
        sexe: null,
      }
    );
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
