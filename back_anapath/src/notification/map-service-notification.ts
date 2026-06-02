import { NotificationType } from './dto/receive-notification.dto';
import { ServiceNotificationInboundDto } from './dto/service-notification-inbound.dto';

const TYPE_MAP: Record<string, NotificationType> = {
  RESULTAT_EXAMEN: NotificationType.RESULTAT_DISPONIBLE,
  DEMANDE_EXAMEN: NotificationType.STAT_ALERT,
  TRANSFUSION: NotificationType.URGENT,
  STOCK_CRITIQUE: NotificationType.URGENT,
  COMMANDE_SANG: NotificationType.URGENT,
  AVIS_INTER_SERVICE: NotificationType.URGENT,
};

export function mapServiceNotificationInbound(dto: ServiceNotificationInboundDto) {
  const urgence = dto.urgence ?? 3;
  const priority = urgence >= 4 ? 'high' : urgence >= 3 ? 'medium' : 'low';

  const typeLabel = dto.type.replace(/_/g, ' ');
  const source = dto.sourceServiceName ?? dto.sourceServiceId;

  return {
    type: TYPE_MAP[dto.type] ?? NotificationType.INFO,
    title: `${typeLabel} — ${source}`,
    message: dto.motif,
    priority,
    source: 'service-notification',
    metadata: {
      patientId: dto.patientId,
      externalNotificationId: dto.id,
      sourceServiceId: dto.sourceServiceId,
      sourceServiceName: dto.sourceServiceName,
      targetServiceId: dto.targetServiceId,
      targetServiceName: dto.targetServiceName,
      serviceNotificationType: dto.type,
      anapathId: dto.payload?.anapathId,
      ...dto.payload,
    },
    read: false,
  };
}

export function isServiceNotificationPayload(body: Record<string, unknown>): boolean {
  return (
    typeof body.motif === 'string' &&
    typeof body.targetServiceId === 'string' &&
    typeof body.sourceServiceId === 'string' &&
    typeof body.type === 'string'
  );
}
