import React, { useEffect, useState } from 'react';
import { DatePicker, DatePickerInput } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import styles from './simple-cron-editor.scss';
import { isEqual } from 'lodash-es';

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
    if (!(valueInternal instanceof Date)) {
      setValidationState({ invalid: true, invalidText: 'dateRequired' });
    } else {
      setValidationState({ invalid: false, invalidText: null });
    }
  };

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
        <DatePickerInput hideLabel={true} />
      </DatePicker>
      {validationState.invalid && (
        <span className={styles.dangerLabel01}>{validationState.invalidText && t(validationState.invalidText)}</span>
      )}
    </div>
  );
};

export default CronDatePicker;
