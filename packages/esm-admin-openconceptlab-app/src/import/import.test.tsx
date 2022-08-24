import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Import from './import.component';
import { openmrsFetch, showNotification } from '@openmrs/esm-framework';
import { renderWithSwr } from '../../../../tools/test-helpers';
import { startImportWithSubscription } from './import.resource';
import { mockSubscription } from '../../../../__mocks__/openconceptlab.mock';

const mockOpenmrsFetch = openmrsFetch as jest.Mock;
const mockStartImportWithSubscription = startImportWithSubscription as jest.Mock;
const mockShowNotification = showNotification as jest.Mock;

jest.mock('./import.resource', () => {
  const originalModule = jest.requireActual('./import.resource');

  return {
    ...originalModule,
    startImportWithSubscription: jest.fn(),
    startImportWithFile: jest.fn(),
  };
});

jest.mock('@openmrs/esm-framework', () => {
  const originalModule = jest.requireActual('@openmrs/esm-framework');

  return {
    ...originalModule,
    showNotification: jest.fn(),
  };
});

describe(`Import component`, () => {
  afterEach(() => {
    mockShowNotification.mockReset();
  });

  it(`renders without dying`, () => {
    renderImportComponent();
  });

  it(`renders the form elements`, async () => {
    mockOpenmrsFetch.mockReturnValueOnce({ data: { results: [] } });
    renderImportComponent();
    await waitForLoadingToFinish();

    expect(screen.getByText('Import Concepts')).toBeVisible();
    expect(screen.getByText('Import from Subscription')).toBeVisible();

    expect(screen.getByText('Import from file (Offline)')).toBeVisible();
    expect(screen.getByText('Import from file')).toBeEnabled();
    expect(screen.queryByText('File Added')).not.toBeInTheDocument();
  });

  it(`renders correctly when there is no subscription`, async () => {
    mockOpenmrsFetch.mockReturnValueOnce({ data: { results: [] } });
    renderImportComponent();
    await waitForLoadingToFinish();

    expect(screen.getByText('Import from Subscription')).toBeDisabled();
    expect(screen.getByText('Import from file')).toBeEnabled();
  });

  it(`renders correctly when when a subscription exists`, async () => {
    mockOpenmrsFetch.mockReturnValueOnce({ data: { results: [mockSubscription] } });
    renderImportComponent();
    await waitForLoadingToFinish();

    await waitFor(() => expect(screen.getByText('Import from Subscription')).toBeEnabled(), { timeout: 2000 });
    expect(screen.getByText('Import from file')).toBeEnabled();
  });

  it(`allows starting an import using the subscription`, async () => {
    mockOpenmrsFetch.mockReturnValueOnce({ data: { results: [mockSubscription] } });
    renderImportComponent();
    await waitForLoadingToFinish();

    mockStartImportWithSubscription.mockReturnValueOnce({ status: 201 });

    await waitFor(() => userEvent.click(screen.getByText('Import from Subscription')));

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

function renderImportComponent() {
  renderWithSwr(<Import />);
}

function waitForLoadingToFinish() {
  return waitFor(() => {
    expect(screen.getByText('Import Concepts')).toBeVisible, { timeout: 2000 };
  });
}
