import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ComboBox, IconButton, TextInput } from '@carbon/react';
import { Close } from '@carbon/react/icons';
import { OpenmrsDatePicker, useDebounce } from '@openmrs/esm-framework';
import { ENTITY_TYPES } from '../constants';
import type { AuditLogFilterState } from '../types';
import { useAuditEntityTypes } from './audit-log.resource';
import styles from './audit-log-filters.scss';

interface AuditLogFiltersProps {
  filters: AuditLogFilterState;
  onChange: (updated: Partial<AuditLogFilterState>) => void;
  onClearAll?: () => void;
  hasActiveFilters?: boolean;
}

interface EntityTypeItem {
  label: string;
  value: string;
  // Shown by default (no search input). Curated common types are pinned; the rest
  // of the audited types only surface once the user starts typing.
  pinned: boolean;
}

const AuditLogFilters: React.FC<AuditLogFiltersProps> = ({ filters, onChange, onClearAll, hasActiveFilters }) => {
  const { t } = useTranslation();
  const { entityTypes } = useAuditEntityTypes();

  const [usernameInput, setUsernameInput] = useState(filters.username);
  const debouncedUsername = useDebounce(usernameInput, 400);

  const today = useMemo(() => new Date(), []);

  const entityTypeItems = useMemo<EntityTypeItem[]>(() => {
    const pinned: EntityTypeItem[] = ENTITY_TYPES.map((e) => ({ ...e, pinned: true }));
    const pinnedValues = new Set(pinned.map((i) => i.value.toLowerCase()));
    const discovered: EntityTypeItem[] = entityTypes
      .filter((type) => !pinnedValues.has(type.toLowerCase()))
      .map((type) => ({ label: type, value: type, pinned: false }));
    return [...pinned, ...discovered];
  }, [entityTypes]);

  // No input → only pinned items; typing → match across every discovered type.
  const filterEntityTypes = useCallback((menu: { item: EntityTypeItem; inputValue: string | null }) => {
    const input = menu?.inputValue?.toLowerCase().trim();
    if (!input) return menu?.item?.pinned ?? false;
    return menu?.item?.label?.toLowerCase().includes(input) ?? false;
  }, []);

  // Sync local input back when parent clears filters externally
  useEffect(() => {
    if (filters.username === '') setUsernameInput('');
  }, [filters.username]);

  useEffect(() => {
    onChange({ username: debouncedUsername });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedUsername]);

  return (
    <div className={styles.filtersRow}>
      <ComboBox
        id="audit-entity-type-filter"
        className={styles.filterItem}
        titleText={t('entityType', 'Entity type')}
        placeholder={t('searchOrSelectEntityType', 'Search or select')}
        items={entityTypeItems}
        itemToString={(item) => item?.label ?? ''}
        selectedItem={entityTypeItems.find((i) => i.value === filters.entityType) ?? null}
        onChange={({ selectedItem }) => onChange({ entityType: selectedItem?.value ?? '' })}
        shouldFilterItem={filterEntityTypes}
        size="md"
      />

      <div className={`${styles.filterItem} ${styles.fieldWithClear}`}>
        <TextInput
          id="audit-username-filter"
          labelText={t('username', 'Username')}
          placeholder={t('searchByUsername', 'Search by username')}
          value={usernameInput}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsernameInput(e.target.value)}
          size="md"
        />
        {usernameInput && (
          <div className={styles.textClear}>
            <IconButton kind="ghost" size="sm" label={t('clear', 'Clear')} onClick={() => setUsernameInput('')}>
              <Close />
            </IconButton>
          </div>
        )}
      </div>

      <div className={`${styles.filterItem} ${styles.fieldWithClear}`}>
        <OpenmrsDatePicker
          id="audit-start-date"
          labelText={t('startDate', 'Start date')}
          value={filters.startDate}
          maxDate={today}
          onChange={(date) => onChange({ startDate: date })}
        />
        {filters.startDate && (
          <div className={styles.dateClear}>
            <IconButton
              kind="ghost"
              size="sm"
              label={t('clear', 'Clear')}
              onClick={() => onChange({ startDate: null })}
            >
              <Close />
            </IconButton>
          </div>
        )}
      </div>

      <div className={`${styles.filterItem} ${styles.fieldWithClear}`}>
        <OpenmrsDatePicker
          id="audit-end-date"
          labelText={t('endDate', 'End date')}
          value={filters.endDate}
          maxDate={today}
          onChange={(date) => onChange({ endDate: date })}
        />
        {filters.endDate && (
          <div className={styles.dateClear}>
            <IconButton kind="ghost" size="sm" label={t('clear', 'Clear')} onClick={() => onChange({ endDate: null })}>
              <Close />
            </IconButton>
          </div>
        )}
      </div>

      {hasActiveFilters && onClearAll && (
        <div className={styles.clearAllItem}>
          <Button kind="ghost" size="md" renderIcon={Close} onClick={onClearAll}>
            {t('clearFilters', 'Clear filters')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default AuditLogFilters;
