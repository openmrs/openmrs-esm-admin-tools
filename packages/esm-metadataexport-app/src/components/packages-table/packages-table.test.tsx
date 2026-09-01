import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type Session, useSession, userHasAccess } from '@openmrs/esm-framework';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type ExportPackage } from '../../types/index';
import { useAllPackages } from '../../packages/packages.resource';
import { launchAddNewPackageWorkspace } from '../new-package/new-package-utils';
import { launchViewPackageWorkspace } from '../view-package/view-package-utils';
import PackagesTable from './packages-table.component';

vi.mock('../../packages/packages.resource', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useAllPackages: vi.fn(),
}));

vi.mock('../new-package/new-package-utils', () => ({
  launchAddNewPackageWorkspace: vi.fn(),
}));

vi.mock('../view-package/view-package-utils', () => ({
  launchViewPackageWorkspace: vi.fn(),
}));

const mockUseAllPackages = vi.mocked(useAllPackages);
const mockUseSession = vi.mocked(useSession);
const mockUserHasAccess = vi.mocked(userHasAccess);
const mockLaunchAddNewPackageWorkspace = vi.mocked(launchAddNewPackageWorkspace);
const mockLaunchViewPackageWorkspace = vi.mocked(launchViewPackageWorkspace);

const sessionWithUser = () => ({ user: { uuid: 'cc8507b8-7c9a-486b-85dc-b8f25ad1e4cc' } }) as unknown as Session;

const builtPackage: ExportPackage = {
  uuid: 'a1b2c3d4-0000-0000-0000-000000000001',
  name: 'Core reference data',
  description: 'Shared reference metadata',
  retired: false,
  dateCreated: 0,
  entries: [{ domain: 'PATIENT_IDENTIFIER_TYPE', itemUuids: [] }],
  latestBuild: {
    uuid: 'build-0000-0000-0000-000000000001',
    packageUuid: 'a1b2c3d4-0000-0000-0000-000000000001',
    version: 1,
    status: 'COMPLETED',
    dateCreated: 0,
    dateStarted: 0,
    dateCompleted: 0,
    errorMessage: null,
    downloadUrl: null,
    manifest: null,
  },
};

const unbuiltPackage: ExportPackage = {
  uuid: 'a1b2c3d4-0000-0000-0000-000000000002',
  name: 'Facility data',
  description: 'Facility metadata',
  retired: false,
  dateCreated: 0,
  entries: [],
  latestBuild: null,
};

describe('PackagesTable', () => {
  beforeEach(() => {
    mockUseAllPackages.mockReturnValue({
      packages: [],
      isLoading: false,
      isValidating: false,
      error: undefined,
      mutate: vi.fn(),
    });
    mockUseSession.mockReturnValue(sessionWithUser());
    mockUserHasAccess.mockReturnValue(true);
  });

  it('allows privileged users to launch the new package workspace from the empty state', async () => {
    const user = userEvent.setup();
    render(<PackagesTable />);

    await user.click(screen.getByRole('button', { name: 'Record packages' }));

    expect(mockUserHasAccess).toHaveBeenCalledWith('Manage Metadata Export Packages', expect.anything());
    expect(mockLaunchAddNewPackageWorkspace).toHaveBeenCalledTimes(1);
  });

  it('does not offer the empty-state action to users without the manage privilege', () => {
    mockUserHasAccess.mockReturnValue(false);
    render(<PackagesTable />);

    expect(screen.queryByRole('button', { name: 'Record packages' })).not.toBeInTheDocument();
    expect(mockLaunchAddNewPackageWorkspace).not.toHaveBeenCalled();
  });

  it('renders the build status per package and launches the view workspace with the package for the clicked row', async () => {
    const user = userEvent.setup();
    mockUseAllPackages.mockReturnValue({
      packages: [builtPackage, unbuiltPackage],
      isLoading: false,
      isValidating: false,
      error: undefined,
      mutate: vi.fn(),
    });
    render(<PackagesTable />);

    const builtRow = screen.getByRole('row', { name: /Core reference data/ });
    const unbuiltRow = screen.getByRole('row', { name: /Facility data/ });

    // Status cell reflects the latest build's status, or falls back to "No builds".
    expect(within(builtRow).getByText('COMPLETED')).toBeInTheDocument();
    expect(within(unbuiltRow).getByText('No builds')).toBeInTheDocument();

    // Empty entries render as "All domains"; otherwise the formatted domain labels.
    expect(within(builtRow).getByText('Patient identifier type')).toBeInTheDocument();
    expect(within(unbuiltRow).getByText('All domains')).toBeInTheDocument();

    // Clicking View resolves the row back to its package via the packagesByUuid lookup.
    await user.click(within(builtRow).getByRole('button', { name: 'View' }));
    expect(mockLaunchViewPackageWorkspace).toHaveBeenLastCalledWith(expect.any(Function), builtPackage);

    await user.click(within(unbuiltRow).getByRole('button', { name: 'View' }));
    expect(mockLaunchViewPackageWorkspace).toHaveBeenLastCalledWith(expect.any(Function), unbuiltPackage);

    expect(mockLaunchViewPackageWorkspace).toHaveBeenCalledTimes(2);
  });
});
