import { expect } from '@playwright/test';
import { getSavedSubscription, removeOclSubscription } from '../commands';
import { test } from '../core';
import { OpenConceptLabPage } from '../pages';

test.beforeEach(async ({ api }) => {
  const savedSubscription = await getSavedSubscription(api);
  if (savedSubscription) {
    await removeOclSubscription(api, savedSubscription);
  }
});

test('should be able to setup a subscription and import concepts', async ({ page }) => {
  const openConceptLabPage = new OpenConceptLabPage(page);

  // Setup the subscription
  await openConceptLabPage.goto();
  await openConceptLabPage.addOclSubscription();

  // Start an Import
  await openConceptLabPage.importTab().click();
  await openConceptLabPage.startImport();

  // Check results of the import
  await openConceptLabPage.goto();
  await openConceptLabPage.previousImportsTab().click();
  await expect(openConceptLabPage.previousImportsTable()).toHaveText(/\d+ items fetched/);

  // Unsubscribe
  await openConceptLabPage.subscriptionTab().click();
  await openConceptLabPage.unsubscribe();
});

test.afterEach(async ({ api }) => {
  const savedSubscription = await getSavedSubscription(api);
  if (savedSubscription) {
    await removeOclSubscription(api, savedSubscription);
  }
});
