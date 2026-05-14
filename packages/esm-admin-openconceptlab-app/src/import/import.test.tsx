import React from 'react';
import { vi, describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { type FetchResponse, openmrsFetch, showNotification } from '@openmrs/esm-framework';
import { mockSubscription } from '@mocks/openconceptlab.mock';
import { renderWithSwr } from '@tools/test-helpers';
import { startImportWithSubscription } from './import.resource';
import Import from './import.component';

const mockOpenmrsFetch = vi.mocked(openmrsFetch);
const mockShowNotification = vi.mocked(showNotification);
const mockStartImportWithSubscription = vi.mocked(startImportWithSubscription);

vi.mock('./import.resource', async () => {
  const originalModule = (await vi.importActual('./import.resource')) as object;

  return {
    ...originalModule,
    startImportWithSubscription: vi.fn(),
    startImportWithFile: vi.fn(),
  };
});

describe('Import component', () => {
  it('renders the form elements', async () => {
    mockOpenmrsFetch.mockResolvedValueOnce({ data: { results: [] } } as unknown as FetchResponse);
    renderWithSwr(<Import />);
    await waitForLoadingToFinish();

    expect(screen.getByText('Import Concepts')).toBeVisible();
    expect(screen.getByText('Import from Subscription')).toBeVisible();

    expect(screen.getByText('Import from file (Offline)')).toBeVisible();
    expect(screen.getByText('Import from file')).toBeEnabled();
    expect(screen.queryByText('File Added')).not.toBeInTheDocument();
  });

  it('renders correctly when there is no subscription', async () => {
    mockOpenmrsFetch.mockResolvedValueOnce({ data: { results: [] } } as unknown as FetchResponse);
    renderWithSwr(<Import />);
    await waitForLoadingToFinish();

    expect(screen.getByText('Import from Subscription')).toBeDisabled();
    expect(screen.getByText('Import from file')).toBeEnabled();
  });

  it('renders correctly when when a subscription exists', async () => {
    mockOpenmrsFetch.mockResolvedValueOnce({ data: { results: [mockSubscription] } } as unknown as FetchResponse);
    renderWithSwr(<Import />);
    await waitForLoadingToFinish();

    await waitFor(() => expect(screen.getByText('Import from Subscription')).toBeEnabled(), { timeout: 2000 });
    expect(screen.getByText('Import from file')).toBeEnabled();
  });

  it('allows starting an import using the subscription', async () => {
    const user = userEvent.setup();
    mockOpenmrsFetch.mockResolvedValueOnce({ data: { results: [mockSubscription] } } as unknown as FetchResponse);
    renderWithSwr(<Import />);
    await waitForLoadingToFinish();

    mockStartImportWithSubscription.mockResolvedValue({ status: 201 } as unknown as FetchResponse);

    await user.click(screen.getByText('Import from Subscription'));

    expect(mockStartImportWithSubscription).toHaveBeenCalledWith(new AbortController());
    expect(mockStartImportWithSubscription).toHaveBeenCalledTimes(1);

    expect(mockShowNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Import started successfully',
        kind: 'success',
      }),
    );
    expect(mockShowNotification).toHaveBeenCalledTimes(1);
  });
});

function waitForLoadingToFinish() {
  return waitFor(() => {
    expect(screen.getByText('Import Concepts')).toBeVisible, { timeout: 2000 };
  });
}
