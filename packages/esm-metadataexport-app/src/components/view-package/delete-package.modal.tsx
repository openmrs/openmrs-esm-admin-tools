import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, InlineLoading, ModalBody, ModalFooter, ModalHeader, TextArea } from '@carbon/react';
import { useSWRConfig } from 'swr';
import { restBaseUrl, showSnackbar } from '@openmrs/esm-framework';
import { deletePackage } from '../../packages/packages.resource';
import type { ExportPackage } from '../../types';
import styles from './delete-package.modal.scss';

const packagesUrl = `${restBaseUrl}/metadataexport/packages`;
const isPackagesCacheKey = (key: unknown) => typeof key === 'string' && key.startsWith(packagesUrl);

interface DeletePackageModalProps {
  closeModal: () => void;
  exportPackage: ExportPackage;
  onDeleted: () => void;
}

const DeletePackageModal: React.FC<DeletePackageModalProps> = ({ closeModal, exportPackage, onDeleted }) => {
  const { t } = useTranslation();
  const { mutate } = useSWRConfig();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      await deletePackage(exportPackage.uuid, deleteReason);
      // Revalidate the packages list so the deleted package drops out of the table.
      await mutate(isPackagesCacheKey);
      showSnackbar({
        title: t('packageDeleted', 'Package deleted'),
        subtitle: t('packageDeletedSubtitle', '{{name}} was deleted', { name: exportPackage.name }),
        kind: 'success',
        isLowContrast: true,
      });
      closeModal();
      onDeleted();
    } catch (deleteError) {
      showSnackbar({
        title: t('packageDeleteFailed', 'Failed to delete package'),
        subtitle: deleteError?.message ?? t('unexpectedError', 'An unexpected error occurred'),
        kind: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
  }, [exportPackage.uuid, exportPackage.name, deleteReason, mutate, closeModal, onDeleted, t]);

  return (
    <>
      <ModalHeader closeModal={closeModal} title={t('deletePackage', 'Delete package')} />
      <ModalBody>
        <p className={styles.modalBody}>
          {t('deletePackageConfirmation', 'Are you sure you want to delete {{name}}? Please provide a reason.', {
            name: exportPackage.name,
          })}
        </p>
        <TextArea
          labelText={t('reason', 'Reason')}
          placeholder={t('reasonPlaceholder', 'Enter a reason for deleting this package')}
          value={deleteReason}
          onChange={(event) => setDeleteReason(event.target.value)}
          rows={3}
        />
      </ModalBody>
      <ModalFooter>
        <Button kind="secondary" onClick={closeModal} disabled={isDeleting}>
          {t('cancel', 'Cancel')}
        </Button>
        <Button kind="danger" onClick={handleDelete} disabled={isDeleting}>
          {isDeleting ? <InlineLoading description={t('deleting', 'Deleting') + '…'} /> : t('delete', 'Delete')}
        </Button>
      </ModalFooter>
    </>
  );
};

export default DeletePackageModal;
