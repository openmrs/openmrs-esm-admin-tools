import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { launchAddNewPackageWorkspace } from '../new-package-utills';
import NewPackageActionButton from './add-package-action-button.component';

vi.mock('../new-package-utills', () => ({
  launchAddNewPackageWorkspace: vi.fn(),
}));

const mockLaunchAddNewPackageWorkspace = launchAddNewPackageWorkspace as Mock;

describe('NewPackageActionButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
