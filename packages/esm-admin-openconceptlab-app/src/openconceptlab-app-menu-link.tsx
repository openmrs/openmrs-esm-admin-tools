import React from 'react';

import { ConfigurableLink } from '@openmrs/esm-framework';
import { useTranslation } from 'react-i18next';

export default function OpenConceptLabAppMenuLink() {
  const { t } = useTranslation();

  return <ConfigurableLink to="${openmrsSpaBase}/ocl">{t('moduleTitle', 'OCL Subscription Module')}</ConfigurableLink>;
}
