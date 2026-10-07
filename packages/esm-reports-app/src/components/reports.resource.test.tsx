import { renderHook } from '@testing-library/react';
import useSWR, { useSWRConfig } from 'swr';
import { describe, expect, it, vi, type Mock } from 'vitest';
import { useReports } from './reports.resource';

vi.mock('swr', () => ({ default: vi.fn(), useSWRConfig: vi.fn() }));

const mockUseSWR = useSWR as unknown as Mock;
const mockUseSWRConfig = useSWRConfig as unknown as Mock;

const reportsUrl =
  '/ws/rest/v1/reportingrest/reportRequest?status=REQUESTED,COMPLETED&startIndex=0&limit=10&totalCount=true';

function refreshIntervalFor(cachedResults?: Array<{ status: string }>) {
  const cache = new Map();
  if (cachedResults) {
    cache.set(reportsUrl, { data: { data: { results: cachedResults } } });
  }
  mockUseSWRConfig.mockReturnValue({ cache });
  mockUseSWR.mockReturnValue({ data: undefined, error: undefined, isValidating: false, mutate: vi.fn() });

  renderHook(() => useReports('REQUESTED,COMPLETED', 0, 10));

  const [url, , options] = mockUseSWR.mock.calls.at(-1);
  expect(url).toBe(reportsUrl);
  return options.refreshInterval as number;
}

describe('useReports', () => {
  it('polls while a listed report request is still requested or processing', () => {
    expect(refreshIntervalFor([{ status: 'COMPLETED' }, { status: 'REQUESTED' }])).toBeGreaterThan(0);
    expect(refreshIntervalFor([{ status: 'PROCESSING' }])).toBeGreaterThan(0);
  });

  it('does not poll once no report request is in progress', () => {
    expect(refreshIntervalFor([{ status: 'COMPLETED' }, { status: 'FAILED' }, { status: 'SAVED' }])).toBe(0);
    expect(refreshIntervalFor([{ status: 'SCHEDULED' }])).toBe(0);
    expect(refreshIntervalFor(undefined)).toBe(0);
  });

  it('passes a fixed interval rather than a function, so re-renders do not re-arm the timer', () => {
    expect(typeof refreshIntervalFor([{ status: 'REQUESTED' }])).toBe('number');
  });
});
