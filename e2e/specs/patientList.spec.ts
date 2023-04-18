import { test } from '../core';
import { OpenConceptLabPage } from '../pages';

test('should be able to add an OCL subscription', async ({ page }) => {
  const openConceptLabPage = new OpenConceptLabPage(page);
  await openConceptLabPage.goto();
});

// TODO: Identify the test cases and add them here
