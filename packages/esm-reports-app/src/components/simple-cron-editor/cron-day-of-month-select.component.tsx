import React, { useEffect, useState } from 'react';
import { Select, SelectItem } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { CronField, DAYS_OF_MONTH } from './commons';
import { isEqual } from 'lodash-es';

interface CronDayOfMonthSelectProps {
  value: CronField;
  onChange: (selectedDayOfMonth: CronField) => void;
}

interface ValidationState {
  invalid: boolean;
  invalidText: string;
}

const CronDayOfMonthSelect: React.FC<CronDayOfMonthSelectProps> = ({ value, onChange }) => {
  const { t } = useTranslation();

  const [valueInternal, setValueInternal] = useState<number | string>(value?.value);
  const [validationState, setValidationState] = useState<ValidationState>({
    invalid: false,
    invalidText: null,
  });

  useEffect(() => {
    if (!isEqual(value, valueInternal)) {
      setValueInternal(value?.value);
    }
  }, [value]);

  useEffect(() => {
    validate();
  }, [valueInternal]);

  useEffect(() => {
    onChange(validationState.invalid ? null : DAYS_OF_MONTH.find((dayOfMonth) => dayOfMonth.value == valueInternal));
  }, [validationState]);

  const validate = () => {
    if (!!valueInternal) {
      setValidationState({ invalid: false, invalidText: null });
    } else {
      setValidationState({ invalid: true, invalidText: 'dayOfMonthRequired' });
    }
  };

  return (
    <Select
      hideLabel={true}
      onChange={(event) => {
        setValueInternal(event.target.value);
      }}
      value={valueInternal}
      invalid={validationState.invalid}
      invalidText={t(validationState.invalidText)}
    >
      <SelectItem text={''} value={null} />
      {DAYS_OF_MONTH.map((dayOfMonth) => (
        <SelectItem key={dayOfMonth.value} text={t('dayOfMonth_' + dayOfMonth.name)} value={dayOfMonth.value} />
      ))}
    </Select>
  );
};

export default CronDayOfMonthSelect;
