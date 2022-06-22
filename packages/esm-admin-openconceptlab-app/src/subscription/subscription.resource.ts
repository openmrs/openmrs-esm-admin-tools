import { openmrsFetch } from '@openmrs/esm-framework';
import useSWR from 'swr';
import { Subscription } from '../types';
import { isNil } from 'lodash-es';

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

export async function updateSubscription(subscription: Subscription, abortController?: AbortController) {
  const url = isNil(subscription.uuid)
    ? '/ws/rest/v1/openconceptlab/subscription'
    : `/ws/rest/v1/openconceptlab/subscription/${subscription.uuid}`;
  return openmrsFetch<Subscription>(url, {
    method: 'POST',
    body: subscription,
    headers: {
      'Content-Type': 'application/json',
    },
    signal: abortController?.signal,
  });
}

export async function deleteSubscription(subscription: Subscription, abortController?: AbortController) {
  const url = `/ws/rest/v1/openconceptlab/subscription/${subscription.uuid}`;
  return openmrsFetch<Subscription>(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    signal: abortController?.signal,
  });
}
