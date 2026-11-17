import useSWR from 'swr';
import type { TFunction } from 'i18next';
import { type FetchResponse, openmrsFetch, restBaseUrl } from '@openmrs/esm-framework';
import { type ExportPackageEntry, type MetadataDomain } from '../types';

export function useDomains() {
  const apiUrl = `${restBaseUrl}/metadataexport/domains`;
  const { data, error, isLoading, isValidating, mutate } = useSWR<FetchResponse<Array<MetadataDomain>>, Error>(
    apiUrl,
    openmrsFetch,
  );

  return {
    domains: data?.data ?? [],
    isLoading,
    isValidating,
    error,
    mutate,
  };
}

export function getDomains(): Promise<FetchResponse<Array<MetadataDomain>>> {
  const apiUrl = `${restBaseUrl}/metadataexport/domains`;
  return openmrsFetch(apiUrl);
}

/**
 * Converts a domain identifier such as `ENCOUNTER_TYPES` into a human readable
 * label such as `Encounter types`.
 */
export function formatDomainLabel(domain: MetadataDomain): string {
  const text = domain.replace(/_/g, ' ').trim().toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Lists a package's domains for display, such as `Roles (12 items), Encounter types`. A domain narrowed to
 * chosen items says how many, so it doesn't read as the whole domain. An empty list means every domain.
 * The extractor doesn't scan this file, so its translation keys are marked in packages-table.component.tsx.
 */
export function formatPackageDomains(entries: Array<ExportPackageEntry>, t: TFunction): string {
  if (!entries.length) {
    return t('allDomains', 'All domains');
  }

  return entries
    .map((entry) =>
      entry.itemUuids?.length
        ? t('domainWithItemCount', '{{domain}} ({{count}} items)', {
            domain: formatDomainLabel(entry.domain),
            count: entry.itemUuids.length,
          })
        : formatDomainLabel(entry.domain),
    )
    .join(', ');
}
