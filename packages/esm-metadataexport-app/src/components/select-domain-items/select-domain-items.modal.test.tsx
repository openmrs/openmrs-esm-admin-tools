import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { useMetadataItems } from '../../items/items.resource';
import type { MetadataItem } from '../../types';
import SelectDomainItemsModal from './select-domain-items.modal';

vi.mock('../../items/items.resource', () => ({
  useMetadataItems: vi.fn(),
}));

const mockUseMetadataItems = useMetadataItems as Mock;
const mockCloseModal = vi.fn();
const mockOnApply = vi.fn();

const item = (uuid: string, display: string, retired = false): MetadataItem => ({
  uuid,
  display,
  domain: 'ATTRIBUTE_TYPES',
  retired,
});

const punctuality = item('uuid-1', 'Punctuality');
const insuranceScheme = item('uuid-2', 'Insurance Scheme');
const paymentMethod = item('uuid-3', 'Payment Method', true);

function mockItems(items: Array<MetadataItem>, overrides = {}) {
  mockUseMetadataItems.mockReturnValue({
    items,
    totalCount: items.length,
    currentPage: 1,
    goTo: vi.fn(),
    isLoading: false,
    error: undefined,
    ...overrides,
  });
}

function renderModal(initiallySelectedItems: Array<MetadataItem> = []) {
  return render(
    <SelectDomainItemsModal
      closeModal={mockCloseModal}
      domain="ATTRIBUTE_TYPES"
      packageFormTitle="New package"
      initiallySelectedItems={initiallySelectedItems}
      onApply={mockOnApply}
    />,
  );
}

describe('SelectDomainItemsModal', () => {
  beforeEach(() => {
    mockItems([punctuality, insuranceScheme, paymentMethod]);
  });

  it('renders the header, the items and a retired tag for retired rows', () => {
    renderModal();

    expect(screen.getByText('New package · Attribute types')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Select attribute types' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Punctuality' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Insurance Scheme' })).toBeInTheDocument();
    expect(screen.getByText('Retired')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'All (3)' })).toBeInTheDocument();
  });

  it('applies "export all" when nothing is selected', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: 'Export all attribute types' }));

    expect(mockOnApply).toHaveBeenCalledWith([]);
    expect(mockCloseModal).toHaveBeenCalled();
  });

  it('applies the selected items', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('checkbox', { name: 'Punctuality' }));
    await user.click(screen.getByRole('checkbox', { name: 'Insurance Scheme' }));
    expect(screen.getByText(/2 selected across all pages/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add 2 selected' }));

    expect(mockOnApply).toHaveBeenCalledWith([punctuality, insuranceScheme]);
  });

  it('keeps the selection when the search results change', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('checkbox', { name: 'Punctuality' }));

    mockItems([insuranceScheme]);
    await user.type(screen.getByRole('searchbox'), 'insurance');

    expect(screen.queryByRole('checkbox', { name: 'Punctuality' })).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Selected (1)' })).toBeInTheDocument();
    expect(mockUseMetadataItems).toHaveBeenLastCalledWith('ATTRIBUTE_TYPES', 'insurance', false, 8);
  });

  it('selects and clears every row on the page from the header checkbox', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('checkbox', { name: 'Select all on this page' }));
    expect(screen.getByRole('tab', { name: 'Selected (3)' })).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: 'Select all on this page' }));
    expect(screen.getByRole('tab', { name: 'Selected (0)' })).toBeInTheDocument();
  });

  it('starts from the initial selection and lists it in the selected view', async () => {
    const user = userEvent.setup();
    renderModal([paymentMethod]);

    await user.click(screen.getByRole('tab', { name: 'Selected (1)' }));

    expect(screen.getByRole('checkbox', { name: 'Payment Method' })).toBeChecked();
    expect(screen.queryByRole('checkbox', { name: 'Punctuality' })).not.toBeInTheDocument();
  });

  it('replaces a uuid placeholder in the selection with the real item once it loads', async () => {
    const user = userEvent.setup();
    const punctualityPlaceholder = item('uuid-1', 'uuid-1');
    mockItems([]);
    const { rerender } = renderModal([punctualityPlaceholder]);

    mockItems([punctuality, insuranceScheme]);
    rerender(
      <SelectDomainItemsModal
        closeModal={mockCloseModal}
        domain="ATTRIBUTE_TYPES"
        packageFormTitle="New package"
        initiallySelectedItems={[punctualityPlaceholder]}
        onApply={mockOnApply}
      />,
    );
    await user.click(screen.getByRole('tab', { name: 'Selected (1)' }));

    expect(screen.getByRole('checkbox', { name: 'Punctuality' })).toBeChecked();
    expect(screen.queryByRole('checkbox', { name: 'uuid-1' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add 1 selected' }));
    expect(mockOnApply).toHaveBeenCalledWith([punctuality]);
  });

  it('clears the selection', async () => {
    const user = userEvent.setup();
    renderModal([punctuality, insuranceScheme]);

    await user.click(screen.getByRole('button', { name: 'Clear selection' }));

    expect(screen.getByRole('tab', { name: 'Selected (0)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export all attribute types' })).toBeInTheDocument();
  });

  it('requests retired rows when "Include retired" is toggled on', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('switch', { name: 'Include retired' }));

    expect(mockUseMetadataItems).toHaveBeenLastCalledWith('ATTRIBUTE_TYPES', '', true, 8);
  });

  it('shows a skeleton instead of the previous rows while a new search or retired toggle loads', () => {
    // keepPreviousData still hands back the last page's rows while the new request is in flight.
    mockItems([punctuality, insuranceScheme], { isLoading: true });
    renderModal();

    expect(screen.queryByRole('checkbox', { name: 'Punctuality' })).not.toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows an error when the items request fails', () => {
    mockItems([], { error: new Error('Privilege required: Get Concepts') });
    renderModal();

    expect(screen.getByText('Error loading attribute types')).toBeInTheDocument();
    expect(screen.getByText('Privilege required: Get Concepts')).toBeInTheDocument();
  });

  it('does not apply anything when cancelled', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('checkbox', { name: 'Punctuality' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mockOnApply).not.toHaveBeenCalled();
    expect(mockCloseModal).toHaveBeenCalled();
  });
});
