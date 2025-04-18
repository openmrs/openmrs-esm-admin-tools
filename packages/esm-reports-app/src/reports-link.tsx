import React from 'react';
import { useTranslation } from 'react-i18next';
import { ClickableTile, Layer } from '@carbon/react';
import { ArrowRight } from '@carbon/react/icons';
import { basePath } from './constants';

export default function ReportsLink() {
  const { t } = useTranslation();
  return (
    <Layer>
      <ClickableTile href={`${window.getOpenmrsSpaBase().slice(0, -1)}${basePath}`}>
        <div>
          <div className="heading">{t('manageReports', 'Manage reports')}</div>
          <div className="content">{t('reports', 'Reports')}</div>
        </div>
        <div className="iconWrapper">
          <ArrowRight size={16} />
        </div>
      </ClickableTile>
    </Layer>
  );
}
