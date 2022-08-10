import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { usePagination } from '@openmrs/esm-framework';
import { renderWithSwr } from '../../../../../tools/test-helpers';
import { mockImportItems, mockPreviousImports } from '../../../../../__mocks__/openconceptlab.mock';
import { ImportItem } from '../../types';
import ImportItems from './import-items.component';
import { getImportDetails } from './import-items.resource';

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

  it(`renders without dying`, () => {
    mockGetImportDetails.mockReturnValue({ status: 200, ok: true, data: [] });
    mockUsePagination.mockReturnValue({
      currentPage: 1,
      goTo: () => {},
      results: [],
    });
    renderImportItemsComponent();
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

    expect(screen.getByText('conceptOrMapping')).toBeVisible();
    expect(screen.getByText('message')).toBeVisible();
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

    expect(screen.getByText('conceptOrMapping')).toBeVisible();
    expect(screen.getByText('message')).toBeVisible();

    mockImportItems.slice(5).forEach((importItem: ImportItem) => {
      expect(screen.getByText(importItem.type + ' ' + importItem.uuid)).toBeVisible();
      expect(screen.getByText(importItem.errorMessage)).toBeVisible();
    });
  });
});

function renderImportItemsComponent() {
  renderWithSwr(<ImportItems importUuid={mockPreviousImports[1].uuid} />);
}

function waitForLoadingToFinish() {
  return waitFor(() => {
    expect(screen.getByText('conceptOrMapping')).toBeVisible(), { timeout: 2000 };
  });
}
