import { type Page, expect } from '@playwright/test';

export class OpenConceptLabPage {
  constructor(readonly page: Page) {}

  readonly subscriptionTab = () => this.page.getByRole('tab', { name: 'Subscription' });
  readonly importTab = () => this.page.getByRole('tab', { name: 'Import', exact: true });
  readonly previousImportsTab = () => this.page.getByRole('tab', { name: 'Previous Imports' });
  readonly previousImportsTable = () => this.page.getByRole('table');

  async goto() {
    await this.page.goto('ocl');
  }

  async addOclSubscription() {
    await expect(this.page.getByRole('heading', { name: /ocl subscription module/i })).toBeVisible();
    await this.page.getByLabel('Subscription URL').fill(process.env.E2E_OCL_SUBSCRIPTION_URL);
    await this.page.getByLabel('Token').fill(process.env.E2E_OCL_TOKEN);
    await this.page.getByRole('button', { name: 'Save Changes' }).click();
  }

  async startImport() {
    await this.page.getByRole('button', { name: 'Import from Subscription' }).click();
  }

  async unsubscribe() {
    await this.page.getByRole('button', { name: 'Unsubscribe' }).click();
  }
}
