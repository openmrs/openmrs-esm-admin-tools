import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SWRConfig } from 'swr';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { useOpenmrsPagination } from '@openmrs/esm-framework';
import { useMetadataItems } from '../../items/items.resource';
import type * as itemsResource from '../../items/items.resource';
import type { MetadataItem } from '../../types';
import SelectDomainItemsModal from './select-domain-items.modal';

vi.mock('../../items/items.resource', () => ({
  useMetadataItems: vi.fn(),
}));

const { useMetadataItems: actualUseMetadataItems } =
  await vi.importActual<typeof itemsResource>('../../items/items.resource');

const mockUseMetadataItems = useMetadataItems as Mock;
const mockUseOpenmrsPagination = useOpenmrsPagination as Mock;
const realUseOpenmrsPagination = mockUseOpenmrsPagination.getMockImplementation();
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

/**
 * Backs the real `useMetadataItems` and pagination hook with a fake server holding the given items,
 * so paging, searching and resizing pages behave as they do against the backend.
 */
function serveItems(items: Array<MetadataItem>) {
  const fetchItems = async (url: string) => {
    const searchParams = new URL(url, window.location.href).searchParams;
    const searchTerm = (searchParams.get('q') ?? '').toLowerCase();
    const startIndex = Number(searchParams.get('startIndex'));
    const limit = Number(searchParams.get('limit'));
    const matchingItems = items.filter((item) => item.display.toLowerCase().includes(searchTerm));
    return {
      data: {
        results: matchingItems.slice(startIndex, startIndex + limit),
        totalCount: matchingItems.length,
        links: [],
      },
    };
  };
  mockUseMetadataItems.mockImplementation(actualUseMetadataItems);
  mockUseOpenmrsPagination.mockImplementation((url, pageSize, options) =>
    realUseOpenmrsPagination(url, pageSize, { ...options, fetcher: fetchItems }),
  );
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
    { wrapper: ({ children }) => <SWRConfig value={{ provider: () => new Map() }}>{children}</SWRConfig> },
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

  describe('across pages', () => {
    // 20 items make 3 pages at the default page size of 8.
    const attributeTypes = Array.from({ length: 20 }, (_, index) =>
      item(`uuid-attribute-${index + 1}`, `Attribute ${String(index + 1).padStart(2, '0')}`),
    );
    const [, attribute02, , , , , , , attribute09] = attributeTypes;

    beforeEach(() => {
      serveItems(attributeTypes);
    });

    it('keeps the selection from every page and applies all of it', async () => {
      const user = userEvent.setup();
      renderModal();

      await user.click(await screen.findByRole('checkbox', { name: 'Attribute 01' }));
      await user.click(screen.getByRole('checkbox', { name: 'Attribute 02' }));

      await user.click(screen.getByRole('button', { name: 'Next page' }));
      await user.click(await screen.findByRole('checkbox', { name: 'Attribute 09' }));
      expect(screen.getByRole('tab', { name: 'Selected (3)' })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Previous page' }));
      expect(await screen.findByRole('checkbox', { name: 'Attribute 01' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'Attribute 02' })).toBeChecked();
      await user.click(screen.getByRole('checkbox', { name: 'Attribute 01' }));

      await user.click(screen.getByRole('button', { name: 'Add 2 selected' }));

      expect(mockOnApply).toHaveBeenCalledWith([attribute02, attribute09]);
    });

    it.each(['all', 'selected'])(
      'shows a page that exists when a search from a later page of the %s view leaves fewer pages',
      async (tabName) => {
        const user = userEvent.setup();
        renderModal(attributeTypes);
        if (tabName === 'selected') {
          await user.click(screen.getByRole('tab', { name: 'Selected (20)' }));
        }

        await user.click(await screen.findByRole('button', { name: 'Next page' }));
        await user.click(screen.getByRole('button', { name: 'Next page' }));
        expect(await screen.findByRole('checkbox', { name: 'Attribute 20' })).toBeInTheDocument();

        // Matches Attribute 02, 12 and 20, which fit on 1 page.
        await user.type(screen.getByRole('searchbox'), '2');

        expect(await screen.findByRole('checkbox', { name: 'Attribute 02' })).toBeInTheDocument();
        expect(screen.getByRole('checkbox', { name: 'Attribute 12' })).toBeInTheDocument();
        expect(screen.getByRole('checkbox', { name: 'Attribute 20' })).toBeInTheDocument();
        expect(screen.getByText(/1–3 of 3 items/)).toBeInTheDocument();
      },
    );

    it.each(['all', 'selected'])(
      'shows a page that exists when the page size grows from a later page of the %s view',
      async (tabName) => {
        const user = userEvent.setup();
        renderModal(attributeTypes);
        if (tabName === 'selected') {
          await user.click(screen.getByRole('tab', { name: 'Selected (20)' }));
        }

        await user.click(await screen.findByRole('button', { name: 'Next page' }));
        await user.click(screen.getByRole('button', { name: 'Next page' }));
        expect(await screen.findByRole('checkbox', { name: 'Attribute 20' })).toBeInTheDocument();

        await user.selectOptions(screen.getByRole('combobox', { name: /items per page/i }), '50');

        expect(await screen.findByRole('checkbox', { name: 'Attribute 01' })).toBeInTheDocument();
        expect(screen.getByRole('checkbox', { name: 'Attribute 20' })).toBeInTheDocument();
        expect(screen.getByText(/1–20 of 20 items/)).toBeInTheDocument();
      },
    );
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
