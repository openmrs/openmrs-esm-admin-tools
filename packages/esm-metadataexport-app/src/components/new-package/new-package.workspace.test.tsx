import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OpenmrsFetchError, showSnackbar } from '@openmrs/esm-framework';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { useDomains } from '../../domain-lookups/domain-lookups.resource';
import { createPackage } from '../../packages/packages.resource';
import NewPackageWorkspace from './new-package.workspace';

vi.mock('../../domain-lookups/domain-lookups.resource', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useDomains: vi.fn(),
}));

vi.mock('../../packages/packages.resource', () => ({
  createPackage: vi.fn(),
}));

const mockUseDomains = useDomains as Mock;
const mockCreatePackage = createPackage as Mock;
const mockShowSnackbar = showSnackbar as Mock;
const mockCloseWorkspace = vi.fn();
const mockCloseWorkspaceWithSavedChanges = vi.fn();
const mockPromptBeforeClosing = vi.fn();

const domains = ['ATTRIBUTE_TYPES', 'CONCEPTS', 'ENCOUNTER_TYPES'];

// Builds an OpenmrsFetchError carrying a REST-style response body so we can
// exercise the component's server-error extraction (fieldErrors / error).
const fetchError = (responseBody: unknown) =>
  new OpenmrsFetchError(
    '/ws/rest/v1/metadataexport/packages',
    new Response(null, { status: 400, statusText: 'Bad Request' }),
    responseBody as never,
    new Error(),
  );

function renderWorkspace() {
  render(
    <NewPackageWorkspace
      closeWorkspace={mockCloseWorkspace}
      closeWorkspaceWithSavedChanges={mockCloseWorkspaceWithSavedChanges}
      promptBeforeClosing={mockPromptBeforeClosing}
      setTitle={vi.fn()}
      // @ts-expect-error - the workspace only uses closeWorkspace and promptBeforeClosing from the default props
      additionalProps={{}}
    />,
  );
}

describe('NewPackageWorkspace', () => {
  beforeEach(() => {
    mockUseDomains.mockReturnValue({ domains, isLoading: false, error: undefined });
    mockCreatePackage.mockResolvedValue({ data: {} });
  });

  it('renders a checkbox for each domain with a human-readable label', () => {
    renderWorkspace();

    expect(screen.getByRole('checkbox', { name: 'Attribute types' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Concepts' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Encounter types' })).toBeInTheDocument();
  });

  it('shows a loading skeleton while domains are loading', () => {
    mockUseDomains.mockReturnValue({ domains: [], isLoading: true, error: undefined });
    renderWorkspace();

    expect(screen.queryByRole('checkbox', { name: 'Select all' })).not.toBeInTheDocument();
  });

  it('shows an error notification when the domains request fails', () => {
    mockUseDomains.mockReturnValue({ domains: [], isLoading: false, error: new Error('Boom') });
    renderWorkspace();

    expect(screen.getByText('Error loading domains')).toBeInTheDocument();
    expect(screen.getByText('Boom')).toBeInTheDocument();
  });

  it('disables the submit button until a name and at least one domain are provided', async () => {
    const user = userEvent.setup();
    renderWorkspace();

    const submitButton = screen.getByRole('button', { name: 'Create package' });
    expect(submitButton).toBeDisabled();

    await user.type(screen.getByRole('textbox', { name: 'Package name' }), 'Core reference data');
    expect(submitButton).toBeDisabled();

    await user.click(screen.getByRole('checkbox', { name: 'Concepts' }));
    expect(submitButton).toBeEnabled();
  });

  it('selects and clears every domain via "Select all"', async () => {
    const user = userEvent.setup();
    renderWorkspace();

    const selectAll = screen.getByRole('checkbox', { name: 'Select all' });
    await user.click(selectAll);

    for (const label of ['Attribute types', 'Concepts', 'Encounter types']) {
      expect(screen.getByRole('checkbox', { name: label })).toBeChecked();
    }

    await user.click(selectAll);
    for (const label of ['Attribute types', 'Concepts', 'Encounter types']) {
      expect(screen.getByRole('checkbox', { name: label })).not.toBeChecked();
    }
  });

  it('POSTs the selected domains as entries, shows a snackbar, and closes the workspace', async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await user.type(screen.getByRole('textbox', { name: 'Package name' }), 'Core reference data');
    await user.type(screen.getByRole('textbox', { name: 'Description' }), 'Some notes');
    await user.click(screen.getByRole('checkbox', { name: 'Concepts' }));
    await user.click(screen.getByRole('checkbox', { name: 'Encounter types' }));
    await user.click(screen.getByRole('button', { name: 'Create package' }));

    expect(mockCreatePackage).toHaveBeenCalledWith({
      name: 'Core reference data',
      description: 'Some notes',
      entries: [{ domain: 'CONCEPTS' }, { domain: 'ENCOUNTER_TYPES' }],
    });
    expect(mockShowSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Package created', kind: 'success' }),
    );
    // Closes without triggering the "unsaved changes" prompt.
    expect(mockCloseWorkspaceWithSavedChanges).toHaveBeenCalled();
    expect(mockCloseWorkspace).not.toHaveBeenCalled();
  });

  it('sends an empty entries array when every domain is selected', async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await user.type(screen.getByRole('textbox', { name: 'Package name' }), 'Everything');
    await user.click(screen.getByRole('checkbox', { name: 'Select all' }));
    await user.click(screen.getByRole('button', { name: 'Create package' }));

    expect(mockCreatePackage).toHaveBeenCalledWith(expect.objectContaining({ name: 'Everything', entries: [] }));
  });

  async function submitValidPackage(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByRole('textbox', { name: 'Package name' }), 'Core reference data');
    await user.click(screen.getByRole('checkbox', { name: 'Concepts' }));
    await user.click(screen.getByRole('button', { name: 'Create package' }));
  }

  it('shows a generic error snackbar and keeps the workspace open for an unexpected error', async () => {
    mockCreatePackage.mockRejectedValue(new Error('Server exploded'));
    const user = userEvent.setup();
    renderWorkspace();

    await submitValidPackage(user);

    expect(mockShowSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Failed to create package',
        subtitle: 'An unexpected error occurred',
        kind: 'error',
      }),
    );
    expect(mockCloseWorkspace).not.toHaveBeenCalled();
  });

  it('surfaces the server error message from an OpenmrsFetchError', async () => {
    mockCreatePackage.mockRejectedValue(fetchError({ error: 'A package with that name already exists' }));
    const user = userEvent.setup();
    renderWorkspace();

    await submitValidPackage(user);

    expect(mockShowSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Failed to create package',
        subtitle: 'A package with that name already exists',
        kind: 'error',
      }),
    );
    expect(mockCloseWorkspace).not.toHaveBeenCalled();
  });

  it('surfaces the first field error from an OpenmrsFetchError', async () => {
    mockCreatePackage.mockRejectedValue(fetchError({ fieldErrors: { name: 'Name must be unique' } }));
    const user = userEvent.setup();
    renderWorkspace();

    await submitValidPackage(user);

    expect(mockShowSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Failed to create package', subtitle: 'Name must be unique', kind: 'error' }),
    );
    expect(mockCloseWorkspace).not.toHaveBeenCalled();
  });

  it('closes the workspace when Cancel is clicked', async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mockCloseWorkspace).toHaveBeenCalled();
  });
});
