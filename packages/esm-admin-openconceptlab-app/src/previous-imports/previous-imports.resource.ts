import { openmrsFetch } from '@openmrs/esm-framework';
import useSWR from 'swr';
import { Import } from '../types';

export function usePreviousImports() {
  const { data, error, isValidating } = useSWR<{ data: { results: Import[] } }, Error>(
    '/ws/rest/v1/openconceptlab/import?v=full',
    openmrsFetch,
  );

  return {
    data: data?.data?.results,
    isLoading: !data && !error,
    isError: error,
    isValidating,
  };
}
