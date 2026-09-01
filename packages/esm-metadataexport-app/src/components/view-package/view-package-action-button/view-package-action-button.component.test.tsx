import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { type Session, useSession, userHasAccess } from '@openmrs/esm-framework';
import { type ExportPackage } from '../../../types';
import { launchViewPackageWorkspace } from '../view-package-utils';
import ViewPackageActionButton from './view-package-action-button.component';

vi.mock('../view-package-utils', () => ({
  launchViewPackageWorkspace: vi.fn(),
}));

const mockLaunchViewPackageWorkspace = launchViewPackageWorkspace as Mock;
const mockUseSession = vi.mocked(useSession);
const mockUserHasAccess = vi.mocked(userHasAccess);

const sessionWithUser = () => ({ user: { uuid: 'cc8507b8-7c9a-486b-85dc-b8f25ad1e4cc' } }) as unknown as Session;

const mockPackage: ExportPackage = {
  uuid: 'a1b2c3d4-0000-0000-0000-000000000000',
  name: 'Core data',
  description: 'testing one',
  retired: false,
  dateCreated: 0,
  entries: [],
  latestBuild: null,
};

describe('ViewPackageActionButton', () => {
  beforeEach(() => {
    mockUseSession.mockReturnValue(sessionWithUser());
    mockUserHasAccess.mockReturnValue(true);
  });

  it('renders a "View" button', () => {
    render(<ViewPackageActionButton exportPackage={mockPackage} />);

    expect(screen.getByRole('button', { name: 'View' })).toBeInTheDocument();
  });

  it('launches the view package workspace with the package when a privileged user clicks', async () => {
    const user = userEvent.setup();
    render(<ViewPackageActionButton exportPackage={mockPackage} />);

    await user.click(screen.getByRole('button', { name: 'View' }));

    expect(mockUserHasAccess).toHaveBeenCalledWith('Manage Metadata Export Packages', expect.anything());
    expect(mockLaunchViewPackageWorkspace).toHaveBeenCalledTimes(1);
    expect(mockLaunchViewPackageWorkspace).toHaveBeenCalledWith(expect.any(Function), mockPackage);
  });

  it('disables the button for users without the Manage Metadata Export Packages privilege', async () => {
    const user = userEvent.setup();
    mockUserHasAccess.mockReturnValue(false);
    render(<ViewPackageActionButton exportPackage={mockPackage} />);

    const button = screen.getByRole('button', { name: 'View' });
    expect(button).toBeDisabled();

    await user.click(button);
    expect(mockLaunchViewPackageWorkspace).not.toHaveBeenCalled();
  });

  it('disables the button when there is no authenticated user', () => {
    mockUseSession.mockReturnValue({ authenticated: false } as unknown as Session);
    render(<ViewPackageActionButton exportPackage={mockPackage} />);

    expect(screen.getByRole('button', { name: 'View' })).toBeDisabled();
    expect(mockUserHasAccess).not.toHaveBeenCalled();
  });
});
