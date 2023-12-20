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

  await test.step('When the user setup the subscription', async () => {
  await openConceptLabPage.goto();
  await openConceptLabPage.addOclSubscription();
  });

  await test.step('And the user starts and import', async () => {
  await openConceptLabPage.importTab().click();
  await openConceptLabPage.startImport();
  });

  await test.step('Then the import results should show in the test report', async () => {
  await openConceptLabPage.goto();
  await openConceptLabPage.previousImportsTab().click();
  await expect(openConceptLabPage.previousImportsTable()).toHaveText(/\d+ items fetched/);
  });

  await test.step('And the user unsubscribes', async () => {
  await openConceptLabPage.subscriptionTab().click();
  await openConceptLabPage.unsubscribe();
  });
});

test.afterEach(async ({ api }) => {
  const savedSubscription = await getSavedSubscription(api);
  if (savedSubscription) {
    await removeOclSubscription(api, savedSubscription);
  }
});
