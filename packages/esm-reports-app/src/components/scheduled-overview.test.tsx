import React from 'react';
import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ScheduledOverviewComponent from './scheduled-overview.component';
import { useScheduledReports } from './reports.resource';

vi.mock('@openmrs/esm-framework', () => ({
  isDesktop: vi.fn(() => true),
  useLayoutType: vi.fn(() => 'desktop'),
  usePagination: vi.fn((rows) => ({ currentPage: 1, results: rows, goTo: vi.fn() })),
  PageHeader: vi.fn(({ children }) => <div>{children}</div>),
  PageHeaderContent: vi.fn(({ illustration, title }) => (
    <div>
      {illustration}
      <h1>{title}</h1>
    </div>
  )),
  ReportsPictogram: vi.fn(() => <svg data-testid="reports-pictogram" />),
}));

vi.mock('./reports.resource', () => ({
  useScheduledReports: vi.fn(),
}));

vi.mock('./scheduled-overview-cell-content.component', () => ({
  default: ({ cell }) => <span>{typeof cell.value === 'string' ? cell.value : null}</span>,
}));

vi.mock('./overlay.component', () => ({
  default: () => null,
}));

const mockUseScheduledReports = vi.mocked(useScheduledReports);

describe('ScheduledOverviewComponent', () => {
  it('renders the Scheduled reports page header and the scheduled reports', () => {
    mockUseScheduledReports.mockReturnValue({
      scheduledReports: [
        { reportDefinitionUuid: 'report-uuid', reportRequestUuid: null, name: 'Patient Identifier Sticker' },
      ],
      mutateScheduledReports: vi.fn(),
    });

    render(<ScheduledOverviewComponent />);

    expect(screen.getByRole('heading', { name: 'Scheduled reports' })).toBeInTheDocument();
    expect(screen.getByTestId('reports-pictogram')).toBeInTheDocument();
    expect(screen.getByText('Patient Identifier Sticker')).toBeInTheDocument();
  });
});
