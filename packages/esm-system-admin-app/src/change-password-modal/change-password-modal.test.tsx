import React from 'react';
import { render, screen } from '@testing-library/react';
import ChangePasswordModal from './change-password-modal.component';
import userEvent from '@testing-library/user-event';

describe(`Change Password Modal`, () => {
  it('should change user locale', async () => {
    const user = userEvent.setup();

    render(<ChangePasswordModal close={jest.fn()} />);
    expect(screen.getByRole('button', { name: /Apply/ })).toBeDisabled();

    await user.type(screen.getByLabelText(/Old Password/i), 'my-password');
    await user.type(screen.getByLabelText(/New Password/i), 'my-password');
    await user.type(screen.getByLabelText(/Confirm Password/i), 'my-password');
    await user.click(screen.getByRole('button', { name: /Apply/i }));
  });
});
