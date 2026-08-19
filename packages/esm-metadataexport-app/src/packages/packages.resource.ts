import useSWR from 'swr';
import { type FetchResponse, openmrsFetch, restBaseUrl } from '@openmrs/esm-framework';
import { type ExportPackage, type ExportPackageRequest } from '../types/index';

export function useAllPackages(includeRetired = false) {
  const apiUrl = `${restBaseUrl}/metadataexport/packages?includeRetired=${includeRetired}`;
  const { data, error, isLoading, isValidating, mutate } = useSWR<FetchResponse<Array<ExportPackage>>, Error>(
    apiUrl,
    openmrsFetch,
  );

  return {
    packages: data?.data ?? [],
    isLoading,
    isValidating,
    error,
    mutate,
  };
}

export function createPackage(
  payload: ExportPackageRequest,
  abortController?: AbortController,
): Promise<FetchResponse<ExportPackageRequest>> {
  return openmrsFetch(`${restBaseUrl}/metadataexport/packages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    signal: abortController?.signal,
  });
}
