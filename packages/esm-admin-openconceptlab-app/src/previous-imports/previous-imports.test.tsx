import React from 'react';
import { vi, describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { type FetchResponse, formatDatetime, openmrsFetch, usePagination } from '@openmrs/esm-framework';
import { renderWithSwr } from '@tools/test-helpers';
import { mockPreviousImports } from '@mocks/openconceptlab.mock';
import PreviousImports from './previous-imports.component';

const mockOpenmrsFetch = vi.mocked(openmrsFetch);
const mockUsePagination = vi.mocked(usePagination);

describe('Previous imports', () => {
  it('renders the table', async () => {
    mockOpenmrsFetch.mockResolvedValueOnce({ data: { results: [] } } as unknown as FetchResponse);
    mockUsePagination.mockReturnValue({
      currentPage: 1,
      goTo: () => {},
      results: [],
    } as unknown as ReturnType<typeof usePagination>);
    renderWithSwr(<PreviousImports />);
    await waitForLoadingToFinish();

    expect(screen.getByText('Previous Imports')).toBeVisible();
    expect(screen.getByText('Date and Time')).toBeVisible();
    expect(screen.getByText('Duration')).toBeVisible();
    expect(screen.getByText('Status')).toBeVisible();
  });

  it('renders the previous imports correctly', async () => {
    mockOpenmrsFetch.mockResolvedValueOnce({ data: { results: mockPreviousImports } } as unknown as FetchResponse);
    mockUsePagination.mockReturnValue({
      currentPage: 1,
      goTo: () => {},
      results: mockPreviousImports,
    } as unknown as ReturnType<typeof usePagination>);
    renderWithSwr(<PreviousImports />);
    await waitForLoadingToFinish();

    mockPreviousImports.forEach((item) => {
      expect(screen.getByText(formatDatetime(item.localDateStarted))).toBeVisible();
      expect(screen.getByText(item.importTime)).toBeVisible();
      expect(screen.getByText(item.status)).toBeVisible();
    });
  });
});

function waitForLoadingToFinish() {
  return waitFor(() => {
    expect(screen.getByText('Previous Imports')).toBeVisible(), { timeout: 2000 };
  });
}
