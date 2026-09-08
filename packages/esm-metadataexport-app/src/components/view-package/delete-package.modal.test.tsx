import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, type Mock } from 'vitest';
import * as esmFramework from '@openmrs/esm-framework';
import DeletePackageModal from './delete-package.modal';
import { deletePackage } from '../../packages/packages.resource';
import type { ExportPackage } from '../../types';

vi.mock('../../packages/packages.resource', () => ({
  deletePackage: vi.fn(),
}));

const mockDeletePackage = deletePackage as Mock;
const mockShowSnackbar = esmFramework.showSnackbar as Mock;

const exportPackage: ExportPackage = {
  uuid: '361d69db-c018-4545-87a7-e987e8af9e85',
  name: 'Core reference data',
  description: 'Some notes',
  retired: false,
  dateCreated: Date.now(),
  entries: [],
  latestBuild: null,
};

const mockCloseModal = vi.fn();
const mockOnDeleted = vi.fn();

function renderModal() {
  render(<DeletePackageModal closeModal={mockCloseModal} exportPackage={exportPackage} onDeleted={mockOnDeleted} />);
}

describe('DeletePackageModal', () => {
  it('deletes the package with the provided reason, then closes the modal and notifies the caller', async () => {
    const user = userEvent.setup();
    mockDeletePackage.mockResolvedValue({});
    renderModal();

    await user.type(screen.getByRole('textbox'), 'No longer needed');
    await user.click(screen.getByRole('button', { name: /delete/i }));

    expect(mockDeletePackage).toHaveBeenCalledWith(exportPackage.uuid, 'No longer needed');
    await waitFor(() => expect(mockCloseModal).toHaveBeenCalled());
    expect(mockOnDeleted).toHaveBeenCalled();
    expect(mockShowSnackbar).toHaveBeenCalledWith(expect.objectContaining({ kind: 'success' }));
  });

  it('shows an error snackbar and keeps the modal open when deletion fails', async () => {
    const user = userEvent.setup();
    mockDeletePackage.mockRejectedValue(new Error('Boom'));
    renderModal();

    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() =>
      expect(mockShowSnackbar).toHaveBeenCalledWith(expect.objectContaining({ kind: 'error', subtitle: 'Boom' })),
    );
    expect(mockCloseModal).not.toHaveBeenCalled();
    expect(mockOnDeleted).not.toHaveBeenCalled();
  });

  it('closes the modal without deleting when Cancel is clicked', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockCloseModal).toHaveBeenCalled();
    expect(mockDeletePackage).not.toHaveBeenCalled();
  });
});
