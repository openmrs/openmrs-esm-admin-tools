import { showNotification } from '@openmrs/esm-framework';
import {
  Button,
  ButtonSkeleton,
  Column,
  FileUploaderDropContainer,
  FileUploaderItem,
  FileUploaderSkeleton,
  Form,
  Row,
  SkeletonText,
} from '@carbon/react';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './import.component.scss';
import { startImportWithFile, startImportWithSubscription, useSubscription } from './import.resource';

const Import: React.FC = () => {
  const { t } = useTranslation();
  const [isSubscriptionAvailable, setIsSubscriptionAvailable] = useState(false);
  const [file, setFile] = useState<File>();

  const { data: subscription, isLoading, isError } = useSubscription();

  useEffect(() => {
    if (!isLoading && !isError) {
      setIsSubscriptionAvailable(!!subscription);
    }
  }, [isLoading, isError, subscription]);

  const onAddFiles = useCallback(
    (evt: React.DragEvent<HTMLInputElement>, { addedFiles }) => {
      const fileToUpload: File = addedFiles[0];
      if (fileToUpload.type !== 'application/zip') {
        showNotification({
          kind: 'error',
          description: t('fileFormatError'),
        });
      } else {
        setFile(fileToUpload);
      }
    },
    [t],
  );

  const handleFileUploaderItemClick = useCallback(() => {
    setFile(null);
  }, []);

  const handleImportWithSubscription = useCallback(
    async (evt: React.FormEvent<HTMLFormElement>) => {
      evt.preventDefault();
      evt.stopPropagation();

      if (!isSubscriptionAvailable) {
        showNotification({
          kind: 'error',
          description: t('noSubscriptionError'),
        });
        return;
      }

      const abortController = new AbortController();
      const response = await startImportWithSubscription(abortController);

      if (response.status === 201) {
        showNotification({
          kind: 'success',
          description: t('importSuccess'),
        });
      } else {
        showNotification({
          kind: 'error',
          description: t('importFailed'),
        });
      }
    },
    [isSubscriptionAvailable, t],
  );

  const handleImportWithFile = useCallback(
    async (evt: React.FormEvent<HTMLFormElement>) => {
      evt.preventDefault();
      evt.stopPropagation();

      if (!file) {
        showNotification({
          kind: 'error',
          description: t('noFileSelected'),
        });
        return;
      }

      const abortController = new AbortController();
      const response = await startImportWithFile(file, abortController);

      if (response.status === 201) {
        setFile(null);
        showNotification({
          kind: 'success',
          description: t('importSuccess'),
        });
      } else {
        showNotification({
          kind: 'error',
          description: t('importFailed'),
        });
      }
    },
    [file, t],
  );

  if (isLoading) {
    return (
      <Row className={styles.tabContentContainer}>
        <Column sm={12} lg={7}>
          <Form>
            <SkeletonText className={styles.productiveHeading03} heading={true} />
            <SkeletonText className={styles.formText} paragraph={true} lineCount={2} />
            <ButtonSkeleton />
          </Form>

          <Form className={styles.form}>
            <SkeletonText className={styles.productiveHeading03} heading={true} />
            <SkeletonText className={styles.formText} />
            <FileUploaderSkeleton style={{ marginBottom: '1.5rem' }} />
            <ButtonSkeleton />
          </Form>
        </Column>
      </Row>
    );
  }

  if (isError) {
    showNotification({
      kind: 'error',
      description: t('subscriptionError'),
    });
  }

  return (
    <Row className={styles.tabContentContainer}>
      <Column sm={12} lg={7}>
        <Form onSubmit={handleImportWithSubscription}>
          <h3 className={styles.productiveHeading03}>{t('importConcepts')}</h3>
          <p className={styles.formText}>{t('importInstructions')}</p>
          <Button kind="primary" type="submit" disabled={!isSubscriptionAvailable}>
            {t('importFromSubscription')}
          </Button>
        </Form>

        <Form className={styles.form} onSubmit={handleImportWithFile}>
          <h3 className={styles.productiveHeading03}>{t('importFromFileHeading')}</h3>
          <p className={styles.formText}>{t('importFromFileInfo')}</p>
          {file ? (
            <FileUploaderItem
              key={file.name}
              name={file.name}
              size="default"
              status="edit"
              iconDescription={t('fileAdded')}
              onDelete={handleFileUploaderItemClick}
              style={{ backgroundColor: '#e0e0e0' }}
            />
          ) : (
            <FileUploaderDropContainer
              accept={['application/zip']}
              multiple
              labelText={t('importFromFileDragInfo')}
              onAddFiles={onAddFiles}
              style={{ marginBottom: '1.5rem' }}
            />
          )}
          <Button kind="primary" type="submit">
            {t('importFromFile')}
          </Button>
        </Form>
      </Column>
    </Row>
  );
};

export default Import;
