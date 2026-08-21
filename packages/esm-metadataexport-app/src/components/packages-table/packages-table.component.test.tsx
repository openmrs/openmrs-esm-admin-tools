import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type Session, useSession, userHasAccess } from '@openmrs/esm-framework';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAllPackages } from '../../packages/packages.resource';
import { launchAddNewPackageWorkspace } from '../new-package/new-package-utils';
import PackagesTable from './packages-table.component';

vi.mock('../../packages/packages.resource', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useAllPackages: vi.fn(),
}));

vi.mock('../new-package/new-package-utils', () => ({
  launchAddNewPackageWorkspace: vi.fn(),
}));

const mockUseAllPackages = vi.mocked(useAllPackages);
const mockUseSession = vi.mocked(useSession);
const mockUserHasAccess = vi.mocked(userHasAccess);
const mockLaunchAddNewPackageWorkspace = vi.mocked(launchAddNewPackageWorkspace);

const sessionWithUser = () => ({ user: { uuid: 'cc8507b8-7c9a-486b-85dc-b8f25ad1e4cc' } }) as unknown as Session;

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
});
