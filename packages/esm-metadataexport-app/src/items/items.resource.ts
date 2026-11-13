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
 * Counts every item in a domain, retired ones included, since the picker lets either be selected
 * and the count is shown as the "of M" in "N of M". Only the total is needed, so it requests a single item.
 */
export function useMetadataItemCount(domain: MetadataDomain, shouldFetch = true) {
  const apiUrl = shouldFetch ? `${metadataItemsUrl}?domain=${domain}&includeAll=true&limit=1&totalCount=true` : null;
  const { data, error, isLoading } = useSWR<
    FetchResponse<{ results: Array<MetadataItem>; totalCount?: number }>,
    Error
  >(apiUrl, openmrsFetch);

  return { totalCount: data?.data?.totalCount, isLoading, error };
}

/**
 * Looks up saved item uuids so their names can be shown. A uuid the domain no longer exports
 * (deleted, or excluded from the build) maps to `null`. A lookup that fails for another reason
 * leaves its uuid out of `itemsByUuid` and adds it to `failedUuids`, so the other lookups still count.
 */
export function useMetadataItemsByUuid(domain: MetadataDomain, uuids: Array<string>) {
  const { data, error, isLoading } = useSWR<MetadataItemLookupResult, Error>(
    uuids.length ? ['metadataexport-items', domain, ...uuids] : null,
    () => fetchMetadataItemsByUuid(domain, uuids),
  );

  const failedUuids = error ? new Set(uuids) : data?.failedUuids ?? noFailedUuids;
  return { itemsByUuid: data?.itemsByUuid, failedUuids, isLoading };
}

interface MetadataItemLookupResult {
  itemsByUuid: Map<string, MetadataItem | null>;
  failedUuids: ReadonlySet<string>;
}

const noFailedUuids: ReadonlySet<string> = new Set();

async function fetchMetadataItemsByUuid(domain: MetadataDomain, uuids: Array<string>) {
  const settledLookups = await Promise.allSettled(uuids.map((uuid) => fetchMetadataItem(domain, uuid)));
  const result = { itemsByUuid: new Map<string, MetadataItem | null>(), failedUuids: new Set<string>() };
  settledLookups.forEach((lookup, index) => {
    if (lookup.status === 'fulfilled') {
      result.itemsByUuid.set(...lookup.value);
    } else {
      result.failedUuids.add(uuids[index]);
    }
  });
  // Nothing resolved, so throw and let SWR retry. Lookups that failed next to successful ones
  // are retried with a new key once the successful ones are cached.
  if (result.itemsByUuid.size === 0) {
    throw (settledLookups[0] as PromiseRejectedResult).reason;
  }
  return result;
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
