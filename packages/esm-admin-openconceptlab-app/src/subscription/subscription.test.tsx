import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Subscription from './subscription.component';
import { openmrsFetch, showNotification } from '@openmrs/esm-framework';
import { renderWithSwr } from '../../../../tools/test-helpers';
import { deleteSubscription, updateSubscription } from './subscription.resource';

const mockOpenmrsFetch = openmrsFetch as jest.Mock;
const mockUpdateSubscription = updateSubscription as jest.Mock;
const mockDeleteSubscription = deleteSubscription as jest.Mock;
const mockShowNotification = showNotification as jest.Mock;

const mockSubscription = {
  url: 'https://api.openconceptlab.org/orgs/openmrs/collections/DemoQueueConcepts/1',
  token: 'Cff4906d8f4890fb08E287f6179781F6165C',
  subscribedToSnapshot: false,
  validationType: 'FULL',
};

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
  });

  it(`renders without dying`, () => {
    renderSubscriptionComponent();
  });

  it(`renders the empty forms`, async () => {
    mockOpenmrsFetch.mockReturnValueOnce({ data: { results: [] } });
    renderSubscriptionComponent();
    await waitForLoadingToFinish();

    expect(screen.getByText('setupSubscription')).toBeInTheDocument();
    expect(screen.getByText('unsubscribe')).toBeInTheDocument();
    expect(screen.getByText('unsubscribeButton')).toBeDisabled();
  });

  it(`renders the subscription if a subscription exists`, async () => {
    mockOpenmrsFetch.mockReturnValueOnce({ data: { results: [mockSubscription] } });
    renderSubscriptionComponent();
    await waitForLoadingToFinish();

    expect(screen.getByLabelText('subscriptionUrl')).toHaveValue(mockSubscription.url);
    expect(screen.getByLabelText('apiToken')).toHaveValue(mockSubscription.token);
    expect(screen.getByLabelText('subscribeToSnapshotText')).not.toBeChecked();
    expect(screen.getByLabelText('disableValidationText')).not.toBeChecked();
    expect(screen.getByText('unsubscribeButton')).toBeEnabled();
  });

  it(`allows adding a new subscription`, async () => {
    mockOpenmrsFetch.mockReturnValueOnce({ data: { results: [] } });
    renderSubscriptionComponent();
    await waitForLoadingToFinish();

    const urlInputField = screen.getByLabelText('subscriptionUrl');
    const tokenInputField = screen.getByLabelText('apiToken');
    const saveButton = screen.getByText('subscribeButton');

    mockUpdateSubscription.mockReturnValueOnce({ status: 201, ok: true });

    userEvent.type(urlInputField, mockSubscription.url);
    userEvent.type(tokenInputField, mockSubscription.token);
    await waitFor(() => userEvent.click(saveButton));

    expect(mockUpdateSubscription).toHaveBeenCalledTimes(1);
    expect(mockUpdateSubscription).toHaveBeenCalledWith(
      expect.objectContaining(mockSubscription),
      new AbortController(),
    );

    expect(mockShowNotification).toHaveBeenCalledTimes(1);
    expect(mockShowNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'subscriptionCreated',
        kind: 'success',
      }),
    );
  });

  it(`allows changing the saved subscription`, async () => {
    mockOpenmrsFetch.mockReturnValueOnce({ data: { results: [mockSubscription] } });
    renderSubscriptionComponent();
    await waitForLoadingToFinish();

    const urlInputField = screen.getByLabelText('subscriptionUrl');
    const tokenInputField = screen.getByLabelText('apiToken');
    const saveButton = screen.getByText('subscribeButton');

    mockUpdateSubscription.mockReturnValueOnce({ status: 200, ok: true });

    userEvent.clear(urlInputField);
    userEvent.clear(tokenInputField);
    userEvent.type(urlInputField, 'https://api.openconceptlab.org/orgs/openmrs/collections/DemoQueueConcepts/2');
    userEvent.type(tokenInputField, 'token123');
    await waitFor(() => userEvent.click(saveButton));

    expect(mockUpdateSubscription).toHaveBeenCalledTimes(1);
    expect(mockUpdateSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        ...mockSubscription,
        url: 'https://api.openconceptlab.org/orgs/openmrs/collections/DemoQueueConcepts/2',
        token: 'token123',
      }),
      new AbortController(),
    );

    expect(mockShowNotification).toHaveBeenCalledTimes(1);
    expect(mockShowNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'subscriptionUpdated',
        kind: 'success',
      }),
    );
  });

  it(`allows removing the saved subscription`, async () => {
    mockOpenmrsFetch.mockReturnValueOnce({ data: { results: [mockSubscription] } });
    renderSubscriptionComponent();
    await waitForLoadingToFinish();

    const unsubscribeButton = screen.getByText('unsubscribeButton');

    mockDeleteSubscription.mockReturnValueOnce({ status: 204 });

    await waitFor(() => userEvent.click(unsubscribeButton));

    expect(mockDeleteSubscription).toHaveBeenCalledTimes(1);
    expect(mockDeleteSubscription).toHaveBeenCalledWith(
      expect.objectContaining(mockSubscription),
      new AbortController(),
    );

    expect(mockShowNotification).toHaveBeenCalledTimes(1);
    expect(mockShowNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'subscriptionDeleted',
        kind: 'success',
      }),
    );
  });
});

function renderSubscriptionComponent() {
  renderWithSwr(<Subscription />);
}

function waitForLoadingToFinish() {
  return waitFor(() => {
    expect(screen.getByText('setupSubscription')).toBeInTheDocument, { timeout: 2000 };
  });
}
