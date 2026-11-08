import { renderHook, waitFor } from '@testing-library/react';
import { openmrsFetch } from '@openmrs/esm-framework';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { useMetadataItemCount } from './items.resource';

const mockOpenmrsFetch = openmrsFetch as Mock;

describe('useMetadataItemCount', () => {
  beforeEach(() => {
    mockOpenmrsFetch.mockResolvedValue({ data: { results: [], totalCount: 3 } });
  });

  it('counts retired items too, since they can be selected in the picker', async () => {
    const { result } = renderHook(() => useMetadataItemCount('LOCATIONS'));

    await waitFor(() => expect(result.current.totalCount).toBe(3));
    const requestedUrl: string = mockOpenmrsFetch.mock.lastCall[0];
    expect(requestedUrl).toContain('domain=LOCATIONS');
    expect(requestedUrl).toContain('includeAll=true');
  });

  it('does not fetch when told not to', () => {
    renderHook(() => useMetadataItemCount('LOCATIONS', false));

    expect(mockOpenmrsFetch).not.toHaveBeenCalled();
  });
});
