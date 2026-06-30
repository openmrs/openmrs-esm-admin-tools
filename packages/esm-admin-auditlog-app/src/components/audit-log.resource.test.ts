import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import useSWR from 'swr';
import dayjs from 'dayjs';
import { useAuditLogs } from './audit-log.resource';
import { DATE_FILTER_FORMAT } from '../constants';
import type { AuditLogFilterState } from '../types';

vi.mock('swr');
vi.mock('@openmrs/esm-framework', () => ({
  openmrsFetch: vi.fn(),
  restBaseUrl: '/ws/rest/v1',
}));

const mockUseSWR = vi.mocked(useSWR);

const emptyFilters: AuditLogFilterState = {
  entityType: '',
  username: '',
  startDate: null,
  endDate: null,
};

const mockResponse = {
  data: {
    data: {
      logs: [],
      totalLogs: 0,
      totalPages: 0,
      currentPage: 0,
    },
  },
  isLoading: false,
  error: undefined,
  mutate: vi.fn(),
};

describe('useAuditLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSWR.mockReturnValue(mockResponse as any);
  });

  it('builds URL with only page and size when no filters are set', () => {
    renderHook(() => useAuditLogs(emptyFilters, 0, 20));
    const calledUrl = mockUseSWR.mock.calls[0][0] as string;
    expect(calledUrl).toContain('page=0');
    expect(calledUrl).toContain('size=20');
    expect(calledUrl).not.toContain('entityType');
    expect(calledUrl).not.toContain('username');
    expect(calledUrl).not.toContain('startDate');
    expect(calledUrl).not.toContain('endDate');
  });

  it('appends entityType filter when set', () => {
    renderHook(() => useAuditLogs({ ...emptyFilters, entityType: 'org.openmrs.Patient' }, 0, 20));
    const calledUrl = mockUseSWR.mock.calls[0][0] as string;
    expect(calledUrl).toContain('entityType=org.openmrs.Patient');
  });

  it('appends trimmed username filter when set', () => {
    renderHook(() => useAuditLogs({ ...emptyFilters, username: '  admin  ' }, 0, 20));
    const calledUrl = mockUseSWR.mock.calls[0][0] as string;
    expect(calledUrl).toContain('username=admin');
  });

  it('formats startDate as dd/MM/yyyy', () => {
    const date = new Date('2026-03-15');
    renderHook(() => useAuditLogs({ ...emptyFilters, startDate: date }, 0, 20));
    const calledUrl = mockUseSWR.mock.calls[0][0] as string;
    expect(calledUrl).toContain(`startDate=${encodeURIComponent(dayjs(date).format(DATE_FILTER_FORMAT))}`);
  });

  it('formats endDate as dd/MM/yyyy', () => {
    const date = new Date('2026-03-20');
    renderHook(() => useAuditLogs({ ...emptyFilters, endDate: date }, 0, 20));
    const calledUrl = mockUseSWR.mock.calls[0][0] as string;
    expect(calledUrl).toContain(`endDate=${encodeURIComponent(dayjs(date).format(DATE_FILTER_FORMAT))}`);
  });

  it('returns hasActiveFilter=false when no filters set', () => {
    const { result } = renderHook(() => useAuditLogs(emptyFilters, 0, 20));
    expect(result.current.hasActiveFilter).toBe(false);
  });

  it('returns hasActiveFilter=true when entityType filter is set', () => {
    const { result } = renderHook(() => useAuditLogs({ ...emptyFilters, entityType: 'org.openmrs.Patient' }, 0, 20));
    expect(result.current.hasActiveFilter).toBe(true);
  });

  it('does not append username when it is only whitespace', () => {
    renderHook(() => useAuditLogs({ ...emptyFilters, username: '   ' }, 0, 20));
    const calledUrl = mockUseSWR.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain('username');
  });
});
