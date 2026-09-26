import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type Session, useSession, userHasAccess } from '@openmrs/esm-framework';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type ExportPackage } from '../../types/index';
import { usePackages } from '../../packages/packages.resource';
import { launchPackageFormWorkspace } from '../metadata-package-form/metadata-package-form-utils';
import { launchViewMetadataPackageWorkspace } from '../view-metadata-package/view-metadata-package-utils';
import PackagesTable from './packages-table.component';

vi.mock('../../packages/packages.resource', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  usePackages: vi.fn(),
}));

vi.mock('../metadata-package-form/metadata-package-form-utils', () => ({
  launchPackageFormWorkspace: vi.fn(),
}));

vi.mock('../view-metadata-package/view-metadata-package-utils', () => ({
  launchViewMetadataPackageWorkspace: vi.fn(),
}));

const mockUsePackages = vi.mocked(usePackages);
const mockUseSession = vi.mocked(useSession);
const mockUserHasAccess = vi.mocked(userHasAccess);
const mockLaunchPackageFormWorkspace = vi.mocked(launchPackageFormWorkspace);
const mockLaunchViewPackageWorkspace = vi.mocked(launchViewMetadataPackageWorkspace);

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
    mockUsePackages.mockReturnValue({
      packages: [],
      totalCount: 0,
      currentPage: 1,
      currentPageSize: 10,
      goTo: vi.fn(),
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
    expect(mockLaunchPackageFormWorkspace).toHaveBeenCalledTimes(1);
  });

  it('does not offer the empty-state action to users without the manage privilege', () => {
    mockUserHasAccess.mockReturnValue(false);
    render(<PackagesTable />);

    expect(screen.queryByRole('button', { name: 'Record packages' })).not.toBeInTheDocument();
    expect(mockLaunchPackageFormWorkspace).not.toHaveBeenCalled();
  });

  it('shows the loading skeleton on the initial load, before any packages have arrived', () => {
    mockUsePackages.mockReturnValue({
      packages: [],
      totalCount: 0,
      currentPage: 1,
      currentPageSize: 10,
      goTo: vi.fn(),
      isLoading: true,
      isValidating: false,
      error: undefined,
      mutate: vi.fn(),
    });
    render(<PackagesTable />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('keeps the current page on screen while the next page loads instead of swapping in the skeleton', () => {
    // keepPreviousData means isLoading can be true while the previous page's data is still present.
    mockUsePackages.mockReturnValue({
      packages: [builtPackage, unbuiltPackage],
      totalCount: 25,
      currentPage: 1,
      currentPageSize: 10,
      goTo: vi.fn(),
      isLoading: true,
      isValidating: false,
      error: undefined,
      mutate: vi.fn(),
    });
    render(<PackagesTable />);

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByRole('row', { name: /Core reference data/ })).toBeInTheDocument();
  });

  it('renders the build status per package and launches the view workspace with the package for the clicked row', async () => {
    const user = userEvent.setup();
    mockUsePackages.mockReturnValue({
      packages: [builtPackage, unbuiltPackage],
      totalCount: 2,
      currentPage: 1,
      currentPageSize: 10,
      goTo: vi.fn(),
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
    expect(mockLaunchViewPackageWorkspace).toHaveBeenLastCalledWith(builtPackage);

    await user.click(within(unbuiltRow).getByRole('button', { name: 'View' }));
    expect(mockLaunchViewPackageWorkspace).toHaveBeenLastCalledWith(unbuiltPackage);

    expect(mockLaunchViewPackageWorkspace).toHaveBeenCalledTimes(2);
  });

  // 25 packages across pages of 10 gives three pages, so both Next and the page-size selector are active.
  const firstPageOfMany = Array.from({ length: 10 }, (_, index) => ({
    ...unbuiltPackage,
    uuid: `a1b2c3d4-0000-0000-0000-00000000${(index + 10).toString().padStart(4, '0')}`,
    name: `Package ${index + 1}`,
  }));

  it('advances to the next page when the "Next page" control is clicked', async () => {
    const user = userEvent.setup();
    const goTo = vi.fn();
    mockUsePackages.mockReturnValue({
      packages: firstPageOfMany,
      totalCount: 25,
      currentPage: 1,
      currentPageSize: 10,
      goTo,
      isLoading: false,
      isValidating: false,
      error: undefined,
      mutate: vi.fn(),
    });
    render(<PackagesTable />);

    await user.click(screen.getByRole('button', { name: 'Next page' }));

    expect(goTo).toHaveBeenCalledWith(2);
  });

  it('refetches with the new page size and resets to the first page when the page size changes', async () => {
    const user = userEvent.setup();
    const goTo = vi.fn();
    mockUsePackages.mockReturnValue({
      packages: firstPageOfMany,
      totalCount: 25,
      currentPage: 1,
      currentPageSize: 10,
      goTo,
      isLoading: false,
      isValidating: false,
      error: undefined,
      mutate: vi.fn(),
    });
    render(<PackagesTable />);

    expect(mockUsePackages).toHaveBeenCalledWith(10);

    await user.selectOptions(screen.getByLabelText(/items per page/i), '20');

    expect(mockUsePackages).toHaveBeenCalledWith(20);
    expect(goTo).toHaveBeenCalledWith(1);
  });
});
