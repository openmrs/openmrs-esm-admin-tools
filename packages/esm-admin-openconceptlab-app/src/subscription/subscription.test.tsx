import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Subscription from './subscription.component';
import { openmrsFetch, showNotification } from '@openmrs/esm-framework';
import { renderWithSwr } from '../../../../tools/test-helpers';
import { deleteSubscription, updateSubscription } from './subscription.resource';
import { mockSubscription } from '../../../../__mocks__/openconceptlab.mock';

const mockOpenmrsFetch = openmrsFetch as jest.Mock;
const mockUpdateSubscription = updateSubscription as jest.Mock;
const mockDeleteSubscription = deleteSubscription as jest.Mock;
const mockShowNotification = showNotification as jest.Mock;

jest.mock('./subscription.resource', () => {
  const originalModule = jest.requireActual('./subscription.resource');

  return {
    ...originalModule,
    updateSubscription: jest.fn(),
    deleteSubscription: jest.fn(),
  };
});

jest.mock('@openmrs/esm-framework', () => {
  const originalModule = jest.requireActual('@openmrs/esm-framework');

  return {
    ...originalModule,
    showNotification: jest.fn(),
  };
});

describe(`Subscription component`, () => {
  afterEach(() => {
    mockShowNotification.mockReset();
    mockUpdateSubscription.mockReset();
    mockOpenmrsFetch.mockReset();
  });

  it(`renders without dying`, () => {
    renderSubscriptionComponent();
  });

  it(`renders the empty forms`, async () => {
    mockOpenmrsFetch.mockReturnValueOnce({ data: { results: [] } });
    renderSubscriptionComponent();
    await waitForLoadingToFinish();

    expect(screen.getByText('Setup Subscription')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Unsubscribe' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'danger Unsubscribe' })).toBeDisabled();
  });

  it(`renders the subscription if a subscription exists`, async () => {
    mockOpenmrsFetch.mockReturnValueOnce({ data: { results: [mockSubscription] } });
    renderSubscriptionComponent();
    await waitForLoadingToFinish();
    await waitForLoadingSubscription();

    expect(screen.getByLabelText('Subscription URL')).toHaveValue(mockSubscription.url);
    expect(screen.getByLabelText('Token')).toHaveValue(mockSubscription.token);
    expect(screen.getByLabelText('Subscribe to SNAPSHOT versions (not recommended)')).not.toBeChecked();
    expect(
      screen.getByLabelText('Disable validation (should be used with care for well curated collections or sources)'),
    ).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'danger Unsubscribe' })).toBeEnabled();
  });

  it(`allows adding a new subscription`, async () => {
    mockOpenmrsFetch.mockReturnValueOnce({ data: { results: [] } });
    renderSubscriptionComponent();
    await waitForLoadingToFinish();

    const urlInputField = screen.getByLabelText('Subscription URL');
    const tokenInputField = screen.getByLabelText('Token');
    const saveButton = screen.getByRole('button', { name: 'Save changes' });

    mockUpdateSubscription.mockReturnValueOnce({ status: 201, ok: true });

    await waitFor(() => userEvent.type(urlInputField, mockSubscription.url));
    await waitFor(() => userEvent.type(tokenInputField, mockSubscription.token));
    await waitFor(() => userEvent.click(saveButton));

    expect(mockUpdateSubscription).toHaveBeenCalledWith(
      expect.objectContaining(mockSubscription),
      new AbortController(),
    );
    expect(mockUpdateSubscription).toHaveBeenCalledTimes(1);

    expect(mockShowNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Subscription created successfully',
        kind: 'success',
      }),
    );
    expect(mockShowNotification).toHaveBeenCalledTimes(1);
  });

  it(`allows changing the saved subscription`, async () => {
    mockOpenmrsFetch.mockReturnValueOnce({ data: { results: [mockSubscription] } });
    renderSubscriptionComponent();
    await waitForLoadingToFinish();
    await waitForLoadingSubscription();

    const urlInputField = screen.getByLabelText('Subscription URL');
    const tokenInputField = screen.getByLabelText('Token');
    const saveButton = screen.getByRole('button', { name: 'Save changes' });

    mockUpdateSubscription.mockReturnValueOnce({ status: 200, ok: true });

    await waitFor(() => userEvent.clear(urlInputField));
    await waitFor(() => userEvent.clear(tokenInputField));
    await waitFor(() =>
      userEvent.type(urlInputField, 'https://api.openconceptlab.org/orgs/openmrs/collections/DemoQueueConcepts/2'),
    );
    await waitFor(() => userEvent.type(tokenInputField, 'token123'));
    await waitFor(() => userEvent.click(saveButton));

    expect(mockUpdateSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        ...mockSubscription,
        url: 'https://api.openconceptlab.org/orgs/openmrs/collections/DemoQueueConcepts/2',
        token: 'token123',
      }),
      new AbortController(),
    );
    expect(mockUpdateSubscription).toHaveBeenCalledTimes(1);

    expect(mockShowNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Subscription updated successfully',
        kind: 'success',
      }),
    );
    expect(mockShowNotification).toHaveBeenCalledTimes(1);
  });

  it(`allows removing the saved subscription`, async () => {
    mockOpenmrsFetch.mockReturnValueOnce({ data: { results: [mockSubscription] } });
    renderSubscriptionComponent();
    await waitForLoadingToFinish();
    await waitForLoadingSubscription();

    const unsubscribeButton = screen.getByRole('button', { name: 'danger Unsubscribe' });

    mockDeleteSubscription.mockReturnValueOnce({ status: 204 });

    await waitFor(() => userEvent.click(unsubscribeButton));

    expect(mockDeleteSubscription).toHaveBeenCalledWith(
      expect.objectContaining(mockSubscription),
      new AbortController(),
    );
    expect(mockDeleteSubscription).toHaveBeenCalledTimes(1);

    expect(mockShowNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Successfully unsubscribed',
        kind: 'success',
      }),
    );
    expect(mockShowNotification).toHaveBeenCalledTimes(1);
  });
});

function renderSubscriptionComponent() {
  renderWithSwr(<Subscription />);
}

function waitForLoadingToFinish() {
  return waitFor(() => {
    expect(screen.getByText('Setup Subscription')).toBeVisible(), { timeout: 2000 };
  });
}

function waitForLoadingSubscription() {
  return waitFor(() => {
    expect(screen.getByLabelText('Subscription URL')).not.toHaveValue(''), { timeout: 2000 };
  });
}
