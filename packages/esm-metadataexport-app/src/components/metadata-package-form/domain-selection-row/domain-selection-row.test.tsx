import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { showModal } from '@openmrs/esm-framework';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { useMetadataItemCount, useMetadataItemsByUuid } from '../../../items/items.resource';
import type { MetadataItem } from '../../../types';
import DomainSelectionRow from './domain-selection-row.component';

vi.mock('../../../items/items.resource', () => ({
  useMetadataItemCount: vi.fn(),
  useMetadataItemsByUuid: vi.fn(),
}));

const mockUseMetadataItemCount = useMetadataItemCount as Mock;
const mockUseMetadataItemsByUuid = useMetadataItemsByUuid as Mock;
const mockShowModal = showModal as Mock;
const mockOnDomainSelectedChange = vi.fn();
const mockOnSelectedItemUuidsChange = vi.fn();

const item = (uuid: string, display: string): MetadataItem => ({
  uuid,
  display,
  domain: 'ATTRIBUTE_TYPES',
  retired: false,
});

const punctuality = item('uuid-1', 'Punctuality');
const paymentMethod = item('uuid-2', 'Payment Method');

// What the server returns when saved uuids are looked up; anything not listed is no longer exported.
const itemsOnServer = new Map([
  [punctuality.uuid, punctuality],
  [paymentMethod.uuid, paymentMethod],
]);

function mockServerLookUp() {
  mockUseMetadataItemsByUuid.mockImplementation((_domain: string, uuids: Array<string>) => ({
    itemsByUuid: uuids.length ? new Map(uuids.map((uuid) => [uuid, itemsOnServer.get(uuid) ?? null])) : undefined,
    error: undefined,
  }));
}

function renderRow(props: Partial<React.ComponentProps<typeof DomainSelectionRow>> = {}) {
  const defaultProps: React.ComponentProps<typeof DomainSelectionRow> = {
    domain: 'ATTRIBUTE_TYPES',
    isDomainSelected: true,
    selectedItemUuids: [],
    packageFormTitle: 'New package',
    onDomainSelectedChange: mockOnDomainSelectedChange,
    onSelectedItemUuidsChange: mockOnSelectedItemUuidsChange,
  };
  const view = render(<DomainSelectionRow {...defaultProps} {...props} />);
  const rerenderRow = (newProps: Partial<React.ComponentProps<typeof DomainSelectionRow>>) =>
    view.rerender(<DomainSelectionRow {...defaultProps} {...props} {...newProps} />);
  return { rerenderRow };
}

// The props the row last passed to the item picker modal.
const lastModalProps = () => mockShowModal.mock.lastCall[1];

describe('DomainSelectionRow', () => {
  beforeEach(() => {
    mockUseMetadataItemCount.mockReturnValue({ totalCount: 7 });
    mockServerLookUp();
    mockShowModal.mockReturnValue(vi.fn());
  });

  describe('when the domain is not selected', () => {
    it('shows only the checkbox', () => {
      renderRow({ isDomainSelected: false });

      expect(screen.getByRole('checkbox', { name: 'Attribute types' })).not.toBeChecked();
      expect(screen.queryByText('All items')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Choose items' })).not.toBeInTheDocument();
    });

    it('reports the domain as selected when the checkbox is ticked', async () => {
      const user = userEvent.setup();
      renderRow({ isDomainSelected: false });

      await user.click(screen.getByRole('checkbox', { name: 'Attribute types' }));

      expect(mockOnDomainSelectedChange).toHaveBeenCalledWith('ATTRIBUTE_TYPES', true);
    });
  });

  describe('when the domain is selected without specific items', () => {
    it('shows "All items" and a "Choose items" link, and no tags', () => {
      renderRow();

      expect(screen.getByRole('checkbox', { name: 'Attribute types' })).toBeChecked();
      expect(screen.getByText('All items')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Choose items' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^Remove/ })).not.toBeInTheDocument();
    });

    it('does not fetch the domain item count', () => {
      renderRow();

      expect(mockUseMetadataItemCount).toHaveBeenLastCalledWith('ATTRIBUTE_TYPES', false);
    });

    it('reports the domain as deselected when the checkbox is unticked', async () => {
      const user = userEvent.setup();
      renderRow();

      await user.click(screen.getByRole('checkbox', { name: 'Attribute types' }));

      expect(mockOnDomainSelectedChange).toHaveBeenCalledWith('ATTRIBUTE_TYPES', false);
    });

    it('opens the item picker modal with nothing selected', async () => {
      const user = userEvent.setup();
      renderRow();

      await user.click(screen.getByRole('button', { name: 'Choose items' }));

      expect(mockShowModal).toHaveBeenCalledWith(
        'select-domain-items-modal',
        expect.objectContaining({
          size: 'lg',
          domain: 'ATTRIBUTE_TYPES',
          packageFormTitle: 'New package',
          initiallySelectedItems: [],
        }),
      );
    });
  });

  describe('applying a selection from the modal', () => {
    it('reports the selected uuids', async () => {
      const user = userEvent.setup();
      renderRow();

      await user.click(screen.getByRole('button', { name: 'Choose items' }));
      act(() => lastModalProps().onApply([punctuality, paymentMethod]));

      expect(mockOnSelectedItemUuidsChange).toHaveBeenCalledWith('ATTRIBUTE_TYPES', ['uuid-1', 'uuid-2']);
    });

    it('labels the new tags from the modal selection without fetching them again', async () => {
      const user = userEvent.setup();
      const { rerenderRow } = renderRow();

      await user.click(screen.getByRole('button', { name: 'Choose items' }));
      act(() => lastModalProps().onApply([punctuality]));
      rerenderRow({ selectedItemUuids: ['uuid-1'] });

      expect(screen.getByText('Punctuality')).toBeInTheDocument();
      expect(mockUseMetadataItemsByUuid).toHaveBeenLastCalledWith('ATTRIBUTE_TYPES', []);
    });
  });

  describe('when specific items are selected', () => {
    it('shows the selected count out of the domain total, an "Edit" link and a tag per item', () => {
      renderRow({ selectedItemUuids: ['uuid-1', 'uuid-2'] });

      expect(screen.getByText('2 of 7')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
      expect(screen.getByText('Punctuality')).toBeInTheDocument();
      expect(screen.getByText('Payment Method')).toBeInTheDocument();
      expect(mockUseMetadataItemCount).toHaveBeenLastCalledWith('ATTRIBUTE_TYPES', true);
    });

    it('shows only the selected count while the domain total is unknown', () => {
      mockUseMetadataItemCount.mockReturnValue({ totalCount: undefined });
      renderRow({ selectedItemUuids: ['uuid-1', 'uuid-2'] });

      expect(screen.getByText('2 selected')).toBeInTheDocument();
    });

    it('reports the remaining uuids when a tag is removed', async () => {
      const user = userEvent.setup();
      renderRow({ selectedItemUuids: ['uuid-1', 'uuid-2'] });

      await user.click(screen.getByRole('button', { name: 'Remove Punctuality' }));

      expect(mockOnSelectedItemUuidsChange).toHaveBeenCalledWith('ATTRIBUTE_TYPES', ['uuid-2']);
    });

    it('opens the modal with the current items already selected when "Edit" is clicked', async () => {
      const user = userEvent.setup();
      renderRow({ selectedItemUuids: ['uuid-1', 'uuid-2'] });

      await user.click(screen.getByRole('button', { name: 'Edit' }));

      expect(lastModalProps().initiallySelectedItems).toEqual([punctuality, paymentMethod]);
    });

    it('hides the tags when the domain is deselected', () => {
      renderRow({ isDomainSelected: false, selectedItemUuids: ['uuid-1'] });

      expect(screen.queryByText('Punctuality')).not.toBeInTheDocument();
      expect(screen.queryByText('2 of 7')).not.toBeInTheDocument();
    });
  });

  describe('labelling saved items', () => {
    it('shows placeholder tags rather than names or uuids while the saved items are being looked up', () => {
      mockUseMetadataItemsByUuid.mockReturnValue({ itemsByUuid: undefined, error: undefined });
      renderRow({ selectedItemUuids: ['uuid-1', 'uuid-2'] });

      expect(screen.getByText('2 of 7')).toBeInTheDocument();
      expect(screen.queryByText('Punctuality')).not.toBeInTheDocument();
      expect(screen.queryByText('uuid-1')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^Remove/ })).not.toBeInTheDocument();
    });

    it('marks an item the domain no longer exports as unavailable', () => {
      renderRow({ selectedItemUuids: ['uuid-1', 'deleted-uuid'] });

      expect(screen.getByText('Punctuality')).toBeInTheDocument();
      expect(screen.getByText('Unavailable item')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Remove Unavailable item' })).toBeInTheDocument();
    });

    it('keeps an unavailable item marked as unavailable after the picker is applied', async () => {
      const user = userEvent.setup();
      const { rerenderRow } = renderRow({ selectedItemUuids: ['uuid-1', 'deleted-uuid'] });

      await user.click(screen.getByRole('button', { name: 'Edit' }));
      act(() => lastModalProps().onApply(lastModalProps().initiallySelectedItems));
      rerenderRow({ selectedItemUuids: ['uuid-1', 'deleted-uuid'] });

      expect(screen.getByText('Punctuality')).toBeInTheDocument();
      expect(screen.getByText('Unavailable item')).toBeInTheDocument();
      expect(screen.queryByText('deleted-uuid')).not.toBeInTheDocument();
    });

    it('keeps looking up items that were still loading when the picker was applied', async () => {
      mockUseMetadataItemsByUuid.mockReturnValue({ itemsByUuid: undefined, error: undefined });
      const user = userEvent.setup();
      const { rerenderRow } = renderRow({ selectedItemUuids: ['uuid-1'] });

      await user.click(screen.getByRole('button', { name: 'Edit' }));
      act(() => lastModalProps().onApply(lastModalProps().initiallySelectedItems));
      mockServerLookUp();
      rerenderRow({ selectedItemUuids: ['uuid-1'] });

      expect(screen.getByText('Punctuality')).toBeInTheDocument();
      expect(screen.queryByText('uuid-1')).not.toBeInTheDocument();
    });

    it('falls back to the uuid when the look-up fails, so the item can still be removed', async () => {
      mockUseMetadataItemsByUuid.mockReturnValue({ itemsByUuid: undefined, error: new Error('Network error') });
      const user = userEvent.setup();
      renderRow({ selectedItemUuids: ['uuid-1'] });

      expect(screen.getByText('uuid-1')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Remove uuid-1' }));
      expect(mockOnSelectedItemUuidsChange).toHaveBeenCalledWith('ATTRIBUTE_TYPES', []);
    });

    it('opens the modal with an item that could not be looked up labelled by its uuid', async () => {
      mockUseMetadataItemsByUuid.mockReturnValue({ itemsByUuid: undefined, error: new Error('Network error') });
      const user = userEvent.setup();
      renderRow({ selectedItemUuids: ['uuid-1'] });

      await user.click(screen.getByRole('button', { name: 'Edit' }));

      expect(lastModalProps().initiallySelectedItems).toEqual([
        { uuid: 'uuid-1', domain: 'ATTRIBUTE_TYPES', display: 'uuid-1', retired: false },
      ]);
    });
  });

  describe('with many selected items', () => {
    const manyUuids = Array.from({ length: 12 }, (_, index) => `uuid-${index + 1}`);

    it('shows the first ten as tags and summarises the rest', () => {
      renderRow({ selectedItemUuids: manyUuids });

      expect(screen.getAllByRole('button', { name: /^Remove/ })).toHaveLength(10);
      expect(screen.getByText('+2 more')).toBeInTheDocument();
    });

    it('opens the modal from the "+N more" tag', async () => {
      const user = userEvent.setup();
      renderRow({ selectedItemUuids: manyUuids });

      await user.click(screen.getByRole('button', { name: '+2 more' }));

      expect(mockShowModal).toHaveBeenCalledWith('select-domain-items-modal', expect.anything());
    });
  });
});
