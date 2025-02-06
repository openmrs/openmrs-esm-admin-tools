import React from 'react';
import styles from './reports.scss';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';

interface ReportStatusProps {
  hasSchedule: string;
}

const ScheduledReportStatus: React.FC<ReportStatusProps> = ({ hasSchedule }) => {
  const { t } = useTranslation();

  return (
    <span
      className={classNames({
        [styles.scheduledStatusText]: hasSchedule,
        [styles.notScheduledStatusText]: !hasSchedule,
      })}
    >
      {hasSchedule ? t('scheduled', 'Scheduled') : t('notScheduled', 'Not Scheduled')}
    </span>
  );
};

export default ScheduledReportStatus;
