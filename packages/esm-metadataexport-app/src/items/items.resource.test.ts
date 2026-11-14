import { renderHook, waitFor } from '@testing-library/react';
import { OpenmrsFetchError, openmrsFetch } from '@openmrs/esm-framework';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { useMetadataItemCount, useMetadataItemsByUuid } from './items.resource';

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

describe('useMetadataItemsByUuid', () => {
  it('keeps the successful look-ups when others fail', async () => {
    mockOpenmrsFetch.mockImplementation(async (url: string) => {
      const uuid = url.match(/items\/([^?]+)/)[1];
      if (uuid === 'deleted') {
        throw Object.assign(Object.create(OpenmrsFetchError.prototype), { response: { status: 404 } });
      }
      if (uuid === 'broken') {
        throw new Error('Network error');
      }
      return { data: { uuid, display: 'Weight' } };
    });

    const { result } = renderHook(() => useMetadataItemsByUuid('CONCEPTS', ['weight', 'deleted', 'broken']));

    await waitFor(() => expect(result.current.itemsByUuid).toBeDefined());
    expect(result.current.itemsByUuid.get('weight')).toEqual({ uuid: 'weight', display: 'Weight' });
    expect(result.current.itemsByUuid.get('deleted')).toBeNull();
    expect(result.current.itemsByUuid.has('broken')).toBe(false);
    expect(result.current.failedUuids).toEqual(new Set(['broken']));
  });
});
