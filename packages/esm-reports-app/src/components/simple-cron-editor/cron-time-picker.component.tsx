import React, { useEffect, useState } from 'react';
import { TimePicker } from '@carbon/react';
import { parseTime, Time, TIME_PATTERN, to24HTime } from '../../utils/time-utils';
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
  const timePatternExp = new RegExp(TIME_PATTERN);
  const [valueInternal, setValueInternal] = useState<string>(to24HTime(value));
  const [validationState, setValidationState] = useState<ValidationState>({
    invalid: false,
    invalidText: null,
  });

  useEffect(() => {
    const newInternalValue = to24HTime(value);
    if (!isEqual(value, newInternalValue)) {
      setValueInternal(newInternalValue);
    }
  }, [value]);

  useEffect(() => {
    validate();
  }, [valueInternal]);

  useEffect(() => {
    onChange(validationState.invalid ? null : parseTime(valueInternal));
  }, [validationState]);

  const validate = () => {
    if (timePatternExp.test(valueInternal)) {
      setValidationState({ invalid: false, invalidText: null });
    } else {
      setValidationState({ invalid: true, invalidText: 'notATimeText' });
    }
  };

  return (
    <TimePicker
      hideLabel={true}
      pattern={TIME_PATTERN}
      value={valueInternal}
      invalid={validationState.invalid}
      invalidText={t(validationState.invalidText)}
      onChange={(event) => {
        setValueInternal(event.target.value);
      }}
    />
  );
};

export default CronTimePicker;
