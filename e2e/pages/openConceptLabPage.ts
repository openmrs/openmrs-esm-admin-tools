import { Page } from '@playwright/test';

export class OpenConceptLabPage {
  constructor(readonly page: Page) {}

  async goto() {
    await this.page.goto('ocl');
  }
}
