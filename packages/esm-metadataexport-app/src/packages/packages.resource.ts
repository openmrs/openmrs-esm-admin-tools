import useSWR from 'swr';
import { type FetchResponse, openmrsFetch, restBaseUrl } from '@openmrs/esm-framework';
import type { ExportPackage, ExportPackageRequest, ExportPackageBuild } from '../types';

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
): Promise<FetchResponse<ExportPackage>> {
  return openmrsFetch<ExportPackage>(`${restBaseUrl}/metadataexport/packages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    signal: abortController?.signal,
  });
}

export function usePackageBuilds(uuid: string) {
  const apiUrl = `${restBaseUrl}/metadataexport/packages/${uuid}/builds`;
  const { data, error, isLoading, isValidating, mutate } = useSWR<FetchResponse<Array<ExportPackageBuild>>, Error>(
    apiUrl,
    openmrsFetch,
  );
  return {
    builds: data?.data ?? [],
    isLoading,
    isValidating,
    error,
    mutate,
  };
}

export function triggerBuild(
  uuid: String,
  abortController?: AbortController,
): Promise<FetchResponse<ExportPackageBuild>> {
  return openmrsFetch<ExportPackageBuild>(`${restBaseUrl}/metadataexport/packages/${uuid}/builds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: abortController?.signal,
  });
}

export function deleteBuild(
  uuid: String,
  reason?: string,
  abortController?: AbortController,
): Promise<FetchResponse<void>> {
  return openmrsFetch<void>(`${restBaseUrl}/metadataexport/packages/${uuid}?reason=${reason}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    signal: abortController?.signal,
  });
}
