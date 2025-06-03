import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DatePicker, DatePickerInput } from '@carbon/react';
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
    if (valueInternal instanceof Date) {
      setValidationState({ invalid: false, invalidText: null });
      onChange(valueInternal);
    } else {
      setValidationState({ invalid: true, invalidText: t('dateRequired', 'Required') });
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
        <DatePickerInput id="cronDatePicker" labelText="" hideLabel />
      </DatePicker>
      {validationState.invalid && (
        <span className={styles.dangerLabel01}>{validationState.invalidText && t(validationState.invalidText)}</span>
      )}
    </div>
  );
};

export default CronDatePicker;
