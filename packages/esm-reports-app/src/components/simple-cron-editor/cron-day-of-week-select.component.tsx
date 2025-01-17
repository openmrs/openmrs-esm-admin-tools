import React, { useEffect, useState } from 'react';
import { FilterableMultiSelect } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { CronField, DAYS_OF_WEEK } from './commons';
import { isEqual } from 'lodash-es';

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

  useEffect(() => {
    if (!isEqual(value, valueInternal)) {
      setValueInternal(value);
    }
  }, [value]);

  useEffect(() => {
    validate();
  }, [valueInternal]);

  useEffect(() => {
    onChange(validationState.invalid ? null : valueInternal);
  }, [validationState]);

  const validate = () => {
    if (!!valueInternal && valueInternal.length > 0) {
      setValidationState({ invalid: false, invalidText: null });
    } else {
      setValidationState({ invalid: true, invalidText: 'dayOfWeekRequired' });
    }
  };

  return (
    <FilterableMultiSelect
      hideLabel={true}
      items={DAYS_OF_WEEK}
      compareItems={(item1, item2) => item1.value < item2.value}
      itemToString={(item) => (item ? t('dayOfWeek_' + item.name) : '')}
      selectionFeedback="fixed"
      initialSelectedItems={valueInternal ? valueInternal : []}
      onChange={(event) => {
        setValueInternal(event.selectedItems);
      }}
      invalid={validationState.invalid}
      invalidText={t(validationState.invalidText)}
    />
  );
};

export default CronDayOfWeekSelect;
