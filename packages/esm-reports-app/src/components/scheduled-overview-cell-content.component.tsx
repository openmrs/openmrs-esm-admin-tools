import React from 'react';
import { Edit, TrashCan } from '@carbon/react/icons';
import { showModal, userHasAccess, useSession } from '@openmrs/esm-framework';
import ReportScheduleDescription from './report-schedule-description.component';
import NextReportExecution from './next-report-execution.component';
import ReportOverviewButton from './report-overview-button.component';
import { useTranslation } from 'react-i18next';
import { closeOverlay, launchOverlay } from '../hooks/useOverlay';
import styles from './reports.scss';
import { PRIVILEGE_SYSTEM_DEVELOPER } from '../constants';
import EditScheduledReportForm from './edit-scheduled-report/edit-scheduled-report-form.component';
import ScheduledReportStatus from './scheduled-report-status.component';

interface ScheduledOverviewCellContentProps {
  cell: { info: { header: string }; value: any };
  mutate: () => void;
}

const ScheduledOverviewCellContent: React.FC<ScheduledOverviewCellContentProps> = ({ cell, mutate }) => {
  const { t } = useTranslation();
  const session = useSession();

  const renderContent = () => {
    switch (cell.info.header) {
      case 'name':
        return <div>{cell.value?.content ?? cell.value}</div>;
      case 'status':
        return <ScheduledReportStatus hasSchedule={cell.value} />;
      case 'schedule':
        return <ReportScheduleDescription schedule={cell.value} />;
      case 'nextRun':
        return <NextReportExecution schedule={cell.value} currentDate={new Date()} />;
      case 'actions':
        return (
          <div>
            <ReportOverviewButton
              shouldBeDisplayed={userHasAccess(PRIVILEGE_SYSTEM_DEVELOPER, session.user)}
              label={t('edit', 'Edit')}
              icon={() => <Edit size={16} className={styles.actionButtonIcon} />}
              reportRequestUuid={null}
              onClick={() => {
                launchOverlay(
                  t('editScheduledReport', 'Edit Scheduled Report'),
                  <EditScheduledReportForm
                    reportDefinitionUuid={cell.value.reportDefinitionUuid}
                    reportRequestUuid={cell.value.reportRequestUuid}
                    closePanel={() => {
                      closeOverlay();
                      mutate();
                    }}
                  />,
                );
              }}
            />
            <ReportOverviewButton
              shouldBeDisplayed={
                !!cell.value.reportRequestUuid && userHasAccess(PRIVILEGE_SYSTEM_DEVELOPER, session.user)
              }
              label={t('deleteSchedule', 'Delete Schedule')}
              icon={() => <TrashCan size={16} className={styles.actionButtonIcon} />}
              reportRequestUuid={cell.value.reportRequestUuid}
              onClick={() => launchDeleteReportScheduleDialog(cell.value.reportRequestUuid)}
            />
          </div>
        );
      default:
        return <span>{cell.value?.content ?? cell.value}</span>;
    }
  };

  const launchDeleteReportScheduleDialog = (reportRequestUuid: string) => {
    const dispose = showModal('cancel-report-modal', {
      closeModal: () => {
        dispose();
        mutate();
      },
      reportRequestUuid,
      modalType: 'schedule',
    });
  };

  return renderContent();
};

export default ScheduledOverviewCellContent;
