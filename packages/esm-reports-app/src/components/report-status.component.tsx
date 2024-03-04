import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckmarkFilled, CheckmarkOutline, CloseFilled, Queued } from '@carbon/react/icons';
import { Loading } from '@carbon/react';
import styles from './reports.scss';
import {
  COMPLETED,
  FAILED,
  PROCESSING,
  SAVED,
  SCHEDULED,
  SCHEDULE_COMPLETED,
  REQUESTED,
} from './report-statuses-constants';

interface ReportStatusProps {
  status: string;
}

const ReportStatus: React.FC<ReportStatusProps> = ({ status }) => {
  const { t } = useTranslation();
  return (
    <>
      {status === SAVED && (
        <>
          <CheckmarkFilled size={16} className={`${styles.statusIcon} ${styles.successIcon}`} />
          {t('completedAndPreserved', 'Completed and Preserved')}
        </>
      )}
      {status === COMPLETED && (
        <>
          <CheckmarkOutline size={16} className={`${styles.statusIcon} ${styles.successIcon}`} />
          {t('completed', 'Completed')}
        </>
      )}
      {status === PROCESSING && (
        <>
          <Loading small={true} withOverlay={false} className={`${styles.statusIcon} ${styles.runningIcon}`} />
          {t('running', 'Running')}
        </>
      )}
      {status === FAILED && (
        <>
          <CloseFilled size={16} className={`${styles.statusIcon} ${styles.failedIcon}`} />
          {t('failed', 'Failed')}
        </>
      )}
      {status === SCHEDULED && (
        <>
          <span className={styles.scheduledStatusText}>{t('scheduled', 'Scheduled')}</span>
        </>
      )}
      {status === SCHEDULE_COMPLETED && (
        <>
          <span className={styles.scheduleCompletedStatusText}>{t('scheduleCompleted', 'Schedule completed')}</span>
        </>
      )}
      {status === REQUESTED && (
        <>
          <Queued size={16} className={`${styles.statusIcon}`} />
          {t('queued', 'Queued')}
        </>
      )}
    </>
  );
};

export default ReportStatus;
