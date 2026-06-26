export function getServiceDisplayName(data?: {
  episodeId?: string | null;
  source?: string | null;
  metadata?: Record<string, unknown> | null;
}): string {
  const meta = data?.metadata;
  if (meta?.sourceServiceName && String(meta.sourceServiceName).trim()) {
    return String(meta.sourceServiceName);
  }
  if (meta?.serviceId && String(meta.serviceId).trim()) {
    return String(meta.serviceId);
  }
  if (meta?.sourceServiceId && String(meta.sourceServiceId).trim()) {
    return String(meta.sourceServiceId);
  }
  if (data?.source && String(data.source).trim()) {
    return String(data.source);
  }
  if (data?.episodeId && String(data.episodeId).trim()) {
    return String(data.episodeId);
  }
  return 'Service inconnu';
}
