import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { usePagination } from '@openmrs/esm-framework';
import { renderWithSwr } from '../../../../../tools/test-helpers';
import { mockImportItems, mockPreviousImports } from '../../../../../__mocks__/openconceptlab.mock';
import { getImportDetails } from './import-items.resource';
import ImportItems from './import-items.component';

const testProps = {
  importUuid: mockPreviousImports[1].uuid,
};

const mockGetImportDetails = getImportDetails as jest.Mock;
const mockUsePagination = usePagination as jest.Mock;

jest.mock('./import-items.resource', () => {
  const originalModule = jest.requireActual('./import-items.resource');

  return {
    ...originalModule,
    getImportDetails: jest.fn(),
  };
});

jest.mock('@openmrs/esm-framework', () => {
  const originalModule = jest.requireActual('@openmrs/esm-framework');

  return {
    ...originalModule,
    usePagination: jest.fn(),
  };
});

describe(`Import Items component`, () => {
  afterEach(() => {
    mockGetImportDetails.mockReset();
    mockUsePagination.mockReset();
  });

  it(`renders the table`, async () => {
    mockGetImportDetails.mockReturnValue({ status: 200, ok: true, data: mockImportItems });
    mockUsePagination.mockReturnValue({
      currentPage: 1,
      goTo: () => {},
      results: mockImportItems,
    });
    renderImportItemsComponent();
    await waitForLoadingToFinish();

    expect(screen.getByText('Concept/Mapping')).toBeVisible();
    expect(screen.getByText('Message')).toBeVisible();
  });

  it(`renders the import items correctly`, async () => {
    mockGetImportDetails.mockReturnValue({ status: 200, ok: true, data: mockImportItems });
    mockUsePagination.mockReturnValue({
      currentPage: 1,
      goTo: () => {},
      results: mockImportItems,
    });
    renderImportItemsComponent();
    await waitForLoadingToFinish();

    expect(screen.getByText('Concept/Mapping')).toBeVisible();
    expect(screen.getByText('Message')).toBeVisible();

    mockImportItems.slice(5).forEach((importItem) => {
      expect(screen.getByText(importItem.type + ' ' + importItem.uuid)).toBeVisible();
      expect(screen.getByText(importItem.errorMessage)).toBeVisible();
    });
  });
});

function renderImportItemsComponent() {
  renderWithSwr(<ImportItems {...testProps} />);
}

function waitForLoadingToFinish() {
  return waitFor(() => {
    expect(screen.getByText('Concept/Mapping')).toBeVisible(), { timeout: 2000 };
  });
}
