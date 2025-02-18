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

  async startImport() {
    await this.page.getByRole('button', { name: 'Import from Subscription' }).click();
  }
}
