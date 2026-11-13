import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Checkbox, DismissibleTag, OperationalTag, TagSkeleton } from '@carbon/react';
import { showModal } from '@openmrs/esm-framework';
import { formatDomainLabel } from '../../../domain-lookups/domain-lookups.resource';
import { useMetadataItemCount, useMetadataItemsByUuid } from '../../../items/items.resource';
import type { MetadataDomain, MetadataItem } from '../../../types';
import styles from './domain-selection-row.scss';

interface DomainSelectionRowProps {
  domain: MetadataDomain;
  isDomainSelected: boolean;
  selectedItemUuids: Array<string>;
  packageFormTitle: string;
  onDomainSelectedChange: (domain: MetadataDomain, isSelected: boolean) => void;
  onSelectedItemUuidsChange: (domain: MetadataDomain, selectedItemUuids: Array<string>) => void;
}

const maxVisibleItemTags = 10;

const DomainSelectionRow: React.FC<DomainSelectionRowProps> = ({
  domain,
  isDomainSelected,
  selectedItemUuids,
  packageFormTitle,
  onDomainSelectedChange,
  onSelectedItemUuidsChange,
}) => {
  const { t } = useTranslation();

  // A selected domain with no specific items picked exports all of its items.
  const hasSelectedItems = isDomainSelected && selectedItemUuids.length > 0;

  const visibleItemUuids = useMemo(() => selectedItemUuids.slice(0, maxVisibleItemTags), [selectedItemUuids]);
  const hiddenItemCount = selectedItemUuids.length - visibleItemUuids.length;

  // Only the visible tags need names, so only those are looked up. Most domains load in full on the
  // server for every lookup, so looking up every selected item would be a full load per item.
  const { itemDetailsByUuid, rememberItemDetails, failedLookupUuids } = useSelectedItemDetails(
    domain,
    visibleItemUuids,
  );
  const { totalCount: totalItemsInDomain } = useMetadataItemCount(domain, hasSelectedItems);

  const openSelectItemsModal = useCallback(() => {
    // Items whose details are loading, unavailable or failed to load are passed to the modal as placeholders.
    // They are kept out of the details cache, so the row keeps looking them up or marking them as unavailable.
    const placeholderItems = new Set<MetadataItem>();
    const currentlySelectedItems = selectedItemUuids.map((uuid): MetadataItem => {
      const itemDetails = itemDetailsByUuid.get(uuid);
      if (itemDetails) {
        return itemDetails;
      }
      const placeholderItem: MetadataItem = { uuid, domain, display: uuid, retired: false };
      placeholderItems.add(placeholderItem);
      return placeholderItem;
    });

    const dispose = showModal('select-domain-items-modal', {
      size: 'lg',
      closeModal: () => dispose(),
      domain,
      packageFormTitle,
      initiallySelectedItems: currentlySelectedItems,
      onApply: (newlySelectedItems: Array<MetadataItem>) => {
        rememberItemDetails(newlySelectedItems.filter((item) => !placeholderItems.has(item)));
        onSelectedItemUuidsChange(
          domain,
          newlySelectedItems.map((item) => item.uuid),
        );
      },
    });
  }, [domain, itemDetailsByUuid, onSelectedItemUuidsChange, packageFormTitle, rememberItemDetails, selectedItemUuids]);

  const removeSelectedItem = useCallback(
    (uuidToRemove: string) => {
      onSelectedItemUuidsChange(
        domain,
        selectedItemUuids.filter((uuid) => uuid !== uuidToRemove),
      );
    },
    [domain, selectedItemUuids, onSelectedItemUuidsChange],
  );

  const getSelectionStatusText = () => {
    if (!hasSelectedItems) {
      return t('allItems', 'All items');
    }
    // The total is still loading (or failed to load), so show just the selected count.
    if (totalItemsInDomain === undefined) {
      return t('itemsSelected', '{{count}} selected', { count: selectedItemUuids.length });
    }
    return t('itemsSelectedOfTotal', '{{count}} of {{total}}', {
      count: selectedItemUuids.length,
      total: totalItemsInDomain,
    });
  };

  return (
    <div className={styles.row}>
      <div className={styles.header}>
        <Checkbox
          id={`domain-${domain}`}
          labelText={formatDomainLabel(domain)}
          checked={isDomainSelected}
          onChange={(_event, { checked }) => onDomainSelectedChange(domain, checked)}
        />
        {isDomainSelected && (
          <div className={styles.actions}>
            <span className={styles.status}>{getSelectionStatusText()}</span>
            <Button className={styles.linkButton} kind="ghost" size="sm" onClick={openSelectItemsModal}>
              {hasSelectedItems ? t('edit', 'Edit') : t('chooseItems', 'Choose items')}
            </Button>
          </div>
        )}
      </div>

      {hasSelectedItems && (
        <div className={styles.tags}>
          {visibleItemUuids.map((uuid) => (
            <SelectedItemTag
              key={uuid}
              uuid={uuid}
              itemDetails={itemDetailsByUuid.get(uuid)}
              hasDetailsFetchFailed={failedLookupUuids.has(uuid)}
              onRemove={removeSelectedItem}
            />
          ))}
          {hiddenItemCount > 0 && (
            <OperationalTag
              type="gray"
              text={t('moreItems', '+{{count}} more', { count: hiddenItemCount })}
              onClick={openSelectItemsModal}
            />
          )}
        </div>
      )}
    </div>
  );
};

interface SelectedItemTagProps {
  uuid: string;
  // `undefined` while the details are loading, `null` when the domain no longer exports the item.
  itemDetails: MetadataItem | null | undefined;
  hasDetailsFetchFailed: boolean;
  onRemove: (uuid: string) => void;
}

const SelectedItemTag: React.FC<SelectedItemTagProps> = ({ uuid, itemDetails, hasDetailsFetchFailed, onRemove }) => {
  const { t } = useTranslation();

  const isLoading = itemDetails === undefined && !hasDetailsFetchFailed;
  if (isLoading) {
    return <TagSkeleton />;
  }

  const isNoLongerExported = itemDetails === null;

  let tagLabel: string;
  if (itemDetails) {
    tagLabel = itemDetails.display;
  } else if (isNoLongerExported) {
    tagLabel = t('unavailableItem', 'Unavailable item');
  } else {
    // The details failed to load; show the uuid so the item can still be identified and removed.
    tagLabel = uuid;
  }

  return (
    <DismissibleTag
      type={isNoLongerExported ? 'red' : 'gray'}
      text={tagLabel}
      tagTitle={itemDetails ? tagLabel : uuid}
      title={t('removeItem', 'Remove {{item}}', { item: tagLabel })}
      onClose={() => onRemove(uuid)}
    />
  );
};

function useSelectedItemDetails(domain: MetadataDomain, itemUuids: Array<string>) {
  const [itemDetailsByUuid, setItemDetailsByUuid] = useState<Map<string, MetadataItem | null>>(() => new Map());

  const uuidsMissingDetails = useMemo(
    () => itemUuids.filter((uuid) => !itemDetailsByUuid.has(uuid)),
    [itemUuids, itemDetailsByUuid],
  );
  const { itemsByUuid: fetchedItemDetailsByUuid, failedUuids: failedLookupUuids } = useMetadataItemsByUuid(
    domain,
    uuidsMissingDetails,
  );

  // Copy fetched details into local state. That leaves only failed lookups in `uuidsMissingDetails`, so those
  // are fetched once more, and keeps the details around when a tag is removed and the uuid list changes.
  useEffect(() => {
    if (fetchedItemDetailsByUuid) {
      setItemDetailsByUuid((previousDetails) => new Map([...previousDetails, ...fetchedItemDetailsByUuid]));
    }
  }, [fetchedItemDetailsByUuid]);

  const rememberItemDetails = useCallback((items: Array<MetadataItem>) => {
    setItemDetailsByUuid((previousDetails) => {
      const nextDetails = new Map(previousDetails);
      items.forEach((item) => nextDetails.set(item.uuid, item));
      return nextDetails;
    });
  }, []);

  return {
    itemDetailsByUuid,
    rememberItemDetails,
    failedLookupUuids,
  };
}

export default DomainSelectionRow;
