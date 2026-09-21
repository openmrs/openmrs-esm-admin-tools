import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { type Session, useSession, userHasAccess } from '@openmrs/esm-framework';
import { launchPackageFormWorkspace } from '../metadata-package-form-utils';
import AddPackageActionButton from './add-package-action-button.component';

vi.mock('../metadata-package-form-utils', () => ({
  launchPackageFormWorkspace: vi.fn(),
}));

const mockLaunchPackageFormWorkspace = launchPackageFormWorkspace as Mock;
const mockUseSession = vi.mocked(useSession);
const mockUserHasAccess = vi.mocked(userHasAccess);

const sessionWithUser = () => ({ user: { uuid: 'cc8507b8-7c9a-486b-85dc-b8f25ad1e4cc' } }) as unknown as Session;

describe('AddPackageActionButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSession.mockReturnValue(sessionWithUser());
    mockUserHasAccess.mockReturnValue(true);
  });

  it('renders a "New Package" button', () => {
    render(<AddPackageActionButton />);

    expect(screen.getByRole('button', { name: 'New Package' })).toBeInTheDocument();
  });

  it('launches the new package workspace when a privileged user clicks', async () => {
    const user = userEvent.setup();
    render(<AddPackageActionButton />);

    await user.click(screen.getByRole('button', { name: 'New Package' }));

    expect(mockUserHasAccess).toHaveBeenCalledWith('Manage Metadata Export Packages', expect.anything());
    expect(mockLaunchPackageFormWorkspace).toHaveBeenCalledTimes(1);
  });

  it('does not render the button for users without the Manage Metadata Export Packages privilege', () => {
    mockUserHasAccess.mockReturnValue(false);
    render(<AddPackageActionButton />);

    expect(screen.queryByRole('button', { name: 'New Package' })).not.toBeInTheDocument();
    expect(mockLaunchPackageFormWorkspace).not.toHaveBeenCalled();
  });

  it('does not render the button when there is no authenticated user', () => {
    mockUseSession.mockReturnValue({ authenticated: false } as unknown as Session);
    render(<AddPackageActionButton />);

    expect(screen.queryByRole('button', { name: 'New Package' })).not.toBeInTheDocument();
    expect(mockUserHasAccess).not.toHaveBeenCalled();
  });
});
