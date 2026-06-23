import React from 'react';
import { useTranslation } from 'react-i18next';
import { ClickableTile, Layer } from '@carbon/react';
import { ArrowRight } from '@carbon/react/icons';
import { basePath } from './constants';

const AuditLogLink: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Layer>
      <ClickableTile href={`${window.getOpenmrsSpaBase().slice(0, -1)}${basePath}`}>
        <div>
          <div className="heading">{t('manageAuditLogs', 'Manage audit logs')}</div>
          <div className="content">{t('auditLogs', 'Audit Logs')}</div>
        </div>
        <div className="iconWrapper">
          <ArrowRight size={16} />
        </div>
      </ClickableTile>
    </Layer>
  );
};

export default AuditLogLink;
