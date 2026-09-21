import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OpenmrsFetchError, showSnackbar } from '@openmrs/esm-framework';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { useDomains } from '../../domain-lookups/domain-lookups.resource';
import { createPackage, editPackage, usePackage } from '../../packages/packages.resource';
import PackageFormWorkspace from './package-form.workspace';

vi.mock('../../domain-lookups/domain-lookups.resource', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useDomains: vi.fn(),
}));

vi.mock('../../packages/packages.resource', () => ({
  createPackage: vi.fn(),
  editPackage: vi.fn(),
  usePackage: vi.fn(),
}));

const mockUseDomains = useDomains as Mock;
const mockCreatePackage = createPackage as Mock;
const mockEditPackage = editPackage as Mock;
const mockUsePackage = usePackage as Mock;
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

function renderWorkspace(uuid?: string) {
  return render(
    <PackageFormWorkspace
      uuid={uuid}
      closeWorkspace={mockCloseWorkspace}
      closeWorkspaceWithSavedChanges={mockCloseWorkspaceWithSavedChanges}
      promptBeforeClosing={mockPromptBeforeClosing}
      setTitle={vi.fn()}
      // @ts-expect-error - the workspace only uses closeWorkspace and promptBeforeClosing from the default props
      additionalProps={{}}
    />,
  );
}

describe('PackageFormWorkspace', () => {
  beforeEach(() => {
    mockUseDomains.mockReturnValue({ domains, isLoading: false, error: undefined });
    mockUsePackage.mockReturnValue({ exportPackage: undefined, isLoading: false, error: undefined });
    mockCreatePackage.mockResolvedValue({ data: {} });
    mockEditPackage.mockResolvedValue({ data: {} });
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

  describe('edit mode', () => {
    const uuid = 'package-uuid';

    it('shows a loading indicator while the package is being fetched', () => {
      mockUsePackage.mockReturnValue({ exportPackage: undefined, isLoading: true, error: undefined });
      renderWorkspace(uuid);

      expect(screen.getByText('Loading package…')).toBeInTheDocument();
      expect(screen.queryByRole('textbox', { name: 'Package name' })).not.toBeInTheDocument();
    });

    it('shows an error notification when the package request fails', () => {
      mockUsePackage.mockReturnValue({ exportPackage: undefined, isLoading: false, error: new Error('Not found') });
      renderWorkspace(uuid);

      expect(screen.getByText('Error loading package')).toBeInTheDocument();
      expect(screen.getByText('Not found')).toBeInTheDocument();
    });

    it('seeds the form from the fetched package', () => {
      mockUsePackage.mockReturnValue({
        exportPackage: {
          name: 'Core reference data',
          description: 'Some notes',
          entries: [{ domain: 'CONCEPTS' }, { domain: 'ENCOUNTER_TYPES' }],
        },
        isLoading: false,
        error: undefined,
      });
      renderWorkspace(uuid);

      expect(screen.getByRole('textbox', { name: 'Package name' })).toHaveValue('Core reference data');
      expect(screen.getByRole('textbox', { name: 'Description' })).toHaveValue('Some notes');
      expect(screen.getByRole('checkbox', { name: 'Concepts' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'Encounter types' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'Attribute types' })).not.toBeChecked();
    });

    it('does not overwrite in-progress edits when the package or domains revalidate', async () => {
      // A fresh object each call mimics SWR handing back a new reference on revalidation.
      const serverPackage = () => ({
        exportPackage: { name: 'Original name', description: 'Original notes', entries: [{ domain: 'CONCEPTS' }] },
        isLoading: false,
        error: undefined,
      });
      mockUsePackage.mockReturnValue(serverPackage());
      const user = userEvent.setup();
      const { rerender } = renderWorkspace(uuid);

      const nameInput = screen.getByRole('textbox', { name: 'Package name' });
      await user.clear(nameInput);
      await user.type(nameInput, 'My edited name');

      // Simulate a background revalidation returning the original server values again.
      mockUsePackage.mockReturnValue(serverPackage());
      rerender(
        <PackageFormWorkspace
          uuid={uuid}
          closeWorkspace={mockCloseWorkspace}
          closeWorkspaceWithSavedChanges={mockCloseWorkspaceWithSavedChanges}
          promptBeforeClosing={mockPromptBeforeClosing}
          setTitle={vi.fn()}
          // @ts-expect-error - the workspace only uses closeWorkspace and promptBeforeClosing from the default props
          additionalProps={{}}
        />,
      );

      expect(screen.getByRole('textbox', { name: 'Package name' })).toHaveValue('My edited name');
    });

    it('selects every domain when the package has no entries', () => {
      mockUsePackage.mockReturnValue({
        exportPackage: { name: 'Everything', description: '', entries: [] },
        isLoading: false,
        error: undefined,
      });
      renderWorkspace(uuid);

      for (const label of ['Attribute types', 'Concepts', 'Encounter types']) {
        expect(screen.getByRole('checkbox', { name: label })).toBeChecked();
      }
    });

    it('updates the package via editPackage, shows a snackbar, and closes the workspace', async () => {
      mockUsePackage.mockReturnValue({
        exportPackage: {
          name: 'Core reference data',
          description: 'Some notes',
          entries: [{ domain: 'CONCEPTS' }],
        },
        isLoading: false,
        error: undefined,
      });
      const user = userEvent.setup();
      renderWorkspace(uuid);

      await user.click(screen.getByRole('checkbox', { name: 'Encounter types' }));
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      expect(mockEditPackage).toHaveBeenCalledWith(uuid, {
        name: 'Core reference data',
        description: 'Some notes',
        entries: [{ domain: 'CONCEPTS' }, { domain: 'ENCOUNTER_TYPES' }],
      });
      expect(mockCreatePackage).not.toHaveBeenCalled();
      expect(mockShowSnackbar).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Package updated', kind: 'success' }),
      );
      expect(mockCloseWorkspaceWithSavedChanges).toHaveBeenCalled();
    });

    it('shows an update-failure snackbar and keeps the workspace open on error', async () => {
      mockUsePackage.mockReturnValue({
        exportPackage: { name: 'Core reference data', description: '', entries: [{ domain: 'CONCEPTS' }] },
        isLoading: false,
        error: undefined,
      });
      mockEditPackage.mockRejectedValue(new Error('Server exploded'));
      const user = userEvent.setup();
      renderWorkspace(uuid);

      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      expect(mockShowSnackbar).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Failed to update package',
          subtitle: 'An unexpected error occurred',
          kind: 'error',
        }),
      );
      expect(mockCloseWorkspaceWithSavedChanges).not.toHaveBeenCalled();
    });
  });
});
