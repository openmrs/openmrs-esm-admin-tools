import { type APIRequestContext, expect } from '@playwright/test';

export interface Subscription {
  uuid: string;
  url: string;
  token: string;
  subscribedToSnapshot?: boolean;
  validationType?: 'NONE' | 'FULL';
}

export const getSavedSubscription = async (api: APIRequestContext): Promise<Subscription> => {
  const subscriptionRes = await api.get('openconceptlab/subscription?v=full');
  await expect(subscriptionRes.ok()).toBeTruthy();
  const { results } = await subscriptionRes.json();
  return results[0];
};

export const removeOclSubscription = async (api: APIRequestContext, subscription: Subscription) => {
  await api.delete(`openconceptlab/subscription/${subscription.uuid}`);
};
