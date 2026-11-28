import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuditLogs } from './audit-log.resource';
import AuditLogDashboard from './audit-log-dashboard.component';

jest.mock('./audit-log.resource');
jest.mock('@openmrs/esm-framework', () => ({
  formatDatetime: (d: Date) => d.toISOString(),
  parseDate: (s: string) => new Date(s),
}));

const mockUseAuditLogs = useAuditLogs as jest.Mock;

const mockLog = {
  uuid: 'abc-123',
  type: 'org.openmrs.Patient',
  simpleType: 'Patient',
  identifier: '42',
  action: 'CREATED' as const,
  userUuid: 'user-uuid-1',
  userDisplay: 'admin',
  dateCreated: '2026-04-19T10:00:00.000Z',
  hasChildLogs: false,
};

describe('AuditLogDashboard', () => {
  beforeEach(() => {
    mockUseAuditLogs.mockReturnValue({
      logs: [mockLog],
      totalCount: 1,
      isLoading: false,
      error: null,
    });
  });

  it('renders audit log rows from the API', () => {
    render(<AuditLogDashboard />);
    expect(screen.getByText('Patient')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('CREATED')).toBeInTheDocument();
  });

  it('shows empty state when no logs are returned', () => {
    mockUseAuditLogs.mockReturnValue({ logs: [], totalCount: 0, isLoading: false, error: null });
    render(<AuditLogDashboard />);
    expect(screen.getByText('No audit logs found')).toBeInTheDocument();
  });

  it('shows skeleton while loading', () => {
    mockUseAuditLogs.mockReturnValue({ logs: [], totalCount: 0, isLoading: true, error: null });
    render(<AuditLogDashboard />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error notification when fetch fails', () => {
    mockUseAuditLogs.mockReturnValue({
      logs: [],
      totalCount: 0,
      isLoading: false,
      error: new Error('Network error'),
    });
    render(<AuditLogDashboard />);
    expect(screen.getByText('Error loading audit logs')).toBeInTheDocument();
  });

  it('resets to page 1 when filters change', async () => {
    render(<AuditLogDashboard />);
    const userInput = screen.getByLabelText('Filter by user');
    await userEvent.type(userInput, 'some-uuid');
    expect(mockUseAuditLogs).toHaveBeenLastCalledWith(expect.objectContaining({ userUuid: 'some-uuid' }), 0, 10);
  });
});
