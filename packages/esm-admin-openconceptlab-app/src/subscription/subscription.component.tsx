import { showNotification, showToast } from '@openmrs/esm-styleguide';
import {
  Button,
  ButtonSkeleton,
  Form,
  FormGroup,
  Grid,
  Row,
  TextInput,
  TextInputSkeleton,
  Tile,
} from 'carbon-components-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { updateSubscription, useSubscription } from './subscription.resource';

const Subscription: React.FC = () => {
  const { t } = useTranslation();
  const [subscriptionUrl, setSubscriptionUrl] = useState('');
  const [token, setToken] = useState('');

  const { data: subscription, isLoading, isError } = useSubscription();

  useEffect(() => {
    if (!isLoading) {
      setSubscriptionUrl(subscription.url);
      setToken(subscription.token);
    }
  }, [isLoading, isError, subscription]);

  const handleSubmit = useCallback(
    async (evt: React.FormEvent<HTMLFormElement>) => {
      evt.preventDefault();
      evt.stopPropagation();

      const abortController = new AbortController();

      const response = await updateSubscription(
        { ...subscription, url: subscriptionUrl, token: token },
        abortController,
      );

      if (response.ok) {
        showToast({
          kind: 'success',
          description: t(response.status === 201 ? 'subscriptionCreated' : 'subscriptionUpdated'),
        });
      } else {
        showNotification({
          title: t('errorSavingSubscription'),
          kind: 'error',
          critical: true,
          description: response.data,
        });
      }

      return () => abortController.abort();
    },
    [subscriptionUrl, token],
  );

  const handleUnsubscribe = useCallback(
    () => {},
    []
  );

  if (isLoading) {
    return (
      <Grid>
        <Row>
          <Form>
            <FormGroup legendText={t('setupSubscription')}>
              <TextInputSkeleton id="subscriptionUrl" />
              <TextInputSkeleton id="apiToken" />
              <ButtonSkeleton />
              <ButtonSkeleton />
            </FormGroup>
          </Form>
          <Form>
            <p></p>
            <ButtonSkeleton />
          </Form>
        </Row>
      </Grid>
    );
  }

  return (
    <Grid>
      <Row>
        <h1>{t('subscriptionTitle')}</h1>
      </Row>
      <Row>
        <Tile light={true}>
          <Form onSubmit={handleSubmit}>
            <FormGroup legendText={t('setupSubscription')}>
              <TextInput id="subscriptionUrl" labelText={t('subscriptionUrl')} value={subscriptionUrl} />
              <TextInput.PasswordInput id="apiToken" labelText={t('apiToken')} value={token} />
              <Button kind="secondary">{t('cancelButton')}</Button>
              <Button kind="primary">{t('subscribeButton')}</Button>
            </FormGroup>
          </Form>
          <Form onSubmit={handleUnsubscribe}>
            <FormGroup legendText={t('unsubscribeLegend')}>
              <p>{t('unsubscribeInfo')}</p>
              <Button kind="primary">{t('unsubscribeButton')}</Button>
            </FormGroup>
          </Form>
        </Tile>
      </Row>
    </Grid>
  );
};

export default Subscription;
