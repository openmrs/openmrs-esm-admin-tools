import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  ContentSwitcher,
  DataTableSkeleton,
  InlineNotification,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Pagination,
  Search,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  TableSelectAll,
  TableSelectRow,
  Tag,
  Toggle,
} from '@carbon/react';
import { useDebounce } from '@openmrs/esm-framework';
import { formatDomainLabel } from '../../domain-lookups/domain-lookups.resource';
import { useMetadataItems } from '../../items/items.resource';
import type { MetadataDomain, MetadataItem } from '../../types';
import styles from './select-domain-items.modal.scss';

interface SelectDomainItemsModalProps {
  closeModal: () => void;
  domain: MetadataDomain;
  packageFormTitle: string;
  initiallySelectedItems: Array<MetadataItem>;
  onApply: (selectedItems: Array<MetadataItem>) => void;
}

type TabName = 'all' | 'selected';

const pageSizeOptions = [8, 20, 50];

const SelectDomainItemsModal: React.FC<SelectDomainItemsModalProps> = ({
  closeModal,
  domain,
  packageFormTitle,
  initiallySelectedItems,
  onApply,
}) => {
  const { t } = useTranslation();
  const domainLabel = formatDomainLabel(domain);
  const lowercaseDomainLabel = domainLabel.toLowerCase();

  const [activeTabName, setActiveTabName] = useState<TabName>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [includeRetired, setIncludeRetired] = useState(false);
  const [pageSize, setPageSize] = useState(pageSizeOptions[0]);
  const trimmedSearchTerm = searchTerm.trim();
  const debouncedSearchTerm = useDebounce(trimmedSearchTerm);

  const { selectedItems, selectedItemCount, isItemSelected, setItemsSelected, clearSelection, refreshSelectedItems } =
    useItemSelection(initiallySelectedItems);

  const {
    items: searchResults,
    totalCount: searchResultCount,
    currentPage: allTabPage,
    goTo: goToAllTabPage,
    isLoading: isLoadingSearchResults,
    error: searchError,
  } = useMetadataItems(domain, debouncedSearchTerm, includeRetired, pageSize);

  useEffect(() => {
    refreshSelectedItems(searchResults);
  }, [refreshSelectedItems, searchResults]);

  const allTab = {
    itemsOnPage: searchResults,
    page: allTabPage,
    totalItemCount: Number.isNaN(searchResultCount) ? 0 : searchResultCount,
    goToPage: goToAllTabPage,
  };

  const [requestedSelectedTabPage, setRequestedSelectedTabPage] = useState(1);
  const selectedItemsMatchingSearch = useMemo(() => {
    const lowercaseSearchTerm = debouncedSearchTerm.toLowerCase();
    return selectedItems.filter((item) => item.display.toLowerCase().includes(lowercaseSearchTerm));
  }, [selectedItems, debouncedSearchTerm]);

  const selectedTabPageCount = Math.max(1, Math.ceil(selectedItemsMatchingSearch.length / pageSize));
  const selectedTabPage = Math.min(requestedSelectedTabPage, selectedTabPageCount);

  const selectedTab = {
    itemsOnPage: selectedItemsMatchingSearch.slice((selectedTabPage - 1) * pageSize, selectedTabPage * pageSize),
    page: selectedTabPage,
    totalItemCount: selectedItemsMatchingSearch.length,
    goToPage: setRequestedSelectedTabPage,
  };

  const isAllTabActive = activeTabName === 'all';
  const activeTab = isAllTabActive ? allTab : selectedTab;

  const isWaitingForSearchToStart = trimmedSearchTerm !== debouncedSearchTerm;
  const isAllTabLoading = isLoadingSearchResults || isWaitingForSearchToStart;

  const handleApply = useCallback(() => {
    onApply(selectedItems);
    closeModal();
  }, [closeModal, onApply, selectedItems]);

  const handlePaginationChange = ({ page, pageSize: newPageSize }: { page: number; pageSize: number }) => {
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
    }
    activeTab.goToPage(page);
  };

  const allTabLabel = Number.isNaN(searchResultCount)
    ? t('all', 'All')
    : t('allCount', 'All ({{count}})', { count: searchResultCount });

  const applyButtonLabel =
    selectedItemCount > 0
      ? t('addSelectedItems', 'Add {{count}} selected', { count: selectedItemCount })
      : t('exportAllDomainItems', 'Export all {{domain}}', { domain: lowercaseDomainLabel });

  const renderTabContent = () => {
    if (isAllTabActive && searchError) {
      return (
        <InlineNotification
          kind="error"
          lowContrast
          hideCloseButton
          title={t('errorLoadingItems', 'Error loading {{domain}}', { domain: lowercaseDomainLabel })}
          subtitle={searchError.message}
        />
      );
    }

    if (isAllTabActive && isAllTabLoading) {
      return (
        <DataTableSkeleton
          role="progressbar"
          columnCount={1}
          rowCount={pageSize}
          showHeader={false}
          showToolbar={false}
        />
      );
    }

    return (
      <>
        <ItemsTable
          domain={domain}
          items={activeTab.itemsOnPage}
          isItemSelected={isItemSelected}
          onItemsSelectedChange={setItemsSelected}
          emptyStateText={
            isAllTabActive
              ? t('noMatchingItems', 'No {{domain}} match your search', { domain: lowercaseDomainLabel })
              : t('noSelectedItems', 'Nothing selected yet')
          }
        />
        <Pagination
          forwardText={t('nextPage', 'Next page')}
          backwardText={t('previousPage', 'Previous page')}
          page={activeTab.page}
          pageSize={pageSize}
          pageSizes={pageSizeOptions}
          totalItems={activeTab.totalItemCount}
          size="md"
          onChange={handlePaginationChange}
        />
      </>
    );
  };

  return (
    <>
      <ModalHeader
        closeModal={closeModal}
        label={`${packageFormTitle} · ${domainLabel}`}
        title={t('selectDomainItems', 'Select {{domain}}', { domain: lowercaseDomainLabel })}
      />
      <ModalBody className={styles.modalBody}>
        <p className={styles.description}>
          {t(
            'selectDomainItemsDescription',
            'Choose the {{domain}} to include in this package. Leave nothing selected to export all of them.',
            { domain: lowercaseDomainLabel },
          )}
        </p>

        <div className={styles.toolbar}>
          <ContentSwitcher
            size="lg"
            className={styles.viewSwitcher}
            selectedIndex={isAllTabActive ? 0 : 1}
            onChange={({ name }) => setActiveTabName(name as TabName)}
          >
            <Switch name="all">{allTabLabel}</Switch>
            <Switch name="selected">{t('selectedCount', 'Selected ({{count}})', { count: selectedItemCount })}</Switch>
          </ContentSwitcher>
          <Search
            className={styles.search}
            size="lg"
            labelText={t('searchDomainItems', 'Search {{domain}}', { domain: lowercaseDomainLabel })}
            placeholder={t('searchDomainItems', 'Search {{domain}}', { domain: lowercaseDomainLabel })}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <Toggle
            id={`include-retired-${domain}`}
            size="sm"
            hideLabel
            labelText={t('includeRetired', 'Include retired')}
            toggled={includeRetired}
            onToggle={setIncludeRetired}
          />
        </div>

        {renderTabContent()}

        <div className={styles.selectionSummary}>
          <span>
            {t(
              'selectionSummary',
              '{{count}} selected across all pages. Selections are kept while you search and page.',
              { count: selectedItemCount },
            )}
          </span>
          <Button kind="ghost" size="sm" disabled={selectedItemCount === 0} onClick={clearSelection}>
            {t('clearSelection', 'Clear selection')}
          </Button>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button kind="secondary" onClick={closeModal}>
          {t('cancel', 'Cancel')}
        </Button>
        <Button kind="primary" onClick={handleApply}>
          {applyButtonLabel}
        </Button>
      </ModalFooter>
    </>
  );
};

interface ItemsTableProps {
  domain: MetadataDomain;
  items: Array<MetadataItem>;
  isItemSelected: (item: MetadataItem) => boolean;
  onItemsSelectedChange: (items: Array<MetadataItem>, isSelected: boolean) => void;
  emptyStateText: string;
}

const ItemsTable: React.FC<ItemsTableProps> = ({
  domain,
  items,
  isItemSelected,
  onItemsSelectedChange,
  emptyStateText,
}) => {
  const { t } = useTranslation();

  const areAllItemsSelected = items.length > 0 && items.every(isItemSelected);
  const areSomeItemsSelected = !areAllItemsSelected && items.some(isItemSelected);

  return (
    <>
      <TableContainer>
        <Table size="md">
          <TableHead>
            <TableRow>
              <TableSelectAll
                id={`select-all-${domain}`}
                name={`select-all-${domain}`}
                aria-label={t('selectAllOnPage', 'Select all on this page')}
                checked={areAllItemsSelected}
                indeterminate={areSomeItemsSelected}
                disabled={items.length === 0}
                onSelect={() => onItemsSelectedChange(items, !areAllItemsSelected)}
              />
              <TableHeader>{t('name', 'Name')}</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.uuid}>
                <TableSelectRow
                  id={`select-item-${item.uuid}`}
                  name={`select-item-${item.uuid}`}
                  aria-label={item.display}
                  checked={isItemSelected(item)}
                  onSelect={() => onItemsSelectedChange([item], !isItemSelected(item))}
                />
                <TableCell>
                  <span className={styles.itemName}>
                    {item.display}
                    {item.retired && (
                      <Tag size="sm" type="gray">
                        {t('retired', 'Retired')}
                      </Tag>
                    )}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {items.length === 0 && <p className={styles.emptyState}>{emptyStateText}</p>}
    </>
  );
};

/**
 * The items picked in the modal, keyed by uuid so a selection is kept while the user searches,
 * pages, switches tabs and toggles retired items.
 */
function useItemSelection(initiallySelectedItems: Array<MetadataItem>) {
  const [selectedItemsByUuid, setSelectedItemsByUuid] = useState(
    () => new Map(initiallySelectedItems.map((item) => [item.uuid, item])),
  );

  const selectedItems = useMemo(() => Array.from(selectedItemsByUuid.values()), [selectedItemsByUuid]);

  const isItemSelected = useCallback((item: MetadataItem) => selectedItemsByUuid.has(item.uuid), [selectedItemsByUuid]);

  const setItemsSelected = useCallback((items: Array<MetadataItem>, isSelected: boolean) => {
    setSelectedItemsByUuid((previousSelection) => {
      const nextSelection = new Map(previousSelection);
      for (const item of items) {
        if (isSelected) {
          nextSelection.set(item.uuid, item);
        } else {
          nextSelection.delete(item.uuid);
        }
      }
      return nextSelection;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedItemsByUuid(new Map()), []);

  // Replaces selected items with the given versions of them; items that aren't selected are ignored.
  const refreshSelectedItems = useCallback((items: Array<MetadataItem>) => {
    setSelectedItemsByUuid((previousSelection) => {
      const outdatedItems = items.filter(
        (item) => previousSelection.has(item.uuid) && previousSelection.get(item.uuid) !== item,
      );
      if (outdatedItems.length === 0) {
        return previousSelection;
      }
      const nextSelection = new Map(previousSelection);
      outdatedItems.forEach((item) => nextSelection.set(item.uuid, item));
      return nextSelection;
    });
  }, []);

  return {
    selectedItems,
    selectedItemCount: selectedItemsByUuid.size,
    isItemSelected,
    setItemsSelected,
    clearSelection,
    refreshSelectedItems,
  };
}

export default SelectDomainItemsModal;
