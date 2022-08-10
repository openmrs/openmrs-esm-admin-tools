import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { formatDatetime } from '@openmrs/esm-framework';
import { renderWithSwr } from '../../../../../tools/test-helpers';
import { mockPreviousImports } from '../../../../../__mocks__/openconceptlab.mock';
import { Import } from '../../types';
import ImportOverview from './import-overview.component';

describe(`Import Overview component`, () => {
  it(`renders without dying`, () => {
    renderImportOverviewComponent(mockPreviousImports[0]);
  });

  it(`renders the fields`, async () => {
    renderImportOverviewComponent(mockPreviousImports[0]);
    await waitForLoadingToFinish();

    expect(screen.getByText('startedOn')).toBeVisible();
    expect(screen.getByText('completedOn')).toBeVisible();
    expect(screen.getByText('duration')).toBeVisible();
    expect(screen.getByText('result')).toBeVisible();
  });

  it(`renders the import details when no errored items`, async () => {
    const selectedImport = mockPreviousImports[0];

    renderImportOverviewComponent(selectedImport);
    await waitForLoadingToFinish();

    const startedTimeText = formatDatetime(selectedImport.localDateStarted);
    const stoppedTimeText = formatDatetime(selectedImport.localDateStopped);
    const upToDateItemsText = selectedImport.upToDateItemsCount + ' conceptsUpToDate';
    const addedItemsText = selectedImport.addedItemsCount + ' conceptsAdded';
    const updatedItemsText = selectedImport.updatedItemsCount + ' conceptsUpdated';
    const retiredItemsText = selectedImport.retiredItemsCount + ' conceptsRetired';
    const errorItemsText = selectedImport.errorItemsCount + ' errorsFound';
    const ignoredErrorsText = selectedImport.ignoredErrorsCount + ' errorsIgnored';

    expect(screen.getByText(startedTimeText)).toBeVisible();
    expect(screen.getByText(stoppedTimeText)).toBeVisible();
    expect(screen.getByText(upToDateItemsText)).toBeVisible();
    expect(screen.getByText(addedItemsText)).toBeVisible();
    expect(screen.getByText(updatedItemsText)).toBeVisible();
    expect(screen.getByText(retiredItemsText)).toBeVisible();
    expect(screen.getByText(errorItemsText)).toBeVisible();
    expect(screen.getByText(ignoredErrorsText)).toBeVisible();
  });

  it(`renders the import details when there are errored items`, async () => {
    const selectedImport = mockPreviousImports[1];

    renderImportOverviewComponent(selectedImport);
    await waitForLoadingToFinish();

    const startedTimeText = formatDatetime(selectedImport.localDateStarted);
    const stoppedTimeText = formatDatetime(selectedImport.localDateStopped);
    const upToDateItemsText = selectedImport.upToDateItemsCount + ' conceptsUpToDate';
    const addedItemsText = selectedImport.addedItemsCount + ' conceptsAdded';
    const updatedItemsText = selectedImport.updatedItemsCount + ' conceptsUpdated';
    const retiredItemsText = selectedImport.retiredItemsCount + ' conceptsRetired';
    const errorItemsText = selectedImport.errorItemsCount + ' errorsFound';
    const ignoredErrorsText = selectedImport.ignoredErrorsCount + ' errorsIgnored';

    expect(screen.getByText(startedTimeText)).toBeVisible();
    expect(screen.getByText(stoppedTimeText)).toBeVisible();
    expect(screen.getByText(upToDateItemsText)).toBeVisible();
    expect(screen.getByText(addedItemsText)).toBeVisible();
    expect(screen.getByText(updatedItemsText)).toBeVisible();
    expect(screen.getByText(retiredItemsText)).toBeVisible();
    expect(screen.getByText(errorItemsText)).toBeVisible();
    expect(screen.getByText(ignoredErrorsText)).toBeVisible();
  });
});

function renderImportOverviewComponent(importObject: Import) {
  renderWithSwr(<ImportOverview selectedImportObject={importObject} />);
}

function waitForLoadingToFinish() {
  return waitFor(() => {
    expect(screen.getByText('startedOn')).toBeVisible(), { timeout: 2000 };
  });
}
