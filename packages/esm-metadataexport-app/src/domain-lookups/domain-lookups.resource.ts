import useSWR from 'swr';
import { type FetchResponse, openmrsFetch, restBaseUrl } from '@openmrs/esm-framework';
import { type MetadataDomain } from '../types';

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
