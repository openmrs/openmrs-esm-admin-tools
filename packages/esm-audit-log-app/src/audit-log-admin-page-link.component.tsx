import React from 'react';
import { useTranslation } from 'react-i18next';
import { ConfigurableLink } from '@openmrs/esm-framework';

const AuditLogAdminPageLink: React.FC = () => {
  const { t } = useTranslation();
  return <ConfigurableLink to="${openmrsSpaBase}/audit-log">{t('auditLog', 'Audit Log')}</ConfigurableLink>;
};

export default AuditLogAdminPageLink;
