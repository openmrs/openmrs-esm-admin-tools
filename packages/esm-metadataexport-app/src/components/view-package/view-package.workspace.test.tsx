import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { showSnackbar } from '@openmrs/esm-framework';
import { deleteBuild, triggerBuild, usePackageBuilds } from '../../packages/packages.resource';
import { type ExportPackage, type ExportPackageBuild } from '../../types';
import ViewPackageWorkspace from './view-package.workspace';

vi.mock('../../packages/packages.resource', () => ({
  usePackageBuilds: vi.fn(),
  triggerBuild: vi.fn(),
  deleteBuild: vi.fn(),
}));

const mockUsePackageBuilds = usePackageBuilds as Mock;
const mockTriggerBuild = triggerBuild as Mock;
const mockDeleteBuild = deleteBuild as Mock;
const mockShowSnackbar = showSnackbar as Mock;
const mockCloseWorkspace = vi.fn();
const mockCloseWorkspaceWithSavedChanges = vi.fn();
const mockPromptBeforeClosing = vi.fn();

const build = (overrides: Partial<ExportPackageBuild> = {}): ExportPackageBuild => ({
  uuid: '23dbfd25-eec7-4f4e-b26c-d95324346ce3',
  packageUuid: '361d69db-c018-4545-87a7-e987e8af9e85',
  version: 2,
  status: 'COMPLETED',
  dateCreated: Date.now(),
  dateStarted: Date.now(),
  dateCompleted: Date.now(),
  errorMessage: null,
  downloadUrl: '/download/build-1',
  manifest: null,
  ...overrides,
});

const exportPackage: ExportPackage = {
  uuid: '361d69db-c018-4545-87a7-e987e8af9e85',
  name: 'Core reference data',
  description: 'Some notes',
  retired: false,
  dateCreated: Date.now(),
  entries: [
    { domain: 'CONCEPTS', itemUuids: [] },
    { domain: 'ENCOUNTER_TYPES', itemUuids: [] },
  ],
  latestBuild: null,
};

function mockBuilds(overrides: Partial<ReturnType<typeof usePackageBuilds>> = {}) {
  mockUsePackageBuilds.mockReturnValue({
    builds: [],
    isLoading: false,
    isValidating: false,
    error: undefined,
    mutate: vi.fn(),
    ...overrides,
  });
}

function renderWorkspace(pkg: ExportPackage = exportPackage) {
  render(
    <ViewPackageWorkspace
      exportPackage={pkg}
      closeWorkspace={mockCloseWorkspace}
      closeWorkspaceWithSavedChanges={mockCloseWorkspaceWithSavedChanges}
      promptBeforeClosing={mockPromptBeforeClosing}
      setTitle={vi.fn()}
    />,
  );
}

describe('ViewPackageWorkspace', () => {
  beforeEach(() => {
    mockBuilds();
  });

  it('renders the package domains as human-readable labels', () => {
    renderWorkspace();

    expect(screen.getByText('Concepts, Encounter types')).toBeInTheDocument();
  });

  it('shows "All domains" when the package has no entries', () => {
    renderWorkspace({ ...exportPackage, entries: [] });

    expect(screen.getByText('All domains')).toBeInTheDocument();
  });

  it('shows a loading indicator while builds are loading', () => {
    mockBuilds({ isLoading: true });
    renderWorkspace();

    expect(screen.getByText('Loading builds…')).toBeInTheDocument();
  });

  it('shows an error state when the builds request fails', () => {
    mockBuilds({ error: new Error('Boom') });
    renderWorkspace();

    expect(screen.getByText('Error State')).toBeInTheDocument();
  });

  it('shows an empty message when there are no builds', () => {
    renderWorkspace();

    expect(screen.getByText('No builds yet')).toBeInTheDocument();
  });

  it('renders each build with its version, status, and download link', () => {
    mockBuilds({ builds: [build()] });
    renderWorkspace();

    expect(screen.getByText('Build 2')).toBeInTheDocument();
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Download' })).toHaveAttribute('href', '/download/build-1');
  });

  it('omits the download link for a build without a download URL', () => {
    mockBuilds({ builds: [build({ status: 'QUEUED', downloadUrl: null, dateStarted: null, dateCompleted: null })] });
    renderWorkspace();

    expect(screen.getByText('QUEUED')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Download' })).not.toBeInTheDocument();
  });

  it('triggers a build and revalidates the builds list', async () => {
    const user = userEvent.setup();
    const mutate = vi.fn();
    mockBuilds({ mutate });
    mockTriggerBuild.mockResolvedValue({});
    renderWorkspace();

    await user.click(screen.getByRole('button', { name: 'Trigger new build' }));

    expect(mockTriggerBuild).toHaveBeenCalledWith(exportPackage.uuid);
    await waitFor(() => expect(mutate).toHaveBeenCalled());
    expect(mockShowSnackbar).toHaveBeenCalledWith(expect.objectContaining({ kind: 'success' }));
  });

  it('shows an error snackbar when triggering a build fails', async () => {
    const user = userEvent.setup();
    mockTriggerBuild.mockRejectedValue(new Error('Boom'));
    renderWorkspace();

    await user.click(screen.getByRole('button', { name: 'Trigger new build' }));

    await waitFor(() =>
      expect(mockShowSnackbar).toHaveBeenCalledWith(expect.objectContaining({ kind: 'error', subtitle: 'Boom' })),
    );
  });

  it('deletes the package with the provided reason and closes the workspace', async () => {
    const user = userEvent.setup();
    mockDeleteBuild.mockResolvedValue({});
    renderWorkspace();

    // The first "Delete" button opens the confirmation modal; the modal footer holds the second.
    await user.click(screen.getAllByRole('button', { name: /delete/i })[0]);

    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByRole('textbox'), 'No longer needed');
    await user.click(within(dialog).getByRole('button', { name: /delete/i }));

    expect(mockDeleteBuild).toHaveBeenCalledWith(exportPackage.uuid, 'No longer needed');
    await waitFor(() => expect(mockCloseWorkspace).toHaveBeenCalled());
    expect(mockShowSnackbar).toHaveBeenCalledWith(expect.objectContaining({ kind: 'success' }));
  });

  it('shows an error snackbar and keeps the workspace open when deletion fails', async () => {
    const user = userEvent.setup();
    mockDeleteBuild.mockRejectedValue(new Error('Boom'));
    renderWorkspace();

    await user.click(screen.getAllByRole('button', { name: /delete/i })[0]);

    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /delete/i }));

    await waitFor(() =>
      expect(mockShowSnackbar).toHaveBeenCalledWith(expect.objectContaining({ kind: 'error', subtitle: 'Boom' })),
    );
    expect(mockCloseWorkspace).not.toHaveBeenCalled();
  });
});
