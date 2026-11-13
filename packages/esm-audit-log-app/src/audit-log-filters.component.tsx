import React from 'react';
import { useTranslation } from 'react-i18next';
import { DatePicker, DatePickerInput, Select, SelectItem, TextInput, Button } from '@carbon/react';
import type { AuditLogFilters } from './audit-log.types';
import styles from './audit-log-dashboard.scss';

interface AuditLogFiltersProps {
  filters: AuditLogFilters;
  onChange: (filters: AuditLogFilters) => void;
  onClear: () => void;
}

const AuditLogFiltersPanel: React.FC<AuditLogFiltersProps> = ({ filters, onChange, onClear }) => {
  const { t } = useTranslation();

  return (
    <div className={styles.filtersPanel}>
      <TextInput
        id="audit-log-user-filter"
        labelText={t('filterByUser', 'Filter by user')}
        placeholder="User UUID"
        value={filters.userUuid}
        onChange={(e) => onChange({ ...filters, userUuid: e.target.value })}
      />

      <Select
        id="audit-log-action-filter"
        labelText={t('filterByAction', 'Filter by action')}
        value={filters.action}
        onChange={(e) => onChange({ ...filters, action: e.target.value })}
      >
        <SelectItem value="" text={t('allActions', 'All actions')} />
        <SelectItem value="CREATED" text={t('created', 'Created')} />
        <SelectItem value="UPDATED" text={t('updated', 'Updated')} />
        <SelectItem value="DELETED" text={t('deleted', 'Deleted')} />
      </Select>

      <DatePicker
        datePickerType="range"
        onChange={([start, end]) => {
          onChange({
            ...filters,
            startDate: start ? start.toISOString().split('T')[0] : '',
            endDate: end ? end.toISOString().split('T')[0] : '',
          });
        }}
      >
        <DatePickerInput id="audit-log-start-date" labelText={t('startDate', 'Start date')} placeholder="mm/dd/yyyy" />
        <DatePickerInput id="audit-log-end-date" labelText={t('endDate', 'End date')} placeholder="mm/dd/yyyy" />
      </DatePicker>

      <Button kind="ghost" onClick={onClear}>
        {t('clearFilters', 'Clear filters')}
      </Button>
    </div>
  );
};

export default AuditLogFiltersPanel;
