import useSWR from 'swr';
import { type FetchResponse, openmrsFetch, restBaseUrl, useOpenmrsPagination } from '@openmrs/esm-framework';
import type { ExportBuildStatus, ExportPackage, ExportPackageRequest, ExportPackageBuild } from '../types';

export function usePackages(pageSize: number, includeRetired = false) {
  // entries and latestBuild are only present in the full representation.
  const apiUrl = `${restBaseUrl}/metadataexport/packages?includeAll=${includeRetired}&v=full`;
  const { data, error, isLoading, isValidating, currentPage, currentPageSize, totalCount, goTo, mutate } =
    useOpenmrsPagination<ExportPackage>(apiUrl, pageSize);

  return {
    packages: data ?? [],
    totalCount,
    currentPage,
    currentPageSize,
    goTo,
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

export function usePackage(uuid: string) {
  const { data, error, isLoading } = useSWR<FetchResponse<ExportPackage>, Error>(
    uuid ? `${restBaseUrl}/metadataexport/packages/${uuid}?v=full` : null,
    openmrsFetch,
  );
  return { exportPackage: data?.data, isLoading, error };
}

export function usePackageBuilds(uuid: string) {
  // Search responses default to the ref representation; request default so version, status and dates are present.
  const apiUrl = uuid ? `${restBaseUrl}/metadataexport/builds?package=${uuid}&v=default` : null;
  const activeBuildStatuses: Array<ExportBuildStatus> = ['QUEUED', 'RUNNING'];

  const { data, error, isLoading, isValidating, mutate } = useSWR<
    FetchResponse<{ results: Array<ExportPackageBuild> }>,
    Error
  >(apiUrl, openmrsFetch, {
    refreshInterval: (data) => {
      const builds = data?.data?.results ?? [];

      const hasActiveBuild = builds.some((build) => activeBuildStatuses.includes(build.status));

      return hasActiveBuild ? 2000 : 0;
    },
  });

  return {
    builds: data?.data?.results ?? [],
    isLoading,
    isValidating,
    error,
    mutate,
  };
}

export function triggerBuild(
  uuid: string,
  abortController?: AbortController,
): Promise<FetchResponse<ExportPackageBuild>> {
  return openmrsFetch<ExportPackageBuild>(`${restBaseUrl}/metadataexport/builds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { package: uuid },
    signal: abortController?.signal,
  });
}

export function deletePackage(
  uuid: string,
  reason?: string,
  abortController?: AbortController,
): Promise<FetchResponse<void>> {
  return openmrsFetch<void>(
    `${restBaseUrl}/metadataexport/packages/${uuid}?reason=${encodeURIComponent(reason ?? '')}`,
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      signal: abortController?.signal,
    },
  );
}

export function editPackage(
  uuid: string,
  payload: ExportPackageRequest,
  abortController?: AbortController,
): Promise<FetchResponse<ExportPackage>> {
  return openmrsFetch<ExportPackage>(`${restBaseUrl}/metadataexport/packages/${uuid}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    signal: abortController?.signal,
  });
}
