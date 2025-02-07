import React, { useCallback, useEffect, useState } from 'react';
import { TimePicker } from '@carbon/react';
import { parseTime, TIME_PATTERN, TIME_PATTERN_REG_EXP, to24HTime, type Time } from '../../utils/time-utils';
import { isEqual } from 'lodash-es';
import { useTranslation } from 'react-i18next';

interface CronTimePickerProps {
  value: Time;
  onChange: (time: Time) => void;
}

interface ValidationState {
  invalid: boolean;
  invalidText: string;
}

const CronTimePicker: React.FC<CronTimePickerProps> = ({ value, onChange }) => {
  const { t } = useTranslation();

  const [valueInternal, setValueInternal] = useState(to24HTime(value));
  const [validationState, setValidationState] = useState<ValidationState>({
    invalid: false,
    invalidText: null,
  });

  const validate = useCallback(() => {
    if (TIME_PATTERN_REG_EXP.test(valueInternal)) {
      setValidationState({ invalid: false, invalidText: null });
    } else {
      setValidationState({ invalid: true, invalidText: t('notATimeText', 'hh:mm 24-hr pattern required') });
    }
  }, [t, valueInternal]);

  useEffect(() => {
    const newInternalValue = to24HTime(value);
    if (!isEqual(value, newInternalValue)) {
      setValueInternal(newInternalValue);
    }
  }, [value]);

  useEffect(() => {
    onChange(validationState.invalid ? null : parseTime(valueInternal));
  }, [onChange, validationState, valueInternal]);

  return (
    <TimePicker
      hideLabel
      invalid={validationState.invalid}
      invalidText={t(validationState.invalidText)}
      onBlur={validate}
      onChange={(event) => setValueInternal(event.target.value)}
      pattern={TIME_PATTERN}
      value={valueInternal}
    />
  );
};

export default CronTimePicker;
