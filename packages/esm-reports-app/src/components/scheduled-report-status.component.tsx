import React from 'react';
import styles from './reports.scss';
import { useTranslation } from 'react-i18next';

interface ReportStatusProps {
  hasSchedule: string;
}

const ScheduledReportStatus: React.FC<ReportStatusProps> = ({ hasSchedule }) => {
  const { t } = useTranslation();

  const renderStatusLabel = () => {
    if (hasSchedule) {
      return <span className={styles.scheduledStatusText}>{t('scheduled', 'Scheduled')}</span>;
    } else {
      return <span className={styles.notScheduledStatusText}>{t('notScheduled', 'Not Scheduled')}</span>;
    }
  };

  return renderStatusLabel();
};

export default ScheduledReportStatus;
