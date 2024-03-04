import React, { useCallback, useState } from 'react';
import { ModalBody, Button, ModalFooter, ModalHeader, InlineLoading } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { cancelReportRequest } from '../reports.resource';
import { showToast } from '@openmrs/esm-framework';
import { mutate } from 'swr';

interface CancelReportModalProps {
  closeModal: () => void;
  reportRequestUuid: string;
  modalType: string;
}

const CancelReportModal: React.FC<CancelReportModalProps> = ({ closeModal, reportRequestUuid, modalType }) => {
  const { t } = useTranslation();
  const [isCanceling, setIsCanceling] = useState(false);

  const handleCancel = useCallback(async () => {
    setIsCanceling(true);
    cancelReportRequest(reportRequestUuid)
      .then(() => {
        callMutates(modalType);
        closeModal();
        showToast({
          critical: true,
          kind: 'success',
          title: getModalTitleByType(modalType),
          description: getSuccessToastMessageByType(modalType),
        });
      })
      .catch((error) => {
        showToast({
          critical: true,
          kind: 'error',
          title: getModalTitleByType(modalType),
          description: getFailedToastMessageByType(modalType),
        });
      });
  }, [closeModal]);

  const callMutates = (modalType) => {
    let baseUrl = '/ws/rest/v1/reportingrest/reportRequest?statusesGroup=';
    if (modalType === 'delete') {
      mutate(baseUrl + 'ran');
    } else if (modalType === 'cancel') {
      mutate(baseUrl + 'ran');
      mutate(baseUrl + 'processing');
    } else if (modalType === 'schedule') {
      mutate(baseUrl + 'scheduled&sortBy=name');
    }
  };

  const getModalTitleByType = (modalType) => {
    if (modalType === 'delete') {
      return t('deleteReport', 'Delete report');
    } else if (modalType === 'cancel') {
      return t('cancelReport', 'Cancel report');
    } else if (modalType === 'schedule') {
      return t('scheduleReport', 'Schedule report');
    }
  };

  const getModalBodyByType = (modalType) => {
    if (modalType === 'delete') {
      return t('deleteReportModalText', 'Are you sure you want to delete this report?');
    } else if (modalType === 'cancel') {
      return t('cancelReportModalText', 'Are you sure you want to cancel this report?');
    } else if (modalType === 'schedule') {
      return t('deleteReportScheduleModalText', 'Are you sure you want to delete this schedule?');
    }
  };

  const getSuccessToastMessageByType = (modalType) => {
    if (modalType === 'delete') {
      return t('reportDeletedSuccessfully', 'Report deleted successfully');
    } else if (modalType === 'cancel') {
      return t('reportCancelledSuccessfully', 'Report cancelled successfully');
    } else if (modalType === 'schedule') {
      return t('reportScheduleDeletedSuccessfully', 'Report schedule deleted successfully');
    }
  };

  const getFailedToastMessageByType = (modalType) => {
    if (modalType === 'delete') {
      return t('reportDeletingErrorMsg', 'Error during report deleting');
    } else if (modalType === 'cancel') {
      return t('reportCancelingErrorMsg', 'Error during report canceling');
    } else if (modalType === 'schedule') {
      return t('reportScheduleDeletingErrorMsg', 'Error during report schedule deleting');
    }
  };

  const getLoadingMessageByType = (modalType) => {
    if (modalType === 'delete' || modalType === 'schedule') {
      return t('deleting', 'Deleting');
    } else if (modalType === 'cancel') {
      return t('canceling', 'Canceling');
    }
  };

  return (
    <div>
      <ModalHeader closeModal={closeModal} title={getModalTitleByType(modalType)} />
      <ModalBody>
        <p>{getModalBodyByType(modalType)}</p>
      </ModalBody>
      <ModalFooter>
        <Button kind="secondary" onClick={closeModal}>
          {t('no', 'No')}
        </Button>
        <Button kind="danger" onClick={handleCancel} disabled={isCanceling}>
          {isCanceling ? (
            <InlineLoading description={getLoadingMessageByType(modalType) + '...'} />
          ) : (
            <span>{t('yes', 'Yes')}</span>
          )}
        </Button>
      </ModalFooter>
    </div>
  );
};

export default CancelReportModal;
