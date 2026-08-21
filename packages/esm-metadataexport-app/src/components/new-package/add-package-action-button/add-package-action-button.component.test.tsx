import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { type Session, useSession, userHasAccess } from '@openmrs/esm-framework';
import { launchAddNewPackageWorkspace } from '../new-package-utills';
import NewPackageActionButton from './add-package-action-button.component';

vi.mock('../new-package-utills', () => ({
  launchAddNewPackageWorkspace: vi.fn(),
}));

const mockLaunchAddNewPackageWorkspace = launchAddNewPackageWorkspace as Mock;
const mockUseSession = vi.mocked(useSession);
const mockUserHasAccess = vi.mocked(userHasAccess);

const sessionWithUser = () => ({ user: { uuid: 'cc8507b8-7c9a-486b-85dc-b8f25ad1e4cc' } }) as unknown as Session;

describe('NewPackageActionButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSession.mockReturnValue(sessionWithUser());
    mockUserHasAccess.mockReturnValue(true);
  });

  it('renders a "New Package" button', () => {
    render(<NewPackageActionButton />);

    expect(screen.getByRole('button', { name: 'New Package' })).toBeInTheDocument();
  });

  it('launches the new package workspace when a privileged user clicks', async () => {
    const user = userEvent.setup();
    render(<NewPackageActionButton />);

    await user.click(screen.getByRole('button', { name: 'New Package' }));

    expect(mockUserHasAccess).toHaveBeenCalledWith('Manage Metadata Export Packages', expect.anything());
    expect(mockLaunchAddNewPackageWorkspace).toHaveBeenCalledTimes(1);
  });

  it('does not render the button for users without the Manage Metadata Export Packages privilege', () => {
    mockUserHasAccess.mockReturnValue(false);
    render(<NewPackageActionButton />);

    expect(screen.queryByRole('button', { name: 'New Package' })).not.toBeInTheDocument();
    expect(mockLaunchAddNewPackageWorkspace).not.toHaveBeenCalled();
  });

  it('does not render the button when there is no authenticated user', () => {
    mockUseSession.mockReturnValue({ authenticated: false } as unknown as Session);
    render(<NewPackageActionButton />);

    expect(screen.queryByRole('button', { name: 'New Package' })).not.toBeInTheDocument();
    expect(mockUserHasAccess).not.toHaveBeenCalled();
  });
});
