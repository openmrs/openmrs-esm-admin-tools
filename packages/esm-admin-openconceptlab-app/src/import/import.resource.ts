import { openmrsFetch } from '@openmrs/esm-framework';
import useSWR from 'swr';
import type { Import, Subscription } from '../types';

export function useSubscription() {
  const { data, error, isValidating } = useSWR<{ data: { results: Subscription[] } }, Error>(
    '/ws/rest/v1/openconceptlab/subscription?v=full',
    openmrsFetch,
  );

  return {
    data: data?.data?.results[0],
    isLoading: !data && !error,
    isError: error,
    isValidating,
  };
}

export async function startImportWithSubscription(abortController?: AbortController) {
  const url = '/ws/rest/v1/openconceptlab/import';
  return openmrsFetch<Import>(url, {
    method: 'POST',
    body: {},
    headers: {
      'Content-Type': 'application/json',
    },
    signal: abortController?.signal,
  });
}

export async function startImportWithFile(file: File, abortController?: AbortController) {
  const url = '/ws/rest/v1/openconceptlab/import';
  const formData: FormData = new FormData();
  formData.append('file', file);
  return openmrsFetch<Import>(url, {
    method: 'POST',
    body: formData,
    signal: abortController?.signal,
  });
}
