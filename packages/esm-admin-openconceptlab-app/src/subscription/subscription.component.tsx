import { showNotification } from '@openmrs/esm-framework';
import {
  Button,
  ButtonSkeleton,
  Checkbox,
  CheckboxSkeleton,
  Column,
  Form,
  FormGroup,
  Grid,
  Stack,
  SkeletonText,
  TextInput,
  TextInputSkeleton,
} from '@carbon/react';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { deleteSubscription, updateSubscription, useSubscription } from './subscription.resource';
import styles from './subscription.component.scss';
import { useSWRConfig } from 'swr';

const Subscription: React.FC = () => {
  const { t } = useTranslation();
  const { mutate } = useSWRConfig();
  const [subscriptionUrl, setSubscriptionUrl] = useState('');
  const [token, setToken] = useState('');
  const [isSubscribedToSnapshot, setIsSubscribedToSnapshot] = useState(false);
  const [validationType, setValidationType] = useState<'NONE' | 'FULL'>('FULL');

  const { data: subscription, isLoading, isError } = useSubscription();

  useEffect(() => {
    if (!isLoading && !isError) {
      setSubscriptionUrl(subscription?.url || '');
      setToken(subscription?.token || '');
      setIsSubscribedToSnapshot(subscription?.subscribedToSnapshot || false);
      setValidationType(subscription?.validationType || 'FULL');
    }
  }, [isLoading, isError, subscription]);

  const handleChangeSubscriptionUrl = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSubscriptionUrl(event.target.value);
  }, []);

  const handleChangeToken = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setToken(event.target.value);
  }, []);

  const handleChangeValidationType = useCallback((checked: boolean) => {
    setValidationType(checked ? 'NONE' : 'FULL');
  }, []);

  const handleChangeSubscriptionType = useCallback((checked: boolean) => {
    setIsSubscribedToSnapshot(checked);
  }, []);

  const handleSubmit = useCallback(
    async (evt: React.FormEvent<HTMLFormElement>) => {
      evt.preventDefault();
      evt.stopPropagation();

      const abortController = new AbortController();

      const updatedSubscription = {
        ...subscription,
        url: subscriptionUrl,
        token: token,
        validationType: validationType,
        subscribedToSnapshot: isSubscribedToSnapshot,
      };
      mutate('/ws/rest/v1/openconceptlab/subscription?v=full', updatedSubscription, false);

      const response = await updateSubscription(updatedSubscription, abortController);
      mutate('/ws/rest/v1/openconceptlab/subscription?v=full');

      if (response.ok) {
        showNotification({
          kind: 'success',
          description: t(response.status === 201 ? 'subscriptionCreated' : 'subscriptionUpdated'),
        });
      } else {
        showNotification({
          title: t('errorSavingSubscription'),
          kind: 'error',
          critical: true,
          description: JSON.stringify(response.data),
        });
      }

      return () => abortController.abort();
    },
    [subscriptionUrl, token, validationType, isSubscribedToSnapshot, t, subscription, mutate],
  );

  const handleCancel = useCallback(() => {
    setSubscriptionUrl(subscription?.url || '');
    setToken(subscription?.token || '');
    setIsSubscribedToSnapshot(subscription?.subscribedToSnapshot || false);
    setValidationType(subscription?.validationType || 'FULL');

    showNotification({
      kind: 'info',
      description: t('cancelledChanges'),
    });
  }, [subscription, t]);

  const handleUnsubscribe = useCallback(
    async (evt: React.FormEvent<HTMLFormElement>) => {
      evt.preventDefault();
      evt.stopPropagation();
      const abortController = new AbortController();

      const response = await deleteSubscription(subscription, abortController);
      mutate('/ws/rest/v1/openconceptlab/subscription?v=full');

      if (response.status === 204) {
        setSubscriptionUrl('');
        setToken('');
        setIsSubscribedToSnapshot(false);
        setValidationType('FULL');
        showNotification({
          kind: 'success',
          description: t('subscriptionDeleted'),
        });
      } else {
        showNotification({
          title: t('errorDeletingSubscription'),
          kind: 'error',
          critical: true,
          description: JSON.stringify(response.data),
        });
      }

      return () => abortController.abort();
    },
    [subscription, t, mutate],
  );

  if (isLoading) {
    return (
      <Grid className={styles.grid}>
        <Column sm={4} md={8} lg={10}>
          <Form>
            <SkeletonText className={styles.productiveHeading03} />
            <Stack gap={5}>
              <TextInputSkeleton />
              <TextInputSkeleton />
              <FormGroup legendText={<SkeletonText width="75px" />} className={styles.formGroup}>
                <CheckboxSkeleton />
                <CheckboxSkeleton />
              </FormGroup>
            </Stack>
            <ButtonSkeleton />
            <ButtonSkeleton />
          </Form>
          <Form className={styles.unsubscribeForm}>
            <SkeletonText className={styles.productiveHeading03} />
            <SkeletonText className={styles.unsubscribeText} />
            <ButtonSkeleton />
          </Form>
        </Column>
      </Grid>
    );
  }

  if (isError) {
    showNotification({
      kind: 'error',
      description: t('subscriptionError'),
    });
  }

  return (
    <Grid className={styles.grid}>
      <Column sm={4} md={8} lg={10}>
        <Form onSubmit={handleSubmit}>
          <h3 className={styles.productiveHeading03}>{t('setupSubscription')}</h3>
          <Stack gap={5}>
            <TextInput
              id="subscriptionUrl"
              type="url"
              labelText={t('subscriptionUrl')}
              placeholder="https://api.openconceptlab.org/orgs/organization-name/collections/dictionary-name"
              value={subscriptionUrl}
              onChange={handleChangeSubscriptionUrl}
              light={true}
              required
            />
            <TextInput
              id="apiToken"
              type="password"
              placeholder="••••••••••••••••••••••••••••••••••••••••••••••••"
              labelText={t('apiToken')}
              value={token}
              onChange={handleChangeToken}
              light={true}
              required
            />
            <FormGroup legendText={t('advancedOptions')} className={styles.formGroup}>
              <Checkbox
                checked={isSubscribedToSnapshot}
                onChange={handleChangeSubscriptionType}
                labelText={t('subscribeToSnapshotText')}
                id="isSubscribedToSnapshot"
              />
              <Checkbox
                checked={validationType === 'NONE'}
                onChange={handleChangeValidationType}
                labelText={t('disableValidationText')}
                id="isValidationDisabled"
              />
            </FormGroup>
          </Stack>
          <Button kind="secondary" onClick={handleCancel}>
            {t('cancelButton')}
          </Button>
          <Button kind="primary" type="submit">
            {t('subscribeButton')}
          </Button>
        </Form>
        <Form onSubmit={handleUnsubscribe} className={styles.unsubscribeForm}>
          <h3 className={styles.productiveHeading03}>{t('unsubscribe')}</h3>
          <p className={styles.unsubscribeText}>{t('unsubscribeInfo')}</p>
          <Button kind="danger" type="submit" disabled={!subscription}>
            {t('unsubscribeButton')}
          </Button>
        </Form>
      </Column>
    </Grid>
  );
};

export default Subscription;
