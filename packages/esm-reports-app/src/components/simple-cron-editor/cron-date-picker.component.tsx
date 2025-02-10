import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DatePicker, DatePickerInput } from '@carbon/react';
import { isEqual } from 'lodash-es';
import styles from './simple-cron-editor.scss';

interface CronDatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
}

interface ValidationState {
  invalid: boolean;
  invalidText: string;
}

const CronDatePicker: React.FC<CronDatePickerProps> = ({ value, onChange }) => {
  const { t } = useTranslation();
  const [valueInternal, setValueInternal] = useState(value);
  const [validationState, setValidationState] = useState<ValidationState>({
    invalid: false,
    invalidText: null,
  });

  const validate = useCallback(() => {
    if (!(valueInternal instanceof Date)) {
      setValidationState({ invalid: true, invalidText: t('dateRequired', 'Required') });
    } else {
      setValidationState({ invalid: false, invalidText: null });
    }
  }, [t, valueInternal]);

  useEffect(() => {
    if (!isEqual(value, valueInternal)) {
      setValueInternal(value);
    }
  }, [value, valueInternal]);

  useEffect(() => {
    validate();
  }, [validate, valueInternal]);

  useEffect(() => {
    onChange(validationState.invalid ? null : valueInternal);
  }, [onChange, validationState, valueInternal]);

  return (
    <div>
      <DatePicker
        datePickerType="single"
        value={valueInternal}
        invalid={validationState.invalid}
        invalidText={t(validationState.invalidText)}
        onChange={([selectedDate]) => {
          setValueInternal(selectedDate);
        }}
      >
        <DatePickerInput hideLabel />
      </DatePicker>
      {validationState.invalid && (
        <span className={styles.dangerLabel01}>{validationState.invalidText && t(validationState.invalidText)}</span>
      )}
    </div>
  );
};

export default CronDatePicker;
