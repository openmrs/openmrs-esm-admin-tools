import { Page } from '@playwright/test';
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

test('Setup a subscription and import concepts', async ({ page }) => {
  const openConceptLabPage = new OpenConceptLabPage(page);

  await test.step('When I go to the "OCL module page"', async () => {
    await openConceptLabPage.goto();
  });

  await test.step('And I enter the subscription URL', async () => {
    await openConceptLabPage.page.getByLabel('Subscription URL').fill(process.env.E2E_OCL_SUBSCRIPTION_URL);
  });

  await test.step('And I enter the token', async () => {
    await openConceptLabPage.page.getByLabel('Token').fill(process.env.E2E_OCL_TOKEN || '');
  });

  await test.step('And I click the save button', async () => {
    await openConceptLabPage.page.getByRole('button', { name: 'Save Changes' }).click();
  });

  await test.step('And I click the Import tab', async () => {
    await openConceptLabPage.importTab().click();
  });

  await test.step('And I click the Import from Subscription button', async () => {
    await openConceptLabPage.startImport();
  });

  await test.step('And I refresh the page and go to the previous imports tab', async () => {
    await openConceptLabPage.goto();
    await openConceptLabPage.previousImportsTab().click();
  });

  await test.step('Then I should see the previous imports', async () => {
    await expect(openConceptLabPage.previousImportsTable()).toHaveText(/\d+ items fetched/);
  });

  await test.step('And I click the Subscription Tab', async () => {
    await openConceptLabPage.subscriptionTab().click();
  });

  await test.step('And I unsubscribe', async () => {
    await openConceptLabPage.page.getByRole('button', { name: 'Unsubscribe' }).click();
  });

  await test.step('Then I should see the unsubscribe message', async () => {
    await openConceptLabPage.page.getByText('Subscription created successfully');
  });
});

test.afterEach(async ({ api }) => {
  const savedSubscription = await getSavedSubscription(api);
  if (savedSubscription) {
    await removeOclSubscription(api, savedSubscription);
  }
});
