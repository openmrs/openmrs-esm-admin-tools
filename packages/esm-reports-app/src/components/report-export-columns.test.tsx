import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import ReportExportColumnsModal from './report-export-columns.modal';

describe('report export columns modal', () => {
  it('preserves selection changes on cancel and exports the current selection on reopen', async () => {
    const user = userEvent.setup();
    const close = vi.fn();
    const onSelectionChange = vi.fn();
    const onExport = vi.fn();
    const props = {
      close,
      onSelectionChange,
      onExport,
      columns: [
        { name: 'name', label: 'Name' },
        { name: 'age', label: 'Age' },
      ],
    };
    const { unmount } = render(<ReportExportColumnsModal {...props} selectedColumns={{ name: true, age: true }} />);
    await user.click(screen.getByRole('checkbox', { name: 'Age' }));
    expect(onSelectionChange).toHaveBeenLastCalledWith({ name: true, age: false });
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(close).toHaveBeenCalledOnce();
    expect(onExport).not.toHaveBeenCalled();
    unmount();
    render(<ReportExportColumnsModal {...props} selectedColumns={{ name: true, age: false }} />);
    expect(screen.getByRole('checkbox', { name: 'Age' })).not.toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Export' }));
    expect(onExport).toHaveBeenCalledWith({ name: true, age: false });
    expect(close).toHaveBeenCalledTimes(2);
  });
});
