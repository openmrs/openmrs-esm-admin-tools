import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderWithSwr } from '@tools/test-helpers';
import { showSnackbar } from '@openmrs/esm-framework';
import ReportsDataOverviewComponent from './reports-data-overview.component';
import { useReportDefinitions, useReportData, useLocations } from './reports.resource';

vi.mock('@openmrs/esm-framework', () => ({
  ExtensionSlot: vi.fn(({ name }) => <div data-testid={`extension-slot-${name}`} />),
  showSnackbar: vi.fn(),
  getCoreTranslation: vi.fn((key: string) => key),
  useConfig: vi.fn(),
}));

vi.mock('./reports.resource', () => ({
  useReportDefinitions: vi.fn(),
  useReportData: vi.fn(),
  useLocations: vi.fn(),
}));

vi.mock('./report-parameter.component', () => ({
  default: ({ parameter, handleOnChange }) => (
    <label>
      {parameter.label}
      <input name={parameter.name} onChange={handleOnChange} />
    </label>
  ),
}));

vi.mock('./report-data-viewer.component', () => ({
  default: () => null,
}));

vi.mock('./overlay.component', () => ({
  default: () => null,
}));

const mockUseReportDefinitions = vi.mocked(useReportDefinitions);
const mockUseReportData = vi.mocked(useReportData);
const mockUseLocations = vi.mocked(useLocations);
const mockShowSnackbar = vi.mocked(showSnackbar);

const reportDefinition = {
  uuid: 'report-uuid',
  name: 'Test Report',
  description: '',
  parameters: [
    { name: 'startDate', label: 'Start Date', type: 'java.lang.String', required: true },
    { name: 'location', label: 'Location', type: 'java.lang.String', required: true },
  ],
};

const renderComponent = () => renderWithSwr(<ReportsDataOverviewComponent />);

beforeEach(() => {
  vi.clearAllMocks();
  mockUseReportDefinitions.mockReturnValue({ reportDefinitions: [reportDefinition] });
  mockUseReportData.mockReturnValue({ reportData: null, error: null, isLoading: false, mutate: vi.fn() });
  mockUseLocations.mockReturnValue({ locations: [] });
});

describe('ReportsDataOverviewComponent', () => {
  it('lists the names of missing required parameters instead of a literal placeholder', () => {
    renderComponent();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'report-uuid' } });
    fireEvent.click(screen.getByRole('button', { name: 'Fetch Report' }));

    expect(mockShowSnackbar).toHaveBeenCalledWith({
      kind: 'error',
      title: 'error',
      subtitle: 'Please provide the following parameters: Start Date, Location',
    });
  });

  it('shows only the missing parameters when some are already provided', () => {
    renderComponent();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'report-uuid' } });
    fireEvent.change(screen.getByLabelText('Start Date'), { target: { value: '2026-01-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Fetch Report' }));

    expect(mockShowSnackbar).toHaveBeenCalledWith({
      kind: 'error',
      title: 'error',
      subtitle: 'Please provide the following parameters: Location',
    });
  });

  it('does not show the error snackbar when all required parameters are provided', () => {
    const mutate = vi.fn();
    mockUseReportData.mockReturnValue({ reportData: null, error: null, isLoading: false, mutate });
    renderComponent();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'report-uuid' } });
    fireEvent.change(screen.getByLabelText('Start Date'), { target: { value: '2026-01-01' } });
    fireEvent.change(screen.getByLabelText('Location'), { target: { value: 'Main Clinic' } });
    fireEvent.click(screen.getByRole('button', { name: 'Fetch Report' }));

    expect(mockShowSnackbar).not.toHaveBeenCalled();
    expect(mutate).toHaveBeenCalled();
  });
});