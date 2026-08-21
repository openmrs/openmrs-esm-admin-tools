import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { type Session, useSession } from '@openmrs/esm-framework';
import { launchAddNewPackageWorkspace } from '../new-package-utills';
import NewPackageActionButton from './add-package-action-button.component';

vi.mock('../new-package-utills', () => ({
  launchAddNewPackageWorkspace: vi.fn(),
}));

const mockLaunchAddNewPackageWorkspace = launchAddNewPackageWorkspace as Mock;
const mockUseSession = vi.mocked(useSession);

const sessionWithPrivilege = (privileges: string[]) =>
  ({ user: { privileges: privileges.map((display) => ({ display })) } }) as unknown as Session;

describe('NewPackageActionButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSession.mockReturnValue(sessionWithPrivilege(['Manage Metadata Export Packages']));
  });

  it('renders a "New Package" button', () => {
    render(<NewPackageActionButton />);

    expect(screen.getByRole('button', { name: 'New Package' })).toBeInTheDocument();
  });

  it('launches the new package workspace when clicked', async () => {
    const user = userEvent.setup();
    render(<NewPackageActionButton />);

    await user.click(screen.getByRole('button', { name: 'New Package' }));

    expect(mockLaunchAddNewPackageWorkspace).toHaveBeenCalledTimes(1);
  });

  it('disables the button for users without the Manage Metadata Export Packages privilege', async () => {
    const user = userEvent.setup();
    mockUseSession.mockReturnValue(sessionWithPrivilege(['Get Metadata Export Packages']));
    render(<NewPackageActionButton />);

    const button = screen.getByRole('button', { name: 'New Package' });
    expect(button).toBeDisabled();

    await user.click(button);
    expect(mockLaunchAddNewPackageWorkspace).not.toHaveBeenCalled();
  });
});
