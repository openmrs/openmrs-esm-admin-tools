import useSWR from 'swr';
import { openmrsFetch, type FetchResponse } from '@openmrs/esm-framework';
import type { AuditLogDetail, AuditLogFilters, AuditLogPageResponse } from './audit-log.types';

const BASE_URL = '/module/auditlog/rest/auditlogs';

export function useAuditLogs(filters: AuditLogFilters, startIndex: number, limit: number) {
  const params = new URLSearchParams();

  if (filters.userUuid) params.set('user', filters.userUuid.trim());
  if (filters.action) params.set('action', filters.action);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  params.set('startIndex', String(startIndex));
  params.set('limit', String(limit));

  const url = `${BASE_URL}?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<FetchResponse<AuditLogPageResponse>>(url, openmrsFetch);

  return {
    logs: data?.data?.results ?? [],
    totalCount: data?.data?.resultsCount ?? 0,
    isLoading,
    error,
    mutate,
  };
}

export function useAuditLogDetail(uuid: string | null) {
  const url = uuid ? `${BASE_URL}/${uuid}` : null;
  const { data, error, isLoading } = useSWR<FetchResponse<AuditLogDetail>>(url, openmrsFetch);
  return {
    detail: data?.data ?? null,
    isLoading,
    error,
  };
}
