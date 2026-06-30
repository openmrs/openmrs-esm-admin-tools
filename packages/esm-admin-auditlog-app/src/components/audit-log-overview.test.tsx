import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { userHasAccess } from '@openmrs/esm-framework';
import AuditLogOverview from './audit-log-overview.component';
import * as resource from './audit-log.resource';

const renderComponent = () => render(<AuditLogOverview />, { wrapper: MemoryRouter });

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback: string) => fallback }),
}));

vi.mock('@openmrs/esm-framework', () => ({
  useSession: vi.fn(() => ({ user: { roles: [], privileges: [{ display: 'View Audit Log' }] } })),
  userHasAccess: vi.fn(() => true),
  useConfig: vi.fn(() => ({ viewPrivilege: 'View Audit Log' })),
  useLayoutType: vi.fn(() => 'small-desktop'),
  isDesktop: vi.fn(() => true),
  showNotification: vi.fn(),
  OpenmrsDatePicker: ({ labelText, onChange }: any) => (
    <div>
      <label>{labelText}</label>
      <input aria-label={labelText} onChange={(e) => onChange(e.target.value ? new Date(e.target.value) : null)} />
    </div>
  ),
  useDebounce: (val: string) => val,
  restBaseUrl: '/ws/rest/v1',
  openmrsFetch: vi.fn(),
}));

vi.mock('./audit-log.resource');
const mockUseAuditLogs = vi.mocked(resource.useAuditLogs);

const mockLogs = [
  {
    revisionID: 1,
    entityType: 'org.openmrs.Patient',
    eventType: 'MOD',
    changedBy: 'admin',
    changedOn: '15/03/2026 10:00:00',
    changes: [{ fieldName: 'givenName', oldValue: 'John', currentValue: 'Johnny', changed: true }],
  },
];

const baseReturn = {
  logs: mockLogs,
  totalLogs: 1,
  totalPages: 1,
  currentPage: 0,
  isLoading: false,
  isValidating: false,
  error: undefined,
  mutate: vi.fn(),
  hasActiveFilter: true,
};

describe('AuditLogOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuditLogs.mockReturnValue(baseReturn);
    vi.mocked(resource.useAuditEntityTypes).mockReturnValue({ entityTypes: [], isLoading: false, error: undefined });
  });

  it('renders the page title', () => {
    renderComponent();
    expect(screen.getByText('Audit Logs')).toBeInTheDocument();
  });

  it('renders table rows', () => {
    renderComponent();
    expect(screen.getByText('Patient')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('15/03/2026 10:00:00')).toBeInTheDocument();
  });

  it('renders loading skeleton when isLoading is true', () => {
    mockUseAuditLogs.mockReturnValue({ ...baseReturn, logs: [], isLoading: true });
    renderComponent();
    // Carbon DataTableSkeleton renders a table-like structure
    expect(screen.getByText('Audit Logs')).toBeInTheDocument();
    expect(screen.queryByText('admin')).not.toBeInTheDocument();
  });

  it('renders empty state when no logs returned', () => {
    mockUseAuditLogs.mockReturnValue({ ...baseReturn, logs: [], totalLogs: 0 });
    renderComponent();
    expect(screen.getByText('No audit logs to display')).toBeInTheDocument();
  });

  it('renders both rows when two entries share a revision id', () => {
    const sharedRevisionLogs = [
      { ...mockLogs[0], revisionID: 20, changedOn: '15/03/2026 10:00:00' },
      { ...mockLogs[0], revisionID: 20, changedOn: '15/03/2026 10:00:00' },
    ];
    mockUseAuditLogs.mockReturnValue({ ...baseReturn, logs: sharedRevisionLogs, totalLogs: 2 });
    renderComponent();
    // Both rows must render despite sharing revisionID (no duplicate-key collision).
    expect(screen.getAllByText('Patient')).toHaveLength(2);
  });

  it('renders pagination controls when logs are present', () => {
    renderComponent();
    expect(screen.getByText('Items per page:')).toBeInTheDocument();
  });

  it('does not show a per-filter clear button when filters are empty', () => {
    renderComponent();
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });

  it('shows a per-filter clear button when a filter has a value', async () => {
    renderComponent();
    const usernameInput = screen.getByLabelText('Username');
    fireEvent.change(usernameInput, { target: { value: 'nurse01' } });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
    });
  });

  it('shows the "apply filter for diffs" hint in expanded row when no filter is active', async () => {
    mockUseAuditLogs.mockReturnValue({ ...baseReturn, hasActiveFilter: false });
    renderComponent();
    const expandButtons = screen.getAllByRole('button', { name: /expand/i });
    fireEvent.click(expandButtons[0]);
    await waitFor(() => {
      expect(screen.getByText('Apply at least one filter to see field-level changes.')).toBeInTheDocument();
    });
  });

  it('shows field-level diff when filter is active and changes exist', async () => {
    renderComponent();
    const expandButtons = screen.getAllByRole('button', { name: /expand/i });
    fireEvent.click(expandButtons[0]);
    await waitFor(() => {
      expect(screen.getByText('givenName')).toBeInTheDocument();
    });
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('Johnny')).toBeInTheDocument();
  });

  it('shows permission denied tile when user lacks privilege', () => {
    vi.mocked(userHasAccess).mockReturnValueOnce(false);
    renderComponent();
    expect(screen.getByText('You do not have permission to view audit logs.')).toBeInTheDocument();
  });
});
