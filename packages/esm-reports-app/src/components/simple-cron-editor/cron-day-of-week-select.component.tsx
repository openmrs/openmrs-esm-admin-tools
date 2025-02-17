import React, { useCallback, useEffect, useState } from 'react';
import { FilterableMultiSelect } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { type CronField, DAYS_OF_WEEK, DAYS_OF_WEEK_DEFAULT_LABELS } from './commons';

interface CronDayOfWeekSelectProps {
  value: CronField[];
  onChange: (selectedDaysOfWeek: CronField[]) => void;
}

interface ValidationState {
  invalid: boolean;
  invalidText: string;
}

const CronDayOfWeekSelect: React.FC<CronDayOfWeekSelectProps> = ({ value, onChange }) => {
  const { t } = useTranslation();

  const [valueInternal, setValueInternal] = useState<CronField[]>(value);
  const [validationState, setValidationState] = useState<ValidationState>({
    invalid: false,
    invalidText: null,
  });

  const validate = useCallback(() => {
    if (!!valueInternal && valueInternal.length > 0) {
      setValidationState({ invalid: false, invalidText: null });
      onChange(valueInternal);
    } else {
      setValidationState({ invalid: true, invalidText: t('dayOfWeekRequired', 'Required') });
      onChange(null);
    }
  }, [t, valueInternal, onChange]);

  useEffect(() => {
    setValueInternal(value);
  }, [value]);

  useEffect(() => {
    validate();
  }, [validate, valueInternal]);

  return (
    <FilterableMultiSelect
      compareItems={(item1, item2) => item1.value < item2.value}
      hideLabel
      selectedItems={valueInternal ? valueInternal : []}
      invalid={validationState.invalid}
      invalidText={t(validationState.invalidText)}
      items={DAYS_OF_WEEK}
      itemToString={(item) =>
        item ? t('dayOfWeek_' + item.name, DAYS_OF_WEEK_DEFAULT_LABELS[item.name] || item.name) : ''
      }
      onChange={(event) => setValueInternal(event.selectedItems)}
      selectionFeedback="fixed"
    />
  );
};

export default CronDayOfWeekSelect;
