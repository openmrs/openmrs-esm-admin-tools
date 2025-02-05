import React, { useEffect, useMemo, useState } from 'react';
import { isEqual } from 'lodash-es';
import { Select, SelectItem } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { type CronField, DAYS_OF_MONTH, DAYS_OF_MONTH_DEFAULT_LABELS } from './commons';

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
      setValidationState({ invalid: true, invalidText: t('dayOfMonthRequired', 'Required') });
    }
  };

  const translatedOptions = useMemo(
    () =>
      DAYS_OF_MONTH.map((day) => ({
        ...day,
        label: t(`dayOfMonth_${day.name}`, DAYS_OF_MONTH_DEFAULT_LABELS[day.name] || day.name),
      })),
    [t],
  );

  return (
    <Select
      hideLabel
      onChange={(event) => {
        setValueInternal(event.target.value);
      }}
      value={valueInternal}
      invalid={validationState.invalid}
      invalidText={t(validationState.invalidText)}
    >
      {translatedOptions.map((dayOfMonth) => (
        <SelectItem key={dayOfMonth.value} text={dayOfMonth.label} value={dayOfMonth.value.toString()} />
      ))}
    </Select>
  );
};

export default CronDayOfMonthSelect;
