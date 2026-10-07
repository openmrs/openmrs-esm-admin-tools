import React from 'react';
import { SWRConfig } from 'swr';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { openmrsFetch } from '@openmrs/esm-framework';
import { useReports } from './reports.resource';

// Runs the hook against real SWR so the timer behaviour is exercised, not just the interval value.
const mockOpenmrsFetch = openmrsFetch as unknown as Mock;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>{children}</SWRConfig>
);

function respondWith(statuses: Array<string>) {
  return {
    data: {
      results: statuses.map((status, i) => ({
        uuid: `request-${i}`,
        status,
        parameterizable: { name: 'Patient Identifier Sticker', parameters: [] },
        requestedBy: { uuid: 'user', person: { display: 'Super User' } },
        requestDate: '2026-10-05T10:00:00.000+0000',
        renderingMode: { label: 'PDF' },
        parameterMappings: {},
        schedule: null,
      })),
      totalCount: statuses.length,
    },
  };
}

describe('useReports polling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps fetching while a request is in progress and stops once it completes', async () => {
    mockOpenmrsFetch
      .mockResolvedValueOnce(respondWith(['REQUESTED']))
      .mockResolvedValueOnce(respondWith(['PROCESSING']))
      .mockResolvedValue(respondWith(['COMPLETED']));

    const { result } = renderHook(() => useReports('REQUESTED,COMPLETED', 0, 10), { wrapper });

    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(mockOpenmrsFetch).toHaveBeenCalledTimes(1);
    expect(result.current.reports[0].status).toBe('REQUESTED');

    await act(() => vi.advanceTimersByTimeAsync(5000));
    expect(mockOpenmrsFetch).toHaveBeenCalledTimes(2);
    expect(result.current.reports[0].status).toBe('PROCESSING');

    await act(() => vi.advanceTimersByTimeAsync(5000));
    expect(mockOpenmrsFetch).toHaveBeenCalledTimes(3);
    expect(result.current.reports[0].status).toBe('COMPLETED');

    await act(() => vi.advanceTimersByTimeAsync(20000));
    expect(mockOpenmrsFetch).toHaveBeenCalledTimes(3);
  });

  it('does not poll when nothing is in progress', async () => {
    mockOpenmrsFetch.mockResolvedValue(respondWith(['COMPLETED', 'FAILED']));

    renderHook(() => useReports('REQUESTED,COMPLETED', 0, 10), { wrapper });

    await act(() => vi.advanceTimersByTimeAsync(0));
    await act(() => vi.advanceTimersByTimeAsync(20000));
    expect(mockOpenmrsFetch).toHaveBeenCalledTimes(1);
  });

  it('keeps the timer going across re-renders of the consumer', async () => {
    mockOpenmrsFetch.mockResolvedValueOnce(respondWith(['REQUESTED'])).mockResolvedValue(respondWith(['REQUESTED']));

    const { rerender } = renderHook(() => useReports('REQUESTED,COMPLETED', 0, 10), { wrapper });
    await act(() => vi.advanceTimersByTimeAsync(0));

    for (let elapsed = 0; elapsed < 5000; elapsed += 1000) {
      rerender();
      await act(() => vi.advanceTimersByTimeAsync(1000));
    }

    expect(mockOpenmrsFetch.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
