import React from 'react';
import { useTranslation } from 'react-i18next';
import { spaBasePath } from './constants';
import { ClickableTile, Layer } from '@carbon/react';
import { ArrowRight } from '@carbon/react/icons';

export default function ReportsLink() {
  const { t } = useTranslation();
  return (
    <Layer>
      <ClickableTile href={`${spaBasePath}`} target="_blank" rel="norefferer">
        <div>
          <div className="heading">{t('manageReports', 'Manage Reports')}</div>
          <div className="content">{t('reports', 'Reports')}</div>
        </div>
        <div className="iconWrapper">
          <ArrowRight size={16} />
        </div>
      </ClickableTile>
    </Layer>
  );
}
