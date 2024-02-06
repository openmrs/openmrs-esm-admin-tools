import React from 'react';
import ChangePasswordButton from './change-password-button.component';
import { render, screen } from '@testing-library/react';
import { showModal } from '@openmrs/esm-framework';
import userEvent from '@testing-library/user-event';

const showModalMock = showModal as jest.Mock;

describe('<ChangePasswordButton/>', () => {
  beforeEach(() => {
    render(<ChangePasswordButton />);
  });

  it('should display the `Change Password` button', async () => {
    const user = userEvent.setup();
    const changePasswordButton = await screen.findByRole('button', {
      name: /Change Password/i,
    });

    await user.click(changePasswordButton);

    expect(showModalMock).toHaveBeenCalledWith('change-password-modal');
  });
});
