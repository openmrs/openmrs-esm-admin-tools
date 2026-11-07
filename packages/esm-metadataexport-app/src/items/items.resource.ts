import useSWR from 'swr';
import {
  type FetchResponse,
  OpenmrsFetchError,
  openmrsFetch,
  restBaseUrl,
  useOpenmrsPagination,
} from '@openmrs/esm-framework';
import type { MetadataDomain, MetadataItem } from '../types';

const metadataItemsUrl = `${restBaseUrl}/metadataexport/items`;

/**
 * Searches the exportable items of one domain. Paging happens on the server, so large domains
 * such as concepts are never loaded whole.
 */
export function useMetadataItems(
  domain: MetadataDomain,
  searchTerm: string,
  includeRetired: boolean,
  pageSize: number,
) {
  const searchParams = new URLSearchParams({ domain, includeAll: String(includeRetired), v: 'default' });
  if (searchTerm) {
    searchParams.set('q', searchTerm);
  }
  const apiUrl = domain ? `${metadataItemsUrl}?${searchParams.toString()}` : null;

  const { data, error, isLoading, isValidating, currentPage, totalCount, goTo } = useOpenmrsPagination<MetadataItem>(
    apiUrl,
    pageSize,
    { swrConfig: { keepPreviousData: true } },
  );

  return { items: data ?? [], totalCount, currentPage, goTo, isLoading, isValidating, error };
}

/**
 * Counts the non-retired items in a domain. Only the total is needed, so it requests a single item.
 */
export function useMetadataItemCount(domain: MetadataDomain, shouldFetch = true) {
  const apiUrl = shouldFetch ? `${metadataItemsUrl}?domain=${domain}&limit=1&totalCount=true` : null;
  const { data, error, isLoading } = useSWR<
    FetchResponse<{ results: Array<MetadataItem>; totalCount?: number }>,
    Error
  >(apiUrl, openmrsFetch);

  return { totalCount: data?.data?.totalCount, isLoading, error };
}

/**
 * Looks up saved item uuids so their names can be shown. A uuid the domain no longer exports
 * (deleted, or excluded from the build) maps to `null`.
 */
export function useMetadataItemsByUuid(domain: MetadataDomain, uuids: Array<string>) {
  const { data, error, isLoading } = useSWR<Map<string, MetadataItem | null>, Error>(
    uuids.length ? ['metadataexport-items', domain, ...uuids] : null,
    () => fetchMetadataItemsByUuid(domain, uuids),
  );

  return { itemsByUuid: data, isLoading, error };
}

async function fetchMetadataItemsByUuid(domain: MetadataDomain, uuids: Array<string>) {
  const uuidItemPairs = await Promise.all(uuids.map((uuid) => fetchMetadataItem(domain, uuid)));
  return new Map(uuidItemPairs);
}

async function fetchMetadataItem(domain: MetadataDomain, uuid: string): Promise<[string, MetadataItem | null]> {
  try {
    const { data: item } = await openmrsFetch<MetadataItem>(`${metadataItemsUrl}/${uuid}?domain=${domain}`);
    return [uuid, item];
  } catch (error) {
    const isNotFound = error instanceof OpenmrsFetchError && error.response?.status === 404;
    if (isNotFound) {
      return [uuid, null];
    }
    throw error;
  }
}
