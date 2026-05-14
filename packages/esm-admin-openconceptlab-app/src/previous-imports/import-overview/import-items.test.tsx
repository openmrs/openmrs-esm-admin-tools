import React from 'react';
import { vi, describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { type FetchResponse, usePagination } from '@openmrs/esm-framework';
import { type ImportItem } from '../../types';
import { renderWithSwr } from '@tools/test-helpers';
import { mockImportItems, mockPreviousImports } from '@mocks/openconceptlab.mock';
import { getImportDetails } from './import-items.resource';
import ImportItems from './import-items.component';

const defaultProps = {
  importUuid: mockPreviousImports[1].uuid,
};

const mockGetImportDetails = vi.mocked(getImportDetails);
const mockUsePagination = vi.mocked(usePagination);

vi.mock('./import-items.resource', async () => {
  const originalModule = (await vi.importActual('./import-items.resource')) as object;

  return {
    ...originalModule,
    getImportDetails: vi.fn(),
  };
});

describe('Import items', () => {
  it('renders a tabular overview', async () => {
    mockGetImportDetails.mockResolvedValue({
      status: 200,
      ok: true,
      data: mockImportItems,
    } as unknown as FetchResponse<{ results: ImportItem[] }>);
    mockUsePagination.mockReturnValue({
      currentPage: 1,
      goTo: () => {},
      results: mockImportItems,
    } as unknown as ReturnType<typeof usePagination>);
    renderWithSwr(<ImportItems {...defaultProps} />);
    await waitForLoadingToFinish();

    expect(screen.getByText('Concept/Mapping')).toBeVisible();
    expect(screen.getByText('Message')).toBeVisible();
  });

  it('renders the import items correctly', async () => {
    mockGetImportDetails.mockResolvedValue({
      status: 200,
      ok: true,
      data: mockImportItems,
    } as unknown as FetchResponse<{ results: ImportItem[] }>);
    mockUsePagination.mockReturnValue({
      currentPage: 1,
      goTo: () => {},
      results: mockImportItems,
    } as unknown as ReturnType<typeof usePagination>);
    renderWithSwr(<ImportItems {...defaultProps} />);
    await waitForLoadingToFinish();

    expect(screen.getByText('Concept/Mapping')).toBeVisible();
    expect(screen.getByText('Message')).toBeVisible();

    mockImportItems.slice(5).forEach((importItem) => {
      expect(screen.getByText(importItem.type + ' ' + importItem.uuid)).toBeVisible();
      expect(screen.getByText(importItem.errorMessage)).toBeVisible();
    });
  });
});

function waitForLoadingToFinish() {
  return waitFor(() => {
    expect(screen.getByText('Concept/Mapping')).toBeVisible(), { timeout: 2000 };
  });
}
