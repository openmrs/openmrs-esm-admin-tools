import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);
import { useTranslation } from 'react-i18next';
import { Select, SelectItem, TextInput } from '@carbon/react';
import {
  DAYS_OF_MONTH,
  DAYS_OF_WEEK,
  SCHEDULE_TYPE_DEFAULT_LABELS,
  SCHEDULE_TYPES,
  ST_ADVANCED,
  ST_EVERY_DAY,
  ST_EVERY_MONTH,
  ST_EVERY_WEEK,
  ST_ONCE,
} from './commons';
import type { CronField } from './commons';
import type { Time } from '../../utils/time-utils';
import { parseOpenMRSCron } from '../../utils/openmrs-cron-utils';
import CronDatePicker from './cron-date-picker.component';
import CronDayOfMonthSelect from './cron-day-of-month-select.component';
import CronDayOfWeekSelect from './cron-day-of-week-select.component';
import CronTimePicker from './cron-time-picker.component';
import styles from './simple-cron-editor.scss';

interface SimpleCronEditorProps {
  initialCron: string;
  onChange: (cron: string, isValid: boolean) => void;
}

interface EditorState {
  scheduleType: string;
  date: Date | null;
  time: Time | null;
  selectedDaysOfWeek: CronField[];
  selectedDayOfMonth: CronField | null;
  cron: string | null;
}

const EMPTY_EDITOR_STATE: EditorState = {
  scheduleType: ST_ONCE,
  date: null,
  time: null,
  selectedDaysOfWeek: [],
  selectedDayOfMonth: null,
  cron: null,
};

function getEditorState(initialCron: string): EditorState {
  const scheduleType = detectSchedulingType(initialCron);
  const openMRSCron = parseOpenMRSCron(initialCron);

  if (scheduleType === ST_ADVANCED) {
    return {
      scheduleType,
      date: undefined,
      selectedDayOfMonth: undefined,
      selectedDaysOfWeek: [],
      time: undefined,
      cron: initialCron,
    };
  } else if (scheduleType === ST_ONCE) {
    return {
      scheduleType,
      date: dayjs()
        .utc()
        .set('year', parseInt(openMRSCron.year))
        .set('month', parseInt(openMRSCron.month) - 1)
        .set('date', parseInt(openMRSCron.day))
        .toDate(),
      selectedDayOfMonth: undefined,
      selectedDaysOfWeek: [],
      time: { hours: parseInt(openMRSCron.hours), minutes: parseInt(openMRSCron.minutes) },
      cron: null,
    };
  } else if (scheduleType === ST_EVERY_DAY) {
    return {
      scheduleType,
      date: undefined,
      selectedDayOfMonth: undefined,
      selectedDaysOfWeek: [],
      time: { hours: parseInt(openMRSCron.hours), minutes: parseInt(openMRSCron.minutes) },
      cron: null,
    };
  } else if (scheduleType === ST_EVERY_WEEK) {
    return {
      scheduleType,
      date: undefined,
      selectedDayOfMonth: undefined,
      selectedDaysOfWeek: openMRSCron.dayOfWeek
        .split(',')
        .map((dayId) => parseInt(dayId))
        .map((dayId) => DAYS_OF_WEEK[dayId]),
      time: { hours: parseInt(openMRSCron.hours), minutes: parseInt(openMRSCron.minutes) },
      cron: null,
    };
  } else if (scheduleType === ST_EVERY_MONTH) {
    return {
      scheduleType,
      date: undefined,
      selectedDayOfMonth: DAYS_OF_MONTH.find((dayOfMonth) => dayOfMonth.value === openMRSCron.day),
      selectedDaysOfWeek: [],
      time: { hours: parseInt(openMRSCron.hours), minutes: parseInt(openMRSCron.minutes) },
      cron: null,
    };
  }

  return EMPTY_EDITOR_STATE;
}

function detectSchedulingType(expression: string) {
  if (!expression) {
    return null;
  }
  const onceRegexp = new RegExp('^0\\s\\d{1,2}\\s\\d{1,2}\\s\\d{1,2}\\s\\d{1,2}\\s[?]\\s\\d{4}');
  if (onceRegexp.test(expression)) {
    return ST_ONCE;
  }
  const everyDayRegexp = new RegExp('^0\\s\\d{1,2}\\s\\d{1,2}\\s[*]\\s[*]\\s[?]');
  if (everyDayRegexp.test(expression)) {
    return ST_EVERY_DAY;
  }
  const everyWeekRegexp = new RegExp('^0\\s\\d{1,2}\\s\\d{1,2}\\s[?]\\s[*]\\s[1-7*,]*');
  if (everyWeekRegexp.test(expression)) {
    return ST_EVERY_WEEK;
  }
  const everyMonthRegexp = new RegExp('^0\\s\\d{1,2}\\s\\d{1,2}\\s(1|L)\\s[*]\\s[?]');
  if (everyMonthRegexp.test(expression)) {
    return ST_EVERY_MONTH;
  }
  return ST_ADVANCED;
}

const SimpleCronEditor: React.FC<SimpleCronEditorProps> = ({ initialCron, onChange }) => {
  const { t } = useTranslation();
  const initialScheduleType = detectSchedulingType(initialCron);

  const [editorState, setEditorState] = useState<EditorState>(getEditorState(initialCron));
  const [invalid, setInvalid] = useState(false);
  const [cron, setCron] = useState(initialCron);

  useEffect(() => {
    setEditorState(getEditorState(initialCron));
  }, [initialCron]);

  useEffect(() => {
    buildCron();
  }, [editorState]);

  useEffect(() => {
    onChange(cron, !invalid);
  }, [cron]);

  const buildCron = () => {
    if (!validateEditor()) {
      setCron(null);
      return;
    }

    const selectedScheduleType = editorState.scheduleType;
    const selectedTime = editorState.time;

    if (selectedScheduleType === ST_ADVANCED) {
      setCron(editorState.cron);
    } else if (selectedScheduleType === ST_ONCE) {
      setCron(
        `0 ${selectedTime.minutes} ${selectedTime.hours} ${editorState.date.getUTCDate()} ${
          editorState.date.getUTCMonth() + 1
        } ? ${editorState.date.getUTCFullYear()}`,
      );
    } else if (selectedScheduleType === ST_EVERY_DAY) {
      setCron(`0 ${selectedTime.minutes} ${selectedTime.hours} * * ?`);
    } else if (selectedScheduleType === ST_EVERY_WEEK) {
      setCron(
        `0 ${selectedTime.minutes} ${selectedTime.hours} ? * ${editorState.selectedDaysOfWeek.map(
          (dayOfWeek) => dayOfWeek.value,
        )}`,
      );
    } else if (selectedScheduleType === ST_EVERY_MONTH) {
      setCron(`0 ${selectedTime.minutes} ${selectedTime.hours} ${editorState.selectedDayOfMonth.value} * ?`);
    }
  };

  const validateEditor = (): boolean => {
    const selectedScheduleType = editorState.scheduleType;
    const selectedTime = editorState.time;

    if (selectedScheduleType === ST_ADVANCED) {
      if (!editorState.cron) {
        return validationFailed();
      }
    } else if (selectedScheduleType === ST_ONCE) {
      if (!selectedTime || !(editorState.date instanceof Date)) {
        return validationFailed();
      }
    } else if (selectedScheduleType === ST_EVERY_DAY) {
      if (!selectedTime) {
        return validationFailed();
      }
    } else if (selectedScheduleType === ST_EVERY_WEEK) {
      if (!selectedTime || !editorState.selectedDaysOfWeek || editorState.selectedDaysOfWeek.length === 0) {
        return validationFailed();
      }
    } else if (selectedScheduleType === ST_EVERY_MONTH) {
      if (!selectedTime || !editorState.selectedDayOfMonth) {
        return validationFailed();
      }
    }

    return validationSuccess();
  };

  const validationFailed = (): boolean => {
    setInvalid(true);
    return false;
  };

  const validationSuccess = (): boolean => {
    setInvalid(false);
    return true;
  };

  const renderScheduleTypeSelect = () => {
    return (
      <div className={styles.cronEditorField}>
        <Select
          hideLabel
          onChange={(event) => {
            setEditorState((state) => ({ ...state, scheduleType: event.target.value }));
          }}
          value={editorState.scheduleType}
        >
          {SCHEDULE_TYPES.filter(
            (scheduleType) =>
              (initialScheduleType != ST_ADVANCED && scheduleType != ST_ADVANCED) ||
              initialScheduleType === ST_ADVANCED,
          ).map((scheduleType) => (
            <SelectItem
              key={scheduleType}
              text={t('scheduleType_' + scheduleType, SCHEDULE_TYPE_DEFAULT_LABELS[scheduleType] || scheduleType)}
              value={scheduleType}
            >
              {scheduleType}
            </SelectItem>
          ))}
        </Select>
      </div>
    );
  };

  const renderDatePicker = () => {
    return (
      <div className={styles.cronEditorField}>
        <CronDatePicker
          onChange={(selectedDate) => {
            setEditorState((state) => ({ ...state, date: selectedDate }));
          }}
          value={editorState.date}
        />
      </div>
    );
  };

  const renderDayOfWeekSelect = () => {
    return (
      <div className={styles.cronEditorField}>
        <CronDayOfWeekSelect
          onChange={(selectedDaysOfWeek) => {
            setEditorState((state) => ({ ...state, selectedDaysOfWeek }));
          }}
          value={editorState.selectedDaysOfWeek}
        />
      </div>
    );
  };

  const renderTimePicker = () => {
    return (
      <div className={styles.cronTimePickerField}>
        <CronTimePicker
          onChange={(selectedTime) => {
            setEditorState((state) => ({ ...state, time: selectedTime }));
          }}
          value={editorState.time}
        />
      </div>
    );
  };

  const renderDayOfMonthSelect = () => {
    return (
      <div className={styles.cronEditorField}>
        <CronDayOfMonthSelect
          onChange={(selectedDayOfMonth) => {
            setEditorState((state) => ({ ...state, selectedDayOfMonth }));
          }}
          value={editorState.selectedDayOfMonth}
        />
      </div>
    );
  };

  const renderCronInput = () => {
    return (
      <div className={styles.cronEditorField}>
        <TextInput
          hideLabel
          readOnly
          onChange={(event) => {
            setEditorState((state) => ({ ...state, cron: event.target.value }));
          }}
          value={editorState.cron}
        />
      </div>
    );
  };

  return (
    <div className={styles.cronContainer}>
      {renderScheduleTypeSelect()}
      {editorState.scheduleType != ST_ADVANCED && editorState.scheduleType != ST_EVERY_DAY && (
        <div className={styles.cronEditorFieldSeparator}>
          <span>{t('on', 'on')}</span>
        </div>
      )}
      {editorState.scheduleType === ST_ONCE && renderDatePicker()}
      {editorState.scheduleType === ST_EVERY_WEEK && renderDayOfWeekSelect()}
      {editorState.scheduleType === ST_EVERY_MONTH && renderDayOfMonthSelect()}
      {editorState.scheduleType != ST_ADVANCED && (
        <div className={styles.cronEditorFieldSeparator}>
          <span>{t('at', 'at')}</span>
        </div>
      )}
      {editorState.scheduleType != ST_ADVANCED && renderTimePicker()}
      {editorState.scheduleType === ST_ADVANCED && renderCronInput()}
    </div>
  );
};

export default SimpleCronEditor;
