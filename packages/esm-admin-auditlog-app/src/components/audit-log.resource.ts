import { useMemo } from 'react';
import { openmrsFetch, restBaseUrl } from '@openmrs/esm-framework';
import dayjs from 'dayjs';
import useSWR from 'swr';
import { DATE_FILTER_FORMAT, ENTITY_TYPE_SAMPLE_SIZE } from '../constants';
import type { AuditLogFilterState, AuditLogResponse } from '../types';

/**
 * Derives the distinct entity types actually present in the audit data, so the
 * entity-type filter can offer every audited type as a searchable option without
 * hardcoding a list. Samples a large unfiltered page and extracts simple class names.
 *
 * Note: coverage is bounded by ENTITY_TYPE_SAMPLE_SIZE — types whose only revisions
 * fall outside the most recent sample won't appear. Adequate for typical volumes.
 */
export function useAuditEntityTypes() {
  const url = `${restBaseUrl}/auditlogs?page=0&size=${ENTITY_TYPE_SAMPLE_SIZE}`;
  const { data, error, isLoading } = useSWR<{ data: AuditLogResponse }, Error>(url, openmrsFetch, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  const entityTypes = useMemo(() => {
    const seen = new Set<string>();
    for (const log of data?.data?.logs ?? []) {
      const simpleName = log.entityType?.split('.').pop();
      if (simpleName) seen.add(simpleName);
    }
    return Array.from(seen).sort((a, b) => a.localeCompare(b));
  }, [data]);

  return { entityTypes, isLoading, error };
}

export function useAuditLogs(filters: AuditLogFilterState, page: number, size: number) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));

  const hasEntityType = Boolean(filters.entityType);
  const hasUsername = Boolean(filters.username?.trim());
  const startDate = dayjs(filters.startDate);
  const endDate = dayjs(filters.endDate);
  const hasStartDate = Boolean(filters.startDate) && startDate.isValid();
  const hasEndDate = Boolean(filters.endDate) && endDate.isValid();

  if (hasEntityType) params.set('entityType', filters.entityType);
  if (hasUsername) params.set('username', filters.username.trim());
  if (hasStartDate) params.set('startDate', startDate.format(DATE_FILTER_FORMAT));
  if (hasEndDate) params.set('endDate', endDate.format(DATE_FILTER_FORMAT));

  // Diffs are only returned server-side when at least one non-pagination filter is active.
  const hasActiveFilter = hasEntityType || hasUsername || hasStartDate || hasEndDate;

  const url = hasActiveFilter ? `${restBaseUrl}/auditlogs?${params.toString()}` : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR<{ data: AuditLogResponse }, Error>(
    url,
    openmrsFetch,
    {
      revalidateOnFocus: true,
      dedupingInterval: 2000,
    },
  );

  return {
    logs: data?.data?.logs ?? [],
    totalLogs: data?.data?.totalLogs ?? 0,
    totalPages: data?.data?.totalPages ?? 0,
    currentPage: data?.data?.currentPage ?? 0,
    isLoading,
    isValidating,
    error,
    mutate,
    hasActiveFilter,
  };
}
