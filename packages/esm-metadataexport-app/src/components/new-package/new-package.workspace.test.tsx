import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { showSnackbar } from '@openmrs/esm-framework';
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

  it('shows an error snackbar and keeps the workspace open when the request fails', async () => {
    mockCreatePackage.mockRejectedValue(new Error('Server exploded'));
    const user = userEvent.setup();
    renderWorkspace();

    await user.type(screen.getByRole('textbox', { name: 'Package name' }), 'Core reference data');
    await user.click(screen.getByRole('checkbox', { name: 'Concepts' }));
    await user.click(screen.getByRole('button', { name: 'Create package' }));

    expect(mockShowSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Failed to create package', subtitle: 'Server exploded', kind: 'error' }),
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
